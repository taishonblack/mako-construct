import { useState } from "react";
import { Calendar, Radio, AlertCircle, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MockBinder, BinderStatus } from "@/data/mock-binders";

const statusStyles: Record<BinderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  completed: "bg-emerald-900/30 text-emerald-500",
  archived: "bg-muted text-muted-foreground",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function BinderCard({ binder }: { binder: MockBinder }) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  if (isMobile) {
    return (
      <div className="steel-panel w-full max-w-full overflow-hidden">
        {/* Tappable link area */}
        <a
          href={`/binders/${binder.id}`}
          className="block p-4 pb-2"
        >
          {/* Line 1: Title + status */}
          <div className="flex items-start gap-2 min-w-0 mb-2">
            <h3 className="text-sm font-medium text-foreground leading-snug min-w-0 flex-1 truncate">
              {binder.title}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}
            >
              {binder.status}
            </span>
          </div>

          {/* Line 2: Date + transport */}
          <div className="flex items-center justify-between min-w-0 text-xs text-muted-foreground">
            <span className="shrink-0 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(binder.eventDate)}
            </span>
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider text-[10px]">
              {binder.transport}
            </span>
          </div>
        </a>

        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setExpanded(!expanded);
          }}
          className="w-full flex items-center justify-center py-1.5 text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-3 pt-1 space-y-1.5 text-xs text-muted-foreground border-t border-border/30">
            <div className="truncate">{binder.partner} · {binder.venue}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="shrink-0 flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                {binder.isoCount} ISOs
              </span>
              {binder.openIssues > 0 && (
                <span className="shrink-0 flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {binder.openIssues} issue{binder.openIssues !== 1 ? "s" : ""}
                </span>
              )}
              <span className="shrink-0">Updated {timeAgo(binder.updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout — unchanged
  return (
    <a
      href={`/binders/${binder.id}`}
      className="group block steel-panel p-5 hover:border-glow-red transition-all duration-300 w-full max-w-full overflow-hidden"
    >
      <div className="flex items-start gap-2 min-w-0 mb-3">
        <h3 className="text-sm font-medium text-foreground leading-snug min-w-0 flex-1 truncate">
          {binder.title}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}
        >
          {binder.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
        <span className="max-w-[55%] truncate">{binder.partner}</span>
        <span className="shrink-0">·</span>
        <span className="shrink-0 truncate max-w-[40%]">{binder.venue}</span>
        <span className="shrink-0 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {formatDate(binder.eventDate)}
        </span>
        <span className="shrink-0 flex items-center gap-1.5">
          <Radio className="w-3 h-3" />
          {binder.isoCount} ISOs
        </span>
        {binder.openIssues > 0 && (
          <span className="shrink-0 flex items-center gap-1.5 text-destructive">
            <AlertCircle className="w-3 h-3" />
            {binder.openIssues}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between min-w-0 text-[10px] text-muted-foreground">
        <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
          {binder.transport}
        </span>
        <span className="shrink-0">Updated {timeAgo(binder.updatedAt)}</span>
      </div>
    </a>
  );
}
