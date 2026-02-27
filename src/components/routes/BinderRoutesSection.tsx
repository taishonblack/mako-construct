/**
 * Binder Routes overlay section — shows routes in context of a binder.
 * Supports use_default, use_profile, fork_profile, custom modes.
 */
import { useState, useEffect, useCallback } from "react";
import { GitBranch, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouteProfileStore } from "@/stores/route-profile-store";
import type { RouteMode, ResolvedRoute, BinderRouteOverride, RouteStatus } from "@/stores/route-profile-types";
import { ProfileRouteRow } from "./ProfileRouteRow";
import { RouteModeSelector } from "./RouteModeSelector";
import { ScopeChooser } from "./ScopeChooser";
import { supabase } from "@/integrations/supabase/client";
import { activityService } from "@/lib/activity-service";

interface Props {
  binderId: string;
  routeMode: RouteMode;
  routeProfileId: string | null;
  onModeChange: (mode: RouteMode, profileId: string | null) => void;
  readOnly?: boolean;
}

export function BinderRoutesSection({ binderId, routeMode, routeProfileId, onModeChange, readOnly }: Props) {
  const profileStore = useRouteProfileStore();
  const [routes, setRoutes] = useState<ResolvedRoute[]>([]);
  const [overrides, setOverrides] = useState<BinderRouteOverride[]>([]);
  const [modeOpen, setModeOpen] = useState(false);
  const [scopeEdit, setScopeEdit] = useState<{
    routeId: string; field: string; oldValue: any; newValue: any; label: string;
  } | null>(null);

  // Load binder routes
  useEffect(() => {
    if (profileStore.loading) return;
    profileStore.getBinderRoutes(binderId, routeMode, routeProfileId)
      .then(({ routes, overrides }) => {
        setRoutes(routes);
        setOverrides(overrides);
      });
  }, [binderId, routeMode, routeProfileId, profileStore.loading]);

  const modeLabel = routeMode === "use_default" ? "Using Default Routes"
    : routeMode === "use_profile" ? `Using ${profileStore.state.profiles.find(p => p.id === routeProfileId)?.name || "Profile"}`
    : routeMode === "fork_profile" ? `Forked from ${profileStore.state.profiles.find(p => p.id === routeProfileId)?.name || "Profile"}`
    : "Custom routes";

  const handleFieldChange = useCallback((routeId: string, field: string, value: any) => {
    if (readOnly) return;
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    const oldValue = (route as any)[field];

    if (routeMode === "fork_profile") {
      // Show scope chooser
      setScopeEdit({ routeId, field, oldValue, newValue: value, label: field });
    } else if (routeMode === "use_default" || routeMode === "use_profile") {
      // Direct to platform
      profileStore.updateRouteField(routeId, field as any, value);
      setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, [field]: value } : r));
    }
  }, [routes, routeMode, readOnly, profileStore]);

  const handleScopeBinderOnly = useCallback(() => {
    if (!scopeEdit) return;
    profileStore.saveBinderOverride(binderId, scopeEdit.routeId, scopeEdit.field, scopeEdit.oldValue, scopeEdit.newValue);
    setRoutes(prev => prev.map(r => r.id === scopeEdit.routeId
      ? { ...r, [scopeEdit.field]: scopeEdit.newValue, isOverridden: true }
      : r
    ));
    activityService.logRouteChange("route_update", scopeEdit.routeId,
      `Binder override: ${scopeEdit.field} → ${scopeEdit.newValue}`,
      { field: scopeEdit.field, before: scopeEdit.oldValue, after: scopeEdit.newValue },
      binderId
    );
    setScopeEdit(null);
  }, [scopeEdit, binderId, profileStore]);

  const handleScopePlatform = useCallback(() => {
    if (!scopeEdit) return;
    profileStore.updateRouteField(scopeEdit.routeId, scopeEdit.field as any, scopeEdit.newValue);
    setRoutes(prev => prev.map(r => r.id === scopeEdit.routeId ? { ...r, [scopeEdit.field]: scopeEdit.newValue } : r));
    activityService.logRouteChange("route_update", scopeEdit.routeId,
      `Platform route update: ${scopeEdit.field} → ${scopeEdit.newValue}`,
      { field: scopeEdit.field, before: scopeEdit.oldValue, after: scopeEdit.newValue },
    );
    setScopeEdit(null);
  }, [scopeEdit, profileStore]);

  const handleAliasChange = useCallback((routeId: string, aliasType: string, value: string) => {
    if (readOnly) return;
    profileStore.upsertAlias(routeId, aliasType as any, value);
  }, [readOnly, profileStore]);

  const handleStatusChange = useCallback((routeId: string, status: RouteStatus) => {
    if (readOnly) return;
    profileStore.updateRouteStatus(routeId, status);
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, status } : r));
  }, [readOnly, profileStore]);

  const handleModeChange = useCallback((mode: RouteMode, profileId: string | null) => {
    onModeChange(mode, profileId);
    // Update binder in DB
    supabase.from("binders").update({
      route_mode: mode,
      route_profile_id: profileId,
    } as any).eq("id", binderId).then();
    activityService.logRouteChange("route_update", binderId,
      `Route mode changed to ${mode}`, { mode, profile_id: profileId }, binderId
    );
  }, [binderId, onModeChange]);

  const isEditable = !readOnly && (routeMode === "fork_profile" || routeMode === "use_default" || routeMode === "use_profile");

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Routes</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {modeLabel}
          </Badge>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" className="text-[10px] gap-1.5" onClick={() => setModeOpen(true)}>
            <Settings2 className="w-3 h-3" /> Change mode
          </Button>
        )}
      </div>

      {/* Route lines */}
      {routes.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          {routeMode === "custom" ? "No custom routes defined." : "No routes in this profile. Generate routes from the Routes page."}
        </div>
      ) : (
        <div className="space-y-1.5">
          {routes.map(route => (
            <ProfileRouteRow
              key={route.id}
              route={route}
              readOnly={!isEditable}
              isOverridden={route.isOverridden}
              onFieldChange={handleFieldChange}
              onAliasChange={handleAliasChange}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <RouteModeSelector
        open={modeOpen}
        onOpenChange={setModeOpen}
        currentMode={routeMode}
        profiles={profileStore.state.profiles}
        currentProfileId={routeProfileId}
        onSelect={handleModeChange}
      />

      <ScopeChooser
        open={!!scopeEdit}
        onOpenChange={(v) => { if (!v) setScopeEdit(null); }}
        fieldLabel={scopeEdit?.label || ""}
        onBinderOnly={handleScopeBinderOnly}
        onPlatform={handleScopePlatform}
      />
    </div>
  );
}
