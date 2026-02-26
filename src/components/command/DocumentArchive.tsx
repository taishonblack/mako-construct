import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, FileText, CheckCircle, Clock, AlertCircle, Plus, Eye, Trash2, ToggleLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocEntry } from "@/lib/binder-types";

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

interface Props {
  docs: DocEntry[];
  onAddDoc: (doc: DocEntry) => void;
  onRemoveDoc: (id: string) => void;
  onUpdateDoc: (id: string, field: keyof DocEntry, value: string) => void;
}

export function DocumentArchive({ docs = [], onAddDoc, onRemoveDoc, onUpdateDoc }: Props) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [name, setName] = useState("");
  const [type, setType] = useState<DocEntry["type"]>("Primer");
  const [version, setVersion] = useState("1.0");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName("");
    setType("Primer");
    setVersion("1.0");
    setUrl("");
    setMode("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    const newDoc: DocEntry = {
      id: `d-${Date.now()}`,
      type,
      name: name.trim(),
      version,
      uploadedBy: "You",
      uploadedAt: new Date().toISOString(),
      extractionStatus: "pending",
      url: mode === "link" ? url : undefined,
    };

    if (mode === "upload" && fileRef.current?.files?.[0]) {
      const file = fileRef.current.files[0];
      if (file.size <= 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          newDoc.url = reader.result as string;
          onAddDoc(newDoc);
        };
        reader.readAsDataURL(file);
      } else {
        onAddDoc(newDoc);
      }
    } else {
      onAddDoc(newDoc);
    }

    setDialogOpen(false);
    resetForm();
  };

  const toggleExtraction = (doc: DocEntry) => {
    const next = doc.extractionStatus === "complete" ? "pending" : "complete";
    onUpdateDoc(doc.id, "extractionStatus", next);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 group"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
            Assets
          </h2>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="text-[10px] text-muted-foreground">{docs.length} files</span>
        </button>
        {open && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] tracking-wider uppercase text-crimson hover:text-crimson hover:bg-crimson/10"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Asset
          </Button>
        )}
      </div>

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
                  {/* Row actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.url && (
                      <button
                        onClick={() => window.open(doc.url, "_blank")}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleExtraction(doc)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Toggle extracted"
                    >
                      <ToggleLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveDoc(doc.id)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-crimson transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Asset Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-sm tracking-wider uppercase">Add Asset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setMode("upload")}
              >
                Upload
              </Button>
              <Button
                variant={mode === "link" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setMode("link")}
              >
                Link
              </Button>
            </div>

            {/* Name */}
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" className="h-8 text-sm" />
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as DocEntry["type"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primer">Primer</SelectItem>
                  <SelectItem value="Call Sheet">Call Sheet</SelectItem>
                  <SelectItem value="Schedule">Schedule</SelectItem>
                  <SelectItem value="Diagram">Technical Drawing</SelectItem>
                  <SelectItem value="Rundown">Rundown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Version */}
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">Version</label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" className="h-8 text-sm" />
            </div>

            {/* File or URL */}
            {mode === "upload" ? (
              <div>
                <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">File (≤2MB for persistence)</label>
                <input ref={fileRef} type="file" className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-foreground" />
              </div>
            ) : (
              <div>
                <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!name.trim()} className="bg-crimson hover:bg-crimson/90 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
