import { ArrowLeft, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReadinessLevel } from "@/lib/readiness-engine";

type EventStatus = "planning" | "configured" | "validated" | "live";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-secondary text-foreground",
  completed: "bg-emerald-900/30 text-emerald-400",
  archived: "bg-muted text-muted-foreground",
  planning: "bg-muted text-muted-foreground",
  configured: "bg-secondary text-foreground",
  validated: "bg-emerald-900/30 text-emerald-400",
  live: "bg-primary/20 text-primary",
};

const readinessConfig: Record<ReadinessLevel, { label: string; dot: string; text: string }> = {
  ready: { label: "Ready", dot: "bg-emerald-400", text: "text-emerald-400" },
  risk: { label: "Risk", dot: "bg-amber-400", text: "text-amber-400" },
  blocked: { label: "Blocked", dot: "bg-primary", text: "text-primary" },
};

interface MobileBinderHeaderProps {
  title: string;
  status: string;
  readiness: ReadinessLevel;
  metadata: { label: string; value: string }[];
  locked?: boolean;
  lockVersion?: number;
  onEdit?: () => void;
  previewMode: boolean;
}

export function MobileBinderHeader({
  title, status, readiness, metadata, locked, lockVersion, onEdit, previewMode,
}: MobileBinderHeaderProps) {
  const r = readinessConfig[readiness];

  return (
    <div className="steel-panel p-4 space-y-3">
      {/* Back + Title */}
      <div className="flex items-start gap-3">
        <Link to="/binders" className="mt-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 rounded ${statusStyles[status] || statusStyles.draft}`}>
              {status}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${r.dot} ${readiness === "blocked" ? "animate-pulse" : ""}`} />
              <span className={`text-[9px] font-medium tracking-[0.15em] uppercase ${r.text}`}>{r.label}</span>
            </div>
            {locked && (
              <span className="text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400">
                Locked v{lockVersion}
              </span>
            )}
          </div>
        </div>
        {onEdit && previewMode && !locked && (
          <button
            onClick={onEdit}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[10px] tracking-wider uppercase border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {/* Wrapping metadata chips */}
      {metadata.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metadata.map((m) => (
            <div key={m.label} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary border border-border">
              <span className="text-[9px] tracking-wider uppercase text-muted-foreground">{m.label}</span>
              <span className="text-[10px] font-mono text-foreground">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
