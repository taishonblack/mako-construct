/**
 * Route Profile Store — manages global route profiles + binder overlays.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  RouteProfile, RouteProfileRoute, RouteAlias, BinderRouteOverride,
  RouteStatus, AliasType, ResolvedRoute,
} from "./route-profile-types";

export type { RouteProfile, RouteProfileRoute, RouteAlias, BinderRouteOverride, ResolvedRoute };

interface ProfileState {
  profiles: RouteProfile[];
  activeProfileId: string | null;
  routes: RouteProfileRoute[];
  aliases: RouteAlias[];
}

export function useRouteProfileStore() {
  const [state, setState] = useState<ProfileState>({
    profiles: [], activeProfileId: null, routes: [], aliases: [],
  });
  const [loading, setLoading] = useState(true);

  // Load all profiles + default profile routes
  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("route_profiles").select("*").order("created_at");
      const list = (profiles || []) as RouteProfile[];
      const defaultProfile = list.find(p => p.is_default) || list[0] || null;
      const activeId = defaultProfile?.id || null;

      let routes: RouteProfileRoute[] = [];
      let aliases: RouteAlias[] = [];
      if (activeId) {
        const [routesRes, aliasesRes] = await Promise.all([
          supabase.from("route_profile_routes").select("*")
            .eq("route_profile_id", activeId).order("iso_number"),
          supabase.from("route_aliases").select("*"),
        ]);
        routes = (routesRes.data || []) as RouteProfileRoute[];
        aliases = (aliasesRes.data || []) as RouteAlias[];
        // Attach aliases to routes
        routes = routes.map(r => ({
          ...r,
          aliases: aliases.filter(a => a.route_profile_route_id === r.id),
        }));
      }
      setState({ profiles: list, activeProfileId: activeId, routes, aliases });
      setLoading(false);
    }
    load();
  }, []);

  // Switch active profile
  const switchProfile = useCallback(async (profileId: string) => {
    const [routesRes, aliasesRes] = await Promise.all([
      supabase.from("route_profile_routes").select("*")
        .eq("route_profile_id", profileId).order("iso_number"),
      supabase.from("route_aliases").select("*"),
    ]);
    const routes = (routesRes.data || []) as RouteProfileRoute[];
    const aliases = (aliasesRes.data || []) as RouteAlias[];
    setState(prev => ({
      ...prev,
      activeProfileId: profileId,
      routes: routes.map(r => ({
        ...r,
        aliases: aliases.filter(a => a.route_profile_route_id === r.id),
      })),
      aliases,
    }));
  }, []);

  // Create or ensure a default profile exists, then generate canonical routes
  const ensureDefaultProfile = useCallback(async (isoCount: number): Promise<string> => {
    // Check if default exists
    let profile = state.profiles.find(p => p.is_default);
    if (!profile) {
      const { data } = await supabase.from("route_profiles")
        .insert({ name: "Default Routes", is_default: true, scope: "global" } as any)
        .select().single();
      if (!data) throw new Error("Failed to create default profile");
      profile = data as RouteProfile;
    }
    // Generate canonical routes for this profile
    await generateCanonicalRoutes(profile.id, isoCount);
    return profile.id;
  }, [state.profiles]);

  // Generate canonical ISO routes for a profile
  const generateCanonicalRoutes = useCallback(async (profileId: string, isoCount: number) => {
    // Delete existing routes for this profile
    await supabase.from("route_profile_routes").delete().eq("route_profile_id", profileId);

    const rows: any[] = [];
    for (let n = 1; n <= isoCount; n++) {
      const unit = Math.ceil(n / 2);
      const slot = ((n - 1) % 2) + 1;
      rows.push({
        route_profile_id: profileId,
        iso_number: n,
        truck_sdi_n: n,
        flypack_id: "Flypack1",
        flypack_sdi_n: n,
        encoder_brand: "Videon",
        videon_unit: unit,
        videon_input_slot: slot,
        videon_input_label: `S${slot}`,
        tx_label: `TX ${unit}.${slot}`,
        transport_protocol: "SRT",
        cloud_endpoint: "TBD",
        receiver_brand: "Magewell",
        magewell_unit: null,
        lawo_vsm_name: `Arena ${n}`,
        status: "unknown",
      });
    }
    const { data: inserted } = await supabase.from("route_profile_routes")
      .insert(rows).select();

    // Create default LAWO aliases
    if (inserted) {
      const aliasRows = inserted.map((r: any) => ({
        route_profile_route_id: r.id,
        alias_type: "lawo",
        alias_value: `Arena ${r.iso_number}`,
      }));
      await supabase.from("route_aliases").insert(aliasRows);
    }

    // Reload
    await switchProfile(profileId);
    // Re-fetch profiles list
    const { data: profiles } = await supabase.from("route_profiles").select("*").order("created_at");
    setState(prev => ({ ...prev, profiles: (profiles || []) as RouteProfile[] }));
  }, [switchProfile]);

  // Update a single route field
  const updateRouteField = useCallback(async (
    routeId: string,
    field: keyof RouteProfileRoute,
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      routes: prev.routes.map(r =>
        r.id === routeId ? { ...r, [field]: value } : r
      ),
    }));
    await supabase.from("route_profile_routes").update({ [field]: value } as any).eq("id", routeId);
  }, []);

  // Update route status
  const updateRouteStatus = useCallback(async (routeId: string, status: RouteStatus) => {
    await updateRouteField(routeId, "status", status);
  }, [updateRouteField]);

  // Upsert an alias
  const upsertAlias = useCallback(async (routeId: string, aliasType: AliasType, value: string) => {
    const existing = state.aliases.find(
      a => a.route_profile_route_id === routeId && a.alias_type === aliasType
    );
    if (existing) {
      await supabase.from("route_aliases").update({ alias_value: value } as any).eq("id", existing.id);
      setState(prev => ({
        ...prev,
        aliases: prev.aliases.map(a => a.id === existing.id ? { ...a, alias_value: value } : a),
        routes: prev.routes.map(r => r.id === routeId ? {
          ...r,
          aliases: (r.aliases || []).map(a => a.id === existing.id ? { ...a, alias_value: value } : a),
        } : r),
      }));
    } else {
      const { data } = await supabase.from("route_aliases")
        .insert({ route_profile_route_id: routeId, alias_type: aliasType, alias_value: value } as any)
        .select().single();
      if (data) {
        const alias = data as RouteAlias;
        setState(prev => ({
          ...prev,
          aliases: [...prev.aliases, alias],
          routes: prev.routes.map(r => r.id === routeId ? {
            ...r,
            aliases: [...(r.aliases || []), alias],
          } : r),
        }));
      }
    }
  }, [state.aliases]);

  // Set a profile as default
  const setAsDefault = useCallback(async (profileId: string) => {
    // Unset all others
    await supabase.from("route_profiles").update({ is_default: false } as any).neq("id", profileId);
    await supabase.from("route_profiles").update({ is_default: true } as any).eq("id", profileId);
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => ({ ...p, is_default: p.id === profileId })),
    }));
  }, []);

  // Save current profile as a new profile (clone)
  const saveAsNewProfile = useCallback(async (name: string): Promise<string | null> => {
    if (!state.activeProfileId) return null;
    const { data: newProfile } = await supabase.from("route_profiles")
      .insert({ name, is_default: false, scope: "global" } as any)
      .select().single();
    if (!newProfile) return null;

    // Clone routes
    const clonedRows = state.routes.map(r => ({
      route_profile_id: newProfile.id,
      iso_number: r.iso_number,
      truck_sdi_n: r.truck_sdi_n,
      flypack_id: r.flypack_id,
      flypack_sdi_n: r.flypack_sdi_n,
      encoder_brand: r.encoder_brand,
      videon_unit: r.videon_unit,
      videon_input_slot: r.videon_input_slot,
      videon_input_label: r.videon_input_label,
      tx_label: r.tx_label,
      transport_protocol: r.transport_protocol,
      cloud_endpoint: r.cloud_endpoint,
      receiver_brand: r.receiver_brand,
      magewell_unit: r.magewell_unit,
      lawo_vsm_name: r.lawo_vsm_name,
      status: r.status,
    }));
    const { data: clonedData } = await supabase.from("route_profile_routes")
      .insert(clonedRows).select();

    // Clone aliases
    if (clonedData) {
      const aliasRows: any[] = [];
      for (const cloned of clonedData) {
        const originalRoute = state.routes.find(r => r.iso_number === (cloned as any).iso_number);
        if (originalRoute?.aliases) {
          for (const alias of originalRoute.aliases) {
            aliasRows.push({
              route_profile_route_id: cloned.id,
              alias_type: alias.alias_type,
              alias_value: alias.alias_value,
            });
          }
        }
      }
      if (aliasRows.length) await supabase.from("route_aliases").insert(aliasRows);
    }

    // Refresh profiles list
    const { data: profiles } = await supabase.from("route_profiles").select("*").order("created_at");
    setState(prev => ({ ...prev, profiles: (profiles || []) as RouteProfile[] }));

    return newProfile.id;
  }, [state.activeProfileId, state.routes]);

  // Delete a profile
  const deleteProfile = useCallback(async (profileId: string) => {
    await supabase.from("route_profiles").delete().eq("id", profileId);
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== profileId),
    }));
    // If it was active, switch to default
    if (state.activeProfileId === profileId) {
      const remaining = state.profiles.filter(p => p.id !== profileId);
      const def = remaining.find(p => p.is_default) || remaining[0];
      if (def) await switchProfile(def.id);
    }
  }, [state.activeProfileId, state.profiles, switchProfile]);

  // Get binder overrides and resolve routes
  const getBinderRoutes = useCallback(async (
    binderId: string,
    routeMode: string,
    profileId: string | null
  ): Promise<{ routes: ResolvedRoute[]; overrides: BinderRouteOverride[] }> => {
    const targetProfileId = profileId || state.profiles.find(p => p.is_default)?.id;
    if (!targetProfileId || routeMode === "custom") {
      return { routes: [], overrides: [] };
    }

    const [routesRes, aliasesRes, overridesRes] = await Promise.all([
      supabase.from("route_profile_routes").select("*")
        .eq("route_profile_id", targetProfileId).order("iso_number"),
      supabase.from("route_aliases").select("*"),
      supabase.from("binder_route_overrides").select("*")
        .eq("binder_id", binderId),
    ]);

    const baseRoutes = (routesRes.data || []) as RouteProfileRoute[];
    const aliases = (aliasesRes.data || []) as RouteAlias[];
    const overrides = (overridesRes.data || []) as BinderRouteOverride[];

    const resolved: ResolvedRoute[] = baseRoutes.map(r => {
      const routeAliases = aliases.filter(a => a.route_profile_route_id === r.id);
      const override = overrides.find(o => o.route_profile_route_id === r.id);
      const base: ResolvedRoute = {
        ...r,
        aliases: routeAliases,
        isOverridden: !!override,
        overriddenFields: override ? Object.keys(override.fields_changed) : [],
      };
      if (override && routeMode === "fork_profile") {
        // Apply overrides
        return { ...base, ...override.after } as ResolvedRoute;
      }
      return base;
    });

    return { routes: resolved, overrides };
  }, [state.profiles]);

  // Save a binder override
  const saveBinderOverride = useCallback(async (
    binderId: string,
    routeId: string,
    field: string,
    oldValue: any,
    newValue: any,
  ) => {
    // Check if override already exists
    const { data: existing } = await supabase.from("binder_route_overrides")
      .select("*")
      .eq("binder_id", binderId)
      .eq("route_profile_route_id", routeId)
      .maybeSingle();

    if (existing) {
      const fieldsChanged = { ...(existing.fields_changed as any), [field]: true };
      const before = { ...(existing.before as any), [field]: oldValue };
      const after = { ...(existing.after as any), [field]: newValue };
      await supabase.from("binder_route_overrides")
        .update({ fields_changed: fieldsChanged, before, after } as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("binder_route_overrides").insert({
        binder_id: binderId,
        route_profile_route_id: routeId,
        fields_changed: { [field]: true },
        before: { [field]: oldValue },
        after: { [field]: newValue },
      } as any);
    }
  }, []);

  // Create profile from binder's forked routes
  const createProfileFromBinder = useCallback(async (
    binderId: string,
    profileName: string,
    sourceProfileId: string,
  ): Promise<string | null> => {
    // Get resolved routes
    const { routes } = await getBinderRoutes(binderId, "fork_profile", sourceProfileId);
    if (!routes.length) return null;

    // Create new profile
    const { data: newProfile } = await supabase.from("route_profiles")
      .insert({ name: profileName, is_default: false, scope: "global" } as any)
      .select().single();
    if (!newProfile) return null;

    // Insert resolved routes
    const rows = routes.map(r => ({
      route_profile_id: newProfile.id,
      iso_number: r.iso_number,
      truck_sdi_n: r.truck_sdi_n,
      flypack_id: r.flypack_id,
      flypack_sdi_n: r.flypack_sdi_n,
      encoder_brand: r.encoder_brand,
      videon_unit: r.videon_unit,
      videon_input_slot: r.videon_input_slot,
      videon_input_label: r.videon_input_label,
      tx_label: r.tx_label,
      transport_protocol: r.transport_protocol,
      cloud_endpoint: r.cloud_endpoint,
      receiver_brand: r.receiver_brand,
      magewell_unit: r.magewell_unit,
      lawo_vsm_name: r.lawo_vsm_name,
      status: r.status,
    }));
    await supabase.from("route_profile_routes").insert(rows);

    // Refresh
    const { data: profiles } = await supabase.from("route_profiles").select("*").order("created_at");
    setState(prev => ({ ...prev, profiles: (profiles || []) as RouteProfile[] }));

    return newProfile.id;
  }, [getBinderRoutes]);

  return {
    state, loading,
    switchProfile,
    ensureDefaultProfile,
    generateCanonicalRoutes,
    updateRouteField,
    updateRouteStatus,
    upsertAlias,
    setAsDefault,
    saveAsNewProfile,
    deleteProfile,
    getBinderRoutes,
    saveBinderOverride,
    createProfileFromBinder,
  };
}
