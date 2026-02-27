/**
 * Modal for selecting binder route mode.
 */
import { useState } from "react";
import { Radio, GitBranch, Layers, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RouteMode, RouteProfile } from "@/stores/route-profile-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMode: RouteMode;
  profiles: RouteProfile[];
  currentProfileId: string | null;
  onSelect: (mode: RouteMode, profileId: string | null) => void;
}

const MODE_OPTIONS: { value: RouteMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "use_default", label: "Use default platform routes", desc: "Read-only view of the current default profile.", icon: <Radio className="w-4 h-4" /> },
  { value: "use_profile", label: "Use a saved route profile", desc: "Select a specific profile for this binder.", icon: <Layers className="w-4 h-4" /> },
  { value: "fork_profile", label: "Fork routes for this binder", desc: "Start from default/profile and create binder-only overrides.", icon: <GitBranch className="w-4 h-4" /> },
  { value: "custom", label: "Custom routes (advanced)", desc: "Fully custom routes. Not linked to any profile.", icon: <Settings2 className="w-4 h-4" /> },
];

export function RouteModeSelector({ open, onOpenChange, currentMode, profiles, currentProfileId, onSelect }: Props) {
  const [selected, setSelected] = useState<RouteMode>(currentMode);
  const [profileId, setProfileId] = useState<string | null>(currentProfileId);

  const handleApply = () => {
    onSelect(selected, selected === "use_profile" || selected === "fork_profile" ? profileId : null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Route Mode</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose how this binder uses routes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3",
                selected === opt.value
                  ? "border-primary/60 bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className={cn("mt-0.5 text-muted-foreground", selected === opt.value && "text-primary")}>
                {opt.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {(selected === "use_profile" || selected === "fork_profile") && (
          <div className="mt-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Select Profile</span>
            <Select value={profileId || ""} onValueChange={setProfileId}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Choose profile…" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleApply}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
