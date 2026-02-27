import { useState } from "react";
import { Calendar, Radio, AlertCircle, ChevronDown, Trash2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { BinderRecord, BinderStatus } from "@/stores/binder-store";
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

interface BinderCardProps {
  binder: BinderRecord;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function BinderCard({ binder, canDelete, onDelete, selectMode, selected, onToggleSelect }: BinderCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`steel-panel w-full max-w-full overflow-hidden transition-all duration-300 relative group/card ${
        selectMode && selected ? "border-primary ring-1 ring-primary/30" : "hover:border-glow-red"
      }`}
      onClick={selectMode && onToggleSelect ? (e) => { e.preventDefault(); onToggleSelect(binder.id); } : undefined}
    >
      {/* Select mode checkbox */}
      {selectMode && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.(binder.id)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}
      {canDelete && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover/card:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Delete binder"
              onClick={(e) => e.preventDefault()}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this binder?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{binder.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(binder.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <a
        href={selectMode ? undefined : `/binders/${binder.id}`}
        className={`group block p-4 sm:p-5 ${selectMode ? "pl-10 sm:pl-12 cursor-pointer" : ""}`}
        onClick={selectMode ? (e) => e.preventDefault() : undefined}
      >
        {/* Title + status — always visible */}
        <div className="flex items-start gap-2 min-w-0 mb-2 sm:mb-3">
          <h3 className="text-sm font-medium text-foreground leading-snug min-w-0 flex-1 truncate">
            {binder.title}
          </h3>
          <span
            className={`shrink-0 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded ${statusStyles[binder.status]}`}
          >
            {binder.status}
          </span>
        </div>

        {/* Mobile summary: date only */}
        <div className="sm:hidden flex items-center justify-between min-w-0 text-xs text-muted-foreground">
          <span className="shrink-0 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatDate(binder.eventDate)}
          </span>
        </div>

        {/* Desktop meta row — hidden on mobile */}
        <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
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

        {/* Desktop footer — hidden on mobile */}
        <div className="hidden sm:flex items-center justify-between min-w-0 text-[10px] text-muted-foreground">
          <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
            {binder.transport}
          </span>
          <span className="shrink-0">Updated {timeAgo(binder.updatedAt)}</span>
        </div>
      </a>

      {/* Mobile expand toggle */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        className="sm:hidden flex items-center justify-center w-full py-2 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Mobile expanded details */}
      {expanded && (
        <div className="sm:hidden px-4 pb-4 space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center justify-between min-w-0">
            <span className="truncate min-w-0 flex-1">{binder.partner}</span>
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary uppercase tracking-wider text-[10px]">
              {binder.transport}
            </span>
          </div>
          <div className="truncate">{binder.venue}</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3" />
              {binder.isoCount} ISOs
            </span>
            {binder.openIssues > 0 && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="w-3 h-3" />
                {binder.openIssues} issue{binder.openIssues !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="text-[10px]">Updated {timeAgo(binder.updatedAt)}</div>
        </div>
      )}
    </div>
  );
}
