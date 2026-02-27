import { useState, useRef } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CallSheetExtraction, ImportFileInfo, ConfidenceLevel } from "@/lib/import-types";
import { runCallSheetExtraction } from "@/lib/call-sheet-extraction";

const CONF_DOT: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-400",
  low: "bg-red-500",
};

function ConfDot({ level }: { level: ConfidenceLevel }) {
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", CONF_DOT[level])} title={level} />;
}

interface Props {
  file: ImportFileInfo;
  extraction: CallSheetExtraction | null;
  onExtracted: (e: CallSheetExtraction) => void;
  onChange: (e: CallSheetExtraction) => void;
  onFileChange?: (file: ImportFileInfo) => void;
}

export function StepExtract({ file, extraction, onExtracted, onChange, onFileChange }: Props) {
  const [running, setRunning] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  const [pasteText, setPasteText] = useState("");
  const isPaste = file.sourceType === "paste";
  const hasFile = !!file.rawFile || (isPaste && pasteText.trim().length > 0);

  const handleRun = async () => {
    setRunning(true);
    const fileInfo = isPaste
      ? { ...file, name: pasteText.slice(0, 40), rawFile: undefined }
      : file;
    // For paste mode, store text in a synthetic File so extraction can read it
    if (isPaste) {
      (fileInfo as any).rawText = pasteText;
    }
    const result = await runCallSheetExtraction(fileInfo, isPaste ? pasteText : undefined);
    onExtracted(result);
    setRunning(false);
  };

  const handlePickFile = () => {
    pickerRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!picked || !onFileChange) return;
    onFileChange({
      name: picked.name,
      size: picked.size,
      type: picked.type,
      sourceType: file.sourceType,
      rawFile: picked,
    });
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for re-picking */}
      <input
        ref={pickerRef}
        type="file"
        className="hidden"
        accept={file.sourceType === "pdf" ? ".pdf" : file.sourceType === "email" ? ".eml" : ".pdf,.doc,.docx,.txt,.rtf"}
        onChange={handleFileSelected}
      />

      {/* Paste text area or file source box */}
      {isPaste ? (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Paste call sheet text below</label>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your call sheet, rundown, or schedule text here…"
            className="min-h-[160px] text-xs font-mono"
            autoFocus
          />
          {pasteText.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{pasteText.length} characters</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePickFile}
          className="w-full steel-panel p-4 flex items-center gap-3 text-left hover:border-primary/40 transition-colors cursor-pointer"
        >
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{file.rawFile ? file.name : "No file selected"}</p>
            <p className="text-[10px] text-muted-foreground">
              {file.rawFile
                ? `${file.sourceType.toUpperCase()} · ${(file.size / 1024).toFixed(1)} KB`
                : "Click to choose a file"}
            </p>
          </div>
          {extraction ? (
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 shrink-0">
              Extracted
            </Badge>
          ) : !file.rawFile ? (
            <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : null}
        </button>
      )}

      {!extraction && (
        <Button onClick={handleRun} disabled={running || !hasFile} className="w-full gap-2">
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Extraction
            </>
          )}
        </Button>
      )}

      {extraction && (() => {
        const updateField = <K extends keyof CallSheetExtraction>(key: K, value: CallSheetExtraction[K]["value"]) => {
          onChange({ ...extraction, [key]: { ...extraction[key], value } });
        };
        return (
        <div className="space-y-3">
          {/* Show Title */}
          <FieldRow label="Show Title" confidence={extraction.showTitle.confidence}>
            <Input
              value={extraction.showTitle.value}
              onChange={(e) => updateField("showTitle", e.target.value)}
              className="h-8 text-sm"
            />
          </FieldRow>

          {/* Date */}
          <FieldRow label="Date" confidence={extraction.showDate.confidence}>
            <Input
              type="date"
              value={extraction.showDate.value}
              onChange={(e) => updateField("showDate", e.target.value)}
              className="h-8 text-sm"
            />
          </FieldRow>

          {/* Venue */}
          <FieldRow label="Venue" confidence={extraction.venue.confidence}>
            <Input
              value={extraction.venue.value}
              onChange={(e) => updateField("venue", e.target.value)}
              className="h-8 text-sm"
            />
          </FieldRow>

          {/* Control Room */}
          <FieldRow label="Control Room" confidence={extraction.controlRoom.confidence}>
            <Input
              value={extraction.controlRoom.value}
              onChange={(e) => updateField("controlRoom", e.target.value)}
              className="h-8 text-sm"
            />
          </FieldRow>

          {/* Call Times */}
          <div className="steel-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <ConfDot level={extraction.callTimes.confidence} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Call Times ({extraction.callTimes.value.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {extraction.callTimes.value.map((ct, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px] gap-2">
                  <Input
                    value={ct.label}
                    onChange={(e) => {
                      const updated = [...extraction.callTimes.value];
                      updated[i] = { ...updated[i], label: e.target.value };
                      updateField("callTimes", updated);
                    }}
                    className="h-7 text-xs"
                  />
                  <Input
                    type="time"
                    value={ct.time}
                    onChange={(e) => {
                      const updated = [...extraction.callTimes.value];
                      updated[i] = { ...updated[i], time: e.target.value };
                      updateField("callTimes", updated);
                    }}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div className="steel-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <ConfDot level={extraction.staff.confidence} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Staff ({extraction.staff.value.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {extraction.staff.value.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Input
                    value={s.name}
                    onChange={(e) => {
                      const updated = [...extraction.staff.value];
                      updated[i] = { ...updated[i], name: e.target.value };
                      updateField("staff", updated);
                    }}
                    className="h-7 text-xs flex-1 min-w-0"
                    placeholder="Name"
                  />
                  <Input
                    value={s.role}
                    onChange={(e) => {
                      const updated = [...extraction.staff.value];
                      updated[i] = { ...updated[i], role: e.target.value };
                      updateField("staff", updated);
                    }}
                    className="h-7 text-xs w-24"
                    placeholder="Role"
                  />
                  <span className="text-muted-foreground text-[10px] shrink-0">{s.orgTag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="steel-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <ConfDot level={extraction.tasks.confidence} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Tasks ({extraction.tasks.value.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {extraction.tasks.value.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Input
                    value={t.title}
                    onChange={(e) => {
                      const updated = [...extraction.tasks.value];
                      updated[i] = { ...updated[i], title: e.target.value };
                      updateField("tasks", updated);
                    }}
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                  <Badge variant="outline" className="text-[9px] shrink-0">{t.departmentTag}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Route Hints */}
          {extraction.routeHints.value.length > 0 && (
            <div className="steel-panel p-3">
              <div className="flex items-center gap-2 mb-2">
                <ConfDot level={extraction.routeHints.confidence} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Route Hints ({extraction.routeHints.value.length})
                </span>
                {extraction.routeHints.confidence === "low" && (
                  <Badge variant="outline" className="text-[9px] border-red-500/40 text-red-400">Needs review</Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {extraction.routeHints.value.map((r, i) => (
                  <div key={i} className="text-[10px] font-mono text-muted-foreground bg-secondary/50 rounded px-2 py-1">
                    {r.txId} · {r.isoName} · {r.source} → {r.output}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}

function FieldRow({ label, confidence, children }: { label: string; confidence: ConfidenceLevel; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
      <div className="flex items-center gap-1.5">
        <ConfDot level={confidence} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
