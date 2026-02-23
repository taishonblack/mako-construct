import type { RouterConfig } from "@/stores/route-store";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  routers: RouterConfig[];
  onUpdateRouter: (id: string, patch: Partial<RouterConfig>) => void;
}

export function RoutersView({ routers, onUpdateRouter }: Props) {
  return (
    <div className="space-y-6">
      {routers.map((router) => (
        <div key={router.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
          {/* Router identity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Name">
              <Input value={router.name} onChange={(e) => onUpdateRouter(router.id, { name: e.target.value })} className="h-8 text-xs" />
            </Field>
            <Field label="Brand">
              <Input value={router.brand} onChange={(e) => onUpdateRouter(router.id, { brand: e.target.value })} className="h-8 text-xs" />
            </Field>
            <Field label="Model">
              <Input value={router.model} onChange={(e) => onUpdateRouter(router.id, { model: e.target.value })} className="h-8 text-xs" />
            </Field>
            <Field label="IP">
              <Input value={router.ip} onChange={(e) => onUpdateRouter(router.id, { ip: e.target.value })} className="h-8 text-xs font-mono" />
            </Field>
          </div>

          {/* Crosspoints table */}
          {router.crosspoints.length > 0 ? (
            <div className="rounded border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[10px] uppercase tracking-wider">Input</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Output</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Signal</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Route Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {router.crosspoints.map((cp, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{cp.input}</TableCell>
                      <TableCell className="text-xs font-mono">{cp.output}</TableCell>
                      <TableCell className="text-xs">{cp.signalLabel}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{cp.routeId.slice(-8)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No crosspoints synced. Click "Sync Crosspoints" in the Topology view.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      {children}
    </div>
  );
}
