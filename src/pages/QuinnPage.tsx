import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Sparkles, Paperclip, Upload, LogIn, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useOptionalAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { parseQuinnInput } from "@/lib/quinn-parser";
import {
  getNextQuestion, getSkipText, hasMinimumFields,
  getIntroMessages, HELP_CHIPS, getMissingIntakeFields,
  type QuinnState, type AskCounts, type QuestionResult, type QuinnIntakeField,
} from "@/lib/quinn-engine";
import { binderDraftStore, type BinderDraft, EMPTY_DRAFT } from "@/stores/binder-draft-store";
import { QuinnPreviewPanel } from "@/components/quinn/QuinnPreviewPanel";
import { supabase } from "@/integrations/supabase/client";
import { binderStore } from "@/stores/binder-store";
import { generateSignals, generatePatchpoints } from "@/lib/signal-utils";
import { DEFAULT_TRANSPORT } from "@/lib/binder-types";
import { buildCanonicalRoutes, buildRouteSummary } from "@/lib/canonical-route-builder";
import { activityStore } from "@/stores/activity-store";
import { quinnThreadStore, getWeekDateKeys, DAY_LABELS, type QuinnThreadMessage } from "@/stores/quinn-thread-store";

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

interface LocalMessage {
  id: string;
  role: "quinn" | "user";
  text: string;
  quickReplies?: string[];
  timestamp: number;
}

const LOCAL_CHAT_KEY = "quinn-local-chat-";

