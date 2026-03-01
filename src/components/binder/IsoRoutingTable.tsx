import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Minus, RotateCcw, GripVertical, Download, Upload, Printer,
  Pencil, Music, ChevronDown, Copy, Eraser, Layers, Wand2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  IsoRoutingRow, EmbAudioMode,
} from "@/lib/iso-routing-types";
import {
  createDefaultIsoRow,
  getAliasesForPartner,
  EMB_AUDIO_MODES,
  VIDEO_FORMATS,
  SOURCE_TYPES,
  DESTINATION_TYPES,
} from "@/lib/iso-routing-types";
import { IsoAudioDrawer } from "./IsoAudioDrawer";

// ─── Column definitions ─────────────────────────────────────────────
interface ColumnDef {
  id: string;
  label: string;
  width: string;
  sticky?: boolean;
  hideable?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: "select", label: "", width: "w-10", sticky: true, hideable: false },
  { id: "iso", label: "ISO #", width: "w-14", sticky: true, hideable: false },
  { id: "alias", label: "Production Alias", width: "min-w-[160px]", hideable: false },
  { id: "sourceType", label: "Source Type", width: "w-28" },
  { id: "sourceSignal", label: "Source Signal", width: "min-w-[120px]" },
  { id: "destType", label: "Dest Type", width: "w-28" },
  { id: "destPath", label: "Dest Path", width: "min-w-[120px]" },
  { id: "embAudio", label: "Emb Audio?", width: "w-28" },
  { id: "format", label: "Format", width: "w-28" },
  { id: "transport", label: "Transport", width: "w-24" },
  { id: "notes", label: "Notes", width: "min-w-[140px]" },
  { id: "actions", label: "", width: "w-20", hideable: false },
];

const COL_ORDER_KEY = "mako-iso-col-order";
const COL_HIDDEN_KEY = "mako-iso-col-hidden";
const ISO_COUNT_KEY = "mako-iso-count-pref";

// ─── Props ───────────────────────────────────────────────────────────
interface IsoRoutingTableProps {
  rows: IsoRoutingRow[];
  onRowsChange: (rows: IsoRoutingRow[]) => void;
  partner: string;
  readOnly?: boolean;
}

// ─── Inline editing helpers ──────────────────────────────────────────
function InlineInput({ value, onChange, mono, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-sm py-0.5 transition-colors placeholder:text-muted-foreground/40",
        mono ? "font-mono text-xs text-muted-foreground" : "text-foreground",
        disabled && "opacity-60 pointer-events-none"
      )}
    />
  );
}

function InlineSelect({ value, options, onChange, disabled }: {
  value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className="bg-transparent text-[11px] font-mono px-0.5 py-0.5 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none text-muted-foreground transition-colors cursor-pointer w-full disabled:opacity-60">
      {options.map(o => <option key={o} value={o} className="bg-card text-foreground">{o}</option>)}
    </select>
  );
}

// ─── ISO count presets ───────────────────────────────────────────────
const ISO_PRESETS = [8, 12, 16, 24];

