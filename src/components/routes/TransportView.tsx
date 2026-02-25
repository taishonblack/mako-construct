import type { SignalRoute } from "@/stores/route-store";
import type { NodeKind } from "./FlowNodeCard";
import { RouteFlowRow } from "./RouteFlowRow";

interface Props {
  routes: SignalRoute[];
  onNodeClick?: (routeId: string, section: NodeKind) => void;
}

export function TransportView({ routes, onNodeClick }: Props) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No routes defined.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {routes.map((route) => (
        <RouteFlowRow
          key={route.id}
          route={route}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
