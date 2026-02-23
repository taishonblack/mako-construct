import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { DocEntry } from "@/data/mock-phase5";

const extractionIcon: Record<DocEntry["extractionStatus"], { icon: typeof CheckCircle; cls: string }> = {
  complete: { icon: CheckCircle, cls: "text-emerald-400" },
  pending: { icon: Clock, cls: "text-amber-400" },
  failed: { icon: AlertCircle, cls: "text-crimson" },
};

const typeBadge: Record<DocEntry["type"], string> = {
  Primer: "bg-crimson/15 text-crimson",
  "Call Sheet": "bg-secondary text-muted-foreground",
  Schedule: "bg-secondary text-muted-foreground",
  Diagram: "bg-amber-900/30 text-amber-400",
  Rundown: "bg-secondary text-muted-foreground",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DocumentArchive({ docs }: { docs: DocEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-3 group"
      >
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
          Document Archive
        </h2>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="text-[10px] text-muted-foreground">{docs.length} files</span>
      </button>

      {open && (
        <div className="steel-panel overflow-hidden">
          <div className="divide-y divide-border">
            {docs.map((doc) => {
              const { icon: StatusIcon, cls } = extractionIcon[doc.extractionStatus];
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 transition-colors">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.uploadedBy} · {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <span className={`text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0 ${typeBadge[doc.type]}`}>
                    {doc.type}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">v{doc.version}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusIcon className={`w-3 h-3 ${cls}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}
