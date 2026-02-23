import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Check, X, ChevronRight, Wand2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { BinderState } from "@/hooks/use-binder-state";
import type { EventCommandHeaderData, StaffEntry } from "@/components/command/EventCommandHeader";

type DocType = "Primer" | "Call Sheet" | "Camera List";

interface DetectedField {
  id: string;
  label: string;
  section: string;
  value: string;
  target: string; // which binder field this maps to
  accepted: boolean;
}

// Mock extraction results per document type
function mockExtract(docType: DocType, state: BinderState): DetectedField[] {
  const now = Date.now();
  if (docType === "Primer") {
    return [
      { id: `f-${now}-1`, label: "Project Title", section: "Event Identity", value: "NYR @ BOS — Alt German Feed", target: "eventHeader.projectTitle", accepted: true },
      { id: `f-${now}-2`, label: "Show Date", section: "Event Identity", value: "2026-03-15", target: "eventHeader.showDate", accepted: true },
      { id: `f-${now}-3`, label: "Show Time", section: "Event Identity", value: "19:30", target: "eventHeader.showTime", accepted: true },
      { id: `f-${now}-4`, label: "Arena", section: "Game Context", value: "TD Garden", target: "eventHeader.arena", accepted: true },
      { id: `f-${now}-5`, label: "NHL Game", section: "Game Context", value: "NYR", target: "eventHeader.nhlGame", accepted: true },
      { id: `f-${now}-6`, label: "Broadcast Feed", section: "Game Context", value: "INTL Truck PGM", target: "eventHeader.broadcastFeed", accepted: true },
      { id: `f-${now}-7`, label: "Control Room", section: "Facility", value: "23", target: "eventHeader.controlRoom", accepted: true },
      { id: `f-${now}-8`, label: "ISO Count", section: "Signals", value: "18", target: "isoCount", accepted: true },
      { id: `f-${now}-9`, label: "Output Mode", section: "Audio", value: "5.1", target: "audioPhilosophy.outputMode", accepted: true },
      { id: `f-${now}-10`, label: "Nats Source", section: "Audio", value: "Arena Overhead Mics", target: "audioPhilosophy.natsSource", accepted: true },
    ];
  }
  if (docType === "Call Sheet") {
    const staffDetected: DetectedField[] = [
      { id: `f-${now}-1`, label: "Producer", section: "Staff", value: "James Calloway", target: "staff.Producer", accepted: true },
      { id: `f-${now}-2`, label: "Director", section: "Staff", value: "Sarah Nguyen", target: "staff.Director", accepted: true },
      { id: `f-${now}-3`, label: "TD", section: "Staff", value: "Marcus Reid", target: "staff.TD", accepted: true },
      { id: `f-${now}-4`, label: "Audio", section: "Staff", value: "Kevin O'Brien", target: "staff.Audio", accepted: true },
      { id: `f-${now}-5`, label: "Graphics", section: "Staff", value: "Rachel Torres", target: "staff.Graphics", accepted: true },
      { id: `f-${now}-6`, label: "Onsite Tech Manager", section: "Staff", value: "Andre Williams", target: "eventHeader.onsiteTechManager", accepted: true },
    ];
    return [
      ...staffDetected,
      { id: `f-${now}-7`, label: "Rehearsal Date", section: "Event Identity", value: "2026-03-14", target: "eventHeader.rehearsalDate", accepted: true },
      { id: `f-${now}-8`, label: "Show Time", section: "Event Identity", value: "19:00", target: "eventHeader.showTime", accepted: true },
    ];
  }
  // Camera List
  return [
    { id: `f-${now}-1`, label: "ISO 1 Alias", section: "Signals", value: "Center Ice High", target: "signal.1.alias", accepted: true },
    { id: `f-${now}-2`, label: "ISO 2 Alias", section: "Signals", value: "Home Bench", target: "signal.2.alias", accepted: true },
    { id: `f-${now}-3`, label: "ISO 3 Alias", section: "Signals", value: "Away Bench", target: "signal.3.alias", accepted: true },
    { id: `f-${now}-4`, label: "ISO 4 Alias", section: "Signals", value: "Goal Cam Home", target: "signal.4.alias", accepted: true },
    { id: `f-${now}-5`, label: "ISO 5 Alias", section: "Signals", value: "Goal Cam Away", target: "signal.5.alias", accepted: true },
    { id: `f-${now}-6`, label: "ISO 6 Alias", section: "Signals", value: "Overhead", target: "signal.6.alias", accepted: true },
    { id: `f-${now}-7`, label: "ISO 7 Alias", section: "Signals", value: "Beauty Shot", target: "signal.7.alias", accepted: true },
    { id: `f-${now}-8`, label: "ISO 8 Alias", section: "Signals", value: "Penalty Box", target: "signal.8.alias", accepted: true },
    { id: `f-${now}-9`, label: "ISO Count", section: "Signals", value: "8", target: "isoCount", accepted: true },
  ];
}

