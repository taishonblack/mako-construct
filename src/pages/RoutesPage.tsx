import { useState, useMemo, useCallback } from "react";
import { Plus, RefreshCw, Save, RotateCcw, ChevronDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouteProfileStore } from "@/stores/route-profile-store";
import { useRoutesStore } from "@/stores/route-store";
import type { RouteStatus } from "@/stores/route-profile-types";
import { ISO_PRESETS } from "@/stores/route-profile-types";
import { ProfileRouteRow } from "@/components/routes/ProfileRouteRow";
import { CanonicalRouteCard } from "@/components/routes/CanonicalRouteCard";
import { CanonicalRouteDrawer } from "@/components/routes/CanonicalRouteDrawer";
import { toast } from "sonner";
import { activityService } from "@/lib/activity-service";
import { useBinder } from "@/hooks/use-binders";

type ViewMode = "platform" | "binder";

export default function RoutesPage() {
  const profileStore = useRouteProfileStore();
  const {
    state: legacyState, updateCanonicalRoute, updateHop, addCanonicalHop, removeHop, removeRoute,
  } = useRoutesStore();

  const [selectedCanonicalId, setSelectedCanonicalId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [isoDialogOpen, setIsoDialogOpen] = useState(false);
  const [isoInput, setIsoInput] = useState(12);
  const [viewBinderId, setViewBinderId] = useState<string | null>(null);
  const [matchBinderOpen, setMatchBinderOpen] = useState(false);

  const { profiles, activeProfileId, routes } = profileStore.state;
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const selectedCanonical = useMemo(
    () => legacyState.canonicalRoutes.find(r => r.id === selectedCanonicalId) ?? null,
    [legacyState.canonicalRoutes, selectedCanonicalId]
  );

  // Handlers
  const handleSwitchProfile = useCallback((profileId: string) => {
    profileStore.switchProfile(profileId);
  }, [profileStore]);

  const handleSetAsDefault = useCallback(async () => {
    if (!activeProfileId) return;
    await profileStore.setAsDefault(activeProfileId);
    toast.success("Set as default profile");
  }, [activeProfileId, profileStore]);

  const handleResetToDefault = useCallback(() => {
    const def = profiles.find(p => p.is_default);
    if (def) profileStore.switchProfile(def.id);
  }, [profiles, profileStore]);

  const handleSaveAsNew = useCallback(async () => {
    if (!newProfileName.trim()) return;
    const id = await profileStore.saveAsNewProfile(newProfileName.trim());
    if (id) {
      toast.success(`Profile "${newProfileName}" created`);
      setNewProfileName("");
      setSaveDialogOpen(false);
    }
  }, [newProfileName, profileStore]);

  const handleGenerateRoutes = useCallback(async () => {
    await profileStore.ensureDefaultProfile(isoInput);
    toast.success(`Generated ${isoInput} canonical routes`);
    setIsoDialogOpen(false);
  }, [isoInput, profileStore]);

  const handleFieldChange = useCallback((routeId: string, field: string, value: any) => {
    profileStore.updateRouteField(routeId, field as any, value);
    activityService.logRouteChange("route_update", routeId,
      `Platform route: ${field} updated`, { field, value });
  }, [profileStore]);

  const handleAliasChange = useCallback((routeId: string, aliasType: string, value: string) => {
    profileStore.upsertAlias(routeId, aliasType as any, value);
  }, [profileStore]);

  const handleStatusChange = useCallback((routeId: string, status: RouteStatus) => {
    profileStore.updateRouteStatus(routeId, status);
  }, [profileStore]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Routes</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Platform baseline — canonical signal topology reference
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setIsoDialogOpen(true)}>
            <Plus className="w-3 h-3" /> Generate Routes
          </Button>
        </div>
      </div>

      {/* Profile selector bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Routes Reference</span>
        <Select value={activeProfileId || ""} onValueChange={handleSwitchProfile}>
          <SelectTrigger className="h-8 text-xs w-52"><SelectValue placeholder="Select profile…" /></SelectTrigger>
          <SelectContent>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{p.is_default ? " ★" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8" onClick={handleSetAsDefault} disabled={activeProfile?.is_default}>
          Set as default
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8" onClick={() => setSaveDialogOpen(true)}>
          <Save className="w-3 h-3" /> Save as new profile
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8" onClick={handleResetToDefault}>
          <RotateCcw className="w-3 h-3" /> Reset to default
        </Button>
      </div>

      {/* Routes list */}
      {routes.length === 0 && legacyState.canonicalRoutes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <p>No routes defined. Click "Generate Routes" to create your canonical ISO topology.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Profile routes (new system) */}
          {routes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                {activeProfile?.name || "Routes"} ({routes.length} ISOs)
              </p>
              <div className="space-y-1">
                {routes.map(route => (
                  <ProfileRouteRow
                    key={route.id}
                    route={route}
                    onFieldChange={handleFieldChange}
                    onAliasChange={handleAliasChange}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legacy canonical routes (from old hop system) */}
          {legacyState.canonicalRoutes.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                Legacy Hop Routes ({legacyState.canonicalRoutes.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {legacyState.canonicalRoutes.map(route => (
                  <CanonicalRouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedCanonicalId === route.id}
                    onSelect={setSelectedCanonicalId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Routes Dialog */}
      <Dialog open={isoDialogOpen} onOpenChange={setIsoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Generate Canonical Routes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">ISO Count</span>
              <div className="flex items-center gap-2 mt-1">
                {ISO_PRESETS.map(n => (
                  <Button
                    key={n}
                    variant={isoInput === n ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setIsoInput(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Input
                  type="number"
                  value={isoInput}
                  onChange={(e) => setIsoInput(parseInt(e.target.value) || 8)}
                  className="h-8 text-xs w-16"
                  min={1}
                  max={48}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              This will generate {isoInput} routes using the NHL canonical model:
              Truck SDI N → Flypack SDI N → Videon (2 encodes/unit, {Math.ceil(isoInput / 2)} units) → SRT → Magewell → LAWO Arena N
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsoDialogOpen(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={handleGenerateRoutes}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save As New Profile Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Save as New Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="e.g. Stadium Series 2026"
              className="h-8 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={handleSaveAsNew} disabled={!newProfileName.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legacy Canonical Route Drawer */}
      <CanonicalRouteDrawer
        route={selectedCanonical}
        open={!!selectedCanonicalId}
        onOpenChange={(open) => { if (!open) setSelectedCanonicalId(null); }}
        onUpdateRoute={updateCanonicalRoute}
        onUpdateHop={updateHop}
        onAddHop={addCanonicalHop}
        onRemoveHop={removeHop}
        onRemoveRoute={removeRoute}
      />
    </div>
  );
}
