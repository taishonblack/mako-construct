import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Trash2, Sparkles, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { parseQuinnInput, getMissingFields } from "@/lib/quinn-parser";
import { getNextQuestion, getSkipText, hasMinimumFields, type QuinnState, type AskCounts, type QuestionResult } from "@/lib/quinn-engine";
import { binderDraftStore, type BinderDraft, type QuinnMessage, EMPTY_DRAFT } from "@/stores/binder-draft-store";
import { QuinnPreviewPanel } from "@/components/quinn/QuinnPreviewPanel";
import { supabase } from "@/integrations/supabase/client";
import { binderStore } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import { mockTransport } from "@/data/mock-phase5";
import { activityStore } from "@/stores/activity-store";

function msgId() { return `qm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ── AI extraction ──
async function callQuinnAI(
  userMessages: { role: string; content: string }[],
  draft: Partial<BinderDraft>
): Promise<{
  reply: string;
  fields: Record<string, any>;
  confidence: Record<string, "high" | "medium" | "low">;
  quickReplies?: string[];
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke("quinn-chat", {
      body: { messages: userMessages, draft },
    });
    if (error) { console.error("Quinn AI error:", error); return null; }
    if (data?.error) {
      if (data.error.includes("Rate limit")) toast.error("Quinn is rate-limited. Using local parsing.");
      else if (data.error.includes("credits")) toast.error("AI credits exhausted. Using local parsing.");
      return null;
    }
    const { reply, confidence, quickReplies, ...fields } = data;
    return { reply: reply || "", fields, confidence: confidence || {}, quickReplies };
  } catch (e) { console.error("Quinn AI fetch failed:", e); return null; }
}

const HELP_CHIPS = [
  "Create a binder",
  "Find a staff member",
  "Search the wiki",
  "Add notes to a binder",
];


export default function QuinnPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<BinderDraft>(() => binderDraftStore.getDraft());
  const [messages, setMessages] = useState<QuinnMessage[]>([]);
  const [input, setInput] = useState("");
  const [quinnState, setQuinnState] = useState<QuinnState>("IDLE");
  const [introComplete, setIntroComplete] = useState(false);
  const [askCounts, setAskCounts] = useState<AskCounts>({});
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mobileTab, setMobileTab] = useState<string>("chat");
  const [typingPhase, setTypingPhase] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Persist
  useEffect(() => { binderDraftStore.saveDraft(draft); }, [draft]);
  useEffect(() => { if (introComplete) binderDraftStore.saveConversation(messages); }, [messages, introComplete]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking, typingPhase]);

  // Animated intro — runs every time the page mounts
  useEffect(() => {
    setTypingPhase(1);
    const t1 = setTimeout(() => {
      setTypingPhase(2);
      setMessages([{ id: msgId(), role: "quinn", text: "Hey — how can I help?", timestamp: Date.now() }]);
    }, 1200);
    const t2 = setTimeout(() => {
      setTypingPhase(3);
    }, 2000);
    const t3 = setTimeout(() => {
      setTypingPhase(0);
      setIntroComplete(true);
      const prev = binderDraftStore.getConversation();
      if (prev.length > 0) {
        setMessages([
          { id: msgId(), role: "quinn", text: "Hey — how can I help?", timestamp: Date.now() },
          { id: msgId(), role: "quinn", text: "Picking up where we left off.", timestamp: Date.now() },
          ...prev,
        ]);
        setQuinnState("CLARIFY");
      } else {
        setMessages(prev2 => [...prev2, {
          id: msgId(), role: "quinn", text: "Let me know if you need help or options.",
          timestamp: Date.now(),
          quickReplies: ["Create a binder", "Help"],
        }]);
        setQuinnState("INTAKE");
      }
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);


  const addQuinnMessage = useCallback((text: string, quickReplies?: string[]) => {
    setMessages(prev => [...prev, { id: msgId(), role: "quinn", text, quickReplies, timestamp: Date.now() }]);
  }, []);

  const applyFieldsFromAI = useCallback((fields: Record<string, any>, confidence: Record<string, string>) => {
    setDraft(prev => {
      const next = { ...prev };
      const conf = { ...prev.fieldConfidence };
      const fieldKeys = ["binderTitle", "homeTeam", "awayTeam", "gameDate", "gameTime", "timezone", "controlRoom", "venue", "broadcastFeed", "status", "onsiteTechManager", "notes"];
      for (const key of fieldKeys) {
        if (fields[key] && !prev.lockedFields.includes(key)) {
          (next as any)[key] = fields[key];
          conf[key] = (confidence[key] as any) || "high";
        }
      }
      if (!next.binderTitle && next.awayTeam && next.homeTeam) {
        next.binderTitle = `${next.awayTeam} @ ${next.homeTeam}`;
        conf.binderTitle = "high";
      }
      next.fieldConfidence = conf;
      return next;
    });
  }, []);

  const applyLocalParsed = useCallback((text: string) => {
    const parsed = parseQuinnInput(text);
    setDraft(prev => {
      const next = { ...prev };
      const conf = { ...prev.fieldConfidence };
      for (const [key, val] of Object.entries(parsed)) {
        if (val && !prev.lockedFields.includes(key)) {
          (next as any)[key] = val.value;
          conf[key] = val.confidence;
        }
      }
      next.fieldConfidence = conf;
      if (!next.binderTitle && next.awayTeam && next.homeTeam) {
        next.binderTitle = `${next.awayTeam} @ ${next.homeTeam}`;
        conf.binderTitle = conf.awayTeam || "medium";
      }
      return next;
    });
  }, []);

  const advanceFallback = useCallback(() => {
    setDraft(currentDraft => {
      const missing = getMissingFields(currentDraft);
      const canConfirm = hasMinimumFields(currentDraft);
      if (missing.length === 0 || (canConfirm && missing.length <= 2)) {
        setQuinnState("CONFIRM");
        const summary = buildSummary(currentDraft);
        setTimeout(() => addQuinnMessage(`Here's what I have so far:\n\n${summary}\n\nAnything to adjust before I create this binder?`, ["Create Binder", "Keep Chatting", "Edit Fields"]), 200);
        return currentDraft;
      }
      const nextQ = getNextQuestion(missing, askCounts, skippedFields as any);
      if (nextQ) {
        setQuinnState("CLARIFY");
        setAskCounts(prev => ({ ...prev, [nextQ.field]: (prev[nextQ.field] || 0) + 1 }));
        setCurrentQuestion(nextQ);
        setTimeout(() => addQuinnMessage(nextQ.text, nextQ.quickReplies), 200);
      } else {
        setQuinnState("CONFIRM");
        const summary = buildSummary(currentDraft);
        setTimeout(() => addQuinnMessage(`Here's what I have:\n\n${summary}\n\nReady to create?`, ["Create Binder", "Keep Chatting"]), 200);
      }
      return currentDraft;
    });
  }, [askCounts, skippedFields, addQuinnMessage]);

  const processUserMessage = useCallback(async (text: string, displayText?: string) => {
    setMessages(prev => [...prev, { id: msgId(), role: "user", text: displayText || text, timestamp: Date.now() }]);

    // Help command
    if (text.toLowerCase() === "help") {
      addQuinnMessage("Here are a few things I can help with:", HELP_CHIPS);
      return;
    }

    if (text.toLowerCase() === "skip" && currentQuestion) {
      setSkippedFields(prev => [...prev, currentQuestion.field]);
      addQuinnMessage(getSkipText(currentQuestion.field as any));
      setCurrentQuestion(null);
      setTimeout(() => advanceFallback(), 300);
      return;
    }

    setThinking(true);
    const aiMessages = messages
      .filter(m => m.role === "user" || m.role === "quinn")
      .map(m => ({ role: m.role === "quinn" ? "assistant" : "user", content: m.text }));
    aiMessages.push({ role: "user", content: text });

    const aiResult = await callQuinnAI(aiMessages, draft);
    setThinking(false);

    if (aiResult) {
      applyFieldsFromAI(aiResult.fields, aiResult.confidence);
      setTimeout(() => {
        setDraft(currentDraft => {
          const missing = getMissingFields(currentDraft);
          const canConfirm = hasMinimumFields(currentDraft);
          if (missing.length === 0 || (canConfirm && missing.length <= 2)) {
            setQuinnState("CONFIRM");
            const summary = buildSummary(currentDraft);
            addQuinnMessage(`${aiResult.reply}\n\n${summary}\n\nAnything to adjust?`, ["Create Binder", "Edit Fields", "Keep Chatting"]);
          } else {
            setQuinnState("CLARIFY");
            addQuinnMessage(aiResult.reply, aiResult.quickReplies || undefined);
          }
          return currentDraft;
        });
      }, 100);
    } else {
      applyLocalParsed(text);
      setTimeout(() => advanceFallback(), 400);
    }
  }, [currentQuestion, messages, draft, addQuinnMessage, applyFieldsFromAI, applyLocalParsed, advanceFallback]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setQuinnState("CREATE");
    try {
      const d = draft;
      const record = await binderStore.create({
        title: d.binderTitle || `${d.awayTeam} @ ${d.homeTeam}` || "Untitled",
        league: "NHL", containerId: "", eventDate: d.gameDate || new Date().toISOString().split("T")[0],
        venue: d.venue || "TBD", showType: "Standard", partner: d.partner || "ESPN",
        status: (d.status as "draft" | "active" | "completed" | "archived") || "draft", isoCount: d.isoCount || 12, returnRequired: false,
        commercials: "local-insert", primaryTransport: "SRT", backupTransport: "",
        notes: d.notes, transport: "SRT", openIssues: 0, eventTime: d.gameTime || "19:00",
        timezone: d.timezone || "America/New_York", homeTeam: d.homeTeam, awayTeam: d.awayTeam,
        siteType: "Arena", studioLocation: "", customShowType: "", customPrimaryTransport: "",
        customBackupTransport: "", customCommercials: "", signalNamingMode: "iso",
        canonicalSignals: [], customSignalNames: "", encoderInputsPerUnit: 2, encoderCount: 6,
        decoderOutputsPerUnit: 4, decoderCount: 6, autoAllocate: true, gameType: "Regular Season",
        season: "2025–26", controlRoom: d.controlRoom || "", rehearsalDate: "",
        broadcastFeed: d.broadcastFeed, onsiteTechManager: d.onsiteTechManager,
        returnFeedEndpoints: [], encoders: [], decoders: [],
        outboundHost: "", outboundPort: "", inboundHost: "", inboundPort: "",
        lqRequired: false, lqPorts: [],
      });
      if (!record) throw new Error("Create failed");

      // Log activity
      await activityStore.log({
        binder_id: record.id,
        actor_type: "quinn",
        actor_name: "Quinn",
        action_type: "binder_create",
        target: "binder",
        target_id: record.id,
        summary: `Created binder "${d.binderTitle || "Untitled"}" via Quinn`,
        details: { draft: d },
        confidence: null,
        source: "chat",
        undo_token: null,
        is_confirmed: true,
      });

      const signals = generateSignals(d.isoCount || 12, "iso");
      const encoderPatchpoints = generatePatchpoints("encoder", 6, 2);
      const decoderPatchpoints = generatePatchpoints("decoder", 6, 4);
      const finalSignals = signals.map((s, i) => ({
        ...s,
        encoderInput: i < encoderPatchpoints.length ? encoderPatchpoints[i] : s.encoderInput,
        decoderOutput: i < decoderPatchpoints.length ? decoderPatchpoints[i] : s.decoderOutput,
      }));

      const binderState = {
        league: "NHL", partner: d.partner || "ESPN", venue: d.venue || "TBD",
        showType: "Standard", eventDate: d.gameDate, eventTime: d.gameTime,
        timezone: d.timezone, homeTeam: d.homeTeam, awayTeam: d.awayTeam,
        siteType: "Arena", isoCount: d.isoCount || 12, returnRequired: false,
        commercials: "local-insert", signals: finalSignals,
        transport: { ...mockTransport, primary: { ...mockTransport.primary, protocol: "SRT" }, returnFeed: false, commercials: "local-insert" as const },
        comms: [], issues: [], changes: [], docs: [], checklist: [],
        topology: { encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 6, encoderPatchpoints, decoderPatchpoints },
      };
      localStorage.setItem(`mako-binder-${record.id}`, JSON.stringify(binderState));

      binderDraftStore.clearDraft();
      toast.success("Binder created.");
      addQuinnMessage("Binder created. Redirecting…");
      setTimeout(() => navigate(`/binders/${record.id}`), 800);
    } catch {
      toast.error("Failed to create binder");
      setQuinnState("CONFIRM");
    } finally {
      setCreating(false);
    }
  }, [draft, navigate, addQuinnMessage]);

  const readFileAsText = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(`[Could not read file: ${file.name}]`);
      reader.readAsText(file);
    });
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    const files = [...attachedFiles];
    if (!text && files.length === 0) return;
    setInput("");
    setAttachedFiles([]);

    // Build message with file contents
    let fullMessage = text;
    if (files.length > 0) {
      const fileContents: string[] = [];
      for (const file of files) {
        const content = await readFileAsText(file);
        fileContents.push(`--- File: ${file.name} ---\n${content.slice(0, 15000)}\n--- End of ${file.name} ---`);
      }
      const fileBlock = fileContents.join("\n\n");
      fullMessage = text
        ? `${text}\n\n[Attached documents]\n${fileBlock}`
        : `Please extract binder information from these documents:\n\n${fileBlock}`;
    }

    // Show user message with file names
    const displayText = files.length > 0
      ? `${text ? text + "\n" : ""}📎 ${files.map(f => f.name).join(", ")}`
      : text;

    if (quinnState === "CONFIRM") {
      const lower = (text || fullMessage).toLowerCase();
      if (lower.includes("create") || lower === "yes" || lower === "y") {
        setMessages(prev => [...prev, { id: msgId(), role: "user", text: displayText, timestamp: Date.now() }]);
        handleCreate();
        return;
      }
      if (lower.includes("edit") || lower.includes("change")) setQuinnState("CLARIFY");
    }

    processUserMessage(fullMessage, displayText);
  };

  const handleQuickReply = (reply: string) => {
    if (reply === "Create Binder") { handleCreate(); return; }
    if (reply === "Edit Fields") { setQuinnState("CLARIFY"); addQuinnMessage("Which field would you like to change?"); return; }
    if (reply === "Keep Chatting") { setQuinnState("CLARIFY"); addQuinnMessage("Got it — what else do you need?"); return; }
    if (reply === "Help") {
      addQuinnMessage("Here are a few things I can help with:", HELP_CHIPS);
      return;
    }
    if (reply === "Create a binder") {
      binderDraftStore.clearDraft();
      setDraft({ ...EMPTY_DRAFT });
      addQuinnMessage("Let's build a binder.\n\nWhat's the project name?", ["NYR @ BOS — Standard", "TOR @ MTL — Alt French Feed", "I'll type it"]);
      setQuinnState("INTAKE");
      return;
    }
    if (reply === "Start new binder") {
      binderDraftStore.clearDraft();
      setDraft({ ...EMPTY_DRAFT });
      addQuinnMessage("Let's build a binder.\n\nWhat's the project name?", ["NYR @ BOS — Standard", "TOR @ MTL — Alt French Feed", "I'll type it"]);
      setQuinnState("INTAKE");
      return;
    }
    // Staff/wiki shortcuts
    if (reply === "Find a staff member") {
      navigate("/staff");
      return;
    }
    if (reply === "Search the wiki") {
      navigate("/wiki");
      return;
    }
    processUserMessage(reply);
  };

  const handleEditField = (field: string) => {
    setDraft(prev => ({
      ...prev,
      lockedFields: prev.lockedFields.includes(field) ? prev.lockedFields : [...prev.lockedFields, field],
    }));
    if (isMobile) setMobileTab("chat");
    addQuinnMessage(`What should I set for ${fieldLabel(field)}?`);
    setQuinnState("CLARIFY");
  };

  const handleClearSession = () => {
    binderDraftStore.clearDraft();
    setDraft({ ...EMPTY_DRAFT });
    setMessages([]);
    setAskCounts({});
    setSkippedFields([]);
    setCurrentQuestion(null);
    setQuinnState("IDLE");
    setIntroComplete(false);
    setAttachedFiles([]);
    setTimeout(() => {
      setTypingPhase(1);
      const t1 = setTimeout(() => {
        setTypingPhase(2);
        setMessages([{ id: msgId(), role: "quinn", text: "Hey — how can I help?", timestamp: Date.now() }]);
      }, 1200);
      const t2 = setTimeout(() => {
        setTypingPhase(0);
        setIntroComplete(true);
        setMessages(prev => [...prev, {
          id: msgId(), role: "quinn", text: "Let me know if you need help or options.",
          timestamp: Date.now(), quickReplies: ["Create a binder", "Help"],
        }]);
        setQuinnState("INTAKE");
      }, 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, 100);
  };

  // ── Typing indicator ──
  const typingDots = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
      </div>
    </motion.div>
  );

  // ── Chat Panel ──
  const chatPanel = (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quinn</span>
          <Badge variant="outline" className="text-[9px]">Ops Assistant</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearSession} title="Clear session">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] min-w-0 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground border border-border"
              )}>{msg.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(typingPhase === 1 || typingPhase === 3) && typingDots}

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Quinn is thinking…
            </div>
          </motion.div>
        )}

        {!thinking && typingPhase === 0 && messages.length > 0 && messages[messages.length - 1].role === "quinn" && messages[messages.length - 1].quickReplies && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5 pl-1">
            {messages[messages.length - 1].quickReplies!.map((reply) => (
              <button key={reply} onClick={() => handleQuickReply(reply)}
                className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                  reply === "Create Binder" ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>{reply}</button>
            ))}
          </motion.div>
        )}

        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating binder…
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachedFiles.map((file, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-secondary border border-border text-muted-foreground">
                {file.name}
                <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="hover:text-destructive">×</button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json" className="hidden"
            onChange={(e) => { if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]); e.target.value = ""; }} />
          <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={creating || thinking}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Quinn what you need…"
            className="flex-1 min-w-0 text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={creating || thinking} />
          <Button type="submit" size="icon" variant="ghost" disabled={(!input.trim() && attachedFiles.length === 0) || creating || thinking}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="flex flex-col h-full border-l border-border">
      <QuinnPreviewPanel draft={draft} onEditField={handleEditField} />
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={handleCreate} disabled={creating || !draft.binderTitle}>
          {creating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Creating…</> : "Create Binder"}
        </Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={handleClearSession}>Clear</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 128px)" }}>
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col h-full">
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="fields">Binder Draft</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">{chatPanel}</TabsContent>
          <TabsContent value="fields" className="flex-1 overflow-hidden mt-0">
            <div className="flex flex-col h-full">
              <QuinnPreviewPanel draft={draft} onEditField={handleEditField} />
              <div className="px-4 py-3 border-t border-border flex gap-2">
                <Button size="sm" className="flex-1 text-xs" onClick={handleCreate} disabled={creating || !draft.binderTitle}>Create Binder</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={handleClearSession}>Clear</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 80px)" }}>
      <div className="flex-1 min-w-0 flex flex-col">{chatPanel}</div>
      <div className="w-[280px] flex-shrink-0">{previewPanel}</div>
    </div>
  );
}