const DOC_TYPES: { type: DocType; desc: string; icon: string }[] = [
  { type: "Primer", desc: "Production primer with event details, facility info, and audio specs", icon: "📋" },
  { type: "Call Sheet", desc: "Staff assignments, rehearsal dates, and contact information", icon: "📞" },
  { type: "Camera List", desc: "ISO camera positions and signal aliases", icon: "🎥" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  state: BinderState;
  onApply: (fields: DetectedField[]) => void;
}

export type { DetectedField };

export function DocToBinderAssist({ open, onClose, state, onApply }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [fields, setFields] = useState<DetectedField[]>([]);

  const handleSelectType = useCallback((type: DocType) => {
    setSelectedType(type);
    const detected = mockExtract(type, state);
    setFields(detected);
    setStep(2);
  }, [state]);

  const toggleField = useCallback((id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, accepted: !f.accepted } : f));
  }, []);

  const toggleAll = useCallback((accepted: boolean) => {
    setFields(prev => prev.map(f => ({ ...f, accepted })));
  }, []);

  const handleApply = useCallback(() => {
    const accepted = fields.filter(f => f.accepted);
    onApply(accepted);
    setStep(3);
  }, [fields, onApply]);

  const handleClose = useCallback(() => {
    setStep(1);
    setSelectedType(null);
    setFields([]);
    onClose();
  }, [onClose]);

  const acceptedCount = fields.filter(f => f.accepted).length;

  // Group fields by section
  const sections = fields.reduce<Record<string, DetectedField[]>>((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm tracking-wider uppercase">
            <Wand2 className="w-4 h-4 text-crimson" />
            Doc-to-Binder Assist
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 1 && "Select the document type to simulate extraction."}
            {step === 2 && `Review ${fields.length} detected fields from ${selectedType}. Toggle to accept or reject.`}
            {step === 3 && "Fields applied to binder successfully."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select doc type */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3 py-2">
              {DOC_TYPES.map(dt => (
                <button key={dt.type} onClick={() => handleSelectType(dt.type)}
                  className="w-full flex items-center gap-3 p-4 rounded-md border border-border hover:border-crimson/40 hover:bg-secondary/50 transition-colors text-left group">
                  <span className="text-xl">{dt.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{dt.type}</span>
                    <p className="text-[11px] text-muted-foreground">{dt.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-crimson transition-colors" />
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Review fields */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  ← Back
                </button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}
                    className="text-[10px] tracking-wider uppercase h-7">Accept All</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}
                    className="text-[10px] tracking-wider uppercase h-7">Reject All</Button>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
                {Object.entries(sections).map(([section, sFields]) => (
                  <div key={section}>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-crimson block mb-2">{section}</span>
                    <div className="space-y-1.5">
                      {sFields.map(f => (
                        <label key={f.id}
                          className={`flex items-center gap-3 p-2.5 rounded-sm border transition-colors cursor-pointer ${
                            f.accepted ? "border-emerald-500/30 bg-emerald-900/10" : "border-border bg-secondary/20 opacity-60"
                          }`}>
                          <Checkbox checked={f.accepted} onCheckedChange={() => toggleField(f.id)} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">{f.label}</span>
                            <p className="text-sm text-foreground font-mono truncate">{f.value}</p>
                          </div>
                          {f.accepted ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  {acceptedCount}/{fields.length} fields accepted
                </span>
                <Button onClick={handleApply} disabled={acceptedCount === 0} size="sm"
                  className="text-[10px] tracking-wider uppercase">
                  <Wand2 className="w-3 h-3 mr-1" /> Apply {acceptedCount} Fields
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-foreground font-medium">{acceptedCount} fields applied</p>
              <p className="text-xs text-muted-foreground">Changes logged. Review in the Change Log section.</p>
              <Button variant="outline" size="sm" onClick={handleClose}
                className="text-[10px] tracking-wider uppercase mt-2">
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
