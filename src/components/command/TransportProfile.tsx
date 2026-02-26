import { motion } from "framer-motion";
import { Shield, ShieldOff, AlertTriangle } from "lucide-react";
import type { TransportConfig } from "@/lib/binder-types";

function Field({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div>
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">{label}</span>
      <span className="text-sm text-foreground font-mono">{String(value)}</span>
    </div>
  );
}

interface TransportProfileProps {
  config: TransportConfig;
  returnRequired: boolean;
}

export function TransportProfile({ config, returnRequired }: TransportProfileProps) {
  const returnMismatch = returnRequired && !config.returnFeed;
  const noBackup = !config.backup.protocol || !config.backup.destination;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Transport Profile</h2>

      <div className="space-y-3">
        {/* Warnings */}
        {(returnMismatch || noBackup) && (
          <div className="steel-panel border-glow-red p-3 flex flex-col gap-1.5">
            {noBackup && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                No backup transport defined
              </div>
            )}
            {returnMismatch && (
              <div className="flex items-center gap-2 text-xs text-crimson">
                <AlertTriangle className="w-3.5 h-3.5" />
                Return feed required but not configured
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Primary */}
          <div className="steel-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
              <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">Primary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Protocol" value={config.primary.protocol} />
              <Field label="Destination" value={config.primary.destination} />
              <Field label="Port" value={config.primary.port} />
              <Field label="Latency" value={config.primary.latency} />
              <div className="flex items-center gap-2 col-span-2">
                {config.primary.encryption ? <Shield className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm text-foreground">{config.primary.encryption ? "Encrypted" : "Unencrypted"}</span>
              </div>
            </div>
          </div>

          {/* Backup */}
          <div className="steel-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <h3 className="text-[10px] tracking-wider uppercase text-muted-foreground">Backup</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Protocol" value={config.backup.protocol} />
              <Field label="Destination" value={config.backup.destination} />
              <Field label="Port" value={config.backup.port} />
              <Field label="Latency" value={config.backup.latency} />
              <div className="flex items-center gap-2 col-span-2">
                {config.backup.encryption ? <Shield className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm text-foreground">{config.backup.encryption ? "Encrypted" : "Unencrypted"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Return + Commercials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="steel-panel p-4">
            <Field label="Return Feed" value={config.returnFeed ? "Active" : "Off"} />
          </div>
          <div className="steel-panel p-4">
            <Field label="Commercials" value={config.commercials.replace("-", " ")} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
