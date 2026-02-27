/**
 * Types for the Route Profile system (global baseline + binder overlays).
 */

export type RouteStatus = "healthy" | "warn" | "down" | "unknown";
export type RouteMode = "use_default" | "use_profile" | "fork_profile" | "custom";
export type AliasType = "production" | "lawo" | "technical" | "truck";

export interface RouteProfile {
  id: string;
  name: string;
  scope: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteProfileRoute {
  id: string;
  route_profile_id: string;
  iso_number: number;
  truck_sdi_n: number;
  flypack_id: string;
  flypack_sdi_n: number;
  encoder_brand: string;
  videon_unit: number;
  videon_input_slot: number;
  videon_input_label: string;
  tx_label: string;
  transport_protocol: string;
  cloud_endpoint: string;
  receiver_brand: string;
  magewell_unit: number | null;
  lawo_vsm_name: string;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
  // Client-side joined
  aliases?: RouteAlias[];
  overrides?: Partial<RouteProfileRoute>;
}

export interface RouteAlias {
  id: string;
  route_profile_route_id: string;
  alias_type: AliasType;
  alias_value: string;
  created_at: string;
}

export interface BinderRouteOverride {
  id: string;
  binder_id: string;
  route_profile_route_id: string;
  fields_changed: Record<string, any>;
  before: Record<string, any>;
  after: Record<string, any>;
  created_at: string;
}

export interface BinderRoute {
  id: string;
  binder_id: string;
  iso_number: number;
  chain: Record<string, any>;
  status: RouteStatus;
  created_at: string;
}

/** Resolved route = base profile route + any binder overrides applied */
export type ResolvedRoute = RouteProfileRoute & {
  isOverridden?: boolean;
  overriddenFields?: string[];
};

export const ISO_PRESETS = [8, 12, 16, 24] as const;
