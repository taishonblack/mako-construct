import { useState, useMemo, useCallback } from "react";
import { Plus, RefreshCw, LayoutGrid, List, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoutesStore, buildDefaultLinks } from "@/stores/route-store";
import type { SignalRoute, HopNode } from "@/stores/route-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { RouteChain } from "@/components/routes/RouteChain";
import { ShowDayCard } from "@/components/routes/ShowDayCard";
import { TransportView } from "@/components/routes/TransportView";
import { RouteDrawer } from "@/components/routes/RouteDrawer";
import type { NodeKind } from "@/components/routes/FlowNodeCard";

type ViewMode = "engineering" | "showday";

export default function RoutesPage() {
  const { state, addRoute, updateRoute, removeRoute, syncRouterCrosspoints } = useRoutesStore();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("topology");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [drawerSection, setDrawerSection] = useState<string | null>(null);
  const [hiddenRoutes, setHiddenRoutes] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<ViewMode>("engineering");

  const selectedRoute = useMemo(
    () => state.routes.find((r) => r.id === selectedRouteId) ?? null,
    [state.routes, selectedRouteId]
  );

  const visibleRoutes = useMemo(
    () => state.routes.filter((r) => !hiddenRoutes.has(r.id)),
    [state.routes, hiddenRoutes]
  );

  const toggleVisibility = useCallback((id: string) => {
    setHiddenRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDuplicate = useCallback((route: SignalRoute) => {
    addRoute();
  }, [addRoute]);

  const handleAddHop = useCallback((routeId: string, linkFrom: string, linkTo: string) => {
    const route = state.routes.find(r => r.id === routeId);
    if (!route) return;
    const links = (route.links ?? buildDefaultLinks()).map(l => {
      if (l.from === linkFrom && l.to === linkTo) {
        return {
          ...l,
          hops: [...l.hops, {
            id: `hop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            subtype: "Other" as const,
            label: "",
            vendor: "",
            model: "",
            notes: "",
            status: "ok" as const,
          }],
        };
      }
      return l;
    });
    updateRoute(routeId, { links });
    setSelectedRouteId(routeId);
    setDrawerSection("hops");
  }, [state.routes, updateRoute]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Routes</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Live contribution topology — See → Select → Modify
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-md">
            <Button
              variant={mode === "engineering" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs rounded-r-none h-8 gap-1"
              onClick={() => setMode("engineering")}
            >
              Engineering
            </Button>
            <Button
              variant={mode === "showday" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs rounded-l-none h-8 gap-1"
              onClick={() => setMode("showday")}
            >
              <Eye className="w-3 h-3" /> Show Day
            </Button>
          </div>
          {mode === "engineering" && (
            <>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={syncRouterCrosspoints}>
                <RefreshCw className="w-3 h-3" /> Sync
              </Button>
              <Button size="sm" className="text-xs gap-1.5" onClick={addRoute}>
                <Plus className="w-3 h-3" /> Add Route
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Show Day mode */}
      {mode === "showday" ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Production Status — {visibleRoutes.length} routes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visibleRoutes.map((route) => (
              <ShowDayCard key={route.id} route={route} onClick={() => setSelectedRouteId(route.id)} />
            ))}
          </div>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between gap-2">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="topology" className="text-xs">Topology</TabsTrigger>
              <TabsTrigger value="transport" className="text-xs">Transport</TabsTrigger>
            </TabsList>

            {tab === "topology" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      Visible
                      {hiddenRoutes.size > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">
                          {state.routes.length - hiddenRoutes.size}/{state.routes.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Route Visibility</p>
                    {state.routes.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-secondary/50 cursor-pointer">
                        <Checkbox checked={!hiddenRoutes.has(r.id)} onCheckedChange={() => toggleVisibility(r.id)} />
                        <span className="text-xs font-mono">{r.routeName}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{r.alias.productionName}</span>
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
                {!isMobile && (
                  <div className="flex border border-border rounded-md">
                    <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setViewMode("grid")}>
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setViewMode("list")}>
                      <List className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="topology" className="mt-4">
            {visibleRoutes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                {state.routes.length === 0
                  ? 'No routes defined. Click "Add Route" to create your first signal path.'
                  : "All routes are hidden. Adjust visibility filter."}
              </div>
            ) : viewMode === "grid" || isMobile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleRoutes.map((route) => (
                  <RouteChain key={route.id} route={route} isSelected={selectedRouteId === route.id} onSelect={setSelectedRouteId} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] uppercase tracking-wider">TX</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">Encoder</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">Transport</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">Decoder</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">ISO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRoutes.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedRouteId(r.id)}>
                        <TableCell className="text-xs font-mono font-semibold">{r.routeName}</TableCell>
                        <TableCell className="text-xs font-mono">{r.encoder.brand} {r.encoder.deviceName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-mono">{r.transport.type || "—"}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">{r.decoder.brand} {r.decoder.deviceName}</TableCell>
                        <TableCell className="text-xs font-semibold">{r.alias.productionName || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transport" className="mt-4">
            <TransportView
              routes={state.routes}
              onNodeClick={(routeId, section) => {
                setSelectedRouteId(routeId);
                setDrawerSection(section);
              }}
              onAddHop={handleAddHop}
            />
          </TabsContent>
        </Tabs>
      )}

      <RouteDrawer
        route={selectedRoute}
        open={!!selectedRouteId}
        onOpenChange={(open) => { if (!open) { setSelectedRouteId(null); setDrawerSection(null); } }}
        onSave={updateRoute}
        onRemove={removeRoute}
        onDuplicate={handleDuplicate}
        initialSection={drawerSection}
      />
    </div>
  );
}
