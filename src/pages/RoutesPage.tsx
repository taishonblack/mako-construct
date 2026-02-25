import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRoutesStore } from "@/stores/route-store";
import { RouteChain } from "@/components/routes/RouteChain";
import { TransportView } from "@/components/routes/TransportView";

export default function RoutesPage() {
  const { state, addRoute, updateRoute, removeRoute, syncRouterCrosspoints } = useRoutesStore();
  const [tab, setTab] = useState("topology");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Routes</h1>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            Live contribution topology — Arena → Encoder → Transport → Cloud → Decoder → Production
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={syncRouterCrosspoints}>
            <RefreshCw className="w-3 h-3" /> Sync Crosspoints
          </Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={addRoute}>
            <Plus className="w-3 h-3" /> Add Route
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="topology" className="text-xs">Topology</TabsTrigger>
          <TabsTrigger value="transport" className="text-xs">Transport</TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="mt-4">
          {state.routes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No routes defined. Click "Add Route" to create your first signal path.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {state.routes.map((route) => (
                <RouteChain key={route.id} route={route} onUpdate={updateRoute} onRemove={removeRoute} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transport" className="mt-4">
          <TransportView routes={state.routes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
