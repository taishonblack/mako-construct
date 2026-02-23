import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface ProductionDefinitionProps {
  league: string;
  venue: string;
  partner: string;
  showType: string;
  eventDate: string;
  isoCount: number;
  onIsoCountChange: (count: number) => void;
  returnRequired: boolean;
  onReturnRequiredChange: (val: boolean) => void;
  commercials: string;
  onCommercialsChange: (val: string) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function ProductionDefinition({
  league, venue, partner, showType, eventDate,
  isoCount, onIsoCountChange,
  returnRequired, onReturnRequiredChange,
  commercials, onCommercialsChange,
}: ProductionDefinitionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Production Definition</h2>
      <div className="steel-panel p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <Field label="League" value={league} />
          <Field label="Partner" value={partner} />
          <Field label="Venue" value={venue} />
          <Field label="Show Type" value={showType} />
          <Field label="Event Date" value={new Date(eventDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} />

          {/* ISO Count — editable */}
          <div>
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">ISO Count</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onIsoCountChange(Math.max(1, isoCount - 1))}
                className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center text-sm font-mono text-foreground">{isoCount}</span>
              <button
                onClick={() => onIsoCountChange(Math.min(28, isoCount + 1))}
                className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Return Required — toggle */}
          <div>
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">Return Required</span>
            <button
              onClick={() => onReturnRequiredChange(!returnRequired)}
              className={`text-sm px-3 py-1 rounded border transition-colors ${
                returnRequired
                  ? "border-crimson/40 bg-crimson/10 text-crimson"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {returnRequired ? "Required" : "Not Required"}
            </button>
          </div>

          {/* Commercials */}
          <div>
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">Commercials</span>
            <select
              value={commercials}
              onChange={(e) => onCommercialsChange(e.target.value)}
              className="text-sm bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-crimson transition-colors"
            >
              <option value="local-insert">Local Insert</option>
              <option value="pass-through">Pass-through</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
