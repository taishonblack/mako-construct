import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Wand2, Loader2, Edit3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CallSheetExtraction, Confidence, ImportFileInfo } from "@/types/callsheet-import";

function ConfidenceDot({ level }: { level: Confidence }) {
  const color =
    level === "high"
      ? "bg-emerald-500"
      : level === "medium"
      ? "bg-amber-400"
      : "bg-destructive";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

interface FieldRowProps {
  label: string;
  value: string;
  confidence?: Confidence;
  onEdit?: (val: string) => void;
}

function FieldRow({ label, value, confidence, onEdit }: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      {confidence && <ConfidenceDot level={confidence} />}
      <span className="text-[11px] text-muted-foreground w-28 shrink-0">{label}</span>
      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { setEditing(false); onEdit?.(draft); }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onEdit?.(draft); } }}
          className="h-7 text-xs flex-1"
          autoFocus
        />
      ) : (
        <span className="text-xs text-foreground font-mono truncate flex-1 min-w-0">
          {value || "—"}
        </span>
      )}
      {onEdit && !editing && (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface Props {
  file: ImportFileInfo | null;
  setFile: (f: ImportFileInfo | null) => void;
  extraction: CallSheetExtraction | null;
  setExtraction: (e: CallSheetExtraction) => void;
  extracting: boolean;
  setExtracting: (v: boolean) => void;
  onNext: () => void;
}

export function StepExtract({ file, setFile, extraction, setExtraction, extracting, setExtracting, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleFile = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: f.name,
        size: f.size,
        type: f.name.endsWith(".pdf") ? "pdf" : f.name.endsWith(".eml") ? "eml" : "txt",
        content: reader.result as string,
      });
    };
    reader.readAsText(f);
  }, [setFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return;
    setFile({
      name: "Pasted text",
      size: new Blob([pasteText]).size,
      type: "txt",
      content: pasteText,
    });
    setPasteMode(false);
  }, [pasteText, setFile]);

  const runExtraction = useCallback(async () => {
    if (!file?.content) {
      toast({ title: "No content", description: "Upload or paste a call sheet first.", variant: "destructive" });
      return;
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-callsheet", {
        body: { text: file.content },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Extraction failed", description: data.error, variant: "destructive" });
        setExtracting(false);
        return;
      }

      const ext = data.extraction as CallSheetExtraction;
      setExtraction(ext);
      toast({ title: "Extraction complete", description: `Found ${ext.staff?.length || 0} staff, ${ext.tasks?.length || 0} tasks, ${ext.callTimes?.length || 0} timeline entries.` });
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast({ title: "Extraction error", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  }, [file, setExtraction, setExtracting]);

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      {!file && !pasteMode && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-foreground">Drop a call sheet here</p>
          <p className="text-[11px] text-muted-foreground mt-1">.pdf, .eml, .txt — or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.eml,.txt,.msg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {!file && !pasteMode && (
        <div className="text-center">
          <button onClick={() => setPasteMode(true)} className="text-[11px] text-primary hover:underline">
            Or paste text instead
          </button>
        </div>
      )}

      {pasteMode && !file && (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your call sheet or email text here..."
            className="w-full h-48 p-3 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none font-mono"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePasteSubmit} disabled={!pasteText.trim()} className="text-[10px] uppercase tracking-wider">
              Use This Text
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPasteMode(false)} className="text-[10px] uppercase tracking-wider">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* File loaded */}
      {file && !extraction && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {file.type.toUpperCase()}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFile(null)}
              className="text-[10px] text-muted-foreground"
            >
              Remove
            </Button>
          </div>

          <Button
            onClick={runExtraction}
            disabled={extracting}
            className="w-full text-[10px] uppercase tracking-wider"
          >
            {extracting ? (
              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Extracting…</>
            ) : (
              <><Wand2 className="w-3 h-3 mr-1" /> Run AI Extraction</>
            )}
          </Button>
        </div>
      )}

      {/* Extraction results */}
      {extraction && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium truncate">{file?.name}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setFile(null); setExtraction(null as any); }} className="text-[10px] text-muted-foreground">
              Re-upload
            </Button>
          </div>

          {/* Show metadata */}
          <div>
            <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">Show Details</span>
            <div className="space-y-0.5">
              <FieldRow label="Show Title" value={extraction.showTitle} confidence={extraction.showTitleConfidence} onEdit={(v) => setExtraction({ ...extraction, showTitle: v })} />
              <FieldRow label="Date" value={extraction.showDate} confidence={extraction.showDateConfidence} onEdit={(v) => setExtraction({ ...extraction, showDate: v })} />
              <FieldRow label="Air Time" value={extraction.airTime} confidence={extraction.airTimeConfidence} onEdit={(v) => setExtraction({ ...extraction, airTime: v })} />
              <FieldRow label="Venue" value={extraction.venue} confidence={extraction.venueConfidence} onEdit={(v) => setExtraction({ ...extraction, venue: v })} />
              <FieldRow label="Facility" value={extraction.facility || ""} confidence={extraction.facilityConfidence} />
              <FieldRow label="Control Room" value={extraction.controlRoom} confidence={extraction.controlRoomConfidence} onEdit={(v) => setExtraction({ ...extraction, controlRoom: v })} />
              <FieldRow label="Production Type" value={extraction.productionType || ""} confidence={extraction.productionTypeConfidence} />
              {extraction.league && <FieldRow label="League" value={extraction.league} />}
              {extraction.homeTeam && <FieldRow label="Home Team" value={extraction.homeTeam} />}
              {extraction.awayTeam && <FieldRow label="Away Team" value={extraction.awayTeam} />}
            </div>
          </div>

          {/* Timeline */}
          {extraction.callTimes?.length > 0 && (
            <div>
              <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">
                Timeline ({extraction.callTimes.length})
              </span>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {extraction.callTimes.map((ct, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-[11px] font-mono text-primary w-14 shrink-0">{ct.time}</span>
                    <span className="text-xs text-foreground truncate">{ct.label}</span>
                    {ct.category && (
                      <span className="text-[9px] text-muted-foreground ml-auto shrink-0 uppercase">{ct.category}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {extraction.staff?.length > 0 && (
            <div>
              <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">
                Staff ({extraction.staff.length})
              </span>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {extraction.staff.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs text-foreground w-32 truncate shrink-0">{s.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{s.role}</span>
                    {s.department && (
                      <span className="text-[9px] text-muted-foreground/60 ml-auto uppercase shrink-0">{s.department}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {extraction.tasks?.length > 0 && (
            <div>
              <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">
                Tasks ({extraction.tasks.length})
              </span>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {extraction.tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs text-foreground truncate flex-1 min-w-0">{t.title}</span>
                    <span className="text-[9px] text-muted-foreground uppercase shrink-0">{t.departmentTag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route hints */}
          {extraction.routeHints && extraction.routeHints.length > 0 && (
            <div>
              <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">
                Route Hints ({extraction.routeHints.length})
              </span>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {extraction.routeHints.map((r, i) => (
                  <div key={i} className="text-[11px] text-foreground font-mono py-0.5 truncate">
                    {r.txId} {r.isoName ? `→ ${r.isoName}` : ""} {r.source ? `[${r.source}]` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low confidence warning */}
          {[extraction.showTitleConfidence, extraction.showDateConfidence, extraction.airTimeConfidence, extraction.venueConfidence, extraction.controlRoomConfidence].some(c => c === "low") && (
            <div className="flex items-start gap-2 p-2.5 rounded-sm bg-amber-900/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/80">Some fields have low confidence. Click the edit icon to correct them before proceeding.</p>
            </div>
          )}

          <Button onClick={onNext} className="w-full text-[10px] uppercase tracking-wider">
            Next: Place in Binder →
          </Button>
        </div>
      )}
    </div>
  );
}
