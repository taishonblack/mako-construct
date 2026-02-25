import { useState, useRef, useEffect } from "react";
import { Plus, FileText, Mail, FileUp, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportSourceType } from "@/lib/import-types";

interface Props {
  onSelect: (sourceType: ImportSourceType) => void;
}

const ITEMS: { label: string; icon: React.ElementType; source: ImportSourceType }[] = [
  { label: "Import Call Sheet (AI)", icon: FileText, source: "callsheet" },
  { label: "Import Email (AI)", icon: Mail, source: "email" },
  { label: "Import PDF (AI)", icon: FileUp, source: "pdf" },
  { label: "Paste Text", icon: ClipboardPaste, source: "paste" },
];

export function ImportMenuButton({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-8"
        onClick={() => setOpen(!open)}
      >
        <Plus className="w-3 h-3" />
        Import
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-popover border border-border rounded-md shadow-lg z-50 py-1">
          {ITEMS.map((item) => (
            <button
              key={item.source}
              type="button"
              onClick={() => {
                onSelect(item.source);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left"
            >
              <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
