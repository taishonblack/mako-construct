import { useState } from "react";
import { AlertTriangle, HardDrive, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface EncoderConfig {
  brand: string;
  model: string;
  sdiInputs: number;
  sdiOutputs: number;
  notes: string;
}

export interface DecoderEntry {
  id: string;
  brand: string;
  model: string;
  sdiOutputs: number;
  role: string;
  location: string;
  notes: string;
}

export interface HardwarePoolConfig {
  encoder: EncoderConfig;
  decoders: DecoderEntry[];
}

export const DEFAULT_HARDWARE_POOL: HardwarePoolConfig = {
  encoder: { brand: "VideoON", model: "", sdiInputs: 12, sdiOutputs: 0, notes: "" },
  decoders: [
    { id: "dec-1", brand: "Sencore", model: "", sdiOutputs: 4, role: "Program", location: "Truck", notes: "" },
  ],
};

const ENCODER_BRANDS = ["VideoON", "Haivision", "Other"];
const DECODER_BRANDS = ["Sencore", "Matrox", "Haivision", "Other"];
const DECODER_ROLES = ["Program", "Multiview", "ISO Return", "Talent", "ENG"];
const DECODER_LOCATIONS = ["Truck", "Arena", "Remote Hub"];

interface Props {
  config: HardwarePoolConfig;
  onChange: (config: HardwarePoolConfig) => void;
  readOnly: boolean;
  isoRoutedToDecoders?: number; // number of ISOs routed to decoder outputs
}

export function HardwarePoolSection({ config, onChange, readOnly, isoRoutedToDecoders = 0 }: Props) {
  const totalDecoderOutputs = config.decoders.reduce((sum, d) => sum + d.sdiOutputs, 0);
  const capacityExceeded = isoRoutedToDecoders > totalDecoderOutputs && totalDecoderOutputs > 0;

  const updateEncoder = (field: keyof EncoderConfig, value: string | number) => {
    onChange({ ...config, encoder: { ...config.encoder, [field]: value } });
  };

  const updateDecoder = (index: number, field: keyof DecoderEntry, value: string | number) => {
    const updated = [...config.decoders];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...config, decoders: updated });
  };

  const addDecoder = () => {
    onChange({
      ...config,
      decoders: [...config.decoders, {
        id: `dec-${Date.now()}`,
        brand: "Sencore",
        model: "",
        sdiOutputs: 4,
        role: "Program",
        location: "Truck",
        notes: "",
      }],
    });
  };

  const removeDecoder = (index: number) => {
    onChange({ ...config, decoders: config.decoders.filter((_, i) => i !== index) });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
        <HardDrive className="w-3.5 h-3.5" /> Hardware
      </h2>

      {/* Encoder */}
      <div className="steel-panel p-4 space-y-3">
        <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-foreground">Encoder</span>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Brand</label>
            {readOnly ? (
              <span className="text-sm text-foreground">{config.encoder.brand}</span>
            ) : (
              <Select value={config.encoder.brand} onValueChange={(v) => updateEncoder("brand", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENCODER_BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Model</label>
            {readOnly ? (
              <span className="text-sm text-foreground">{config.encoder.model || "—"}</span>
            ) : (
              <Input value={config.encoder.model} onChange={(e) => updateEncoder("model", e.target.value)}
                className="h-8 text-xs" placeholder="Model…" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">SDI Inputs</label>
            {readOnly ? (
              <span className="text-sm text-foreground font-mono">{config.encoder.sdiInputs}</span>
            ) : (
              <Input type="number" value={config.encoder.sdiInputs}
                onChange={(e) => updateEncoder("sdiInputs", parseInt(e.target.value) || 0)}
                className="h-8 text-xs font-mono" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">SDI Outputs</label>
            {readOnly ? (
              <span className="text-sm text-foreground font-mono">{config.encoder.sdiOutputs}</span>
            ) : (
              <Input type="number" value={config.encoder.sdiOutputs}
                onChange={(e) => updateEncoder("sdiOutputs", parseInt(e.target.value) || 0)}
                className="h-8 text-xs font-mono" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Notes</label>
            {readOnly ? (
              <span className="text-sm text-muted-foreground">{config.encoder.notes || "—"}</span>
            ) : (
              <Input value={config.encoder.notes} onChange={(e) => updateEncoder("notes", e.target.value)}
                className="h-8 text-xs" placeholder="Notes…" />
            )}
          </div>
        </div>
      </div>

      {/* Decoder Pool */}
      <div className="steel-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-foreground">Decoder Pool</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">
              {totalDecoderOutputs} SDI out total
            </span>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addDecoder} className="h-7 text-[10px] gap-1">
                <Plus className="w-3 h-3" /> Add Decoder
              </Button>
            )}
          </div>
        </div>

        {capacityExceeded && (
          <div className="flex items-center gap-2 rounded px-3 py-2 text-[10px] bg-amber-900/20 border border-amber-700/40 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Decoder capacity exceeded: {isoRoutedToDecoders} routed, {totalDecoderOutputs} available.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-2 px-2">Brand</th>
                <th className="text-left py-2 px-2">Model</th>
                <th className="text-left py-2 px-2 w-20">SDI Out</th>
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-left py-2 px-2">Location</th>
                <th className="text-left py-2 px-2">Notes</th>
                {!readOnly && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {config.decoders.map((d, i) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{d.brand}</span>
                    ) : (
                      <Select value={d.brand} onValueChange={(v) => updateDecoder(i, "brand", v)}>
                        <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DECODER_BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{d.model || "—"}</span>
                    ) : (
                      <Input value={d.model} onChange={(e) => updateDecoder(i, "model", e.target.value)}
                        className="h-7 text-xs" placeholder="Model…" />
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground font-mono">{d.sdiOutputs}</span>
                    ) : (
                      <Input type="number" value={d.sdiOutputs}
                        onChange={(e) => updateDecoder(i, "sdiOutputs", parseInt(e.target.value) || 0)}
                        className="h-7 text-xs font-mono w-16" />
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{d.role}</span>
                    ) : (
                      <Select value={d.role} onValueChange={(v) => updateDecoder(i, "role", v)}>
                        <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DECODER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{d.location}</span>
                    ) : (
                      <Select value={d.location} onValueChange={(v) => updateDecoder(i, "location", v)}>
                        <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DECODER_LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-muted-foreground">{d.notes || "—"}</span>
                    ) : (
                      <Input value={d.notes} onChange={(e) => updateDecoder(i, "notes", e.target.value)}
                        className="h-7 text-xs" placeholder="Notes…" />
                    )}
                  </td>
                  {!readOnly && (
                    <td className="py-1.5 px-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDecoder(i)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
