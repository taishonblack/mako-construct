import { Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface BitfirePort {
  port: string; // A, B, C, D
  direction: "TX" | "RX";
  label: string;
  notes: string;
}

export interface BitfireConfig {
  engineId: string;
  ports: BitfirePort[];
}

export const DEFAULT_BITFIRE_CONFIG: BitfireConfig = {
  engineId: "",
  ports: [
    { port: "A", direction: "TX", label: "", notes: "" },
    { port: "B", direction: "TX", label: "", notes: "" },
    { port: "C", direction: "RX", label: "", notes: "" },
    { port: "D", direction: "RX", label: "", notes: "" },
  ],
};

interface Props {
  config: BitfireConfig;
  onChange: (config: BitfireConfig) => void;
  readOnly: boolean;
}

export function BitfireSection({ config, onChange, readOnly }: Props) {
  const updatePort = (index: number, field: keyof BitfirePort, value: string) => {
    const updated = [...config.ports];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...config, ports: updated });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5" /> Bitfire
      </h2>

      <div className="steel-panel p-4 space-y-3">
        <div className="max-w-xs">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Engine ID #</label>
          {readOnly ? (
            <span className="text-sm text-foreground font-mono">{config.engineId || "—"}</span>
          ) : (
            <Input value={config.engineId} onChange={(e) => onChange({ ...config, engineId: e.target.value })}
              placeholder="e.g. BF-001" className="h-8 text-xs font-mono" />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-2 px-2 w-12">Port</th>
                <th className="text-left py-2 px-2 w-20">Direction</th>
                <th className="text-left py-2 px-2">Label</th>
                <th className="text-left py-2 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {config.ports.map((p, i) => (
                <tr key={p.port} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-mono font-medium text-foreground">{p.port}</td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${p.direction === "TX" ? "bg-emerald-900/30 text-emerald-400" : "bg-blue-900/30 text-blue-400"}`}>
                        {p.direction}
                      </span>
                    ) : (
                      <Select value={p.direction} onValueChange={(v) => updatePort(i, "direction", v)}>
                        <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TX">TX</SelectItem>
                          <SelectItem value="RX">RX</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-foreground">{p.label || "—"}</span>
                    ) : (
                      <Input value={p.label} onChange={(e) => updatePort(i, "label", e.target.value)}
                        className="h-7 text-xs" placeholder="Label…" />
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    {readOnly ? (
                      <span className="text-muted-foreground">{p.notes || "—"}</span>
                    ) : (
                      <Input value={p.notes} onChange={(e) => updatePort(i, "notes", e.target.value)}
                        className="h-7 text-xs" placeholder="Notes…" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
