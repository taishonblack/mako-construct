import type { SignalRoute } from "@/stores/route-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  routes: SignalRoute[];
}

export function TransportView({ routes }: Props) {
  const withTransport = routes.filter((r) => r.transport.type);
  const noTransport = routes.filter((r) => !r.transport.type);

  return (
    <div className="space-y-4">
      {withTransport.length > 0 && (
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
      )}

      {noTransport.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs text-destructive font-medium mb-1">{noTransport.length} route{noTransport.length > 1 ? "s" : ""} without transport</p>
          <p className="text-[10px] text-muted-foreground">{noTransport.map((r) => r.routeName).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
