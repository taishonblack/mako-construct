import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Zap, AlertTriangle, HelpCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BinderState } from "@/hooks/use-binder-state";
import type { ReadinessReport } from "@/lib/readiness-engine";

interface CopilotProps {
  state: BinderState;
  report: ReadinessReport;
}

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// --- Rules-based answer engine ---
function answerQuery(query: string, state: BinderState, report: ReadinessReport): string {
  const q = query.toLowerCase().trim();

  // What changed
  if (q.includes("what changed") || q.includes("recent change") || q.includes("changelog") || q.includes("last update")) {
    const recent = state.changes.slice(0, 5);
    if (recent.length === 0) return "No changes recorded yet.";
    return "**Recent Changes:**\n" + recent.map((c, i) =>
      `${i + 1}. ${c.label} — *${new Date(c.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}*`
    ).join("\n");
  }

  // What's blocking
  if (q.includes("block") || q.includes("what's stopping") || q.includes("why can't") || q.includes("readiness")) {
    if (report.level === "ready") return "✅ **All clear.** No blocking issues. Production is ready.";
    const items = report.reasons.map((r, i) => `${i + 1}. ${r}`);
    const icon = report.level === "blocked" ? "🔴" : "🟡";
    return `${icon} **Readiness: ${report.level.toUpperCase()}**\n\n${items.join("\n")}`;
  }

  // Unmapped ISOs
  if (q.includes("unmapped") || q.includes("unassigned signal") || q.includes("iso") && (q.includes("missing") || q.includes("unmap"))) {
    const unmapped = state.signals.filter(s => !s.destination);
    const noEncoder = state.signals.filter(s => !s.encoderInput);
    const noDecoder = state.signals.filter(s => !s.decoderOutput && !s.hqPatchCustomLabel);
    let result = "";
    if (unmapped.length > 0) {
      result += `**${unmapped.length} signal${unmapped.length > 1 ? "s" : ""} with no destination:**\n`;
      result += unmapped.slice(0, 8).map(s => `- ISO ${s.iso} (${s.productionAlias || "no alias"})`).join("\n");
      if (unmapped.length > 8) result += `\n- ...and ${unmapped.length - 8} more`;
    }
    if (noEncoder.length > 0) {
      result += `\n\n**${noEncoder.length} signal${noEncoder.length > 1 ? "s" : ""} missing encoder input.**`;
    }
    if (noDecoder.length > 0) {
      result += `\n\n**${noDecoder.length} signal${noDecoder.length > 1 ? "s" : ""} missing decoder output.**`;
    }
    if (!result) return "✅ All signals are fully mapped (encoder, decoder, destination).";
    return result;
  }

  // TX/RX gaps
  if (q.includes("tx") || q.includes("rx") || q.includes("contribution")) {
    const missingTx = state.signals.filter(s => !s.txName);
    const missingRx = state.signals.filter(s => !s.rxName);
    if (missingTx.length === 0 && missingRx.length === 0) {
      return "✅ All signals have TX and RX names assigned.";
    }
    let result = "";
    if (missingTx.length > 0) {
      result += `**${missingTx.length} signal${missingTx.length > 1 ? "s" : ""} missing TX name:**\n`;
      result += missingTx.slice(0, 6).map(s => `- ISO ${s.iso} (${s.productionAlias || "—"})`).join("\n");
      if (missingTx.length > 6) result += `\n- ...and ${missingTx.length - 6} more`;
    }
    if (missingRx.length > 0) {
      result += `\n\n**${missingRx.length} signal${missingRx.length > 1 ? "s" : ""} missing RX name:**\n`;
      result += missingRx.slice(0, 6).map(s => `- ISO ${s.iso} (${s.productionAlias || "—"})`).join("\n");
      if (missingRx.length > 6) result += `\n- ...and ${missingRx.length - 6} more`;
    }
    result += "\n\nUse **Generate Missing TX/RX** in the Event Command Header to auto-fill.";
    return result;
  }

  // Comms / who owns
  if (q.includes("comms") || q.includes("who owns") || q.includes("communication") || q.includes("lq")) {
    const total = state.comms.length;
    const unassigned = state.comms.filter(c => !c.assignment.trim());
    if (total === 0) return "ℹ️ Comms are managed via LQ Ports Request in the Event Command Header. Check the LQ ports section.";
    let result = `**${total} comms channel${total > 1 ? "s" : ""} configured.**\n\n`;
    if (unassigned.length > 0) {
      result += `🟡 **${unassigned.length} unassigned:**\n`;
      result += unassigned.map(c => `- ${c.channel} (${c.type})`).join("\n");
    } else {
      result += "✅ All channels assigned.\n";
    }
    const byType = {
      "Clear-Com": state.comms.filter(c => c.type === "Clear-Com"),
      "LQ": state.comms.filter(c => c.type === "LQ"),
      "Hot Mic": state.comms.filter(c => c.type === "Hot Mic"),
    };
    result += "\n\n**Breakdown:**\n";
    for (const [type, entries] of Object.entries(byType)) {
      if (entries.length > 0) {
        result += `\n*${type}* (${entries.length}):\n`;
        result += entries.map(c => `- ${c.channel}: ${c.assignment || "⚠️ Unassigned"} @ ${c.location}`).join("\n");
      }
    }
    return result;
  }

  // Transport / backup
  if (q.includes("transport") || q.includes("backup") || q.includes("primary")) {
    const pri = state.transport.primary;
    const bak = state.transport.backup;
    let result = `**Primary Transport:** ${pri.protocol || "Not set"}\n`;
    if (pri.destination) result += `  Destination: ${pri.destination}:${pri.port}\n`;
    if (pri.latency) result += `  Latency: ${pri.latency}\n`;
    result += `\n**Backup Transport:** ${bak.protocol || "Not set"}\n`;
    if (bak.destination) result += `  Destination: ${bak.destination}:${bak.port}\n`;
    result += `\n**Return Feed:** ${state.returnRequired ? (state.transport.returnFeed ? "✅ Configured" : "❌ Required but not configured") : "Not required"}`;
    return result;
  }

  // Encoder / decoder
  if (q.includes("encoder") || q.includes("decoder") || q.includes("capacity")) {
    return `**Encoder Capacity:** ${report.encoderCapacity} available, ${report.encoderRequired} required${report.encoderShortfall > 0 ? ` — 🔴 ${report.encoderShortfall} shortfall` : " — ✅ OK"}\n\n**Decoder Mapping:** ${report.decoderAssigned}/${report.decoderTotal} assigned`;
  }

  // Checklist
  if (q.includes("checklist") || q.includes("check list") || q.includes("pre-air")) {
    const done = state.checklist.filter(c => c.checked);
    const pending = state.checklist.filter(c => !c.checked);
    let result = `**Checklist: ${done.length}/${state.checklist.length} complete**\n\n`;
    if (pending.length > 0) {
      result += "**Pending:**\n" + pending.map(c => `- ☐ ${c.label}`).join("\n");
    }
    if (done.length > 0) {
      result += "\n\n**Done:**\n" + done.map(c => `- ☑ ${c.label}`).join("\n");
    }
    return result;
  }

  // Lock
  if (q.includes("lock") || q.includes("version")) {
    const lock = state.currentLock;
    if (lock.locked) {
      return `🔒 **Production is LOCKED** — Lock v${lock.version}\nLocked at: ${lock.lockedAt ? new Date(lock.lockedAt).toLocaleString() : "—"}\nBy: ${lock.lockedBy}\n\n${state.lockHistory.length} total lock version${state.lockHistory.length > 1 ? "s" : ""} in history.`;
    }
    return `🔓 **Production is UNLOCKED**${lock.version > 0 ? `\nLast lock was v${lock.version}.` : ""}\n${state.lockHistory.length} lock version${state.lockHistory.length > 1 ? "s" : ""} in history.`;
  }

  // Staff
  if (q.includes("staff") || q.includes("crew") || q.includes("who is") || q.includes("team")) {
    const filled = state.eventHeader.staff.filter(s => s.name.trim());
    const empty = state.eventHeader.staff.filter(s => !s.name.trim());
    let result = `**Staff: ${filled.length}/${state.eventHeader.staff.length} assigned**\n\n`;
    if (filled.length > 0) {
      result += filled.map(s => `- **${s.role}**: ${s.name} (${s.panelPosition || "no panel"})`).join("\n");
    }
    if (empty.length > 0) {
      result += `\n\n⚠️ **${empty.length} role${empty.length > 1 ? "s" : ""} unfilled:** ${empty.map(s => s.role).join(", ")}`;
    }
    if (state.eventHeader.onsiteTechManager) {
      result += `\n\n**Onsite Tech Manager:** ${state.eventHeader.onsiteTechManager}`;
    }
    return result;
  }

  // Audio
  if (q.includes("audio") || q.includes("nats") || q.includes("announcer") || q.includes("output mode") || q.includes("5.1") || q.includes("stereo")) {
    const ap = state.audioPhilosophy;
    if (!ap) return "⚠️ Audio Philosophy not configured yet.";
    const configured = !!(ap.outputMode && ap.natsSource && ap.announcerRouting);
    return `${configured ? "✅" : "🟡"} **Audio Philosophy**\n\n` +
      `- **Output Mode:** ${ap.outputMode || "Not set"}\n` +
      `- **Nats Source:** ${ap.natsSource || "Not set"}\n` +
      `- **Announcer Routing:** ${ap.announcerRouting || "Not set"}\n` +
      (ap.notes ? `\n**Notes:** ${ap.notes}` : "");
  }

  // Control room
  if (q.includes("control room") || q.includes("cr-") || q.includes("facility")) {
    return `**Control Room:** CR-${state.eventHeader.controlRoom}\n**Arena:** ${state.eventHeader.arena || "Not set"}\n**Broadcast Feed:** ${state.eventHeader.broadcastFeed}`;
  }

  // Summary / overview
  if (q.includes("summary") || q.includes("overview") || q.includes("status") || q.includes("brief")) {
    const icon = report.level === "ready" ? "✅" : report.level === "risk" ? "🟡" : "🔴";
    return `${icon} **Production Status: ${report.level.toUpperCase()}**\n\n` +
      `- **Venue:** ${state.venue}\n` +
      `- **Partner:** ${state.partner}\n` +
      `- **ISO Count:** ${state.isoCount}\n` +
      `- **Control Room:** CR-${state.eventHeader.controlRoom}\n` +
      `- **Encoder:** ${report.encoderShortfall > 0 ? `🔴 ${report.encoderShortfall} short` : "✅ OK"}\n` +
      `- **Transport:** ${report.transportComplete ? "✅" : "❌"} Primary, ${report.backupDefined ? "✅" : "⚠️"} Backup\n` +
      `- **Checklist:** ${report.checklistComplete}/${report.checklistTotal}\n` +
      `- **Comms:** ${report.commsTotal} channels (${report.commsUnassigned} unassigned)\n` +
      `- **TX/RX:** ${report.txRxMissing} missing\n` +
      `- **Lock:** ${state.currentLock.locked ? `v${state.currentLock.version}` : "Unlocked"}\n` +
      `- **Audio:** ${report.audioConfigured ? "✅ Configured" : "⚠️ Incomplete"}`;
  }

  // Fallback
  return `I can help with these topics:\n\n` +
    `- **"What changed?"** — Recent change log\n` +
    `- **"What's blocking?"** — Readiness issues\n` +
    `- **"Unmapped ISOs"** — Signal mapping gaps\n` +
    `- **"TX/RX gaps"** — Missing contribution names\n` +
    `- **"Comms"** — Channel assignments & ownership\n` +
    `- **"Transport"** — Primary/backup/return status\n` +
    `- **"Encoder capacity"** — Encoder/decoder status\n` +
    `- **"Checklist"** — Pre-air checklist progress\n` +
    `- **"Staff"** — Crew assignments\n` +
    `- **"Lock status"** — Lock version history\n` +
    `- **"Summary"** — Full production overview\n\n` +
    `Try asking one of these!`;
}

