import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { SignalRoute } from "@/stores/route-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  route: SignalRoute;
  onUpdate: (id: string, patch: Partial<SignalRoute>) => void;
  onRemove: (id: string) => void;
}

/* Small editable block in the chain */
function ChainBlock({ label, sublabel, accent, onClick, className }: { label: string; sublabel?: string; accent?: string; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border border-border bg-card px-4 py-3 hover:border-primary/50 transition-colors group",
        className
      )}
    >
      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{sublabel}</div>
      <div className={cn("text-sm font-semibold", accent || "text-foreground")}>{label || "—"}</div>
    </button>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-px h-5 bg-border" />
    </div>
  );
}

const TRANSPORT_TYPES = ["SRT Public", "SRT Private", "MPLS", "Multicast", "Fiber"] as const;

export function RouteChain({ route, onUpdate, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const r = route;

  const field = <T extends keyof SignalRoute>(section: T) => (key: string, value: any) => {
    const current = r[section];
    if (typeof current === "object" && current !== null) {
      onUpdate(r.id, { [section]: { ...current, [key]: value } } as any);
    }
  };

  const fEncoder = field("encoder");
  const fTransport = field("transport");
  const fDecoder = field("decoder");
  const fRouter = field("routerMapping");
  const fAlias = field("alias");
  const fSource = field("signalSource");

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Input
            value={r.routeName}
            onChange={(e) => onUpdate(r.id, { routeName: e.target.value })}
            className="h-7 w-32 text-sm font-mono bg-transparent border-none px-0 text-foreground font-bold focus-visible:ring-0"
          />
          <span className="text-[10px] font-mono text-muted-foreground">{r.id.slice(-8)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onRemove(r.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Visual chain — always visible */}
      <div className="flex flex-col items-stretch">
        <ChainBlock
          sublabel="Signal Source"
          label={`${r.signalSource.signalName}${r.signalSource.location ? ` — ${r.signalSource.location}` : ""}`}
          onClick={() => setExpanded(true)}
        />
        <Connector />
        <ChainBlock
          sublabel="Encoder"
          label={`${r.encoder.brand} ${r.encoder.deviceName} | Port ${r.encoder.inputPort}`}
          accent="text-blue-400"
          onClick={() => setExpanded(true)}
        />
        <Connector />
        <ChainBlock
          sublabel="Transport"
          label={`${r.transport.type || "—"} ${r.transport.srtAddress ? r.transport.srtAddress + ":" + r.transport.port : ""}`}
          accent="text-amber-400"
          onClick={() => setExpanded(true)}
        />
        <Connector />
        <ChainBlock sublabel="Cloud Relay" label={r.transport.cloudRelayName || "—"} onClick={() => setExpanded(true)} />
        <Connector />
        <ChainBlock
          sublabel="Decoder"
          label={`${r.decoder.brand} ${r.decoder.deviceName} | Port ${r.decoder.outputPort}`}
          accent="text-emerald-400"
          onClick={() => setExpanded(true)}
        />
        <Connector />
        <ChainBlock
          sublabel={`Router ${r.routerMapping.router || "—"}`}
          label={`In ${r.routerMapping.inputCrosspoint || "—"} → Out ${r.routerMapping.outputCrosspoint || "—"}`}
          accent="text-purple-400"
          onClick={() => setExpanded(true)}
        />
        <Connector />
        <ChainBlock
          sublabel="Production Alias"
          label={r.alias.productionName || "—"}
          accent="text-crimson"
          className="border-primary/30"
          onClick={() => setExpanded(true)}
        />
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="mt-4 space-y-5 border-t border-border pt-4">
          {/* Signal Source */}
          <Section title="Signal Source">
            <Row label="Location">
              <Input value={r.signalSource.location} onChange={(e) => fSource("location", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Venue">
              <Input value={r.signalSource.venue} onChange={(e) => fSource("venue", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Signal Name">
              <Input value={r.signalSource.signalName} onChange={(e) => fSource("signalName", e.target.value)} className="h-8 text-xs" />
            </Row>
          </Section>

          {/* Encoder */}
          <Section title="Encoder Device">
            <Row label="Brand">
              <Input value={r.encoder.brand} onChange={(e) => fEncoder("brand", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Model">
              <Input value={r.encoder.model} onChange={(e) => fEncoder("model", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Device Name">
              <Input value={r.encoder.deviceName} onChange={(e) => fEncoder("deviceName", e.target.value)} className="h-8 text-xs" />
            </Row>
            <Row label="Input Port">
              <Input type="number" value={r.encoder.inputPort} onChange={(e) => fEncoder("inputPort", parseInt(e.target.value) || 1)} className="h-8 text-xs w-20" />
            </Row>
            <Row label="Local IP">
              <Input value={r.encoder.localIp} onChange={(e) => fEncoder("localIp", e.target.value)} className="h-8 text-xs" placeholder="10.0.0.x" />
            </Row>
            <Row label="Notes">
              <Input value={r.encoder.notes} onChange={(e) => fEncoder("notes", e.target.value)} className="h-8 text-xs" />
            </Row>
          </Section>

          {/* Transport */}
          <Section title="Transport">
            <Row label="Type">
              <Select value={r.transport.type} onValueChange={(v) => fTransport("type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TRANSPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
            {(r.transport.type === "SRT Public" || r.transport.type === "SRT Private") && (
              <>
                <Row label="SRT Address"><Input value={r.transport.srtAddress} onChange={(e) => fTransport("srtAddress", e.target.value)} className="h-8 text-xs" /></Row>
                <Row label="Port"><Input value={r.transport.port} onChange={(e) => fTransport("port", e.target.value)} className="h-8 text-xs w-24" /></Row>
                <Row label="Mode">
                  <Select value={r.transport.mode} onValueChange={(v) => fTransport("mode", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caller">Caller</SelectItem>
                      <SelectItem value="listener">Listener</SelectItem>
                      <SelectItem value="rendezvous">Rendezvous</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Passphrase"><Input type="password" value={r.transport.passphrase} onChange={(e) => fTransport("passphrase", e.target.value)} className="h-8 text-xs" /></Row>
              </>
            )}
            {r.transport.type === "Multicast" && (
              <Row label="Multicast IP"><Input value={r.transport.multicastIp} onChange={(e) => fTransport("multicastIp", e.target.value)} className="h-8 text-xs" /></Row>
            )}
            <Row label="Cloud Relay"><Input value={r.transport.cloudRelayName} onChange={(e) => fTransport("cloudRelayName", e.target.value)} className="h-8 text-xs" /></Row>
          </Section>

          {/* Decoder */}
          <Section title="Decoder Device">
            <Row label="Brand"><Input value={r.decoder.brand} onChange={(e) => fDecoder("brand", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Model"><Input value={r.decoder.model} onChange={(e) => fDecoder("model", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Device Name"><Input value={r.decoder.deviceName} onChange={(e) => fDecoder("deviceName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Output Port"><Input type="number" value={r.decoder.outputPort} onChange={(e) => fDecoder("outputPort", parseInt(e.target.value) || 1)} className="h-8 text-xs w-20" /></Row>
            <Row label="Frame Sync">
              <Switch checked={r.decoder.frameSync} onCheckedChange={(v) => fDecoder("frameSync", v)} />
            </Row>
            <Row label="Local IP"><Input value={r.decoder.localIp} onChange={(e) => fDecoder("localIp", e.target.value)} className="h-8 text-xs" placeholder="10.0.0.x" /></Row>
          </Section>

          {/* Router */}
          <Section title="Router Mapping">
            <Row label="Router">
              <Select value={r.routerMapping.router} onValueChange={(v) => fRouter("router", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="23">CR-23</SelectItem>
                  <SelectItem value="26">CR-26</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Input Crosspoint"><Input value={r.routerMapping.inputCrosspoint} onChange={(e) => fRouter("inputCrosspoint", e.target.value)} className="h-8 text-xs w-20" /></Row>
            <Row label="Output Crosspoint"><Input value={r.routerMapping.outputCrosspoint} onChange={(e) => fRouter("outputCrosspoint", e.target.value)} className="h-8 text-xs w-20" /></Row>
            <Row label="Monitor Wall"><Input value={r.routerMapping.monitorWallDest} onChange={(e) => fRouter("monitorWallDest", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="EVS Record Ch"><Input value={r.routerMapping.evsRecordChannel} onChange={(e) => fRouter("evsRecordChannel", e.target.value)} className="h-8 text-xs" /></Row>
          </Section>

          {/* Production Alias */}
          <Section title="Production Alias">
            <Row label="Engineering Name"><Input value={r.alias.engineeringName} onChange={(e) => fAlias("engineeringName", e.target.value)} className="h-8 text-xs" /></Row>
            <Row label="Production Name"><Input value={r.alias.productionName} onChange={(e) => fAlias("productionName", e.target.value)} className="h-8 text-xs" /></Row>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-semibold">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
