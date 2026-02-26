import { Shield, ShieldOff } from "lucide-react";
import type { TransportConfig } from "@/lib/binder-types";

function Field({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div>
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">{label}</span>
      <span className="text-sm text-foreground font-mono">{String(value)}</span>
    </div>
  );
}

export function TransportTab({ config }: { config: TransportConfig }) {
  return (
    <div className="mt-4 space-y-4">
      {/* Primary */}
      <div className="steel-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
          <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">Primary Transport</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Field label="Protocol" value={config.primary.protocol} />
          <Field label="Destination" value={config.primary.destination} />
          <Field label="Port" value={config.primary.port} />
          <Field label="Latency" value={config.primary.latency} />
          <div className="flex items-center gap-2">
            {config.primary.encryption ? (
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">{config.primary.encryption ? "Encrypted" : "Unencrypted"}</span>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="steel-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">Backup Transport</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Field label="Protocol" value={config.backup.protocol} />
          <Field label="Destination" value={config.backup.destination} />
          <Field label="Port" value={config.backup.port} />
          <Field label="Latency" value={config.backup.latency} />
          <div className="flex items-center gap-2">
            {config.backup.encryption ? (
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">{config.backup.encryption ? "Encrypted" : "Unencrypted"}</span>
          </div>
        </div>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="steel-panel p-4">
          <Field label="Return Feed" value={config.returnFeed ? "Active" : "Off"} />
        </div>
        <div className="steel-panel p-4">
          <Field label="Commercials" value={config.commercials.replace("-", " ")} />
        </div>
        <div className="steel-panel p-4">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">Notes</span>
          <p className="text-xs text-muted-foreground leading-relaxed">{config.notes}</p>
        </div>
      </div>
    </div>
  );
}
