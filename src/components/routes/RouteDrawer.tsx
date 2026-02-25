import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Copy, Ban } from "lucide-react";
import type { SignalRoute } from "@/stores/route-store";
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
}

// Jump nav sections
const SECTIONS = [
  { id: "source", label: "Source" },
  { id: "encoder", label: "Encoder" },
  { id: "transport", label: "Transport" },
  { id: "decoder", label: "Decoder" },
  { id: "router", label: "Router" },
  { id: "alias", label: "Alias" },
] as const;

export function RouteDrawer({ route, open, onOpenChange, onSave, onRemove, onDuplicate }: Props) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<SignalRoute | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Reset draft when route changes
  useEffect(() => {
    if (route) setDraft(structuredClone(route));
    else setDraft(null);
  }, [route]);

  const isDirty = useMemo(() => {
    if (!route || !draft) return false;
    return JSON.stringify(route) !== JSON.stringify(draft);
  }, [route, draft]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      onOpenChange(false);
    }
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

  // Field updaters
  const setField = <T extends keyof SignalRoute>(section: T) =>
    (key: string, value: any) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const current = prev[section];
        if (typeof current === "object" && current !== null) {
          return { ...prev, [section]: { ...current, [key]: value } };
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

  const scrollToSection = (id: string) => {
    document.getElementById(`route-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
            <Badge variant="outline" className="text-[10px] font-mono">CR-{draft.routerMapping.router || "?"}</Badge>
          </div>
        </div>

        {/* Jump nav */}
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
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
            <Row label="Brand">
              <Input value={draft.encoder.brand} onChange={(e) => fEncoder("brand", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Model">
              <Input value={draft.encoder.model} onChange={(e) => fEncoder("model", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Device">
              <Input value={draft.encoder.deviceName} onChange={(e) => fEncoder("deviceName", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Input Port">
              <Input type="number" value={draft.encoder.inputPort} onChange={(e) => fEncoder("inputPort", parseInt(e.target.value) || 1)} className="h-8 text-xs w-20" />
            </Row>
            <Row label="Local IP">
              <Input value={draft.encoder.localIp} onChange={(e) => fEncoder("localIp", e.target.value)} className="h-8 text-xs" placeholder="10.0.0.x" />
            </Row>
            <Row label="Notes">
              <Input value={draft.encoder.notes} onChange={(e) => fEncoder("notes", e.target.value)} className="h-8 text-xs" />
            </Row>
          </DrawerSection>

          {/* Transport */}
          <DrawerSection id="transport" title="Transport" defaultOpen>
            <Row label="Type">
              <Select value={draft.transport.type} onValueChange={(v) => fTransport("type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TRANSPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
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
            {/* Mini routing diagram */}
            <div className="mt-2 p-2 rounded bg-secondary/50 text-[10px] font-mono text-muted-foreground text-center">
              {draft.decoder.deviceName} → Router {draft.routerMapping.router} → {draft.alias.productionName || "?"}
            </div>
          </DrawerSection>

          {/* Production Alias */}
          <DrawerSection id="alias" title="Production Alias" defaultOpen>
            <Row label="Eng. Name"><Input value={draft.alias.engineeringName} onChange={(e) => fAlias("engineeringName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="ISO Name"><Input value={draft.alias.productionName} onChange={(e) => fAlias("productionName", e.target.value)} className="h-8 text-sm font-semibold" /></Row>
          </DrawerSection>

          {/* Health placeholder */}
          <div className="mt-4 p-3 rounded border border-border bg-secondary/20">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Route Health</span>
            <p className="text-[10px] text-muted-foreground mt-1 italic">Latency, bitrate, packet loss — coming soon</p>
          </div>
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
