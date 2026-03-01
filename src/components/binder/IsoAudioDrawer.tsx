import { useState } from "react";
import { X, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Plus, Minus } from "lucide-react";
import type { IsoRoutingRow, AudioChannelMap } from "@/lib/iso-routing-types";
import { VIDEO_FORMATS, SOURCE_TYPES, DESTINATION_TYPES } from "@/lib/iso-routing-types";
import { cn } from "@/lib/utils";

interface Props {
  row: IsoRoutingRow;
  onChange: (row: IsoRoutingRow) => void;
  onClose: () => void;
  readOnly?: boolean;
}

const CHANNEL_COUNTS = [2, 4, 6, 8, 16];

const inputClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
const selectClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none";

export function IsoAudioDrawer({ row, onChange, onClose, readOnly }: Props) {
  const [tab, setTab] = useState("audio");

  const set = <K extends keyof IsoRoutingRow>(key: K, value: IsoRoutingRow[K]) => {
    onChange({ ...row, [key]: value });
  };

  const setChannel = (idx: number, patch: Partial<AudioChannelMap>) => {
    const channels = [...row.embAudioChannels];
    channels[idx] = { ...channels[idx], ...patch };
    set("embAudioChannels", channels);
  };

  const addChannel = () => {
    const next = row.embAudioChannels.length + 1;
    set("embAudioChannels", [...row.embAudioChannels, { channel: next, label: `Ch ${next}`, source: "", notes: "" }]);
  };

  const removeChannel = (idx: number) => {
    set("embAudioChannels", row.embAudioChannels.filter((_, i) => i !== idx));
  };

  // Ensure channels match count
  const ensureChannels = (count: number) => {
    const current = row.embAudioChannels;
    if (current.length < count) {
      const newChannels = [...current];
      for (let i = current.length; i < count; i++) {
        newChannels.push({ channel: i + 1, label: `Ch ${i + 1}`, source: "", notes: "" });
      }
      set("embAudioChannels", newChannels);
    }
    set("embAudioChannelCount", count);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 bg-background border-l border-border shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Music className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-medium text-foreground">ISO {row.isoNumber} — {row.productionAlias || "Untitled"}</h3>
              <p className="text-[10px] text-muted-foreground">Audio & Format Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-5 pt-2">
              <TabsTrigger value="signal" className="text-[10px] tracking-wider uppercase data-[state=active]:text-primary">Signal</TabsTrigger>
              <TabsTrigger value="audio" className="text-[10px] tracking-wider uppercase data-[state=active]:text-primary">Audio Payload</TabsTrigger>
              <TabsTrigger value="format" className="text-[10px] tracking-wider uppercase data-[state=active]:text-primary">Format</TabsTrigger>
              <TabsTrigger value="notes" className="text-[10px] tracking-wider uppercase data-[state=active]:text-primary">Notes</TabsTrigger>
            </TabsList>

            {/* SIGNAL TAB */}
            <TabsContent value="signal" className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Source Type</Label>
                  <select value={row.sourceType} onChange={(e) => set("sourceType", e.target.value)} disabled={readOnly} className={selectClass}>
                    {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Source Signal</Label>
                  <Input value={row.sourceSignal} onChange={(e) => set("sourceSignal", e.target.value)} disabled={readOnly} placeholder="e.g. Cam 3" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Destination Type</Label>
                  <select value={row.destinationType} onChange={(e) => set("destinationType", e.target.value)} disabled={readOnly} className={selectClass}>
                    {DESTINATION_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Destination Path</Label>
                  <Input value={row.destinationPath} onChange={(e) => set("destinationPath", e.target.value)} disabled={readOnly} placeholder="e.g. DEC-01 OUT-01" className="h-9 text-sm font-mono" />
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">TX Name</Label>
                  <Input value={row.txName} onChange={(e) => set("txName", e.target.value)} disabled={readOnly} placeholder="TX-…" className="h-9 text-sm font-mono" />
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">RX Name</Label>
                  <Input value={row.rxName} onChange={(e) => set("rxName", e.target.value)} disabled={readOnly} placeholder="RX-…" className="h-9 text-sm font-mono" />
                </div>
              </div>
            </TabsContent>

            {/* AUDIO PAYLOAD TAB */}
            <TabsContent value="audio" className="px-5 py-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Audio Mode</Label>
                  <p className="text-xs text-muted-foreground mb-1">Embedded on ISO</p>
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Channel Count</Label>
                  <div className="flex gap-1.5 mt-1">
                    {CHANNEL_COUNTS.map(c => (
                      <button key={c} onClick={() => !readOnly && ensureChannels(c)}
                        className={cn("px-3 py-1.5 text-sm rounded-sm border transition-colors font-mono",
                          row.embAudioChannelCount === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel mapping table */}
                <div>
                  <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2 block">Channel Mapping</Label>
                  <div className="steel-panel overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-[10px] tracking-wider uppercase w-16">Ch #</TableHead>
                          <TableHead className="text-[10px] tracking-wider uppercase">Label</TableHead>
                          <TableHead className="text-[10px] tracking-wider uppercase">Source</TableHead>
                          <TableHead className="text-[10px] tracking-wider uppercase">Notes</TableHead>
                          {!readOnly && <TableHead className="w-10" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {row.embAudioChannels.map((ch, idx) => (
                          <TableRow key={idx} className="border-border hover:bg-secondary/50">
                            <TableCell className="font-mono text-xs text-primary">{ch.channel}</TableCell>
                            <TableCell className="p-1">
                              <Input value={ch.label} onChange={(e) => setChannel(idx, { label: e.target.value })}
                                disabled={readOnly} className="h-7 text-xs border-0 bg-transparent" placeholder="Label" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input value={ch.source} onChange={(e) => setChannel(idx, { source: e.target.value })}
                                disabled={readOnly} className="h-7 text-xs border-0 bg-transparent" placeholder="Source" />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input value={ch.notes} onChange={(e) => setChannel(idx, { notes: e.target.value })}
                                disabled={readOnly} className="h-7 text-xs border-0 bg-transparent" placeholder="—" />
                            </TableCell>
                            {!readOnly && (
                              <TableCell className="p-1">
                                <button onClick={() => removeChannel(idx)} className="text-muted-foreground hover:text-destructive">
                                  <Minus className="w-3 h-3" />
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {!readOnly && (
                    <button onClick={addChannel}
                      className="flex items-center gap-1 mt-2 text-[10px] tracking-wider uppercase text-primary hover:text-foreground transition-colors">
                      <Plus className="w-3 h-3" /> Add Channel
                    </button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* FORMAT TAB */}
            <TabsContent value="format" className="px-5 py-4 space-y-4">
              <div>
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Video Format</Label>
                <select value={row.format} onChange={(e) => set("format", e.target.value)} disabled={readOnly} className={selectClass}>
                  {VIDEO_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Transport Protocol</Label>
                <select value={row.transport} onChange={(e) => set("transport", e.target.value)} disabled={readOnly} className={selectClass}>
                  <option value="SRT">SRT</option>
                  <option value="MPEG-TS">MPEG-TS</option>
                  <option value="Fiber">Fiber</option>
                  <option value="RIST">RIST</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="px-5 py-4 space-y-4">
              <div>
                <Label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Notes</Label>
                <Textarea value={row.notes} onChange={(e) => set("notes", e.target.value)}
                  disabled={readOnly} placeholder="Signal-specific notes…" className="min-h-[120px] text-sm resize-y" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
