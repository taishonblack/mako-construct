import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Radio, Mic, Phone, Plus, Trash2, AlertTriangle } from "lucide-react";
import type { CommEntry } from "@/data/mock-phase5";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const typeIcon: Record<CommEntry["type"], typeof Radio> = {
  "Clear-Com": Phone,
  LQ: Radio,
  "Hot Mic": Mic,
};

const typeStyle: Record<CommEntry["type"], string> = {
  "Clear-Com": "bg-secondary text-muted-foreground",
  LQ: "bg-crimson/15 text-crimson",
  "Hot Mic": "bg-amber-900/30 text-amber-400",
};

const COMM_TYPES: CommEntry["type"][] = ["Clear-Com", "LQ", "Hot Mic"];

const LOCATIONS = ["Truck", "Arena", "Studio", "Transmission", "Remote", "Other"];

interface Props {
  comms: CommEntry[];
  onUpdateComm?: (id: string, field: keyof CommEntry, value: string) => void;
  onAddComm?: (type: CommEntry["type"]) => void;
  onRemoveComm?: (id: string) => void;
  readOnly?: boolean;
}

export function CommsStructure({ comms, onUpdateComm, onAddComm, onRemoveComm, readOnly }: Props) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = useCallback((id: string, field: string, currentValue: string) => {
    if (readOnly) return;
    setEditingCell(`${id}-${field}`);
    setEditValue(currentValue);
  }, [readOnly]);

  const commitEdit = useCallback((id: string, field: keyof CommEntry) => {
    if (onUpdateComm && editValue.trim()) {
      onUpdateComm(id, field, editValue.trim());
    }
    setEditingCell(null);
  }, [onUpdateComm, editValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string, field: keyof CommEntry) => {
    if (e.key === "Enter") commitEdit(id, field);
    if (e.key === "Escape") setEditingCell(null);
  }, [commitEdit]);

  // Comms readiness summary
  const clearComCount = comms.filter(c => c.type === "Clear-Com").length;
  const lqCount = comms.filter(c => c.type === "LQ").length;
  const hotMicCount = comms.filter(c => c.type === "Hot Mic").length;
  const unassigned = comms.filter(c => !c.assignment.trim()).length;
  const total = comms.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Comms Structure</h2>

      {/* Capacity Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="steel-panel px-4 py-3">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Total Channels</div>
          <div className="text-lg font-mono text-foreground">{total}</div>
        </div>
        <div className="steel-panel px-4 py-3">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Clear-Com</div>
          <div className="text-lg font-mono text-foreground">{clearComCount}</div>
        </div>
        <div className="steel-panel px-4 py-3">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1">LQ / Hot Mic</div>
          <div className="text-lg font-mono text-foreground">{lqCount} / {hotMicCount}</div>
        </div>
        <div className="steel-panel px-4 py-3">
          <div className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Unassigned</div>
          <div className={`text-lg font-mono ${unassigned > 0 ? "text-crimson" : "text-emerald-400"}`}>
            {unassigned}
          </div>
        </div>
      </div>

      {/* Grouped tables by type */}
      {COMM_TYPES.map((type) => {
        const entries = comms.filter((c) => c.type === type);
        const Icon = typeIcon[type];
        return (
          <div key={type} className="steel-panel overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded ${typeStyle[type]}`}>
                  <Icon className="w-3 h-3" />
                  {type}
                </span>
                <span className="text-[10px] text-muted-foreground">{entries.length} channel{entries.length !== 1 ? "s" : ""}</span>
              </div>
              {!readOnly && onAddComm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-crimson"
                  onClick={() => onAddComm(type)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
            {entries.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                No {type} channels configured
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] tracking-wider uppercase w-24">Channel</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase">Assignment</TableHead>
                    <TableHead className="text-[10px] tracking-wider uppercase w-32">Location</TableHead>
                    {!readOnly && <TableHead className="text-[10px] tracking-wider uppercase w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="border-border hover:bg-secondary/50 group">
                      {/* Channel */}
                      <TableCell className="p-0">
                        {editingCell === `${entry.id}-channel` ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(entry.id, "channel")}
                            onKeyDown={(e) => handleKeyDown(e, entry.id, "channel")}
                            className="h-8 font-mono text-xs border-crimson/50 bg-background rounded-none"
                          />
                        ) : (
                          <button
                            className="w-full text-left px-4 py-2 font-mono text-xs text-crimson hover:bg-secondary/30 cursor-text"
                            onClick={() => startEdit(entry.id, "channel", entry.channel)}
                            disabled={readOnly}
                          >
                            {entry.channel || <span className="text-muted-foreground italic">—</span>}
                          </button>
                        )}
                      </TableCell>

                      {/* Assignment */}
                      <TableCell className="p-0">
                        {editingCell === `${entry.id}-assignment` ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(entry.id, "assignment")}
                            onKeyDown={(e) => handleKeyDown(e, entry.id, "assignment")}
                            className="h-8 text-sm border-crimson/50 bg-background rounded-none"
                          />
                        ) : (
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/30 cursor-text"
                            onClick={() => startEdit(entry.id, "assignment", entry.assignment)}
                            disabled={readOnly}
                          >
                            {entry.assignment || (
                              <span className="text-amber-400/80 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Unassigned
                              </span>
                            )}
                          </button>
                        )}
                      </TableCell>

                      {/* Location dropdown */}
                      <TableCell className="p-0">
                        {readOnly ? (
                          <span className="px-4 py-2 text-xs text-muted-foreground">{entry.location}</span>
                        ) : (
                          <Select
                            value={entry.location}
                            onValueChange={(v) => onUpdateComm?.(entry.id, "location", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 bg-transparent rounded-none focus:ring-0 focus:ring-offset-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATIONS.map((loc) => (
                                <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      {/* Delete */}
                      {!readOnly && (
                        <TableCell className="p-0">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-crimson opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-crimson" />
                                  Remove Channel
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove <strong>{entry.channel}</strong> ({entry.assignment || "unassigned"}) from comms structure? This action is logged.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-crimson hover:bg-crimson/80"
                                  onClick={() => onRemoveComm?.(entry.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}

      {readOnly && (
        <div className="text-[10px] tracking-wider uppercase text-amber-400/60 mt-2">
          Comms locked — unlock production to edit
        </div>
      )}
    </motion.section>
  );
}
