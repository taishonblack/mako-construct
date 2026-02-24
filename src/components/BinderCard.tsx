import { Calendar, Radio, AlertCircle } from "lucide-react";
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
  return (
    <a
      href={`/binders/${binder.id}`}
      className="group block steel-panel p-5 hover:border-glow-red transition-all duration-300 w-full max-w-full overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground leading-snug pr-3 min-w-0 truncate">
          {binder.title}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}
        >
          {binder.status}
        </span>
      </div>

      {/* Partner + venue */}
      <p className="text-xs text-muted-foreground mb-4 min-w-0 truncate">{binder.partner} · {binder.venue}</p>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {formatDate(binder.eventDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3" />
          {binder.isoCount} ISOs
        </span>
        {binder.openIssues > 0 && (
          <span className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="w-3 h-3" />
            {binder.openIssues}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
          {binder.transport}
        </span>
        <span>Updated {timeAgo(binder.updatedAt)}</span>
      </div>
    </a>
  );
}
