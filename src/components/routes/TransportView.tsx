import type { SignalRoute } from "@/stores/route-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  routes: SignalRoute[];
}

function MobileTransportCard({ r }: { r: SignalRoute }) {
  return (
    <div className="steel-panel p-3 space-y-2">
      <div className="flex items-center justify-between min-w-0 gap-2">
        <span className="text-xs font-mono font-semibold truncate min-w-0">{r.routeName}</span>
        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{r.transport.type}</Badge>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-14">Address</span>
          <span className="text-xs font-mono truncate min-w-0">{r.transport.srtAddress || r.transport.multicastIp || "—"}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-14">Port</span>
          <span className="text-xs font-mono">{r.transport.port || "—"}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-14">Mode</span>
          <span className="text-xs">{r.transport.mode || "—"}</span>
        </div>
        {r.transport.cloudRelayName && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-14">Relay</span>
            <span className="text-xs truncate min-w-0">{r.transport.cloudRelayName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-14">Signal</span>
          <span className="text-xs text-muted-foreground truncate min-w-0">{r.alias.productionName || r.signalSource.signalName}</span>
        </div>
      </div>
    </div>
  );
}

export function TransportView({ routes }: Props) {
  const isMobile = useIsMobile();
  const withTransport = routes.filter((r) => r.transport.type);
  const noTransport = routes.filter((r) => !r.transport.type);

  return (
    <div className="space-y-4">
      {withTransport.length > 0 && (
        isMobile ? (
          <div className="space-y-3">
            {withTransport.map((r) => (
              <MobileTransportCard key={r.id} r={r} />
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
          <p className="text-[10px] text-muted-foreground break-words">{noTransport.map((r) => r.routeName).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
