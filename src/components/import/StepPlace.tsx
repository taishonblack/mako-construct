import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBinders } from "@/hooks/use-binders";
import type { CallSheetExtraction, ImportPlan, BinderTarget, TimelineOption, AssignmentBehavior } from "@/lib/import-types";

interface Props {
  extraction: CallSheetExtraction;
  plan: ImportPlan;
  onChange: (plan: ImportPlan) => void;
}

export function StepPlace({ extraction, plan, onChange }: Props) {
  const [binderSearch, setBinderSearch] = useState("");
  const { binders } = useBinders();

  const filteredBinders = useMemo(() => {
    if (!binderSearch) return binders.slice(0, 5);
    const q = binderSearch.toLowerCase();
    return binders.filter(b => b.title.toLowerCase().includes(q) || b.venue.toLowerCase().includes(q)).slice(0, 8);
  }, [binderSearch, binders]);

  const set = <K extends keyof ImportPlan>(key: K, value: ImportPlan[K]) =>
    onChange({ ...plan, [key]: value });

  const hasRouteHints = extraction.routeHints.value.length > 0;

  return (
    <div className="space-y-5">
      {/* A: Binder target */}
      <Section title="Where should this go?">
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2.5 rounded border border-border cursor-pointer hover:bg-secondary/50 transition-colors">
            <input
              type="radio"
              name="binderTarget"
              checked={plan.binderTarget === "new"}
              onChange={() => set("binderTarget", "new")}
              className="accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-foreground">Create new binder</span>
          </label>
          <label className="flex items-center gap-3 p-2.5 rounded border border-border cursor-pointer hover:bg-secondary/50 transition-colors">
            <input
              type="radio"
              name="binderTarget"
              checked={plan.binderTarget === "existing"}
              onChange={() => set("binderTarget", "existing")}
              className="accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-foreground">Attach to existing binder</span>
          </label>
          {plan.binderTarget === "existing" && (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={binderSearch}
                  onChange={(e) => setBinderSearch(e.target.value)}
                  placeholder="Search binders…"
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-border p-1">
                {filteredBinders.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => set("existingBinderId", b.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                      plan.existingBinderId === b.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="font-medium">{b.title}</span>
                    <span className="text-muted-foreground ml-2">{b.venue}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* B: Control Room */}
      <Section title="Control Room / Build">
        <Select value={plan.controlRoom} onValueChange={(v) => set("controlRoom", v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PCR23">PCR23</SelectItem>
            <SelectItem value="CR-26">CR-26</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      {/* C: Timeline */}
      <Section title="Timeline import">
        <ToggleRow label="Create timeline from call times" checked={plan.createTimeline} onChange={(v) => set("createTimeline", v)} />
        {plan.createTimeline && (
          <div className="flex gap-2 mt-2">
            {([["full", "Full timeline"], ["crew-onair-wrap", "Crew / On Air / Wrap"]] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("timelineOption", val as TimelineOption)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider rounded border transition-colors ${
                  plan.timelineOption === val
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* D: Tasks */}
      <Section title="Task creation">
        <ToggleRow label="Create tasks" checked={plan.createTasks} onChange={(v) => set("createTasks", v)} />
        {plan.createTasks && (
          <div className="mt-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Assignment behavior</span>
            <Select value={plan.assignmentBehavior} onValueChange={(v) => set("assignmentBehavior", v as AssignmentBehavior)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-assign by role</SelectItem>
                <SelectItem value="ask">Ask me per department</SelectItem>
                <SelectItem value="unassigned">Leave unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Section>

      {/* E: Staff */}
      <Section title="Staff import">
        <ToggleRow label="Add missing staff to Team directory" checked={plan.addMissingStaff} onChange={(v) => set("addMissingStaff", v)} />
        <ToggleRow label="Link to existing contacts when names match" checked={plan.linkExistingStaff} onChange={(v) => set("linkExistingStaff", v)} />
      </Section>

      {/* F: Routes */}
      {hasRouteHints && (
        <Section title="Routes">
          <ToggleRow label="Update routes from call sheet hints" checked={plan.updateRoutes} onChange={(v) => set("updateRoutes", v)} />
          <ToggleRow label="Ask about extra hop(s)" checked={plan.askAboutHops} onChange={(v) => set("askAboutHops", v)} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="steel-panel p-4">
      <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
      <span className="text-xs text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </label>
  );
}