export function IsoRoutingTable({ rows, onRowsChange, partner, readOnly }: IsoRoutingTableProps) {
  // Column order + visibility
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try { const s = localStorage.getItem(COL_ORDER_KEY); return s ? JSON.parse(s) : ALL_COLUMNS.map(c => c.id); }
    catch { return ALL_COLUMNS.map(c => c.id); }
  });
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem(COL_HIDDEN_KEY); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });

  // Persist column prefs
  useEffect(() => { localStorage.setItem(COL_ORDER_KEY, JSON.stringify(colOrder)); }, [colOrder]);
  useEffect(() => { localStorage.setItem(COL_HIDDEN_KEY, JSON.stringify([...hiddenCols])); }, [hiddenCols]);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerRow, setDrawerRow] = useState<string | null>(null);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkValue, setBulkValue] = useState("");

  const aliases = useMemo(() => getAliasesForPartner(partner), [partner]);
  const visibleCols = useMemo(() => {
    return colOrder
      .map(id => ALL_COLUMNS.find(c => c.id === id))
      .filter((c): c is ColumnDef => !!c && !hiddenCols.has(c.id));
  }, [colOrder, hiddenCols]);

  // Row helpers
  const updateRow = useCallback((id: string, patch: Partial<IsoRoutingRow>) => {
    onRowsChange(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }, [rows, onRowsChange]);

  const addRow = useCallback(() => {
    const nextIso = rows.length > 0 ? Math.max(...rows.map(r => r.isoNumber)) + 1 : 1;
    onRowsChange([...rows, createDefaultIsoRow(nextIso)]);
  }, [rows, onRowsChange]);

  const removeRow = useCallback((id: string) => {
    onRowsChange(rows.filter(r => r.id !== id));
  }, [rows, onRowsChange]);

  const setIsoCount = useCallback((count: number) => {
    const current = rows.length;
    if (count > current) {
      const newRows = [...rows];
      for (let i = current; i < count; i++) {
        newRows.push(createDefaultIsoRow(i + 1));
      }
      onRowsChange(newRows);
    } else if (count < current) {
      onRowsChange(rows.slice(0, count));
    }
  }, [rows, onRowsChange]);

  const resetToDefault = useCallback(() => {
    const count = rows.length || 12;
    onRowsChange(Array.from({ length: count }, (_, i) => createDefaultIsoRow(i + 1)));
  }, [rows.length, onRowsChange]);

  const duplicateRow = useCallback((id: string) => {
    const source = rows.find(r => r.id === id);
    if (!source) return;
    const nextIso = Math.max(...rows.map(r => r.isoNumber)) + 1;
    const newRow = { ...source, id: `iso-${Date.now()}-${nextIso}`, isoNumber: nextIso, sortOrder: nextIso };
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

  const clearRow = useCallback((id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    updateRow(id, {
      productionAlias: `ISO ${String(row.isoNumber).padStart(2, "0")}`,
      sourceType: "Camera", sourceSignal: "", destinationType: "Program", destinationPath: "",
      embAudioMode: "none", embAudioChannelCount: 2, embAudioChannels: [],
      format: "1080i59.94", notes: "", encoderInput: "", decoderOutput: "", txName: "", rxName: "",
    });
  }, [rows, updateRow]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };

  // Bulk apply
  const applyBulk = useCallback(() => {
    if (selected.size === 0 || !bulkAction) return;
    onRowsChange(rows.map(r => {
      if (!selected.has(r.id)) return r;
      switch (bulkAction) {
        case "setDest": return { ...r, destinationType: bulkValue };
        case "setFormat": return { ...r, format: bulkValue };
        case "addPrefix": return { ...r, productionAlias: `${bulkValue}${r.productionAlias}` };
        case "clear": return { ...r, productionAlias: `ISO ${String(r.isoNumber).padStart(2, "0")}`, sourceSignal: "", destinationPath: "", notes: "" };
        default: return r;
      }
    }));
    setSelected(new Set());
    setBulkAction("");
    setBulkValue("");
  }, [rows, selected, bulkAction, bulkValue, onRowsChange]);

  const duplicateSelected = useCallback(() => {
    const toDuplicate = rows.filter(r => selected.has(r.id));
    let nextIso = Math.max(...rows.map(r => r.isoNumber)) + 1;
    const newRows = toDuplicate.map(r => ({
      ...r, id: `iso-${Date.now()}-${nextIso}`, isoNumber: nextIso++, sortOrder: nextIso - 1,
    }));
    onRowsChange([...rows, ...newRows]);
    setSelected(new Set());
  }, [rows, selected, onRowsChange]);

  // Column drag
  const handleDragStart = (colId: string) => setDragCol(colId);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragCol || dragCol === targetId) return;
    const col = ALL_COLUMNS.find(c => c.id === dragCol);
    const target = ALL_COLUMNS.find(c => c.id === targetId);
    if (col?.sticky || target?.sticky) return; // Can't move sticky columns
  };
  const handleDrop = (targetId: string) => {
    if (!dragCol || dragCol === targetId) { setDragCol(null); return; }
    const col = ALL_COLUMNS.find(c => c.id === dragCol);
    const target = ALL_COLUMNS.find(c => c.id === targetId);
    if (col?.sticky || target?.sticky) { setDragCol(null); return; }
    const newOrder = [...colOrder];
    const fromIdx = newOrder.indexOf(dragCol);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragCol);
    setColOrder(newOrder);
    setDragCol(null);
  };

  const resetLayout = () => {
    setColOrder(ALL_COLUMNS.map(c => c.id));
    setHiddenCols(new Set());
  };

  const toggleColVisibility = (colId: string) => {
    const next = new Set(hiddenCols);
    next.has(colId) ? next.delete(colId) : next.add(colId);
    setHiddenCols(next);
  };

  // Embedded audio summary
  const embAudioIsos = rows.filter(r => r.embAudioMode !== "none");

  // Current drawer row
  const activeDrawerRow = drawerRow ? rows.find(r => r.id === drawerRow) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">ISO Routing</h2>

      {/* ═══ EMBEDDED AUDIO SUMMARY ═══ */}
      {embAudioIsos.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
          <Music className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-foreground">
            Embedded Audio ISOs: {embAudioIsos.map(r => `ISO ${r.isoNumber}`).join(", ")}
          </span>
        </div>
      )}

      {/* ═══ STICKY TOP BAR — ISO CONTROLS ═══ */}
      <div className="steel-panel p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* ISO count selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">ISOs</span>
            {ISO_PRESETS.map(n => (
              <button key={n} onClick={() => !readOnly && setIsoCount(n)}
                className={cn("px-2 py-1 text-xs rounded-sm border transition-colors font-mono",
                  rows.length === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  readOnly && "pointer-events-none opacity-60")}>
                {n}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground font-mono ml-1">{rows.length}</span>
          </div>

          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={addRow} className="text-[10px] tracking-wider uppercase gap-1">
                <Plus className="w-3 h-3" /> Add ISO
              </Button>
              <Button variant="outline" size="sm" onClick={resetToDefault} className="text-[10px] tracking-wider uppercase gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column visibility menu */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowColMenu(!showColMenu)}
              className="text-[10px] tracking-wider uppercase gap-1">
              <Layers className="w-3 h-3" /> Columns <ChevronDown className="w-3 h-3" />
            </Button>
            {showColMenu && (
              <div className="absolute right-0 mt-1 z-50 bg-card border border-border rounded-sm shadow-lg p-2 min-w-[180px]">
                {ALL_COLUMNS.filter(c => c.hideable !== false).map(col => (
                  <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary/50 rounded-sm cursor-pointer">
                    <Checkbox checked={!hiddenCols.has(col.id)} onCheckedChange={() => toggleColVisibility(col.id)} />
                    <span className="text-xs text-foreground">{col.label}</span>
                  </label>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={resetLayout}
                    className="w-full text-left px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <RotateCcw className="w-3 h-3 inline mr-1" /> Reset Layout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BULK ACTIONS BAR ═══ */}
      {selected.size > 0 && !readOnly && (
        <div className="steel-panel p-3 mb-3 flex items-center gap-3 border-primary/30">
          <span className="text-[10px] font-mono text-primary">{selected.size} selected</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
            className="bg-secondary text-[10px] px-2 py-1 rounded-sm border border-border text-foreground">
            <option value="">Action…</option>
            <option value="setDest">Set Destination</option>
            <option value="setFormat">Set Format</option>
            <option value="addPrefix">Add Alias Prefix</option>
            <option value="clear">Clear Fields</option>
          </select>
          {bulkAction === "setDest" && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-secondary text-[10px] px-2 py-1 rounded-sm border border-border text-foreground">
              {DESTINATION_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {bulkAction === "setFormat" && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-secondary text-[10px] px-2 py-1 rounded-sm border border-border text-foreground">
              {VIDEO_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {bulkAction === "addPrefix" && (
            <input type="text" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Prefix…" className="bg-secondary text-[10px] px-2 py-1 rounded-sm border border-border text-foreground w-24" />
          )}
          {bulkAction && bulkAction !== "clear" && (
            <Button variant="outline" size="sm" onClick={applyBulk} className="text-[10px]">Apply</Button>
          )}
          {bulkAction === "clear" && (
            <Button variant="outline" size="sm" onClick={applyBulk} className="text-[10px]">Clear Selected</Button>
          )}
          <Button variant="outline" size="sm" onClick={duplicateSelected} className="text-[10px] gap-1">
            <Copy className="w-3 h-3" /> Duplicate
          </Button>
          <button onClick={() => setSelected(new Set())} className="text-[10px] text-muted-foreground hover:text-foreground ml-auto">
            Clear Selection
          </button>
        </div>
      )}

      {/* ═══ ISO ROUTING TABLE ═══ */}
      <div className="steel-panel overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              {visibleCols.map(col => (
                <th key={col.id}
                  draggable={!col.sticky}
                  onDragStart={() => handleDragStart(col.id)}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={() => handleDrop(col.id)}
                  className={cn(
                    "px-3 py-2.5 text-left text-[10px] tracking-wider uppercase font-medium text-muted-foreground",
                    col.width,
                    col.sticky && "sticky left-0 z-20 bg-card",
                    !col.sticky && "cursor-grab",
                    dragCol === col.id && "opacity-50"
                  )}>
                  <div className="flex items-center gap-1">
                    {!col.sticky && col.id !== "actions" && <GripVertical className="w-3 h-3 text-muted-foreground/40" />}
                    {col.id === "select" ? (
                      <Checkbox checked={selected.size === rows.length && rows.length > 0} onCheckedChange={selectAll} disabled={readOnly} />
                    ) : (
                      col.label
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}
                className={cn(
                  "border-b border-border transition-colors hover:bg-secondary/50",
                  selected.has(row.id) && "bg-primary/5"
                )}>
                {visibleCols.map(col => (
                  <td key={col.id}
                    className={cn(
                      "px-3 py-1.5",
                      col.width,
                      col.sticky && "sticky left-0 z-10 bg-card",
                      col.id === "iso" && "sticky left-10 z-10 bg-card"
                    )}>
                    {renderCell(col.id, row, {
                      readOnly,
                      selected,
                      toggleSelect,
                      updateRow,
                      removeRow,
                      duplicateRow,
                      clearRow,
                      aliases,
                      setDrawerRow,
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ AUDIO DRAWER ═══ */}
      {activeDrawerRow && (
        <IsoAudioDrawer
          row={activeDrawerRow}
          onChange={(updated) => updateRow(updated.id, updated)}
          onClose={() => setDrawerRow(null)}
          readOnly={readOnly}
        />
      )}
    </motion.section>
  );
}

// ─── Cell renderers ──────────────────────────────────────────────────
interface CellContext {
  readOnly?: boolean;
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  updateRow: (id: string, patch: Partial<IsoRoutingRow>) => void;
  removeRow: (id: string) => void;
  duplicateRow: (id: string) => void;
  clearRow: (id: string) => void;
  aliases: string[];
  setDrawerRow: (id: string | null) => void;
}

function renderCell(colId: string, row: IsoRoutingRow, ctx: CellContext): React.ReactNode {
  switch (colId) {
    case "select":
      return <Checkbox checked={ctx.selected.has(row.id)} onCheckedChange={() => ctx.toggleSelect(row.id)} disabled={ctx.readOnly} />;
    case "iso":
      return <span className="font-mono text-xs text-primary font-semibold">{row.isoNumber}</span>;
    case "alias":
      return (
        <div className="flex items-center gap-1">
          <select value={ctx.aliases.includes(row.productionAlias) ? row.productionAlias : "__custom__"}
            onChange={(e) => {
              if (e.target.value === "__custom__") return;
              ctx.updateRow(row.id, { productionAlias: e.target.value });
            }}
            disabled={ctx.readOnly}
            className="bg-transparent text-sm px-0 py-0.5 border-0 focus:outline-none text-foreground cursor-pointer w-auto max-w-[60%] truncate">
            {ctx.aliases.map(a => <option key={a} value={a}>{a}</option>)}
            <option value="__custom__">Custom…</option>
          </select>
          {(!ctx.aliases.includes(row.productionAlias) || true) && (
            <InlineInput
              value={row.productionAlias}
              onChange={(v) => ctx.updateRow(row.id, { productionAlias: v })}
              disabled={ctx.readOnly}
              placeholder="Alias"
            />
          )}
        </div>
      );
    case "sourceType":
      return <InlineSelect value={row.sourceType} options={SOURCE_TYPES} onChange={(v) => ctx.updateRow(row.id, { sourceType: v })} disabled={ctx.readOnly} />;
    case "sourceSignal":
      return <InlineInput value={row.sourceSignal} onChange={(v) => ctx.updateRow(row.id, { sourceSignal: v })} disabled={ctx.readOnly} placeholder="Signal" />;
    case "destType":
      return <InlineSelect value={row.destinationType} options={DESTINATION_TYPES} onChange={(v) => ctx.updateRow(row.id, { destinationType: v })} disabled={ctx.readOnly} />;
    case "destPath":
      return <InlineInput value={row.destinationPath} onChange={(v) => ctx.updateRow(row.id, { destinationPath: v })} disabled={ctx.readOnly} placeholder="Path" mono />;
    case "embAudio":
      return (
        <div className="flex items-center gap-1">
          <select value={row.embAudioMode}
            onChange={(e) => ctx.updateRow(row.id, { embAudioMode: e.target.value as EmbAudioMode })}
            disabled={ctx.readOnly}
            className="bg-transparent text-[11px] font-mono px-0.5 py-0.5 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none text-muted-foreground transition-colors cursor-pointer">
            {EMB_AUDIO_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {row.embAudioMode !== "none" && (
            <button onClick={() => ctx.setDrawerRow(row.id)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              <Music className="w-2.5 h-2.5" />
              {row.embAudioChannelCount}ch
            </button>
          )}
        </div>
      );
    case "format":
      return <InlineSelect value={row.format} options={VIDEO_FORMATS} onChange={(v) => ctx.updateRow(row.id, { format: v })} disabled={ctx.readOnly} />;
    case "transport":
      return <InlineSelect value={row.transport} options={["SRT", "MPEG-TS", "Fiber", "RIST", "Other"]} onChange={(v) => ctx.updateRow(row.id, { transport: v })} disabled={ctx.readOnly} />;
    case "notes":
      return <InlineInput value={row.notes} onChange={(v) => ctx.updateRow(row.id, { notes: v })} disabled={ctx.readOnly} placeholder="—" />;
    case "actions":
      if (ctx.readOnly) return null;
      return (
        <div className="flex items-center gap-1">
          <button onClick={() => ctx.setDrawerRow(row.id)} title="Edit details"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => ctx.duplicateRow(row.id)} title="Duplicate"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={() => ctx.clearRow(row.id)} title="Clear"
            className="text-muted-foreground hover:text-primary transition-colors p-0.5">
            <Eraser className="w-3 h-3" />
          </button>
        </div>
      );
    default:
      return null;
  }
}
