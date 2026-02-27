/**
 * Canonical Route Builder — generates NHL-mode ISO routes
 * with deterministic hop assignments.
 *
 * Formula: ISO N → Truck SDI N → Flypack SDI N → Videon X.S → Cloud SRT (TBD) → RX (Unassigned)
 */
import { supabase } from "@/integrations/supabase/client";
import type { CanonicalRoute, RouteHop, TruckSdiMeta, FlypackPatchMeta, EncoderMeta, CloudTransportMeta, ReceiverMeta } from "@/stores/route-types";

export interface CanonicalBuildParams {
  binderId: string;
  isoCount: number;
  encodesPerUnit?: number;
  encoderBrand?: string;
  receiverBrand?: string;
  flypackId?: string;
  protocol?: string;
}

export async function buildCanonicalRoutes(params: CanonicalBuildParams): Promise<CanonicalRoute[]> {
  const {
    binderId,
    isoCount,
    encodesPerUnit = 2,
    encoderBrand = "Videon",
    receiverBrand = "Magewell",
    flypackId = "Flypack1",
    protocol = "SRT",
  } = params;

  const routes: CanonicalRoute[] = [];

  for (let n = 1; n <= isoCount; n++) {
    const unit = Math.ceil(n / encodesPerUnit);
    const slot = ((n - 1) % encodesPerUnit) + 1;
    const txLabel = `TX ${unit}.${slot}`;
    const routeName = txLabel;

    // Insert route row
    const { data: routeRow, error: routeError } = await supabase
      .from("routes")
      .insert({
        route_name: routeName,
        binder_id: binderId,
        iso_number: n,
        status: "unknown",
        notes: "",
        route_data: {} as any,
      })
      .select()
      .single();

    if (routeError || !routeRow) {
      console.error("Failed to create route:", routeError);
      continue;
    }

    const routeId = routeRow.id;

    // Build 5 canonical hops
    const hops: Omit<RouteHop, "id" | "created_at" | "updated_at">[] = [
      {
        route_id: routeId,
        position: 1,
        hop_type: "truck_sdi",
        label: `Truck SDI ${n}`,
        meta: { sdi_number: n, alias: "", arena_input: n } satisfies TruckSdiMeta,
        status: "unknown",
      },
      {
        route_id: routeId,
        position: 2,
        hop_type: "flypack_patch",
        label: `${flypackId}_SDI_${n}`,
        meta: { flypack_id: flypackId, sdi_port: n, label: `${flypackId}_SDI_${n}` } satisfies FlypackPatchMeta,
        status: "unknown",
      },
      {
        route_id: routeId,
        position: 3,
        hop_type: "encoder",
        label: `${encoderBrand}_${unit} S${slot}`,
        meta: { brand: encoderBrand, unit, slot, input_label: `S${slot}`, encodes_per_unit: encodesPerUnit, ip_mode: "DHCP" } satisfies EncoderMeta,
        status: "unknown",
      },
      {
        route_id: routeId,
        position: 4,
        hop_type: "cloud_transport",
        label: "Cloud SRT",
        meta: { protocol, mode: "public", endpoint: "TBD", tx_label: txLabel } satisfies CloudTransportMeta,
        status: "unknown",
      },
      {
        route_id: routeId,
        position: 5,
        hop_type: "receiver",
        label: "Unassigned RX",
        meta: { brand: receiverBrand, unit: null, rx_label: "Unassigned" } satisfies ReceiverMeta,
        status: "unknown",
      },
    ];

    const { data: hopRows, error: hopError } = await supabase
      .from("route_hops")
      .insert(hops as any[])
      .select();

    if (hopError) {
      console.error("Failed to create hops:", hopError);
    }

    routes.push({
      id: routeId,
      binder_id: binderId,
      iso_number: n,
      route_name: routeName,
      status: "unknown",
      notes: "",
      hops: (hopRows || []).map((h: any) => ({
        id: h.id,
        route_id: h.route_id,
        position: h.position,
        hop_type: h.hop_type,
        label: h.label,
        meta: h.meta,
        status: h.status,
        created_at: h.created_at,
        updated_at: h.updated_at,
      })),
      created_at: routeRow.created_at,
      updated_at: routeRow.updated_at,
    });
  }

  return routes;
}

/** Summary text for Quinn confirmation */
export function buildRouteSummary(params: CanonicalBuildParams): string {
  const encodesPerUnit = params.encodesPerUnit ?? 2;
  const videonCount = Math.ceil(params.isoCount / encodesPerUnit);
  return `${params.isoCount} ISO routes using the canonical model:\n` +
    `• Truck SDI = ISO number\n` +
    `• ${params.encoderBrand ?? "Videon"} ${encodesPerUnit} encodes/unit (${videonCount} units)\n` +
    `• ${params.protocol ?? "SRT"} to cloud (endpoint TBD)\n` +
    `• RX unassigned`;
}
