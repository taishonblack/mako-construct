import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MockBinder, BinderStatus } from "@/data/mock-binders";

const statusStyles: Record<BinderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  completed: "bg-emerald-900/30 text-emerald-400",
  archived: "bg-muted text-muted-foreground",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function MobileBinderCard({ binder }: { binder: MockBinder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="steel-panel w-full max-w-full overflow-hidden">
      {/* Collapsed: tap target */}
      <a
        href={`/binders/${binder.id}`}
        className="block px-4 py-3"
        onClick={(e) => {
          // If tapping the expand chevron area, don't navigate
        }}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground leading-snug truncate">
              {binder.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatDate(binder.eventDate)} • {formatTime(binder.eventDate)}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}
          >
            {binder.status}
          </span>
        </div>
      </a>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center py-1.5 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded metadata */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5 border-t border-border pt-3">
              <MetaRow label="Partner" value={binder.partner} />
              <MetaRow label="Arena" value={binder.venue} />
              <MetaRow label="Transport" value={binder.transport} />
              <MetaRow label="ISO Count" value={String(binder.isoCount)} />
              {binder.openIssues > 0 && (
                <MetaRow
                  label="Open Issues"
                  value={String(binder.openIssues)}
                  highlight
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs min-w-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`truncate ml-4 ${highlight ? "text-destructive font-medium" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
