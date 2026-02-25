import { Copy } from "lucide-react";
import type { SignalRoute } from "@/stores/route-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  routes: SignalRoute[];
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function MobileTransportCard({ route }: { route: SignalRoute }) {
  const address = route.transport.srtAddress || route.transport.multicastIp || "—";
  const fullEndpoint = route.transport.srtAddress
    ? `${route.transport.srtAddress}:${route.transport.port || ""}`
    : address;

  return (
    <div className="steel-panel p-4 space-y-2 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-sm font-mono font-semibold text-foreground truncate min-w-0">{route.routeName}</span>
        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{route.transport.type}</Badge>
      </div>
      <div className="space-y-1.5">
        <TransportRow label="Signal" value={route.alias.productionName || route.signalSource.signalName} />
        <TransportRow label="Address" value={fullEndpoint} copyable />
        {route.transport.port && <TransportRow label="Port" value={route.transport.port} />}
        {route.transport.mode && <TransportRow label="Mode" value={route.transport.mode} />}
        {route.transport.cloudRelayName && <TransportRow label="Cloud Relay" value={route.transport.cloudRelayName} />}
      </div>
    </div>
  );
}

function TransportRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs font-mono text-foreground truncate min-w-0 flex-1">{value}</span>
      {copyable && value !== "—" && (
        <button onClick={() => copyText(value)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function TransportView({ routes }: Props) {
  const isMobile = useIsMobile();
  const withTransport = routes.filter((r) => r.transport.type);
  const noTransport = routes.filter((r) => !r.transport.type);

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {withTransport.length > 0 && (
        isMobile ? (
          <div className="space-y-2">
            {withTransport.map((r) => (
              <MobileTransportCard key={r.id} route={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] uppercase tracking-wider">Route</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Port</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Mode</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Cloud Relay</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withTransport.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono font-semibold">{r.routeName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">{r.transport.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{r.transport.srtAddress || r.transport.multicastIp || "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{r.transport.port || "—"}</TableCell>
                    <TableCell className="text-xs">{r.transport.mode || "—"}</TableCell>
                    <TableCell className="text-xs">{r.transport.cloudRelayName || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.alias.productionName || r.signalSource.signalName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {noTransport.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs text-destructive font-medium mb-1">{noTransport.length} route{noTransport.length > 1 ? "s" : ""} without transport</p>
          <p className="text-[10px] text-muted-foreground break-all">{noTransport.map((r) => r.routeName).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