const QUICK_QUESTIONS = [
  { label: "What's blocking?", icon: AlertTriangle },
  { label: "Summary", icon: Zap },
  { label: "Unmapped ISOs", icon: HelpCircle },
  { label: "TX/RX gaps", icon: HelpCircle },
  { label: "Comms", icon: MessageSquare },
  { label: "What changed?", icon: ChevronRight },
];

export function BinderCopilot({ state, report }: CopilotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = useCallback((text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    const userMsg: CopilotMessage = { id: `u-${Date.now()}`, role: "user", content: q };
    const answer = answerQuery(q, state, report);
    const assistantMsg: CopilotMessage = { id: `a-${Date.now()}`, role: "assistant", content: answer };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
  }, [input, state, report]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-crimson text-white shadow-lg hover:bg-crimson/90 transition-colors flex items-center justify-center"
            title="Ask MAKO"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-[380px] bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-crimson font-medium">Ask MAKO</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              {messages.length === 0 ? (
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Ask about your production state, readiness, signals, comms, or changes.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_QUESTIONS.map(qq => (
                      <button key={qq.label}
                        onClick={() => handleSend(qq.label)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[11px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors text-left"
                      >
                        <qq.icon className="w-3 h-3 shrink-0" />
                        {qq.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
                      <div className={`max-w-[95%] rounded-md px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-crimson/15 text-foreground"
                          : "bg-secondary/50 text-foreground"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="space-y-1 text-[13px] leading-relaxed whitespace-pre-wrap">
                            {msg.content.split("\n").map((line, i) => {
                              if (line.startsWith("**") && line.endsWith("**")) {
                                return <p key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, "")}</p>;
                              }
                              if (line.startsWith("- **")) {
                                const parts = line.replace(/^- \*\*/, "").split("**");
                                return (
                                  <p key={i} className="pl-2">
                                    <span className="font-medium">{parts[0]}</span>
                                    <span className="text-muted-foreground">{parts.slice(1).join("")}</span>
                                  </p>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return <p key={i} className="pl-2 text-muted-foreground">{line}</p>;
                              }
                              if (line.match(/^\d+\./)) {
                                return <p key={i} className="pl-2">{line}</p>;
                              }
                              if (line.trim() === "") return <br key={i} />;
                              return <p key={i}>{line.replace(/\*\*/g, "")}</p>;
                            })}
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-background/95">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this production…"
                  className="h-9 text-sm"
                />
                <Button size="icon" variant="ghost" onClick={() => handleSend()}
                  className="h-9 w-9 text-muted-foreground hover:text-crimson shrink-0"
                  disabled={!input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
