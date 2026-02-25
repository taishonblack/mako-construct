import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, Copy, Ban, Plus, Trash2, GripVertical, Activity, ChevronUp, ChevronDown as ChevronDownSmall, Power } from "lucide-react";
import type { SignalRoute, HopNode, RouteHealthStatus } from "@/stores/route-store";
import { HOP_SUBTYPES, buildDefaultLinks } from "@/stores/route-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TRANSPORT_TYPES = ["SRT Public", "SRT Private", "MPLS", "Multicast", "Fiber"] as const;

interface Props {
  route: SignalRoute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<SignalRoute>) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (route: SignalRoute) => void;
  initialSection?: string | null;
}

const SECTIONS = [
  { id: "health", label: "Health" },
  { id: "source", label: "Source" },
  { id: "encoder", label: "Encoder" },
  { id: "transport", label: "Transport" },
  { id: "decoder", label: "Decoder" },
  { id: "router", label: "Router" },
  { id: "alias", label: "Alias" },
  { id: "hops", label: "Hops" },
] as const;

const HEALTH_PILL: Record<RouteHealthStatus, { label: string; dot: string; cls: string }> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  warn: { label: "Degraded", dot: "bg-amber-400", cls: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  down: { label: "Down", dot: "bg-red-500", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function RouteDrawer({ route, open, onOpenChange, onSave, onRemove, onDuplicate, initialSection }: Props) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<SignalRoute | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmRemoveHop, setConfirmRemoveHop] = useState<{ linkIdx: number; hopIdx: number; label: string } | null>(null);
  const [newlyAddedHopId, setNewlyAddedHopId] = useState<string | null>(null);
  const hopsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (route) {
      const migrated = {
        ...route,
        health: route.health ?? { status: "healthy" as const, reason: "", lastUpdated: new Date().toISOString() },
        links: route.links ?? buildDefaultLinks(),
      };
      // Migrate hops missing 'enabled' field
      migrated.links = migrated.links.map(l => ({
        ...l,
        hops: l.hops.map(h => ({ ...h, enabled: h.enabled ?? true })),
      }));
      setDraft(structuredClone(migrated));
    } else {
      setDraft(null);
    }
  }, [route]);

  useEffect(() => {
    if (open && initialSection) {
      setTimeout(() => {
        document.getElementById(`route-section-${initialSection}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [open, initialSection]);

  // Auto-focus newly added hop name input
  useEffect(() => {
    if (newlyAddedHopId) {
      setTimeout(() => {
        const el = document.getElementById(`hop-name-${newlyAddedHopId}`) as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
        setNewlyAddedHopId(null);
      }, 100);
    }
  }, [newlyAddedHopId]);

  const isDirty = useMemo(() => {
    if (!route || !draft) return false;
    return JSON.stringify(route) !== JSON.stringify(draft);
  }, [route, draft]);

  const handleClose = useCallback(() => {
    if (isDirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }, [isDirty, onOpenChange]);

  const handleSave = useCallback(() => {
    if (!draft || !route) return;
    const { id, createdAt, ...rest } = draft;
    onSave(route.id, rest);
    onOpenChange(false);
  }, [draft, route, onSave, onOpenChange]);

  const handleDiscard = useCallback(() => {
    setConfirmDiscard(false);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!draft) return null;

  const setField = <T extends keyof SignalRoute>(section: T) =>
    (key: string, value: any) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const current = prev[section];
        if (typeof current === "object" && current !== null && !Array.isArray(current)) {
          return { ...prev, [section]: { ...(current as object), [key]: value } };
        }
        return { ...prev, [section]: value };
      });
    };

  const fSource = setField("signalSource");
  const fEncoder = setField("encoder");
  const fTransport = setField("transport");
  const fDecoder = setField("decoder");
  const fRouter = setField("routerMapping");
  const fAlias = setField("alias");
  const fHealth = setField("health");

  const scrollToSection = (id: string) => {
    document.getElementById(`route-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Hop management
  const addHop = (linkIndex: number) => {
    const hopId = `hop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setDraft((prev) => {
      if (!prev) return prev;
      const links = [...prev.links];
      const link = { ...links[linkIndex], hops: [...links[linkIndex].hops] };
      link.hops.push({
        id: hopId,
        subtype: "Other",
        label: "New Hop",
        vendor: "",
        model: "",
        notes: "",
        status: "ok",
        enabled: true,
      });
      links[linkIndex] = link;
      return { ...prev, links };
    });
    setNewlyAddedHopId(hopId);
    // Scroll to hops section
    setTimeout(() => {
      document.getElementById("route-section-hops")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const updateHop = (linkIndex: number, hopIndex: number, patch: Partial<HopNode>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const links = [...prev.links];
      const link = { ...links[linkIndex], hops: [...links[linkIndex].hops] };
      link.hops[hopIndex] = { ...link.hops[hopIndex], ...patch };
      links[linkIndex] = link;
      return { ...prev, links };
    });
  };

  const removeHop = (linkIndex: number, hopIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const links = [...prev.links];
      const link = { ...links[linkIndex], hops: [...links[linkIndex].hops] };
      link.hops.splice(hopIndex, 1);
      links[linkIndex] = link;
      return { ...prev, links };
    });
    setConfirmRemoveHop(null);
  };

  const reorderHop = (linkIndex: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const links = [...prev.links];
      const link = { ...links[linkIndex], hops: [...links[linkIndex].hops] };
      const [moved] = link.hops.splice(fromIdx, 1);
      link.hops.splice(toIdx, 0, moved);
      links[linkIndex] = link;
      return { ...prev, links };
    });
  };

  const healthPill = HEALTH_PILL[draft.health?.status ?? "healthy"];
  const totalHops = draft.links?.reduce((sum, l) => sum + l.hops.length, 0) ?? 0;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Input
              value={draft.routeName}
              onChange={(e) => setDraft((p) => p ? { ...p, routeName: e.target.value } : p)}
              className="h-7 text-sm font-mono font-bold bg-transparent border-none px-0 focus-visible:ring-0"
            />
            <p className="text-[10px] text-muted-foreground">
              {draft.alias.productionName || "No alias"} · {draft.signalSource.location}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isDirty && (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">Unsaved</Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] border", healthPill.cls)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", healthPill.dot)} />
              {healthPill.label}
            </Badge>
          </div>
        </div>

        {!isMobile && (
          <div className="flex gap-1 flex-wrap">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {s.label}
                {s.id === "hops" && totalHops > 0 && (
                  <span className="ml-1 text-primary">{totalHops}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">

          {/* Route Health */}
          <DrawerSection id="health" title="Route Health" defaultOpen>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className={cn("text-xs border", healthPill.cls)}>
                <span className={cn("w-2 h-2 rounded-full mr-1.5", healthPill.dot)} />
                {healthPill.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {draft.health?.lastUpdated ? new Date(draft.health.lastUpdated).toLocaleTimeString() : "—"}
              </span>
            </div>
            <Row label="Status">
              <Select value={draft.health?.status ?? "healthy"} onValueChange={(v) => {
                fHealth("status", v);
                fHealth("lastUpdated", new Date().toISOString());
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warn">Degraded</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Reason">
              <Input
                value={draft.health?.reason ?? ""}
                onChange={(e) => fHealth("reason", e.target.value)}
                className="h-8 text-xs"
                placeholder="e.g. Packet loss on transport"
              />
            </Row>
          </DrawerSection>

          {/* Signal Source */}
          <DrawerSection id="source" title="Signal Source" defaultOpen>
            <Row label="Location">
              <Input value={draft.signalSource.location} onChange={(e) => fSource("location", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Venue">
              <Input value={draft.signalSource.venue} onChange={(e) => fSource("venue", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Signal Name">
              <Input value={draft.signalSource.signalName} onChange={(e) => fSource("signalName", e.target.value)} className="h-8 text-xs" />
            </Row>
          </DrawerSection>

          {/* Encoder */}
          <DrawerSection id="encoder" title="Encoder">
            <Row label="Brand"><Input value={draft.encoder.brand} onChange={(e) => fEncoder("brand", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Model"><Input value={draft.encoder.model} onChange={(e) => fEncoder("model", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Device"><Input value={draft.encoder.deviceName} onChange={(e) => fEncoder("deviceName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Input Port"><Input type="number" value={draft.encoder.inputPort} onChange={(e) => fEncoder("inputPort", parseInt(e.target.value) || 1)} className="h-8 text-xs w-20" /></Row>
            <Row label="Local IP"><Input value={draft.encoder.localIp} onChange={(e) => fEncoder("localIp", e.target.value)} className="h-8 text-xs" placeholder="10.0.0.x" /></Row>
            <Row label="Notes"><Input value={draft.encoder.notes} onChange={(e) => fEncoder("notes", e.target.value)} className="h-8 text-xs" /></Row>
          </DrawerSection>

          {/* Transport */}
          <DrawerSection id="transport" title="Transport" defaultOpen>
            <Row label="Type">
              <Select value={draft.transport.type} onValueChange={(v) => fTransport("type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{TRANSPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            {(draft.transport.type === "SRT Public" || draft.transport.type === "SRT Private") && (
              <>
                <Row label="SRT Address"><Input value={draft.transport.srtAddress} onChange={(e) => fTransport("srtAddress", e.target.value)} className="h-8 text-xs" /></Row>
                <Row label="Port"><Input value={draft.transport.port} onChange={(e) => fTransport("port", e.target.value)} className="h-8 text-xs w-24" /></Row>
                <Row label="Mode">
                  <Select value={draft.transport.mode} onValueChange={(v) => fTransport("mode", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caller">Caller</SelectItem>
                      <SelectItem value="listener">Listener</SelectItem>
                      <SelectItem value="rendezvous">Rendezvous</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Passphrase"><Input type="password" value={draft.transport.passphrase} onChange={(e) => fTransport("passphrase", e.target.value)} className="h-8 text-xs" /></Row>
              </>
            )}
            {draft.transport.type === "Multicast" && (
              <Row label="Multicast IP"><Input value={draft.transport.multicastIp} onChange={(e) => fTransport("multicastIp", e.target.value)} className="h-8 text-xs" /></Row>
            )}
            <Row label="Cloud Relay"><Input value={draft.transport.cloudRelayName} onChange={(e) => fTransport("cloudRelayName", e.target.value)} className="h-8 text-xs" /></Row>
          </DrawerSection>

          {/* Decoder */}
          <DrawerSection id="decoder" title="Decoder">
            <Row label="Brand"><Input value={draft.decoder.brand} onChange={(e) => fDecoder("brand", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Model"><Input value={draft.decoder.model} onChange={(e) => fDecoder("model", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Device"><Input value={draft.decoder.deviceName} onChange={(e) => fDecoder("deviceName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Output Port"><Input type="number" value={draft.decoder.outputPort} onChange={(e) => fDecoder("outputPort", parseInt(e.target.value) || 1)} className="h-8 text-xs w-20" /></Row>
            <Row label="Frame Sync"><Switch checked={draft.decoder.frameSync} onCheckedChange={(v) => fDecoder("frameSync", v)} /></Row>
            <Row label="Local IP"><Input value={draft.decoder.localIp} onChange={(e) => fDecoder("localIp", e.target.value)} className="h-8 text-xs" placeholder="10.0.0.x" /></Row>
          </DrawerSection>

          {/* Router Mapping */}
          <DrawerSection id="router" title="Router Mapping">
            <Row label="Router">
              <Select value={draft.routerMapping.router} onValueChange={(v) => fRouter("router", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="23">CR-23</SelectItem>
                  <SelectItem value="26">CR-26</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Input XP"><Input value={draft.routerMapping.inputCrosspoint} onChange={(e) => fRouter("inputCrosspoint", e.target.value)} className="h-8 text-xs w-20" /></Row>
            <Row label="Output XP"><Input value={draft.routerMapping.outputCrosspoint} onChange={(e) => fRouter("outputCrosspoint", e.target.value)} className="h-8 text-xs w-20" /></Row>
            <Row label="Mon Wall"><Input value={draft.routerMapping.monitorWallDest} onChange={(e) => fRouter("monitorWallDest", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="EVS Ch"><Input value={draft.routerMapping.evsRecordChannel} onChange={(e) => fRouter("evsRecordChannel", e.target.value)} className="h-8 text-xs" /></Row>
            <div className="mt-2 p-2 rounded bg-secondary/50 text-[10px] font-mono text-muted-foreground text-center">
              {draft.decoder.deviceName} → Router {draft.routerMapping.router} → {draft.alias.productionName || "?"}
            </div>
          </DrawerSection>

          {/* Production Alias */}
          <DrawerSection id="alias" title="Production Alias" defaultOpen>
            <Row label="Eng. Name"><Input value={draft.alias.engineeringName} onChange={(e) => fAlias("engineeringName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="ISO Name"><Input value={draft.alias.productionName} onChange={(e) => fAlias("productionName", e.target.value)} className="h-8 text-sm font-semibold" /></Row>
          </DrawerSection>

          {/* Hops / Signal Chain */}
          <DrawerSection id="hops" title={`Signal Chain Hops${totalHops > 0 ? ` (${totalHops})` : ""}`} defaultOpen={totalHops > 0}>
            <p className="text-[10px] text-muted-foreground mb-3">
              Add converters, gateways, or processors between canonical stages.
            </p>
            <div ref={hopsSectionRef}>
              {draft.links?.map((link, linkIdx) => (
                <div key={`${link.from}-${link.to}`} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {link.from} → {link.to}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => addHop(linkIdx)}
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </Button>
                  </div>
                  {link.hops.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic pl-2">No hops</p>
                  ) : (
                    <div className="space-y-2">
                      {link.hops.map((hop, hopIdx) => (
                        <div
                          key={hop.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", JSON.stringify({ linkIdx, hopIdx }));
                            e.dataTransfer.effectAllowed = "move";
                            (e.currentTarget as HTMLElement).style.opacity = "0.5";
                          }}
                          onDragEnd={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = "1";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            (e.currentTarget as HTMLElement).classList.add("border-primary/60");
                          }}
                          onDragLeave={(e) => {
                            (e.currentTarget as HTMLElement).classList.remove("border-primary/60");
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).classList.remove("border-primary/60");
                            try {
                              const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                              if (data.linkIdx === linkIdx) {
                                reorderHop(linkIdx, data.hopIdx, hopIdx);
                              }
                            } catch {}
                          }}
                          className={cn(
                            "p-2 rounded border bg-secondary/30 space-y-1.5 transition-colors",
                            !hop.enabled ? "opacity-50 border-border" : "border-border",
                          )}
                        >
                          {/* Row 1: Drag handle + Name + Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
                              <Input
                                id={`hop-name-${hop.id}`}
                                value={hop.label}
                                onChange={(e) => updateHop(linkIdx, hopIdx, { label: e.target.value })}
                                className="h-6 text-[10px] font-mono font-semibold flex-1 min-w-0"
                                placeholder="e.g. SDI→IP Converter"
                              />
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                disabled={hopIdx === 0}
                                onClick={() => reorderHop(linkIdx, hopIdx, hopIdx - 1)}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                disabled={hopIdx === link.hops.length - 1}
                                onClick={() => reorderHop(linkIdx, hopIdx, hopIdx + 1)}
                              >
                                <ChevronDownSmall className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive hover:text-destructive"
                                onClick={() => setConfirmRemoveHop({ linkIdx, hopIdx, label: hop.label || "Unnamed" })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Row 2: Type + Status + Enabled */}
                          <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                            <div>
                              <span className="text-[9px] text-muted-foreground">Type</span>
                              <Select value={hop.subtype} onValueChange={(v) => updateHop(linkIdx, hopIdx, { subtype: v as any })}>
                                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {HOP_SUBTYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground">Status</span>
                              <Select value={hop.status} onValueChange={(v) => updateHop(linkIdx, hopIdx, { status: v as any })}>
                                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ok">OK</SelectItem>
                                  <SelectItem value="warn">Warn</SelectItem>
                                  <SelectItem value="error">Error</SelectItem>
                                  <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 pb-0.5">
                              <span className="text-[9px] text-muted-foreground">On</span>
                              <Switch
                                checked={hop.enabled}
                                onCheckedChange={(v) => updateHop(linkIdx, hopIdx, { enabled: v })}
                                className="scale-75"
                              />
                            </div>
                          </div>
                          {/* Row 3: Vendor + Notes (collapsed on mobile by default) */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground">Vendor</span>
                              <Input
                                value={hop.vendor}
                                onChange={(e) => updateHop(linkIdx, hopIdx, { vendor: e.target.value })}
                                className="h-7 text-[10px]"
                                placeholder="e.g. AJA"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground">Notes</span>
                              <Input
                                value={hop.notes}
                                onChange={(e) => updateHop(linkIdx, hopIdx, { notes: e.target.value })}
                                className="h-7 text-[10px]"
                              />
                            </div>
                          </div>
                          {!hop.enabled && (
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground italic">
                              <Power className="w-2.5 h-2.5" /> Bypassed
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DrawerSection>
        </div>
      </ScrollArea>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { onDuplicate(draft); onOpenChange(false); }}>
              <Copy className="w-3 h-3" /> Duplicate
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive hover:text-destructive" onClick={() => { onRemove(route!.id); onOpenChange(false); }}>
            <Ban className="w-3 h-3" /> Remove
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={handleClose}>Cancel</Button>
          <Button size="sm" className="text-xs" disabled={!isDirty} onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "p-0 flex flex-col",
            isMobile ? "h-[95dvh] rounded-t-xl" : "w-[480px] sm:max-w-[480px]"
          )}
        >
          <SheetTitle className="sr-only">Route Editor — {draft.routeName}</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>

      {/* Discard changes dialog */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes to this route. Discard them?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove hop confirm dialog */}
      <AlertDialog open={!!confirmRemoveHop} onOpenChange={(v) => { if (!v) setConfirmRemoveHop(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove hop</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{confirmRemoveHop?.label}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmRemoveHop && removeHop(confirmRemoveHop.linkIdx, confirmRemoveHop.hopIdx)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function DrawerSection({ id, title, defaultOpen = false, children }: { id: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} id={`route-section-${id}`}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <h4 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{title}</h4>
        <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] md:grid-cols-[100px_1fr] items-center gap-2 min-w-0">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
