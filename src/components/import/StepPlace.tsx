import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBinders } from "@/hooks/use-binders";
import type { CallSheetExtraction, ImportPlan } from "@/types/callsheet-import";

interface Props {
  extraction: CallSheetExtraction;
  plan: ImportPlan;
  setPlan: (p: ImportPlan) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepPlace({ extraction, plan, setPlan, onBack, onNext }: Props) {
  const { binders } = useBinders();
  const [binderSearch, setBinderSearch] = useState("");

  const filteredBinders = binders.filter(
    (b) =>
      b.title.toLowerCase().includes(binderSearch.toLowerCase()) ||
      b.venue.toLowerCase().includes(binderSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Target */}
      <div>
        <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-3">Where should this go?</span>
        <div className="space-y-2">
          <label className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${plan.target === "new" ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"}`}>
            <input
              type="radio"
              name="target"
              checked={plan.target === "new"}
              onChange={() => setPlan({ ...plan, target: "new", existingBinderId: undefined })}
              className="accent-primary"
            />
            <div>
              <p className="text-xs text-foreground font-medium">Create new binder</p>
              <p className="text-[10px] text-muted-foreground">"{extraction.showTitle}" on {extraction.showDate}</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${plan.target === "existing" ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"}`}>
            <input
              type="radio"
              name="target"
              checked={plan.target === "existing"}
              onChange={() => setPlan({ ...plan, target: "existing" })}
              className="accent-primary"
            />
            <div>
              <p className="text-xs text-foreground font-medium">Attach to existing binder</p>
              <p className="text-[10px] text-muted-foreground">Merge data into an existing event</p>
            </div>
          </label>
        </div>
        {plan.target === "existing" && (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Search binders..."
              value={binderSearch}
              onChange={(e) => setBinderSearch(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="max-h-28 overflow-y-auto space-y-1">
              {filteredBinders.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setPlan({ ...plan, existingBinderId: b.id })}
                  className={`w-full text-left p-2 rounded-sm text-xs transition-colors ${plan.existingBinderId === b.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary border border-transparent"}`}
                >
                  <span className="text-foreground">{b.title}</span>
                  <span className="text-muted-foreground ml-2">{b.eventDate}</span>
                </button>
              ))}
              {filteredBinders.length === 0 && (
                <p className="text-[10px] text-muted-foreground py-2 text-center">No binders found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Room */}
      <div>
        <span className="text-[9px] tracking-[0.2em] uppercase text-primary block mb-2">Control Room</span>
        <Select value={plan.controlRoom} onValueChange={(v) => setPlan({ ...plan, controlRoom: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PCR23">PCR 23</SelectItem>
            <SelectItem value="CR-26">CR-26</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        {extraction.controlRoom && extraction.controlRoom !== "Unknown" && (
          <p className="text-[10px] text-muted-foreground mt-1">Detected: {extraction.controlRoom}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Create timeline from call times</Label>
          <p className="text-[10px] text-muted-foreground">{extraction.callTimes?.length || 0} entries detected</p>
        </div>
        <Switch checked={plan.createTimeline} onCheckedChange={(v) => setPlan({ ...plan, createTimeline: v })} />
      </div>
      {plan.createTimeline && (
        <div className="flex gap-2 -mt-3 ml-1">
          {["full", "key-only"].map((scope) => (
            <button
              key={scope}
              onClick={() => setPlan({ ...plan, timelineScope: scope as any })}
              className={`text-[10px] px-2.5 py-1 rounded-sm border transition-colors ${plan.timelineScope === scope ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {scope === "full" ? "Full timeline" : "Key events only"}
            </button>
          ))}
        </div>
      )}

      {/* Tasks */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Create tasks</Label>
          <p className="text-[10px] text-muted-foreground">{extraction.tasks?.length || 0} tasks detected</p>
        </div>
        <Switch checked={plan.createTasks} onCheckedChange={(v) => setPlan({ ...plan, createTasks: v })} />
      </div>
      {plan.createTasks && (
        <div className="-mt-3">
          <Select value={plan.taskAssignment} onValueChange={(v) => setPlan({ ...plan, taskAssignment: v as any })}>
            <SelectTrigger className="h-7 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-assign by role</SelectItem>
              <SelectItem value="ask">Ask me per department</SelectItem>
              <SelectItem value="unassigned">Leave unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Staff */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Add staff to Team directory</Label>
          <p className="text-[10px] text-muted-foreground">{extraction.staff?.length || 0} detected</p>
        </div>
        <Switch checked={plan.addStaff} onCheckedChange={(v) => setPlan({ ...plan, addStaff: v })} />
      </div>

      {/* Routes */}
      {extraction.routeHints && extraction.routeHints.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Update routes from hints</Label>
            <p className="text-[10px] text-muted-foreground">{extraction.routeHints.length} route hints</p>
          </div>
          <Switch checked={plan.updateRoutes} onCheckedChange={(v) => setPlan({ ...plan, updateRoutes: v })} />
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-[10px] uppercase tracking-wider">
          ← Back
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={plan.target === "existing" && !plan.existingBinderId}
          className="flex-1 text-[10px] uppercase tracking-wider"
        >
          Next: Review & Create →
        </Button>
      </div>
    </div>
  );
}
