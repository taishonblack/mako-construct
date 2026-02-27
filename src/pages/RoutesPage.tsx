import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, RefreshCw, Save, RotateCcw, ChevronDown, Eye, GitMerge } from "lucide-react";
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
import { useBinders } from "@/hooks/use-binders";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [matchBinderOpen, setMatchBinderOpen] = useState(false);
  const [matchBinderId, setMatchBinderId] = useState<string | null>(null);
  const [matchProfileName, setMatchProfileName] = useState("");
  const [matchSetDefault, setMatchSetDefault] = useState(false);
  const [viewBinderOpen, setViewBinderOpen] = useState(false);
  const [viewBinderId, setViewBinderId] = useState<string | null>(null);
  const [viewBinderRoutes, setViewBinderRoutes] = useState<import("@/stores/route-profile-types").ResolvedRoute[]>([]);

  const { binders } = useBinders();

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

  const handleViewBinder = useCallback(async (binderId: string) => {
    const binder = binders.find(b => b.id === binderId);
    const sourceProfileId = binder?.route_profile_id || activeProfileId;
    const mode = binder?.route_mode || "use_default";
    const { routes: resolved } = await profileStore.getBinderRoutes(binderId, mode, sourceProfileId || null);
    setViewBinderId(binderId);
    setViewBinderRoutes(resolved);
    setViewBinderOpen(false);
  }, [binders, activeProfileId, profileStore]);

  const handleExitBinderView = useCallback(() => {
    setViewBinderId(null);
    setViewBinderRoutes([]);
  }, []);

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
        <Select
          value={viewBinderId ? `__binder__` : (activeProfileId || "")}
          onValueChange={(v) => {
            if (v === "__view_binder__") {
              setViewBinderOpen(true);
            } else {
              handleExitBinderView();
              handleSwitchProfile(v);
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs w-56">
            <SelectValue placeholder="Select profile…">
              {viewBinderId
                ? `🔍 ${binders.find(b => b.id === viewBinderId)?.title || "Binder"}`
                : activeProfile?.name || "Select profile…"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{p.is_default ? " ★" : ""}
              </SelectItem>
            ))}
            <SelectItem value="__view_binder__" className="text-primary">
              <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> View Binder…</span>
            </SelectItem>
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
        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8" onClick={() => setMatchBinderOpen(true)}>
          <GitMerge className="w-3 h-3" /> Match a binder…
        </Button>
      </div>

      {/* Binder view banner */}
      {viewBinderId && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-foreground font-medium">
              Viewing binder overlay: <span className="font-semibold">{binders.find(b => b.id === viewBinderId)?.title}</span>
            </span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">Read-only</Badge>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] gap-1 h-7" onClick={handleExitBinderView}>
            <RotateCcw className="w-3 h-3" /> Return to Default Routes
          </Button>
        </div>
      )}

      {/* Routes list */}
      {viewBinderId ? (
        /* Binder overlay view */
        <div className="space-y-1.5">
          {viewBinderRoutes.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              This binder has no route overrides or is using default routes as-is.
            </div>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                {binders.find(b => b.id === viewBinderId)?.title} — {viewBinderRoutes.length} ISOs
              </p>
              <div className="space-y-1">
                {viewBinderRoutes.map(route => (
                  <ProfileRouteRow
                    key={route.id}
                    route={route}
                    readOnly
                    isOverridden={route.isOverridden}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : routes.length === 0 && legacyState.canonicalRoutes.length === 0 ? (
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

      {/* Match a Binder Dialog */}
      <Dialog open={matchBinderOpen} onOpenChange={setMatchBinderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Match a Binder</DialogTitle>
          </DialogHeader>
          <p className="text-[10px] text-muted-foreground">
            Create a new route profile from a binder's forked overrides, then optionally set it as default.
          </p>
          <div className="space-y-3 mt-2">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Select Binder</span>
              <Select value={matchBinderId || ""} onValueChange={setMatchBinderId}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Choose binder…" /></SelectTrigger>
                <SelectContent>
                  {binders.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">New Profile Name</span>
              <Input
                value={matchProfileName}
                onChange={(e) => setMatchProfileName(e.target.value)}
                placeholder="e.g. Bruins @ Rangers Dec 12"
                className="h-8 text-xs mt-1"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={matchSetDefault} onCheckedChange={(v) => setMatchSetDefault(!!v)} />
              <span className="text-xs text-muted-foreground">Set as default profile</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setMatchBinderOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                className="text-xs"
                disabled={!matchBinderId || !matchProfileName.trim()}
                onClick={async () => {
                  if (!matchBinderId || !matchProfileName.trim()) return;
                  const binder = binders.find(b => b.id === matchBinderId);
                  const sourceProfileId = binder?.route_profile_id || activeProfileId;
                  if (!sourceProfileId) {
                    toast.error("No source profile found");
                    return;
                  }
                  const newId = await profileStore.createProfileFromBinder(
                    matchBinderId, matchProfileName.trim(), sourceProfileId
                  );
                  if (newId) {
                    if (matchSetDefault) await profileStore.setAsDefault(newId);
                    await profileStore.switchProfile(newId);
                    toast.success(`Profile "${matchProfileName}" created from binder`);
                    activityService.logRouteChange("route_create", newId,
                      `Created profile "${matchProfileName}" from binder "${binder?.title}"`,
                      { source_binder: matchBinderId, profile_name: matchProfileName }
                    );
                    setMatchBinderOpen(false);
                    setMatchBinderId(null);
                    setMatchProfileName("");
                    setMatchSetDefault(false);
                  } else {
                    toast.error("Failed to create profile");
                  }
                }}
              >
                Create Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Binder Picker Dialog */}
      <Dialog open={viewBinderOpen} onOpenChange={setViewBinderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">View Binder Routes</DialogTitle>
          </DialogHeader>
          <p className="text-[10px] text-muted-foreground">
            Preview a binder's route overlay (read-only). No changes will be made.
          </p>
          <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
            {binders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No binders found.</p>
            ) : (
              binders.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleViewBinder(b.id)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs font-medium text-foreground">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {b.venue}{b.partner ? ` · ${b.partner}` : ""} · {b.route_mode || "use_default"}
                  </p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
