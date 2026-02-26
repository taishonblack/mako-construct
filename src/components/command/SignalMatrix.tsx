import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Wand2, ChevronDown, Copy, Eraser, Layers, Link2, Unlink } from "lucide-react";
import type { Signal } from "@/lib/signal-utils";
import { TRANSPORT_OPTIONS, DESTINATION_OPTIONS, applyAliasScheme } from "@/lib/signal-utils";
import type { ReadinessReport } from "@/lib/readiness-engine";
import type { TopologyConfig } from "@/hooks/use-binder-state";
import type { SignalRoute } from "@/stores/route-store";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";

interface SignalMatrixProps {
  signals: Signal[];
  report: ReadinessReport;
  onUpdateSignal: (iso: number, field: keyof Signal, value: string) => void;
  onUpdateSignals?: (updater: (signals: Signal[]) => Signal[]) => void;
  topology?: TopologyConfig;
  routes?: SignalRoute[];
}

function InlineInput({ value, onChange, mono, placeholder }: { value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-b border-transparent hover:border-border focus:border-crimson focus:outline-none text-sm py-0.5 transition-colors placeholder:text-muted-foreground/40 ${mono ? "font-mono text-xs text-muted-foreground" : "text-foreground"}`}
    />
  );
}

function InlineSelect({ value, options, onChange, allowCustom }: { value: string; options: string[]; onChange: (v: string) => void; allowCustom?: boolean }) {
  const isCustom = allowCustom && !options.includes(value) && value !== "";
  
  if (isCustom) {
    return (
      <div className="flex items-center gap-1">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-crimson/30 focus:border-crimson focus:outline-none text-[10px] font-mono py-0.5 text-muted-foreground" />
        <button onClick={() => onChange(options[0])} className="text-muted-foreground hover:text-foreground shrink-0">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-[10px] font-mono px-1 py-0.5 rounded border border-transparent hover:border-border focus:border-crimson focus:outline-none text-muted-foreground uppercase tracking-wider transition-colors cursor-pointer w-full">
      {options.map((o) => (
        <option key={o} value={o} className="bg-card text-foreground">{o}</option>
      ))}
      {allowCustom && <option value="__custom__" className="bg-card text-foreground">Custom…</option>}
    </select>
  );
}

function PatchpointSelect({ value, options, onChange, customLabel, onCustomLabelChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
  customLabel?: string; onCustomLabelChange?: (v: string) => void;
}) {
  const [useCustom, setUseCustom] = useState(!!customLabel);

  if (useCustom && onCustomLabelChange) {
    return (
      <div className="flex items-center gap-1">
        <input type="text" value={customLabel || ""} onChange={(e) => onCustomLabelChange(e.target.value)}
          placeholder="Custom label"
          className="w-full bg-transparent border-b border-crimson/30 focus:border-crimson focus:outline-none text-xs font-mono py-0.5 text-muted-foreground placeholder:text-muted-foreground/40" />
        <button onClick={() => { setUseCustom(false); if (onCustomLabelChange) onCustomLabelChange(""); }}
          className="text-muted-foreground hover:text-foreground shrink-0" title="Switch to dropdown">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select value={value} onChange={(e) => {
        if (e.target.value === "__custom__" && onCustomLabelChange) {
          setUseCustom(true);
          return;
        }
        onChange(e.target.value);
      }}
        className="bg-transparent text-xs font-mono px-0.5 py-0.5 rounded border border-transparent hover:border-border focus:border-crimson focus:outline-none text-muted-foreground transition-colors cursor-pointer w-full">
        <option value="" className="bg-card text-foreground">—</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-card text-foreground">{o}</option>
        ))}
        {onCustomLabelChange && <option value="__custom__" className="bg-card text-foreground">Custom…</option>}
      </select>
    </div>
  );
}

function SyncedBadge({ signal, field, routes }: { signal: Signal; field: string; routes: SignalRoute[] }) {
  if (!signal.linkedRouteId) return null;
  const route = routes.find(r => r.id === signal.linkedRouteId);
  if (!route) return null;

  // Check if this field is actually synced from the route
  const syncMap: Record<string, boolean> = {
    productionAlias: !!route.alias.productionName && signal.productionAlias === route.alias.productionName,
    transport: !!route.transport.type && signal.transport === route.transport.type,
    txName: !!route.routeName && signal.txName === route.routeName,
    rxName: !!route.alias.engineeringName && signal.rxName === route.alias.engineeringName,
    encoderInput: !!route.encoder.deviceName && signal.encoderInput === route.encoder.deviceName,
    decoderOutput: !!route.decoder.deviceName && signal.decoderOutput === route.decoder.deviceName,
  };

  if (!syncMap[field]) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link2 className="w-2.5 h-2.5 text-sky-400 shrink-0 inline-block ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px]">
        Synced from route: <span className="font-mono font-medium">{route.routeName}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function SignalStatus({ signal }: { signal: Signal }) {
  const hasAlias = !!signal.productionAlias;
  const hasOnsite = !!signal.encoderInput;
  const hasHQ = !!signal.decoderOutput || !!signal.hqPatchCustomLabel;

  if (hasOnsite && hasHQ) {
    return <span className="text-[10px] tracking-wider uppercase text-emerald-400">Configured</span>;
  }
  if (hasOnsite || hasHQ || hasAlias) {
    return <span className="text-[10px] tracking-wider uppercase text-amber-400">Partial</span>;
  }
  return <span className="text-[10px] tracking-wider uppercase text-crimson">Blocked</span>;
}

const ALIAS_SCHEMES = [
  { value: "iso", label: "ISO 1..N" },
  { value: "cam", label: "Cam 1..N" },
  { value: "game-iso", label: "Game ISO 1..N" },
  { value: "clean-iso", label: "Clean ISO 1..N" },
  { value: "custom", label: "Custom Prefix" },
];

export function SignalMatrix({ signals, report, onUpdateSignal, onUpdateSignals, topology, routes = [] }: SignalMatrixProps) {
  const [showNamingContext, setShowNamingContext] = useState(false);
  const [aliasScheme, setAliasScheme] = useState("iso");
  const [customPrefix, setCustomPrefix] = useState("");
  const [bulkTransport, setBulkTransport] = useState("SRT");
  const [bulkDestination, setBulkDestination] = useState("Studio");

  const encoderPatchpoints = topology?.encoderPatchpoints || [];
  const decoderPatchpoints = topology?.decoderPatchpoints || [];

  const configuredCount = useMemo(() =>
    signals.filter((s) => !!s.encoderInput && (!!s.decoderOutput || !!s.hqPatchCustomLabel)).length
  , [signals]);

  const bulkUpdate = useCallback((updater: (signals: Signal[]) => Signal[]) => {
    if (onUpdateSignals) {
      onUpdateSignals(updater);
    }
  }, [onUpdateSignals]);

  const autoAssignOnsite = () => {
    bulkUpdate((sigs) => {
      const used = new Set(sigs.filter((s) => s.encoderInput).map((s) => s.encoderInput));
      const available = encoderPatchpoints.filter((p) => !used.has(p));
      let idx = 0;
      return sigs.map((s) => {
        if (!s.encoderInput && idx < available.length) {
          return { ...s, encoderInput: available[idx++] };
        }
        return s;
      });
    });
  };

  const autoAssignHQ = () => {
    bulkUpdate((sigs) => {
      const used = new Set(sigs.filter((s) => s.decoderOutput).map((s) => s.decoderOutput));
      const available = decoderPatchpoints.filter((p) => !used.has(p));
      let idx = 0;
      return sigs.map((s) => {
        if (!s.decoderOutput && !s.hqPatchCustomLabel && idx < available.length) {
          return { ...s, decoderOutput: available[idx++] };
        }
        return s;
      });
    });
  };

  const applyTransportToAll = () => {
    bulkUpdate((sigs) => sigs.map((s) => ({ ...s, transport: bulkTransport })));
  };

  const applyDestinationToAll = () => {
    bulkUpdate((sigs) => sigs.map((s) => ({ ...s, destination: bulkDestination })));
  };

  const applyAlias = () => {
    bulkUpdate((sigs) => applyAliasScheme(sigs, aliasScheme, customPrefix, false));
  };

  const duplicateRow = (iso: number) => {
    const source = signals.find((s) => s.iso === iso);
    if (!source || !onUpdateSignals) return;
    // Copy alias, transport, destination to next unaliased row
    onUpdateSignals((sigs) => {
      const nextBlank = sigs.find((s) => s.iso > iso && !s.productionAlias);
      if (!nextBlank) return sigs;
      return sigs.map((s) => s.iso === nextBlank.iso
        ? { ...s, productionAlias: source.productionAlias, transport: source.transport, destination: source.destination }
        : s
      );
    });
  };

  const clearRow = (iso: number) => {
    if (onUpdateSignals) {
      onUpdateSignals((sigs) => sigs.map((s) => s.iso === iso
        ? { ...s, productionAlias: "", encoderInput: "", decoderOutput: "", hqPatchCustomLabel: "" }
        : s
      ));
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Signal Configuration Matrix</h2>

      {/* Capacity summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className={`steel-panel p-4 ${report.encoderShortfall > 0 ? "border-glow-red" : ""}`}>
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Encoder Capacity</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-mono font-medium ${report.encoderShortfall > 0 ? "text-crimson" : "text-foreground"}`}>
              {report.encoderCapacity}
            </span>
            <span className="text-xs text-muted-foreground">/ {report.encoderRequired} required</span>
          </div>
          {report.encoderShortfall > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-crimson text-xs">
              <Zap className="w-3 h-3" /> {report.encoderShortfall} shortfall
            </div>
          )}
        </div>

        <div className="steel-panel p-4">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Decoder Mapping</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-medium text-foreground">{report.decoderAssigned}</span>
            <span className="text-xs text-muted-foreground">/ {report.decoderTotal} assigned</span>
          </div>
        </div>

        <div className="steel-panel p-4">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Signal Completion</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-mono font-medium ${configuredCount === signals.length ? "text-emerald-400" : "text-foreground"}`}>
              {configuredCount}
            </span>
            <span className="text-xs text-muted-foreground">/ {signals.length} configured</span>
        </div>

        {/* Route validation summary */}
        {routes.length > 0 && (report.orphanDecoders > 0 || report.duplicateSrtPorts > 0 || report.unmappedRoutes > 0) && (
          <div className="steel-panel p-3 mb-4 border-crimson/30">
            <span className="text-[10px] tracking-wider uppercase text-crimson flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3" /> Route Validation Issues
            </span>
            {report.routeValidationErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-muted-foreground pl-4">• {err}</p>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {onUpdateSignals && (
        <div className="steel-panel p-3 mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mr-2">Bulk</span>

          {encoderPatchpoints.length > 0 && (
            <button onClick={autoAssignOnsite}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors">
              <Wand2 className="w-3 h-3" /> Auto-Assign Onsite
            </button>
          )}
          {decoderPatchpoints.length > 0 && (
            <button onClick={autoAssignHQ}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors">
              <Wand2 className="w-3 h-3" /> Auto-Assign HQ
            </button>
          )}

          <div className="flex items-center gap-1">
            <select value={bulkTransport} onChange={(e) => setBulkTransport(e.target.value)}
              className="bg-secondary text-[10px] font-mono px-1.5 py-1 rounded-sm border border-border text-muted-foreground">
              {TRANSPORT_OPTIONS.filter((t) => t !== "Other").map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={applyTransportToAll}
              className="px-2 py-1 text-[10px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors">
              Apply Transport
            </button>
          </div>

          <div className="flex items-center gap-1">
            <select value={bulkDestination} onChange={(e) => setBulkDestination(e.target.value)}
              className="bg-secondary text-[10px] font-mono px-1.5 py-1 rounded-sm border border-border text-muted-foreground">
              {DESTINATION_OPTIONS.filter((d) => d !== "Other").map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={applyDestinationToAll}
              className="px-2 py-1 text-[10px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors">
              Apply Destination
            </button>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <select value={aliasScheme} onChange={(e) => setAliasScheme(e.target.value)}
              className="bg-secondary text-[10px] px-1.5 py-1 rounded-sm border border-border text-muted-foreground">
              {ALIAS_SCHEMES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {aliasScheme === "custom" && (
              <input type="text" value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value)}
                placeholder="Prefix" className="w-16 bg-secondary text-[10px] px-1.5 py-1 rounded-sm border border-border text-muted-foreground" />
            )}
            <button onClick={applyAlias}
              className="px-2 py-1 text-[10px] rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-crimson/40 transition-colors">
              Apply Alias
            </button>
          </div>
        </div>
      )}

      {/* Naming context toggle */}
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => setShowNamingContext(!showNamingContext)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <Layers className="w-3 h-3" />
          {showNamingContext ? "Hide" : "Show"} Naming Context
        </button>
      </div>

      {/* Signal table */}
      <div className="steel-panel overflow-hidden">
        <TooltipProvider delayDuration={200}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-14 text-[10px] tracking-wider uppercase">ISO</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Production Alias</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">Onsite Encoder</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase">HQ Decoder</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-28">TX Name</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-28">RX Name</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-24">Transport</TableHead>
              <TableHead className="text-[10px] tracking-wider uppercase w-28">Destination</TableHead>
              <TableHead className="w-20 text-[10px] tracking-wider uppercase">Status</TableHead>
              {routes.length > 0 && <TableHead className="w-32 text-[10px] tracking-wider uppercase">Linked Route</TableHead>}
              {onUpdateSignals && <TableHead className="w-16 text-[10px] tracking-wider uppercase">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow key={signal.iso} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-xs text-crimson">{signal.iso}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <InlineInput value={signal.productionAlias} onChange={(v) => onUpdateSignal(signal.iso, "productionAlias", v)} />
                    <SyncedBadge signal={signal} field="productionAlias" routes={routes} />
                  </div>
                  {showNamingContext && signal.productionAlias && (
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">Production: {signal.productionAlias}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {encoderPatchpoints.length > 0 ? (
                      <PatchpointSelect value={signal.encoderInput} options={encoderPatchpoints}
                        onChange={(v) => onUpdateSignal(signal.iso, "encoderInput", v)} />
                    ) : (
                      <InlineInput value={signal.encoderInput} onChange={(v) => onUpdateSignal(signal.iso, "encoderInput", v)} mono />
                    )}
                    <SyncedBadge signal={signal} field="encoderInput" routes={routes} />
                  </div>
                  {showNamingContext && signal.encoderInput && (
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">Onsite: {signal.encoderInput}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {decoderPatchpoints.length > 0 ? (
                      <PatchpointSelect value={signal.decoderOutput} options={decoderPatchpoints}
                        onChange={(v) => onUpdateSignal(signal.iso, "decoderOutput", v)}
                        customLabel={signal.hqPatchCustomLabel}
                        onCustomLabelChange={(v) => onUpdateSignal(signal.iso, "hqPatchCustomLabel", v)} />
                    ) : (
                      <InlineInput value={signal.decoderOutput} onChange={(v) => onUpdateSignal(signal.iso, "decoderOutput", v)} mono />
                    )}
                    <SyncedBadge signal={signal} field="decoderOutput" routes={routes} />
                  </div>
                  {showNamingContext && (signal.decoderOutput || signal.hqPatchCustomLabel) && (
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                      HQ: {signal.hqPatchCustomLabel || signal.decoderOutput}
                    </div>
                   )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <InlineInput value={signal.txName} onChange={(v) => onUpdateSignal(signal.iso, "txName", v)} mono placeholder="TX-…" />
                    <SyncedBadge signal={signal} field="txName" routes={routes} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <InlineInput value={signal.rxName} onChange={(v) => onUpdateSignal(signal.iso, "rxName", v)} mono placeholder="RX-…" />
                    <SyncedBadge signal={signal} field="rxName" routes={routes} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <InlineSelect value={signal.transport} options={TRANSPORT_OPTIONS}
                      onChange={(v) => {
                        if (v === "__custom__") {
                          onUpdateSignal(signal.iso, "transport", "");
                        } else {
                          onUpdateSignal(signal.iso, "transport", v);
                        }
                      }}
                      allowCustom />
                    <SyncedBadge signal={signal} field="transport" routes={routes} />
                  </div>
                </TableCell>
                <TableCell>
                  <InlineSelect value={signal.destination} options={DESTINATION_OPTIONS}
                    onChange={(v) => {
                      if (v === "__custom__") {
                        onUpdateSignal(signal.iso, "destination", "");
                      } else {
                        onUpdateSignal(signal.iso, "destination", v);
                      }
                    }}
                    allowCustom />
                </TableCell>
                <TableCell>
                  <SignalStatus signal={signal} />
                </TableCell>
                {routes.length > 0 && (
                  <TableCell>
                    {signal.linkedRouteId ? (
                      <div className="flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-[10px] font-mono text-foreground truncate">
                          {routes.find(r => r.id === signal.linkedRouteId)?.routeName || signal.linkedRouteId}
                        </span>
                        {onUpdateSignals && (
                          <button onClick={() => onUpdateSignal(signal.iso, "linkedRouteId", "")}
                            className="text-muted-foreground hover:text-crimson shrink-0" title="Unlink">
                            <Unlink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      onUpdateSignals ? (
                        <select
                          value=""
                          onChange={(e) => onUpdateSignal(signal.iso, "linkedRouteId", e.target.value)}
                          className="bg-transparent text-[10px] font-mono px-0.5 py-0.5 rounded border border-transparent hover:border-border focus:border-crimson focus:outline-none text-muted-foreground transition-colors cursor-pointer w-full"
                        >
                          <option value="" className="bg-card text-foreground">— Link Route —</option>
                          {routes.map(r => (
                            <option key={r.id} value={r.id} className="bg-card text-foreground">
                              {r.routeName} ({r.alias.productionName || r.alias.engineeringName || "unnamed"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )
                    )}
                  </TableCell>
                )}
                {onUpdateSignals && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => duplicateRow(signal.iso)} title="Duplicate to next blank"
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => clearRow(signal.iso)} title="Clear row"
                        className="text-muted-foreground hover:text-crimson transition-colors p-0.5">
                        <Eraser className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>
    </motion.section>
  );
}
