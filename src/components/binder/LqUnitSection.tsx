import { useState } from "react";
import { AlertTriangle, Network, Headphones, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface LqAudioPort {
  port: string; // E, F, G, H
  alias: string;
  position: string;
  notes: string;
}

export interface LqConfig {
  switchPort: string;
  vlan: string;
  ipAddress: string;
  audioPorts: LqAudioPort[];
}

export const DEFAULT_LQ_CONFIG: LqConfig = {
  switchPort: "",
  vlan: "",
  ipAddress: "",
  audioPorts: [
    { port: "E", alias: "Truck AD", position: "Truck", notes: "" },
    { port: "F", alias: "Truck Production", position: "Truck", notes: "" },
    { port: "G", alias: "Cam Ops", position: "Arena", notes: "" },
    { port: "H", alias: "TBD", position: "TBD", notes: "" },
  ],
};

const POSITIONS = ["Truck", "Arena", "Control Room", "Studio", "Remote Hub", "TBD"];

interface Props {
  config: LqConfig;
  onChange: (config: LqConfig) => void;
  readOnly: boolean;
  globalPositions?: string[];
  onAddPosition?: (pos: string) => void;
}

export function LqUnitSection({ config, onChange, readOnly, globalPositions = [], onAddPosition }: Props) {
  const [customPos, setCustomPos] = useState("");
  const allPositions = [...new Set([...POSITIONS, ...globalPositions])];

  const updateField = (field: keyof LqConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const updatePort = (index: number, field: keyof LqAudioPort, value: string) => {
    const updated = [...config.audioPorts];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...config, audioPorts: updated });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
        <Headphones className="w-3.5 h-3.5" /> LQ Unit
      </h2>

      {/* Network Block */}
      <div className="steel-panel p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-foreground">Network</span>
        </div>

        <div className="text-[10px] text-muted-foreground border border-border rounded px-3 py-2 bg-secondary/30 flex items-center gap-2">
          <span className="font-mono text-foreground">LQ Network Port:</span>
          <span>1× RJ45</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Connected Switch Port</label>
            {readOnly ? (
              <span className="text-sm text-foreground font-mono">{config.switchPort || "—"}</span>
            ) : (
              <Input value={config.switchPort} onChange={(e) => updateField("switchPort", e.target.value)}
                placeholder="e.g. Gi1/0/24" className="h-8 text-xs font-mono" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">VLAN</label>
            {readOnly ? (
              <span className="text-sm text-foreground font-mono">{config.vlan || "—"}</span>
            ) : (
              <Input value={config.vlan} onChange={(e) => updateField("vlan", e.target.value)}
                placeholder="e.g. 100" className="h-8 text-xs font-mono" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">IP Address</label>
            {readOnly ? (
              <span className="text-sm text-foreground font-mono">{config.ipAddress || "—"}</span>
            ) : (
              <Input value={config.ipAddress} onChange={(e) => updateField("ipAddress", e.target.value)}
                placeholder="e.g. 10.0.1.50" className="h-8 text-xs font-mono" />
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded px-3 py-2 text-[10px] bg-amber-900/10 border border-amber-700/30 text-amber-400">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>LQ has only <strong>ONE</strong> network port. Audio Ports E–H are baseband audio and do <strong>NOT</strong> connect to the network.</span>
        </div>

        {!config.switchPort && (
          <div className="flex items-center gap-2 rounded px-3 py-1.5 text-[10px] bg-amber-900/20 border border-amber-700/40 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            LQ network port not assigned.
          </div>
        )}
      </div>

      {/* Audio Ports Block */}
      <div className="steel-panel p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-foreground">Audio Ports (Baseband)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-2 px-2 w-12">Port</th>
                <th className="text-left py-2 px-2">Alias</th>
                <th className="text-left py-2 px-2">Position</th>
                <th className="text-left py-2 px-2">Notes</th>
                {!readOnly && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {config.audioPorts.map((ap, i) => (
                <tr key={ap.port + i} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-mono font-medium text-foreground">{ap.port}</td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{ap.alias || "—"}</span>
                    ) : (
                      <Input value={ap.alias} onChange={(e) => updatePort(i, "alias", e.target.value)}
                        className="h-7 text-xs" placeholder="Alias…" />
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{ap.position || "—"}</span>
                    ) : (
                      <Select value={ap.position} onValueChange={(v) => updatePort(i, "position", v)}>
                        <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allPositions.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                          <SelectItem value="__custom">+ Custom…</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-muted-foreground">{ap.notes || "—"}</span>
                    ) : (
                      <Input value={ap.notes} onChange={(e) => updatePort(i, "notes", e.target.value)}
                        className="h-7 text-xs" placeholder="Notes…" />
                    )}
                  </td>
                  {!readOnly && (
                    <td className="py-1.5 px-1">
                      {i >= 4 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => onChange({ ...config, audioPorts: config.audioPorts.filter((_, j) => j !== i) })}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
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
