/**
 * Single ISO route row displaying the full canonical chain.
 * Truck SDI N > Flypack SDI N > Videon_X S? > TX label > Cloud SRT > Magewell > SDI > LAWO Arena X
 */
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RouteProfileRoute, RouteStatus, ResolvedRoute } from "@/stores/route-profile-types";

const STATUS_DOTS: Record<RouteStatus, string> = {
  healthy: "bg-emerald-500",
  warn: "bg-amber-400",
  down: "bg-red-500",
  unknown: "bg-muted-foreground/40",
};

interface Props {
  route: RouteProfileRoute | ResolvedRoute;
  readOnly?: boolean;
  isOverridden?: boolean;
  onFieldChange?: (routeId: string, field: string, value: any) => void;
  onAliasChange?: (routeId: string, aliasType: string, value: string) => void;
  onStatusChange?: (routeId: string, status: RouteStatus) => void;
}

export function ProfileRouteRow({
  route, readOnly, isOverridden, onFieldChange, onAliasChange, onStatusChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const productionAlias = route.aliases?.find(a => a.alias_type === "production")?.alias_value || "";
  const resolved = route as ResolvedRoute;

  return (
    <div className={cn(
      "rounded-lg border bg-card transition-colors",
      isOverridden ? "border-amber-400/30" : "border-border",
    )}>
      {/* Compact chain line */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 text-left group"
      >
        <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOTS[route.status])} />
        <span className="text-xs font-mono font-bold text-foreground shrink-0 w-10">
          ISO {route.iso_number}
        </span>
        <div className="flex-1 flex items-center gap-1 text-[10px] font-mono text-muted-foreground overflow-hidden whitespace-nowrap">
          <span>Truck SDI {route.truck_sdi_n}</span>
          <span className="text-border">→</span>
          <span>{route.flypack_id} SDI {route.flypack_sdi_n}</span>
          <span className="text-border">→</span>
          <span>{route.encoder_brand}_{route.videon_unit} {route.videon_input_label}</span>
          <span className="text-border">→</span>
          <span className="text-foreground font-semibold">{route.tx_label}</span>
          <span className="text-border">→</span>
          <span>{route.transport_protocol} ({route.cloud_endpoint === "TBD" ? <span className="text-amber-400">TBD</span> : route.cloud_endpoint})</span>
          <span className="text-border">→</span>
          <span>{route.magewell_unit ? `${route.receiver_brand} ${route.magewell_unit}` : <span className="text-amber-400">Unassigned</span>}</span>
          <span className="text-border">→</span>
          <span>SDI</span>
          <span className="text-border">→</span>
          <span className="text-foreground">LAWO {route.lawo_vsm_name}</span>
        </div>
        {productionAlias && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 border-primary/30 text-primary">
            {productionAlias}
          </Badge>
        )}
        {isOverridden && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 border-amber-400/40 text-amber-400">
            Overridden
          </Badge>
        )}
        {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded inline editor */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Cloud Endpoint" readOnly={readOnly}>
            <Input
              value={route.cloud_endpoint}
              onChange={(e) => onFieldChange?.(route.id, "cloud_endpoint", e.target.value)}
              className="h-7 text-xs font-mono"
              placeholder="TBD"
              readOnly={readOnly}
            />
          </Field>
          <Field label="Magewell Unit" readOnly={readOnly}>
            <Input
              type="number"
              value={route.magewell_unit ?? ""}
              onChange={(e) => onFieldChange?.(route.id, "magewell_unit", e.target.value ? parseInt(e.target.value) : null)}
              className="h-7 text-xs font-mono"
              placeholder="Unassigned"
              readOnly={readOnly}
            />
          </Field>
          <Field label="LAWO VSM Name" readOnly={readOnly}>
            <Input
              value={route.lawo_vsm_name}
              onChange={(e) => onFieldChange?.(route.id, "lawo_vsm_name", e.target.value)}
              className="h-7 text-xs font-mono"
              readOnly={readOnly}
            />
          </Field>
          <Field label="Production Name" readOnly={readOnly}>
            <Input
              value={productionAlias}
              onChange={(e) => onAliasChange?.(route.id, "production", e.target.value)}
              className="h-7 text-xs"
              placeholder="e.g. Beauty, Home"
              readOnly={readOnly}
            />
          </Field>
          <Field label="Status" readOnly={readOnly}>
            <Select value={route.status} onValueChange={(v) => onStatusChange?.(route.id, v as RouteStatus)} disabled={readOnly}>
              <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warn">Degraded</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="TX Label" readOnly={readOnly}>
            <Input
              value={route.tx_label}
              onChange={(e) => onFieldChange?.(route.id, "tx_label", e.target.value)}
              className="h-7 text-xs font-mono"
              readOnly={readOnly}
            />
          </Field>
          <Field label="Encoder Brand" readOnly={readOnly}>
            <Input
              value={route.encoder_brand}
              onChange={(e) => onFieldChange?.(route.id, "encoder_brand", e.target.value)}
              className="h-7 text-xs"
              readOnly={readOnly}
            />
          </Field>
          <Field label="Receiver Brand" readOnly={readOnly}>
            <Input
              value={route.receiver_brand}
              onChange={(e) => onFieldChange?.(route.id, "receiver_brand", e.target.value)}
              className="h-7 text-xs"
              readOnly={readOnly}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, readOnly, children }: { label: string; readOnly?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      {children}
    </div>
  );
}