export default function QuinnPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const isAuthenticated = !!auth?.user;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocFiles = useRef<File[]>([]);

  // Day selector
  const weekKeys = getWeekDateKeys();
  const todayKey = new Date().toISOString().split("T")[0];
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(true);

  // Chat state
  const [draft, setDraft] = useState<BinderDraft>(() => binderDraftStore.getDraft());
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [quinnState, setQuinnState] = useState<QuinnState>("IDLE");
  const [askCounts, setAskCounts] = useState<AskCounts>({});
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mobileTab, setMobileTab] = useState<string>("chat");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  // Clear current chat
  const handleClearChat = useCallback(async () => {
    // Delete messages from DB if we have a thread
    if (threadId) {
      await supabase.from("quinn_messages").delete().eq("thread_id", threadId);
      await supabase.from("quinn_threads").delete().eq("id", threadId);
      setThreadId(null);
    }
    // Clear local storage
    localStorage.removeItem(LOCAL_CHAT_KEY + selectedDay);
    // Reset state
    setMessages([]);
    setDraft({ ...EMPTY_DRAFT });
    binderDraftStore.clearDraft();
    setQuinnState("IDLE");
    setAskCounts({});
    setSkippedFields([]);
    setCurrentQuestion(null);
    // Re-init
    if (isAuthenticated) {
      const thread = await quinnThreadStore.getOrCreateThread(selectedDay);
      if (thread) {
        setThreadId(thread.id);
        await postIntroMessages(thread.id);
      }
    } else {
      initEmptyThread();
    }
    toast.success("Chat cleared");
  }, [threadId, selectedDay, isAuthenticated]);

  // AI health check
  useEffect(() => {
    supabase.functions.invoke("quinn-health").then(({ data }) => {
      setAiStatus(data?.ok ? "connected" : "disconnected");
    }).catch(() => setAiStatus("disconnected"));
  }, []);
  // Persist draft
  useEffect(() => { binderDraftStore.saveDraft(draft); }, [draft]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  // Persist messages to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated && messages.length > 0) {
      localStorage.setItem(LOCAL_CHAT_KEY + selectedDay, JSON.stringify(messages));
    }
  }, [messages, isAuthenticated, selectedDay]);

  // Load thread when day changes
  useEffect(() => {
    let cancelled = false;
    setThreadLoading(true);
    setMessages([]);

    async function loadThread() {
      const thread = await quinnThreadStore.getOrCreateThread(selectedDay);
      if (cancelled) return;

      if (!thread) {
        // Not authenticated — use local-only mode
        setThreadId(null);
        setThreadLoading(false);
        initEmptyThread();
        return;
      }

      setThreadId(thread.id);

      if (thread.messages.length > 0) {
        // Existing thread with messages
        setMessages(thread.messages.map(m => ({
          id: m.id,
          role: m.role,
          text: m.content,
          quickReplies: m.quickReplies,
          timestamp: new Date(m.createdAt).getTime(),
        })));
        setQuinnState("INTAKE");
      } else {
        // Empty thread — post intro messages
        await postIntroMessages(thread.id);
      }
      setThreadLoading(false);
    }

    loadThread();
    return () => { cancelled = true; };
  }, [selectedDay]);

  async function postIntroMessages(tid: string) {
    const intros = getIntroMessages();
    const newMsgs: LocalMessage[] = [];
    for (const intro of intros) {
      const saved = await quinnThreadStore.addMessage(tid, "quinn", intro.text, intro.quickReplies);
      newMsgs.push({
        id: saved?.id || msgId(),
        role: "quinn",
        text: intro.text,
        quickReplies: intro.quickReplies,
        timestamp: Date.now(),
      });
    }
    setMessages(newMsgs);
    setQuinnState("INTAKE");
  }

  function initEmptyThread() {
    // Try to restore from localStorage first
    const stored = localStorage.getItem(LOCAL_CHAT_KEY + selectedDay);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalMessage[];
        if (parsed.length > 0) {
          setMessages(parsed);
          setQuinnState("INTAKE");
          return;
        }
      } catch { /* ignore */ }
    }
    const intros = getIntroMessages();
    setMessages(intros.map(i => ({
      id: msgId(), role: "quinn", text: i.text, quickReplies: i.quickReplies, timestamp: Date.now(),
    })));
    setQuinnState("INTAKE");
  }

  // ── Message helpers ──
  const addQuinnMessage = useCallback(async (text: string, quickReplies?: string[]) => {
    const local: LocalMessage = { id: msgId(), role: "quinn", text, quickReplies, timestamp: Date.now() };
    setMessages(prev => [...prev, local]);
    if (threadId) {
      quinnThreadStore.addMessage(threadId, "quinn", text, quickReplies);
    }
  }, [threadId]);

  const addUserMessage = useCallback(async (text: string) => {
    const local: LocalMessage = { id: msgId(), role: "user", text, timestamp: Date.now() };
    setMessages(prev => [...prev, local]);
    if (threadId) {
      quinnThreadStore.addMessage(threadId, "user", text);
    }
  }, [threadId]);

  // ── Field extraction ──
  const applyFieldsFromAI = useCallback((fields: Record<string, any>, confidence: Record<string, string>) => {
    setDraft(prev => {
      const next = { ...prev };
      const conf = { ...prev.fieldConfidence };
      const fieldKeys = ["binderTitle", "homeTeam", "awayTeam", "gameDate", "gameTime", "timezone", "controlRoom", "venue", "broadcastFeed", "status", "onsiteTechManager", "notes", "isoCount"];
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
      const missing = getMissingIntakeFields(currentDraft);
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

  // ── Process user message ──
  const processUserMessage = useCallback(async (text: string, displayText?: string) => {
    await addUserMessage(displayText || text);

    // "I don't know" detection
    const lower = text.toLowerCase().trim();
    if (["not sure", "idk", "help", "i don't know", "i dont know", "no idea"].includes(lower)) {
      addQuinnMessage("Here are a few things I can help with:", HELP_CHIPS);
      return;
    }

    // Help chip handlers
    if (lower === "build a binder") {
      binderDraftStore.clearDraft();
      setDraft({ ...EMPTY_DRAFT });
      setQuinnState("INTAKE");
      addQuinnMessage("what is the project name", ["I'll type it"]);
      return;
    }
    if (lower === "get an overview of routes") { navigate("/routes"); return; }
    if (lower === "ask for the upcoming projects") { navigate("/binders"); return; }
    if (lower === "find staff") { navigate("/staff"); return; }
    if (lower === "look up something in the wiki") { navigate("/wiki"); return; }

    // Skip handling
    if (lower === "skip" && currentQuestion) {
      setSkippedFields(prev => [...prev, currentQuestion.field]);
      addQuinnMessage(getSkipText(currentQuestion.field as any));
      setCurrentQuestion(null);
      setTimeout(() => advanceFallback(), 300);
      return;
    }

    // AI extraction
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
          const missing = getMissingIntakeFields(currentDraft);
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
      // Unknown / can't answer → admin escalation
      if (quinnState === "IDLE" || quinnState === "INTAKE") {
        // Might be a general question Quinn can't answer
        addQuinnMessage("I'm not sure about that — I've flagged it for the team.");
        quinnThreadStore.logAdminQuestion(text);
        return;
      }
      applyLocalParsed(text);
      setTimeout(() => advanceFallback(), 400);
    }
  }, [currentQuestion, messages, draft, addQuinnMessage, addUserMessage, applyFieldsFromAI, applyLocalParsed, advanceFallback, quinnState, navigate]);

  // ── Create binder ──
  const handleCreate = useCallback(async () => {
    if (!isAuthenticated) {
      addQuinnMessage("You need to sign in before I can create a binder. Head to the sign-in page and come back — your chat will still be here.", ["Sign In"]);
      return;
    }
    setCreating(true);
    setQuinnState("CREATE");
    try {
      const d = draft;
      const record = await binderStore.create({
        title: d.binderTitle || `${d.awayTeam} @ ${d.homeTeam}` || "Untitled",
        league: "NHL", containerId: "", eventDate: d.gameDate || new Date().toISOString().split("T")[0],
        venue: d.venue || "TBD", showType: "Standard", partner: d.partner || "ESPN",
        status: (d.status as "draft" | "active" | "completed" | "archived") || "draft",
        isoCount: d.isoCount || 12, returnRequired: false,
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
        transport: { ...DEFAULT_TRANSPORT, primary: { ...DEFAULT_TRANSPORT.primary, protocol: "SRT" }, returnFeed: false, commercials: "local-insert" as const },
        comms: [], issues: [], changes: [], docs: [], checklist: [],
        topology: { encoderInputsPerUnit: 2, encoderCount: 6, decoderOutputsPerUnit: 4, decoderCount: 6, encoderPatchpoints, decoderPatchpoints },
      };
      localStorage.setItem(`mako-binder-${record.id}`, JSON.stringify(binderState));

      binderDraftStore.clearDraft();
      toast.success("Binder created.");

      // Transition: ask about routes
      addQuinnMessage("Binder created.\n\nDo you want to build routes for this binder now?", ["Yes", "No"]);
      setQuinnState("ROUTES_BUILD");
      // Store binder id for route context
      setDraft(prev => ({ ...prev, binderTitle: record.id }));
    } catch {
      toast.error("Failed to create binder");
      setQuinnState("CONFIRM");
    } finally {
      setCreating(false);
    }
  }, [draft, addQuinnMessage, isAuthenticated, navigate]);

  // ── File handling ──
  const BINARY_TYPES = ["application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

  const readFileAsText = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(`[Could not read file: ${file.name}]`);
      reader.readAsText(file);
    });
  }, []);

  const readFileAsBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { const result = reader.result as string; resolve(result.split(",")[1] || result); };
      reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }, []);

  const parseDocumentViaAI = useCallback(async (file: File): Promise<string> => {
    try {
      const base64 = await readFileAsBase64(file);
      const { data, error } = await supabase.functions.invoke("quinn-parse-doc", {
        body: { fileBase64: base64, fileName: file.name, mimeType: file.type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.text || `[Could not extract text from ${file.name}]`;
    } catch (e) {
      console.error("Doc parse failed:", e);
      toast.error(`Could not parse ${file.name}. Trying as plain text.`);
      return readFileAsText(file);
    }
  }, [readFileAsBase64, readFileAsText]);

  // ── Document intent chips ──
  const DOC_INTENT_CHIPS = ["Binder details", "Schedule / times", "Staff", "Routes", "Checklist", "Something else"];

  // When files are attached without text, Quinn should guide intent first
  const handleSend = async () => {
    const text = input.trim();
    const files = [...attachedFiles];
    if (!text && files.length === 0) return;
    setInput("");
    setAttachedFiles([]);

    // If files attached with no text, show document preview and ask intent
    if (files.length > 0 && !text) {
      const fileNames = files.map(f => f.name).join(", ");
      await addUserMessage(`📎 ${fileNames}`);
      // Store files temporarily for later extraction
      pendingDocFiles.current = files;
      addQuinnMessage(`received ${files.length === 1 ? files[0].name : `${files.length} documents`}. what would you like to extract from ${files.length === 1 ? "the document" : "these documents"}?`, DOC_INTENT_CHIPS);
      return;
    }

    const displayText = files.length > 0
      ? `${text ? text + "\n" : ""}📎 ${files.map(f => f.name).join(", ")}`
      : text;

    let fullMessage = text;
    if (files.length > 0) {
      setThinking(true);
      const fileContents: string[] = [];
      for (const file of files) {
        const isBinary = BINARY_TYPES.includes(file.type) || file.name.endsWith(".pdf");
        const content = isBinary ? await parseDocumentViaAI(file) : await readFileAsText(file);
        fileContents.push(`--- File: ${file.name} ---\n${content.slice(0, 15000)}\n--- End of ${file.name} ---`);
      }
      setThinking(false);
      const fileBlock = fileContents.join("\n\n");
      fullMessage = `${text}\n\n[Attached documents]\n${fileBlock}`;
    }

    // Route build transition
    if (quinnState === "ROUTES_BUILD") {
      const lower = text.toLowerCase();
      if (lower === "yes" || lower === "y") {
        await addUserMessage(displayText);
        // Build canonical routes automatically
        const binderId = draft.binderTitle; // stored binder id
        const isoCount = draft.isoCount || 12;
        const summary = buildRouteSummary({
          binderId: binderId || "",
          isoCount,
          encodesPerUnit: 2,
          encoderBrand: draft.encoderBrand || "Videon",
          receiverBrand: draft.decoderBrand || "Magewell",
        });
        addQuinnMessage(`I will create ${isoCount} routes using the canonical model:\n${summary}\n\nProceed?`, ["Proceed", "Adjust"]);
        setQuinnState("ROUTES_CONFIRM");
        return;
      }
      if (lower === "no" || lower === "n") {
        await addUserMessage(displayText);
        addQuinnMessage("Got it — standing by.");
        setQuinnState("INTAKE");
        return;
      }
    }

    // Route build confirmation
    if ((quinnState as string) === "ROUTES_CONFIRM") {
      const lower = text.toLowerCase();
      if (lower === "proceed" || lower === "yes") {
        await addUserMessage(displayText);
        setThinking(true);
        try {
          const binderId = draft.binderTitle;
          const routes = await buildCanonicalRoutes({
            binderId: binderId || "",
            isoCount: draft.isoCount || 12,
            encodesPerUnit: 2,
            encoderBrand: draft.encoderBrand || "Videon",
            receiverBrand: draft.decoderBrand || "Magewell",
          });
          addQuinnMessage(`Created ${routes.length} canonical routes. You can view them in the Routes page.`, ["View Routes"]);
          setQuinnState("IDLE");
        } catch {
          addQuinnMessage("Failed to create routes. Please try again.");
        } finally {
          setThinking(false);
        }
        return;
      }
      if (lower === "adjust") {
        await addUserMessage(displayText);
        addQuinnMessage("What would you like to change? ISO count, encoder brand, or encodes per unit?");
        return;
      }
    }

    if (quinnState === "CONFIRM") {
      const lower = (text || fullMessage).toLowerCase();
      if (lower.includes("create") || lower === "yes" || lower === "y") {
        await addUserMessage(displayText);
        handleCreate();
        return;
      }
      if (lower.includes("edit") || lower.includes("change")) setQuinnState("CLARIFY");
    }

    processUserMessage(fullMessage, displayText);
  };

  const handleQuickReply = async (reply: string) => {
    if (reply === "Sign In") { navigate("/login"); return; }
    if (reply === "Create Binder") { handleCreate(); return; }
    if (reply === "Edit Fields") { setQuinnState("CLARIFY"); addQuinnMessage("Which field would you like to change?"); return; }
    if (reply === "Keep Chatting") { setQuinnState("CLARIFY"); addQuinnMessage("Got it — what else do you need?"); return; }
    if (reply === "Yes" && quinnState === "ROUTES_BUILD") {
      processUserMessage("yes", "Yes");
      return;
    }
    if (reply === "No" && quinnState === "ROUTES_BUILD") {
      addUserMessage("No");
      addQuinnMessage("Got it — standing by.");
      setQuinnState("INTAKE");
      return;
    }
    if (reply === "Proceed" && (quinnState as string) === "ROUTES_CONFIRM") {
      processUserMessage("proceed", "Proceed");
      return;
    }
    if (reply === "Adjust" && (quinnState as string) === "ROUTES_CONFIRM") {
      addUserMessage("Adjust");
      addQuinnMessage("What would you like to change? ISO count, encoder brand, or encodes per unit?");
      return;
    }
    if (reply === "View Routes") {
      addUserMessage("View Routes");
      navigate("/routes");
      return;
    }
    // Document intent chips — process pending files with the selected intent
    if (DOC_INTENT_CHIPS.includes(reply) && pendingDocFiles.current.length > 0) {
      const files = pendingDocFiles.current;
      pendingDocFiles.current = [];
      addUserMessage(reply);
      setThinking(true);
      const fileContents: string[] = [];
      for (const file of files) {
        const isBinary = BINARY_TYPES.includes(file.type) || file.name.endsWith(".pdf");
        const content = isBinary ? await parseDocumentViaAI(file) : await readFileAsText(file);
        fileContents.push(`--- File: ${file.name} ---\n${content.slice(0, 15000)}\n--- End of ${file.name} ---`);
      }
      setThinking(false);
      const fileBlock = fileContents.join("\n\n");
      const fullMessage = `Please extract ${reply.toLowerCase()} from these documents:\n\n${fileBlock}`;
      processUserMessage(fullMessage, reply);
      return;
    }
    // Help chips
    if (HELP_CHIPS.includes(reply)) {
      processUserMessage(reply);
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

  // ── Day selector ──
  const daySelector = (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
      {weekKeys.map((key, i) => {
        const isToday = key === todayKey;
        const isSelected = key === selectedDay;
        const isFuture = key > todayKey;
        return (
          <button
            key={key}
            onClick={() => !isFuture && setSelectedDay(key)}
            disabled={isFuture}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isFuture
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              isToday && !isSelected && "font-semibold"
            )}
          >
            {DAY_LABELS[i]}
          </button>
        );
      })}
    </div>
  );

  // ── Typing dots ──
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
    <div className="flex flex-col h-full min-w-0 relative"
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) setAttachedFiles(prev => [...prev, ...files]);
      }}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quinn</span>
          <Badge variant="outline" className="text-[9px]">Ops Assistant</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              aiStatus === "connected" ? "bg-emerald-500" : aiStatus === "disconnected" ? "bg-red-500" : "bg-amber-400 animate-pulse"
            )} />
            <span className="text-[10px] text-muted-foreground">
              {aiStatus === "connected" ? "AI Connected" : aiStatus === "disconnected" ? "AI Offline" : "Checking…"}
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all messages in today's conversation. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear Chat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {daySelector}

      {/* Drag overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Drop files here</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {threadLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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

            {thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Quinn is thinking…
                </div>
              </motion.div>
            )}

            {!thinking && messages.length > 0 && messages[messages.length - 1].role === "quinn" && messages[messages.length - 1].quickReplies && (
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
          </>
        )}
      </div>

      {/* Input */}
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
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json" className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                // Auto-send: show doc in chat and ask intent immediately
                const fileNames = files.map(f => f.name).join(", ");
                addUserMessage(`📎 ${fileNames}`);
                pendingDocFiles.current = files;
                addQuinnMessage(
                  `received ${files.length === 1 ? files[0].name : `${files.length} documents`}. what would you like to extract from ${files.length === 1 ? "the document" : "these documents"}?`,
                  DOC_INTENT_CHIPS
                );
              }
              e.target.value = "";
            }} />
          <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={creating || thinking}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Quinn what you need…"
            className="flex-1 min-w-0 text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={creating || thinking || selectedDay !== todayKey} />
          <Button type="submit" size="icon" variant="ghost" disabled={(!input.trim() && attachedFiles.length === 0) || creating || thinking || selectedDay !== todayKey}>
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
    onsiteTechManager: "tech manager", notes: "notes", isoCount: "ISO count",
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
  if (draft.onsiteTechManager) lines.push(`Tech Manager: ${draft.onsiteTechManager}`);
  lines.push(`Status: ${(draft.status || "draft").charAt(0).toUpperCase() + (draft.status || "draft").slice(1)}`);
  return lines.join("\n");
}
