import { useState, useMemo, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type {
  CallSheetExtraction,
  ImportFileInfo,
  ImportPlan,
  ImportCreateItem,
  ImportSourceType,
} from "@/lib/import-types";
import { DEFAULT_IMPORT_PLAN } from "@/lib/import-types";
import { StepExtract } from "./StepExtract";
import { StepPlace } from "./StepPlace";
import { StepCreate } from "./StepCreate";

const STEPS = ["Extract", "Place", "Create"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFile?: ImportFileInfo | null;
}

export function ImportCallSheetDrawer({ open, onOpenChange, initialFile }: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<ImportFileInfo>(
    initialFile ?? { name: "call-sheet.pdf", size: 245760, type: "application/pdf", sourceType: "callsheet" }
  );
  const [extraction, setExtraction] = useState<CallSheetExtraction | null>(null);
  const [plan, setPlan] = useState<ImportPlan>(DEFAULT_IMPORT_PLAN);
  const [creating, setCreating] = useState(false);

  // Build create items from extraction + plan
  const createItems = useMemo((): ImportCreateItem[] => {
    if (!extraction) return [];
    const items: ImportCreateItem[] = [];

    // Binder
    items.push({
      type: "binder",
      label: plan.binderTarget === "new"
        ? `New Binder: "${extraction.showTitle.value}"`
        : `Attach to existing binder`,
      details: [
        `Date: ${extraction.showDate.value}`,
        `Venue: ${extraction.venue.value}`,
        `Control Room: ${plan.controlRoom}`,
      ],
      enabled: true,
    });

    // Timeline
    if (plan.createTimeline && extraction.callTimes.value.length > 0) {
      const times = plan.timelineOption === "full"
        ? extraction.callTimes.value
        : extraction.callTimes.value.filter(ct =>
          ["crew call", "on air", "wrap"].some(k => ct.label.toLowerCase().includes(k))
        );
      items.push({
        type: "timeline",
        label: `${times.length} Timeline item${times.length !== 1 ? "s" : ""}`,
        details: times.map(ct => `${ct.label} — ${ct.time}`),
        enabled: true,
      });
    }

    // Tasks
    if (plan.createTasks && extraction.tasks.value.length > 0) {
      items.push({
        type: "tasks",
        label: `${extraction.tasks.value.length} Task${extraction.tasks.value.length !== 1 ? "s" : ""}`,
        details: extraction.tasks.value.map(t => `${t.title} [${t.departmentTag}]`),
        enabled: true,
      });
    }

    // Staff
    if (plan.addMissingStaff && extraction.staff.value.length > 0) {
      items.push({
        type: "staff",
        label: `${extraction.staff.value.length} Staff member${extraction.staff.value.length !== 1 ? "s" : ""}`,
        details: extraction.staff.value.map(s => `${s.name} — ${s.role} (${s.orgTag})`),
        enabled: true,
      });
    }

    // Routes
    if (plan.updateRoutes && extraction.routeHints.value.length > 0) {
      items.push({
        type: "routes",
        label: `${extraction.routeHints.value.length} Route update${extraction.routeHints.value.length !== 1 ? "s" : ""}`,
        details: extraction.routeHints.value.map(r => `${r.txId}: ${r.source} → ${r.output}`),
        enabled: true,
      });
    }

    return items;
  }, [extraction, plan]);

  const [itemStates, setItemStates] = useState<boolean[]>([]);

  // Sync item states when create items change
  const effectiveItems = useMemo(() => {
    return createItems.map((item, i) => ({
      ...item,
      enabled: itemStates[i] ?? item.enabled,
    }));
  }, [createItems, itemStates]);

  const toggleItem = useCallback((index: number) => {
    setItemStates(prev => {
      const next = [...prev];
      while (next.length <= index) next.push(true);
      next[index] = !next[index];
      return next;
    });
  }, []);

  const canNext = step === 0 ? !!extraction : step === 1 ? true : true;

  const handleNext = async () => {
    if (step < 2) {
      if (step === 1) {
        // Reset item states when entering Step 3
        setItemStates(createItems.map(() => true));
      }
      setStep(step + 1);
      return;
    }
    // Step 3 → Create
    setCreating(true);
    await new Promise(r => setTimeout(r, 1500));
    setCreating(false);
    toast({ title: "Import complete", description: `Imported into "${extraction?.showTitle.value}"` });
    onOpenChange(false);
    // Reset
    setStep(0);
    setExtraction(null);
    setPlan(DEFAULT_IMPORT_PLAN);
    navigate("/binders");
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(0);
    setExtraction(null);
    setPlan(DEFAULT_IMPORT_PLAN);
  };

  const hasNeeds = extraction && (
    extraction.showTitle.confidence === "low" ||
    extraction.venue.confidence === "low" ||
    extraction.controlRoom.confidence === "low" ||
    extraction.routeHints.confidence === "low"
  );

  const inner = (
    <div className="flex flex-col h-full max-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Import Call Sheet</h2>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {file.name}
              {extraction?.showDate.value && ` · ${extraction.showDate.value}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {extraction && (
              <Badge variant="outline" className={cn("text-[9px]",
                hasNeeds
                  ? "border-amber-400/40 text-amber-400"
                  : "border-emerald-500/40 text-emerald-400"
              )}>
                {hasNeeds ? "Needs input" : "Extracted"}
              </Badge>
            )}
            <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors",
                  i === step ? "text-primary" : i < step ? "text-foreground cursor-pointer" : "text-muted-foreground/50"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border",
                  i === step ? "border-primary bg-primary/15 text-primary"
                    : i < step ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                    : "border-border text-muted-foreground/50"
                )}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {step === 0 && (
            <StepExtract
              file={file}
              extraction={extraction}
              onExtracted={setExtraction}
              onChange={setExtraction}
              onFileChange={(f) => { setFile(f); setExtraction(null); }}
            />
          )}
          {step === 1 && extraction && (
            <StepPlace
              extraction={extraction}
              plan={plan}
              onChange={setPlan}
            />
          )}
          {step === 2 && extraction && (
            <StepCreate
              extraction={extraction}
              plan={plan}
              items={effectiveItems}
              onToggle={toggleItem}
            />
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleClose}>Cancel</Button>
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="w-3 h-3" /> Back
            </Button>
          )}
          <Button
            size="sm"
            className="text-xs gap-1"
            disabled={!canNext || creating}
            onClick={handleNext}
          >
            {creating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Creating…
              </>
            ) : step === 2 ? (
              "Create Objects"
            ) : (
              <>
                Next
                <ChevronRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DrawerContent className="h-[92dvh] max-h-[92dvh] p-0">
          <DrawerTitle className="sr-only">Import Call Sheet</DrawerTitle>
          {inner}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] p-0 flex flex-col">
        <SheetTitle className="sr-only">Import Call Sheet</SheetTitle>
        {inner}
      </SheetContent>
    </Sheet>
  );
}
