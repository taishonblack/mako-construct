/**
 * Route Drawer for Canonical (hop-based) routes.
 * Tabs: Chain | Transport | Notes | History
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Copy, Trash2, Plus, ChevronDown, GripVertical, Activity } from "lucide-react";
import type { CanonicalRoute, RouteHop, RouteStatus, HopType, CloudTransportMeta, ReceiverMeta } from "@/stores/route-types";
import { HOP_TYPES } from "@/stores/route-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_PILLS: Record<RouteStatus, { label: string; dot: string; cls: string }> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  warn: { label: "Degraded", dot: "bg-amber-400", cls: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  down: { label: "Down", dot: "bg-red-500", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  unknown: { label: "Unknown", dot: "bg-muted-foreground/30", cls: "bg-muted-foreground/15 text-muted-foreground border-border" },
};

const HOP_TYPE_LABELS: Record<HopType, string> = {
  truck_sdi: "Truck SDI",
  flypack_patch: "Flypack",
  encoder: "Encoder",
  cloud_transport: "Cloud",
  receiver: "Receiver",
  custom: "Custom",
};

interface Props {
  route: CanonicalRoute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRoute: (id: string, patch: Partial<Pick<CanonicalRoute, "status" | "notes" | "route_name">>) => void;
  onUpdateHop: (hopId: string, patch: Partial<Pick<RouteHop, "label" | "meta" | "status">>) => void;
  onAddHop: (routeId: string, afterPosition: number, hopType: string, label: string, meta?: Record<string, any>) => void;
  onRemoveHop: (hopId: string) => void;
  onRemoveRoute: (id: string) => void;
}

export function CanonicalRouteDrawer({ route, open, onOpenChange, onUpdateRoute, onUpdateHop, onAddHop, onRemoveHop, onRemoveRoute }: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("chain");
  const [confirmRemoveHop, setConfirmRemoveHop] = useState<{ id: string; label: string } | null>(null);
  const [activityEntries, setActivityEntries] = useState<any[]>([]);

  // Load activity when History tab selected
  useEffect(() => {
    if (tab === "history" && route) {
      supabase
        .from("binder_activity")
        .select("*")
        .eq("target", "route")
        .eq("target_id", route.id)
        .order("timestamp", { ascending: false })
        .limit(50)
        .then(({ data }) => setActivityEntries(data || []));
    }
  }, [tab, route?.id]);

  if (!route) return null;

  const pill = STATUS_PILLS[route.status];

  const handleCopyLine = () => {
    const cloudHop = route.hops.find(h => h.hop_type === "cloud_transport");
    const rxHop = route.hops.find(h => h.hop_type === "receiver");
    const txLabel = (cloudHop?.meta as CloudTransportMeta)?.tx_label || route.route_name;
    const protocol = (cloudHop?.meta as CloudTransportMeta)?.protocol || "SRT";
    const endpoint = (cloudHop?.meta as CloudTransportMeta)?.endpoint || "TBD";
    const rxLabel = (rxHop?.meta as ReceiverMeta)?.rx_label || "Unassigned";
    const line = `ISO ${route.iso_number} → ${txLabel} → ${protocol} (${endpoint}) → ${rxLabel}`;
    navigator.clipboard.writeText(line);
    toast.success("Copied to clipboard");
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-mono font-bold text-foreground">ISO {route.iso_number}</h2>
            <p className="text-[10px] text-muted-foreground">{route.route_name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={cn("text-[10px] border", pill.cls)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", pill.dot)} />
              {pill.label}
            </Badge>
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-muted/50 h-8">
            <TabsTrigger value="chain" className="text-[11px] flex-1">Chain</TabsTrigger>
            <TabsTrigger value="transport" className="text-[11px] flex-1">Transport</TabsTrigger>
            <TabsTrigger value="notes" className="text-[11px] flex-1">Notes</TabsTrigger>
            <TabsTrigger value="history" className="text-[11px] flex-1">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {tab === "chain" && <ChainTab route={route} onUpdateHop={onUpdateHop} onAddHop={onAddHop} onRemoveHop={(id, label) => setConfirmRemoveHop({ id, label })} />}
          {tab === "transport" && <TransportTab route={route} onUpdateHop={onUpdateHop} onCopyLine={handleCopyLine} />}
          {tab === "notes" && <NotesTab route={route} onUpdateRoute={onUpdateRoute} />}
          {tab === "history" && <HistoryTab entries={activityEntries} />}
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Select value={route.status} onValueChange={(v) => onUpdateRoute(route.id, { status: v as RouteStatus })}>
            <SelectTrigger className="h-7 text-[10px] w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warn">Degraded</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1" onClick={() => { onRemoveRoute(route.id); onOpenChange(false); }}>
            <Trash2 className="w-3 h-3" /> Remove
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn("p-0 flex flex-col", isMobile ? "h-[95dvh] rounded-t-xl" : "w-[480px] sm:max-w-[480px]")}
        >
          <SheetTitle className="sr-only">Route Editor — ISO {route.iso_number}</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmRemoveHop} onOpenChange={(v) => { if (!v) setConfirmRemoveHop(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove hop</AlertDialogTitle>
            <AlertDialogDescription>Remove "{confirmRemoveHop?.label}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmRemoveHop) { onRemoveHop(confirmRemoveHop.id); setConfirmRemoveHop(null); } }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Chain Tab ──────────────────────────────────────────────

function ChainTab({ route, onUpdateHop, onAddHop, onRemoveHop }: {
  route: CanonicalRoute;
  onUpdateHop: Props["onUpdateHop"];
  onAddHop: Props["onAddHop"];
  onRemoveHop: (id: string, label: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground mb-3">
        Signal chain from source to production. Tap any hop to edit.
      </p>
      {route.hops.map((hop, i) => (
        <div key={hop.id}>
          <HopCard
            hop={hop}
            onUpdate={(patch) => onUpdateHop(hop.id, patch)}
            onRemove={hop.hop_type === "custom" ? () => onRemoveHop(hop.id, hop.label) : undefined}
          />
          {/* Add hop button between cards */}
          {i < route.hops.length - 1 && (
            <div className="flex justify-center py-1">
              <div className="flex items-center gap-2">
                <div className="w-px h-4 bg-border" />
                <button
                  type="button"
                  onClick={() => onAddHop(route.id, hop.position, "custom", "New Hop")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-dashed border-muted-foreground/20 hover:border-primary/40"
                >
                  <Plus className="w-2.5 h-2.5" /> Add hop
                </button>
                <div className="w-px h-4 bg-border" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HopCard({ hop, onUpdate, onRemove }: {
  hop: RouteHop;
  onUpdate: (patch: Partial<Pick<RouteHop, "label" | "meta" | "status">>) => void;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pill = STATUS_PILLS[hop.status];
  const typeLabel = HOP_TYPE_LABELS[hop.hop_type as HopType] || hop.hop_type;

  return (
    <div className={cn("rounded-lg border bg-card transition-colors", hop.status === "down" ? "border-red-500/30" : hop.status === "warn" ? "border-amber-400/20" : "border-border")}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 p-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", pill.dot)} />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{typeLabel}</span>
          <span className="text-xs font-mono font-semibold text-foreground truncate">{hop.label || "Unnamed"}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
          <Row label="Name">
            <Input value={hop.label} onChange={(e) => onUpdate({ label: e.target.value })} className="h-7 text-xs font-mono" />
          </Row>
          <Row label="Status">
            <Select value={hop.status} onValueChange={(v) => onUpdate({ status: v as RouteStatus })}>
              <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warn">Degraded</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          {/* Render meta fields based on hop_type */}
          <MetaFields hop={hop} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

function MetaFields({ hop, onUpdate }: { hop: RouteHop; onUpdate: (patch: Partial<Pick<RouteHop, "meta">>) => void }) {
  const meta = hop.meta || {};
  const setMeta = (key: string, value: any) => onUpdate({ meta: { ...meta, [key]: value } });

  switch (hop.hop_type) {
    case "truck_sdi":
      return (
        <>
          <Row label="SDI #"><Input value={meta.sdi_number ?? ""} onChange={(e) => setMeta("sdi_number", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
          <Row label="Alias"><Input value={meta.alias ?? ""} onChange={(e) => setMeta("alias", e.target.value)} className="h-7 text-xs" placeholder="e.g. Beauty" /></Row>
          <Row label="Arena Input"><Input value={meta.arena_input ?? ""} onChange={(e) => setMeta("arena_input", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
        </>
      );
    case "flypack_patch":
      return (
        <>
          <Row label="Flypack"><Input value={meta.flypack_id ?? ""} onChange={(e) => setMeta("flypack_id", e.target.value)} className="h-7 text-xs" /></Row>
          <Row label="SDI Port"><Input value={meta.sdi_port ?? ""} onChange={(e) => setMeta("sdi_port", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
        </>
      );
    case "encoder":
      return (
        <>
          <Row label="Brand"><Input value={meta.brand ?? ""} onChange={(e) => setMeta("brand", e.target.value)} className="h-7 text-xs" /></Row>
          <Row label="Unit"><Input value={meta.unit ?? ""} onChange={(e) => setMeta("unit", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
          <Row label="Slot"><Input value={meta.slot ?? ""} onChange={(e) => setMeta("slot", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
          <Row label="IP Mode">
            <Select value={meta.ip_mode ?? "DHCP"} onValueChange={(v) => setMeta("ip_mode", v)}>
              <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DHCP">DHCP</SelectItem>
                <SelectItem value="Static">Static</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </>
      );
    case "cloud_transport":
      return (
        <>
          <Row label="Protocol"><Input value={meta.protocol ?? ""} onChange={(e) => setMeta("protocol", e.target.value)} className="h-7 text-xs" /></Row>
          <Row label="Mode"><Input value={meta.mode ?? ""} onChange={(e) => setMeta("mode", e.target.value)} className="h-7 text-xs" /></Row>
          <Row label="Endpoint"><Input value={meta.endpoint ?? ""} onChange={(e) => setMeta("endpoint", e.target.value)} className="h-7 text-xs" placeholder="TBD" /></Row>
          <Row label="TX Label"><Input value={meta.tx_label ?? ""} onChange={(e) => setMeta("tx_label", e.target.value)} className="h-7 text-xs" /></Row>
        </>
      );
    case "receiver":
      return (
        <>
          <Row label="Brand"><Input value={meta.brand ?? ""} onChange={(e) => setMeta("brand", e.target.value)} className="h-7 text-xs" /></Row>
          <Row label="Unit"><Input value={meta.unit ?? ""} onChange={(e) => setMeta("unit", parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" type="number" /></Row>
          <Row label="RX Label"><Input value={meta.rx_label ?? ""} onChange={(e) => setMeta("rx_label", e.target.value)} className="h-7 text-xs" placeholder="e.g. Magewell 7" /></Row>
        </>
      );
    default:
      return (
        <Row label="Notes">
          <Input value={meta.notes ?? ""} onChange={(e) => setMeta("notes", e.target.value)} className="h-7 text-xs" />
        </Row>
      );
  }
}

// ─── Transport Tab ──────────────────────────────────────────

function TransportTab({ route, onUpdateHop, onCopyLine }: {
  route: CanonicalRoute;
  onUpdateHop: Props["onUpdateHop"];
  onCopyLine: () => void;
}) {
  const cloudHop = route.hops.find(h => h.hop_type === "cloud_transport");
  const rxHop = route.hops.find(h => h.hop_type === "receiver");
  const encoderHop = route.hops.find(h => h.hop_type === "encoder");

  const cloudMeta = (cloudHop?.meta || {}) as CloudTransportMeta;
  const rxMeta = (rxHop?.meta || {}) as ReceiverMeta;

  return (
    <div className="space-y-4">
      {/* Summary line */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          ISO {route.iso_number} → {cloudMeta.tx_label || route.route_name} → {cloudMeta.protocol || "SRT"} ({cloudMeta.endpoint || "TBD"}) → {rxMeta.rx_label || "Unassigned"}
        </p>
        <Button variant="ghost" size="sm" className="text-[10px] gap-1 h-6 shrink-0" onClick={onCopyLine}>
          <Copy className="w-3 h-3" /> Copy
        </Button>
      </div>

      {/* TX details */}
      <div className="steel-panel p-4 space-y-2">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Transmit</h4>
        <Row label="TX Label">
          <Input value={cloudMeta.tx_label || ""} onChange={(e) => cloudHop && onUpdateHop(cloudHop.id, { meta: { ...cloudHop.meta, tx_label: e.target.value } })} className="h-7 text-xs font-mono" />
        </Row>
        <Row label="Protocol">
          <Input value={cloudMeta.protocol || ""} onChange={(e) => cloudHop && onUpdateHop(cloudHop.id, { meta: { ...cloudHop.meta, protocol: e.target.value } })} className="h-7 text-xs" />
        </Row>
        <Row label="Endpoint">
          <Input value={cloudMeta.endpoint || ""} onChange={(e) => cloudHop && onUpdateHop(cloudHop.id, { meta: { ...cloudHop.meta, endpoint: e.target.value } })} className="h-7 text-xs" placeholder="TBD" />
        </Row>
      </div>

      {/* RX assignment */}
      <div className="steel-panel p-4 space-y-2">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Receive</h4>
        <Row label="RX Device">
          <Input value={rxMeta.rx_label || ""} onChange={(e) => rxHop && onUpdateHop(rxHop.id, { meta: { ...rxHop.meta, rx_label: e.target.value } })} className="h-7 text-xs font-mono" placeholder="e.g. Magewell 7" />
        </Row>
        <Row label="Brand">
          <Input value={rxMeta.brand || ""} onChange={(e) => rxHop && onUpdateHop(rxHop.id, { meta: { ...rxHop.meta, brand: e.target.value } })} className="h-7 text-xs" />
        </Row>
        <Row label="Unit #">
          <Input type="number" value={rxMeta.unit ?? ""} onChange={(e) => rxHop && onUpdateHop(rxHop.id, { meta: { ...rxHop.meta, unit: parseInt(e.target.value) || null } })} className="h-7 text-xs w-20" />
        </Row>
      </div>
    </div>
  );
}

// ─── Notes Tab ──────────────────────────────────────────────

function NotesTab({ route, onUpdateRoute }: { route: CanonicalRoute; onUpdateRoute: Props["onUpdateRoute"] }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground">Route-specific notes — not binder-level.</p>
      <Textarea
        value={route.notes}
        onChange={(e) => onUpdateRoute(route.id, { notes: e.target.value })}
        className="text-xs min-h-[200px] font-mono"
        placeholder="Add notes about this route..."
      />
    </div>
  );
}

// ─── History Tab ────────────────────────────────────────────

function HistoryTab({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">No activity logged for this route.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="p-2 rounded border border-border bg-secondary/20 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-foreground">{e.actor_name}</span>
            <span className="text-[9px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{e.summary}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 min-w-0">
      <span className="text-[10px] text-muted-foreground truncate">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