// ── Helpers ──
function fieldLabel(field: string): string {
  const map: Record<string, string> = {
    binderTitle: "title", homeTeam: "home team", awayTeam: "away team",
    gameDate: "date", gameTime: "time", timezone: "timezone",
    controlRoom: "control room", venue: "venue", broadcastFeed: "feed",
    onsiteTechManager: "tech manager", notes: "notes",
  };
  return map[field] || field;
}

function buildSummary(draft: BinderDraft): string {
  const lines: string[] = [];
  const title = draft.binderTitle || (draft.awayTeam && draft.homeTeam ? `${draft.awayTeam} @ ${draft.homeTeam}` : "Untitled");
  lines.push(`**${title}**`);
  if (draft.gameDate) lines.push(`Date: ${draft.gameDate}`);
  if (draft.gameTime) {
    const tz = draft.timezone === "America/New_York" ? "ET" : draft.timezone === "America/Los_Angeles" ? "PT" : draft.timezone || "";
    lines.push(`Time: ${draft.gameTime} ${tz}`);
  }
  if (draft.venue) lines.push(`Venue: ${draft.venue}`);
  if (draft.controlRoom) lines.push(`Control Room: ${draft.controlRoom === "Remote" ? "Remote" : `CR-${draft.controlRoom}`}`);
  if (draft.broadcastFeed) lines.push(`Feed: ${draft.broadcastFeed}`);
  lines.push(`Status: ${(draft.status || "draft").charAt(0).toUpperCase() + (draft.status || "draft").slice(1)}`);
  return lines.join("\n");
}
