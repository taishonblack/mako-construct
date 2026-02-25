import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { parseQuinnInput, getMissingFields } from "@/lib/quinn-parser";
import { getNextQuestion, getSkipText, hasMinimumFields, getIntroMessage, type QuinnState, type AskCounts, type QuestionResult } from "@/lib/quinn-engine";
import { binderDraftStore, type BinderDraft, type QuinnMessage, EMPTY_DRAFT } from "@/stores/binder-draft-store";
import { QuinnPreviewPanel } from "./QuinnPreviewPanel";
import { supabase } from "@/integrations/supabase/client";

import type { BinderFormData } from "@/components/command/BinderFormModal";

interface Props {
  onSubmit: (data: BinderFormData) => void;
  onClose: () => void;
}

function msgId() { return `qm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ── AI extraction via edge function ──
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
    if (error) {
      console.error("Quinn AI error:", error);
      return null;
    }
    if (data?.error) {
      if (data.error.includes("Rate limit")) toast.error("Quinn is rate-limited. Using local parsing.");
      else if (data.error.includes("credits")) toast.error("AI credits exhausted. Using local parsing.");
      else console.warn("Quinn AI:", data.error);
      return null;
    }
    // Extract fields from response
    const { reply, confidence, quickReplies, ...fields } = data;
    return { reply: reply || "", fields, confidence: confidence || {}, quickReplies };
  } catch (e) {
    console.error("Quinn AI fetch failed:", e);
    return null;
  }
}

function buildFormData(draft: BinderDraft): BinderFormData {
  return {
    title: draft.binderTitle || `${draft.awayTeam} @ ${draft.homeTeam}` || "Untitled",
    eventDate: draft.gameDate || new Date().toISOString().split("T")[0],
    eventTime: draft.gameTime || "19:00",
    timezone: draft.timezone || "America/New_York",
    rehearsalDate: "",
    awayTeam: draft.awayTeam,
    homeTeam: draft.homeTeam,
    venue: draft.venue || "TBD",
    broadcastFeed: draft.broadcastFeed,
    controlRoom: draft.controlRoom || "23",
    onsiteTechManager: draft.onsiteTechManager,
    partner: draft.partner || "ESPN",
    status: (draft.status as any) || "draft",
    isoCount: draft.isoCount || 12,
    returnRequired: false, returnFeedEndpoints: [],
    signalNamingMode: "iso", canonicalSignals: [], customSignalNames: "",
    encoders: [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
    decoders: [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
    primaryTransport: "SRT", outboundHost: "", outboundPort: "", inboundHost: "", inboundPort: "",
    backupTransport: "", backupOutboundHost: "", backupOutboundPort: "", backupInboundHost: "", backupInboundPort: "",
    notes: draft.notes, saveAsTemplate: false, templateName: "",
    league: "NHL", containerId: "", showType: "Standard", customShowType: "",
    siteType: "Arena", studioLocation: "", commercials: "local-insert",
    customCommercials: "", customPrimaryTransport: "", customBackupTransport: "",
    gameType: "Regular Season", season: "2025–26",
    encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 6,
    autoAllocate: true,
    srtPrimaryHost: "", srtPrimaryPort: "", srtPrimaryMode: "caller", srtPrimaryPassphrase: "",
    mpegPrimaryMulticast: "", mpegPrimaryPort: "",
    srtBackupHost: "", srtBackupPort: "", srtBackupMode: "caller", srtBackupPassphrase: "",
    mpegBackupMulticast: "", mpegBackupPort: "",
    lqRequired: false,
    lqPorts: [
      { letter: "E", label: "Truck AD", notes: "" },
      { letter: "F", label: "Truck Production", notes: "" },
      { letter: "G", label: "Cam Ops", notes: "" },
      { letter: "H", label: "TBD", notes: "" },
    ],
  };
}

export default function QuinnBinderAssistant({ onSubmit, onClose }: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<BinderDraft>(() => binderDraftStore.getDraft());
  const [messages, setMessages] = useState<QuinnMessage[]>(() => binderDraftStore.getConversation());
  const [input, setInput] = useState("");
  const [state, setState] = useState<QuinnState>(() => messages.length > 0 ? "CLARIFY" : "IDLE");
  const [askCounts, setAskCounts] = useState<AskCounts>({});
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mobileTab, setMobileTab] = useState<string>("chat");

  // Persist
  useEffect(() => { binderDraftStore.saveDraft(draft); }, [draft]);
  useEffect(() => { binderDraftStore.saveConversation(messages); }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // Init with greeting
  useEffect(() => {
    if (messages.length === 0) {
      const intro: QuinnMessage = {
        id: msgId(), role: "quinn", text: getIntroMessage(), timestamp: Date.now(),
        quickReplies: ["NYR @ BOS tonight 7pm ET CR-23", "Create a studio show"],
      };
      setMessages([intro]);
      setState("INTAKE");
    }
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
      // Auto-derive title
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

  const processUserMessage = useCallback(async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { id: msgId(), role: "user", text, timestamp: Date.now() }]);

    // Check for skip
    if (text.toLowerCase() === "skip" && currentQuestion) {
      setSkippedFields(prev => [...prev, currentQuestion.field]);
      addQuinnMessage(getSkipText(currentQuestion.field as any));
      setCurrentQuestion(null);
      setTimeout(() => advanceFallback(), 300);
      return;
    }

    // Try AI first, fallback to local parsing
    setThinking(true);

    // Build conversation history for AI
    const aiMessages = messages
      .filter(m => m.role === "user" || m.role === "quinn")
      .map(m => ({ role: m.role === "quinn" ? "assistant" : "user", content: m.text }));
    aiMessages.push({ role: "user", content: text });

    const aiResult = await callQuinnAI(aiMessages, draft);
    setThinking(false);

    if (aiResult) {
      // Apply AI-extracted fields
      applyFieldsFromAI(aiResult.fields, aiResult.confidence);

      // Check if we should confirm
      // We need to read draft after applying fields — use a timeout to let state settle
      setTimeout(() => {
        setDraft(currentDraft => {
          const missing = getMissingFields(currentDraft);
          const canConfirm = hasMinimumFields(currentDraft);

          if (missing.length === 0 || (canConfirm && missing.length <= 2)) {
            setState("CONFIRM");
            const summary = buildSummary(currentDraft);
            addQuinnMessage(
              `${aiResult.reply}\n\nHere's what I'm creating:\n\n${summary}\n\nAnything to adjust?`,
              ["Create Binder", "Edit Fields", "Keep Chatting"]
            );
          } else {
            setState("CLARIFY");
            addQuinnMessage(aiResult.reply, aiResult.quickReplies || undefined);
          }
          return currentDraft;
        });
      }, 100);
    } else {
      // Fallback to local parsing
      applyLocalParsed(text);
      setTimeout(() => advanceFallback(), 400);
    }
  }, [currentQuestion, messages, draft, addQuinnMessage, applyFieldsFromAI, applyLocalParsed]);

  const advanceFallback = useCallback(() => {
    setDraft(currentDraft => {
      const missing = getMissingFields(currentDraft);
      const canConfirm = hasMinimumFields(currentDraft);

      if (missing.length === 0 || (canConfirm && missing.length <= 2)) {
        setState("CONFIRM");
        const summary = buildSummary(currentDraft);
        setTimeout(() => {
          addQuinnMessage(`Here's what I'm creating:\n\n${summary}\n\nAnything to adjust?`, ["Create Binder", "Edit Fields", "Keep Chatting"]);
        }, 200);
        return currentDraft;
      }

      const nextQ = getNextQuestion(missing, askCounts, skippedFields as any);
      if (nextQ) {
        setState("CLARIFY");
        setAskCounts(prev => ({ ...prev, [nextQ.field]: (prev[nextQ.field] || 0) + 1 }));
        setCurrentQuestion(nextQ);
        setTimeout(() => addQuinnMessage(nextQ.text, nextQ.quickReplies), 200);
      } else {
        setState("CONFIRM");
        const summary = buildSummary(currentDraft);
        setTimeout(() => {
          addQuinnMessage(`Here's what I have so far:\n\n${summary}\n\nReady to create?`, ["Create Binder", "Keep Chatting"]);
        }, 200);
      }
      return currentDraft;
    });
  }, [askCounts, skippedFields, addQuinnMessage]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setState("CREATE");
    try {
      const formData = buildFormData(draft);
      await onSubmit(formData);
      binderDraftStore.clearDraft();
      toast.success("Binder created by Quinn");
    } catch {
      toast.error("Failed to create binder");
      setState("CONFIRM");
    } finally {
      setCreating(false);
    }
  }, [draft, onSubmit]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (state === "CONFIRM") {
      const lower = text.toLowerCase();
      if (lower.includes("create") || lower === "yes" || lower === "y") {
        setMessages(prev => [...prev, { id: msgId(), role: "user", text, timestamp: Date.now() }]);
        handleCreate();
        return;
      }
      if (lower.includes("edit") || lower.includes("change")) {
        setState("CLARIFY");
      }
    }

    processUserMessage(text);
  };

  const handleQuickReply = (reply: string) => {
    if (reply === "Create Binder") { handleCreate(); return; }
    if (reply === "Edit Fields") { setState("CLARIFY"); addQuinnMessage("Which field would you like to change?"); return; }
    if (reply === "Keep Chatting") { setState("CLARIFY"); addQuinnMessage("Got it — what else do you need?"); return; }
    processUserMessage(reply);
  };

  const handleEditField = (field: string) => {
    setDraft(prev => ({
      ...prev,
      lockedFields: prev.lockedFields.includes(field) ? prev.lockedFields : [...prev.lockedFields, field],
    }));
    if (isMobile) setMobileTab("chat");
    addQuinnMessage(`What should I set for ${fieldLabel(field)}?`);
    setState("CLARIFY");
  };

  // ── Render ──
  const chatPanel = (
    <div className="flex flex-col h-full min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] min-w-0 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground border border-border"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Quinn is thinking…
            </div>
          </motion.div>
        )}

        {/* Quick replies */}
        {!thinking && messages.length > 0 && messages[messages.length - 1].role === "quinn" && messages[messages.length - 1].quickReplies && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5 pl-1">
            {messages[messages.length - 1].quickReplies!.map((reply) => (
              <button key={reply} onClick={() => handleQuickReply(reply)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  reply === "Create Binder"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                {reply}
              </button>
            ))}
          </motion.div>
        )}

        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Creating binder…
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Quinn about your show…"
            className="flex-1 min-w-0 text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={creating || thinking} />
          <Button type="submit" size="icon" variant="ghost" disabled={!input.trim() || creating || thinking}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const previewPanel = (
    <QuinnPreviewPanel draft={draft} onEditField={handleEditField}
      className="border-l border-border" />
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full min-w-0">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col h-full">
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">{chatPanel}</TabsContent>
          <TabsContent value="fields" className="flex-1 overflow-hidden mt-0">
            <QuinnPreviewPanel draft={draft} onEditField={handleEditField} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0">
      <div className="flex-1 min-w-0 flex flex-col">{chatPanel}</div>
      <div className="w-[260px] flex-shrink-0">{previewPanel}</div>
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
