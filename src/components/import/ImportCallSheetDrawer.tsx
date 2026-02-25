import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  CallSheetExtraction,
  ImportPlan,
  ImportStep,
  ImportFileInfo,
} from "@/types/callsheet-import";
import { StepExtract } from "./StepExtract";
import { StepPlace } from "./StepPlace";
import { StepCreate } from "./StepCreate";

const DEFAULT_PLAN: ImportPlan = {
  target: "new",
  controlRoom: "PCR23",
  createTimeline: true,
  timelineScope: "full",
  createTasks: true,
  taskAssignment: "auto",
  addStaff: true,
  linkExisting: true,
  updateRoutes: true,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportCallSheetDrawer({ open, onClose }: Props) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<ImportStep>(1);
  const [file, setFile] = useState<ImportFileInfo | null>(null);
  const [extraction, setExtraction] = useState<CallSheetExtraction | null>(null);
  const [plan, setPlan] = useState<ImportPlan>(DEFAULT_PLAN);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleClose = useCallback(() => {
    setStep(1);
    setFile(null);
    setExtraction(null);
    setPlan(DEFAULT_PLAN);
    setExtracting(false);
    setCreating(false);
    onClose();
  }, [onClose]);

  const statusBadge = extraction ? "Extracted" : file ? "Ready" : "Upload";

  const content = (
    <div className="flex flex-col h-full max-h-[85vh] md:max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="min-w-0 flex-1">
          <SheetHeader className="p-0 space-y-0">
            <SheetTitle className="text-sm font-semibold tracking-wider uppercase text-foreground">
              Import Call Sheet
            </SheetTitle>
          </SheetHeader>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "Upload or paste a call sheet"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={extraction ? "default" : "secondary"}
            className="text-[9px] uppercase tracking-wider"
          >
            {statusBadge}
          </Badge>
          <button onClick={handleClose} className="p-1 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 px-5 py-3 border-b border-border shrink-0">
        {[
          { n: 1, label: "Extract" },
          { n: 2, label: "Place" },
          { n: 3, label: "Create" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1">
            {i > 0 && <div className="w-6 h-px bg-border" />}
            <button
              onClick={() => s.n <= step && setStep(s.n as ImportStep)}
              disabled={s.n > step}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] tracking-wider uppercase transition-colors ${
                s.n === step
                  ? "bg-primary/10 text-primary font-medium"
                  : s.n < step
                  ? "text-foreground hover:bg-secondary cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-mono ${
                s.n === step ? "bg-primary text-primary-foreground" : s.n < step ? "bg-secondary text-foreground" : "bg-secondary/50 text-muted-foreground/40"
              }`}>
                {s.n}
              </span>
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {step === 1 && (
          <StepExtract
            file={file}
            setFile={setFile}
            extraction={extraction}
            setExtraction={setExtraction}
            extracting={extracting}
            setExtracting={setExtracting}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && extraction && (
          <StepPlace
            extraction={extraction}
            plan={plan}
            setPlan={setPlan}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && extraction && (
          <StepCreate
            extraction={extraction}
            plan={plan}
            creating={creating}
            setCreating={setCreating}
            onBack={() => setStep(2)}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-[580px] sm:max-w-[580px] p-0 flex flex-col [&>button]:hidden">
        {content}
      </SheetContent>
    </Sheet>
  );
}
