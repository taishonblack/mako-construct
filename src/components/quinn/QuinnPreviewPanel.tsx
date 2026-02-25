import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { BinderDraft } from "@/stores/binder-draft-store";

interface Props {
  draft: BinderDraft;
  onEditField: (field: string) => void;
  className?: string;
}

const TIMEZONES: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "Europe/Berlin": "CET",
};

function ConfidenceDot({ level }: { level?: "high" | "medium" | "low" }) {
  if (!level) return null;
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full ml-1.5 flex-shrink-0", {
      "bg-emerald-500": level === "high",
      "bg-amber-400": level === "medium",
      "bg-red-400": level === "low",
    })} title={`${level} confidence`} />
  );
}

function PreviewField({ label, value, confidence, locked, onEdit }: {
  label: string; value: string; confidence?: "high" | "medium" | "low"; locked?: boolean; onEdit: () => void;
}) {
  return (
    <button onClick={onEdit} className="w-full text-left group py-1.5 px-2 -mx-2 rounded hover:bg-secondary/60 transition-colors">
      <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground flex items-center">
        {label}
        <ConfidenceDot level={confidence} />
        {locked && <span className="ml-1.5 text-[8px] text-amber-400/70">locked</span>}
      </span>
      <span className={cn("text-sm block mt-0.5", value ? "text-foreground" : "text-muted-foreground/50 italic")}>
        {value || "—"}
      </span>
    </button>
  );
}

export function QuinnPreviewPanel({ draft, onEditField, className }: Props) {
  const dateDisplay = draft.gameDate
    ? (() => { try { return format(new Date(draft.gameDate + "T12:00:00"), "EEE, MMM d, yyyy"); } catch { return draft.gameDate; } })()
    : "";

  const timeDisplay = draft.gameTime || "";
  const tzDisplay = TIMEZONES[draft.timezone] || draft.timezone || "";
  const crDisplay = draft.controlRoom ? (draft.controlRoom === "Remote" ? "Remote" : `CR-${draft.controlRoom}`) : "";
  const statusDisplay = draft.status ? draft.status.charAt(0).toUpperCase() + draft.status.slice(1) : "Draft";

  const conf = draft.fieldConfidence;

  const titleDisplay = draft.binderTitle || (draft.awayTeam && draft.homeTeam ? `${draft.awayTeam} @ ${draft.homeTeam}` : "");

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">Binder Preview</span>
        <Badge variant="outline" className="text-[9px]">{statusDisplay}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        <PreviewField label="Title" value={titleDisplay} confidence={conf.binderTitle} locked={draft.lockedFields.includes("binderTitle")} onEdit={() => onEditField("binderTitle")} />
        
        <div className="grid grid-cols-2 gap-x-2">
          <PreviewField label="Away" value={draft.awayTeam} confidence={conf.awayTeam} locked={draft.lockedFields.includes("awayTeam")} onEdit={() => onEditField("awayTeam")} />
          <PreviewField label="Home" value={draft.homeTeam} confidence={conf.homeTeam} locked={draft.lockedFields.includes("homeTeam")} onEdit={() => onEditField("homeTeam")} />
        </div>

        <PreviewField label="Date" value={dateDisplay} confidence={conf.gameDate} locked={draft.lockedFields.includes("gameDate")} onEdit={() => onEditField("gameDate")} />

        <div className="grid grid-cols-2 gap-x-2">
          <PreviewField label="Time" value={timeDisplay} confidence={conf.gameTime} locked={draft.lockedFields.includes("gameTime")} onEdit={() => onEditField("gameTime")} />
          <PreviewField label="Timezone" value={tzDisplay} confidence={conf.timezone} locked={draft.lockedFields.includes("timezone")} onEdit={() => onEditField("timezone")} />
        </div>

        <PreviewField label="Control Room" value={crDisplay} confidence={conf.controlRoom} locked={draft.lockedFields.includes("controlRoom")} onEdit={() => onEditField("controlRoom")} />
        <PreviewField label="Venue" value={draft.venue} confidence={conf.venue} locked={draft.lockedFields.includes("venue")} onEdit={() => onEditField("venue")} />
        <PreviewField label="Feed" value={draft.broadcastFeed} confidence={conf.broadcastFeed} locked={draft.lockedFields.includes("broadcastFeed")} onEdit={() => onEditField("broadcastFeed")} />
        <PreviewField label="Tech Manager" value={draft.onsiteTechManager} confidence={conf.onsiteTechManager} locked={draft.lockedFields.includes("onsiteTechManager")} onEdit={() => onEditField("onsiteTechManager")} />
        <PreviewField label="Notes" value={draft.notes} confidence={conf.notes} locked={draft.lockedFields.includes("notes")} onEdit={() => onEditField("notes")} />
      </div>

      {/* Updated-by-Quinn activity line */}
      {Object.keys(conf).length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <span className="text-[9px] text-muted-foreground">
            Quinn updated: {Object.keys(conf).filter(k => conf[k]).map(k => {
              const labels: Record<string, string> = {
                binderTitle: "Title", homeTeam: "Home", awayTeam: "Away",
                gameDate: "Date", gameTime: "Time", timezone: "TZ",
                controlRoom: "CR", venue: "Venue", broadcastFeed: "Feed",
              };
              return labels[k] || k;
            }).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
