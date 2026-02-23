import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BinderStatus } from "@/stores/binder-store";

const LEAGUES = ["NBA", "NFL", "NHL", "MLS", "NCAA", "Other"];
const SHOW_TYPES = ["Standard", "Alt Language", "Animated", "Remote Call", "Studio Alt", "Other"];
const PARTNERS = ["ESPN", "WBD", "RSN", "SportsNet", "HBO Max", "Apple TV", "FOX Sports", "TNT Sports", "ABC", "Other"];
const STATUSES: BinderStatus[] = ["draft", "active", "completed", "archived"];
const ISO_PRESETS = [8, 12, 16, 18, 24];
const TRANSPORTS = ["SRT", "MPEG-TS", "Fiber", "RIST", "Other"];
const COMMERCIALS = ["local-insert", "pass-through", "none"];

// --- Templates ---
interface Template {
  name: string;
  description: string;
  defaults: Partial<BinderFormData>;
}

const TEMPLATES: Template[] = [
  {
    name: "Standard Game",
    description: "Full live game production — 18 ISOs, SRT primary, return feed",
    defaults: {
      showType: "Standard",
      isoCount: 18,
      returnRequired: true,
      commercials: "local-insert",
      primaryTransport: "SRT",
      backupTransport: "MPEG-TS",
    },
  },
  {
    name: "Alt Language Studio",
    description: "Studio-based alt language feed — 8 ISOs, no return, pass-through",
    defaults: {
      showType: "Alt Language",
      isoCount: 8,
      returnRequired: false,
      commercials: "pass-through",
      primaryTransport: "SRT",
      backupTransport: "MPEG-TS",
    },
  },
  {
    name: "Remote Call (Bitfire)",
    description: "Remote call show — 12 ISOs, RIST transport, return required",
    defaults: {
      showType: "Remote Call",
      isoCount: 12,
      returnRequired: true,
      commercials: "none",
      primaryTransport: "RIST",
      backupTransport: "SRT",
    },
  },
  {
    name: "Animated (Beyond Sports)",
    description: "Animated/virtual production — 6 ISOs, fiber transport, no return",
    defaults: {
      showType: "Animated",
      isoCount: 6,
      returnRequired: false,
      commercials: "none",
      primaryTransport: "Fiber",
      backupTransport: "SRT",
    },
  },
];

export interface BinderFormData {
  title: string;
  league: string;
  containerId: string;
  eventDate: string;
  venue: string;
  showType: string;
  partner: string;
  status: BinderStatus;
  isoCount: number;
  returnRequired: boolean;
  commercials: string;
  primaryTransport: string;
  backupTransport: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BinderFormData) => void;
  onDelete?: () => void;
  initial?: Partial<BinderFormData>;
  mode: "create" | "edit";
  oldIsoCount?: number;
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors";
const selectClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground focus:outline-none focus:border-crimson transition-colors appearance-none";

export function BinderFormModal({ open, onClose, onSubmit, onDelete, initial, mode, oldIsoCount }: Props) {
  const defaultForm: BinderFormData = {
    title: "",
    league: "NBA",
    containerId: "",
    eventDate: new Date().toISOString().split("T")[0],
    venue: "",
    showType: "Standard",
    partner: "ESPN",
    status: "draft",
    isoCount: 12,
    returnRequired: false,
    commercials: "local-insert",
    primaryTransport: "SRT",
    backupTransport: "MPEG-TS",
    notes: "",
  };

  const [form, setForm] = useState<BinderFormData>(defaultForm);
  const [customIso, setCustomIso] = useState(false);
  const [otherPartner, setOtherPartner] = useState("");
  const [showIsoWarning, setShowIsoWarning] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      const merged = { ...defaultForm, ...initial };
      setForm(merged);
      setCustomIso(!ISO_PRESETS.includes(merged.isoCount));
      setShowIsoWarning(false);
      setDeleteConfirm(false);
      if (!PARTNERS.includes(merged.partner) || merged.partner === "Other") {
        setOtherPartner(merged.partner === "Other" ? "" : merged.partner);
      } else {
        setOtherPartner("");
      }
    }
  }, [open]);

  const set = <K extends keyof BinderFormData>(key: K, value: BinderFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (template: Template) => {
    setForm((prev) => ({ ...prev, ...template.defaults }));
    if (template.defaults.isoCount && !ISO_PRESETS.includes(template.defaults.isoCount)) {
      setCustomIso(true);
    } else {
      setCustomIso(false);
    }
    setTemplateOpen(false);
  };

  const handleIsoChange = (val: number) => {
    if (mode === "edit" && oldIsoCount && val < oldIsoCount) {
      setShowIsoWarning(true);
    } else {
      setShowIsoWarning(false);
    }
    set("isoCount", val);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.venue.trim()) return;
    const finalPartner = form.partner === "Other" ? otherPartner || "Other" : form.partner;
    onSubmit({ ...form, partner: finalPartner });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="steel-panel w-full max-w-2xl mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  {mode === "create" ? "Create Binder" : "Edit Binder"}
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {mode === "create" ? "Configure a new production binder" : "Update binder configuration"}
                </p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Template selector — create mode only */}
              {mode === "create" && (
                <div className="relative">
                  <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">
                    Template
                  </label>
                  <button
                    onClick={() => setTemplateOpen(!templateOpen)}
                    className={cn(inputClass, "text-left flex items-center justify-between")}
                  >
                    <span className="text-muted-foreground">Select a template to pre-fill…</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", templateOpen && "rotate-180")} />
                  </button>
                  {templateOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-[60] bg-card border border-border rounded-sm shadow-lg overflow-hidden">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => applyTemplate(t)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors border-b border-border last:border-0"
                        >
                          <span className="text-sm text-foreground font-medium block">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Required fields */}
              <div className="space-y-1">
                <span className="text-[9px] tracking-[0.2em] uppercase text-crimson font-medium">Required</span>
                <div className="h-px bg-crimson/20" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Event Title" required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. NBA Finals Game 3"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="League" required>
                  <select value={form.league} onChange={(e) => set("league", e.target.value)} className={selectClass}>
                    {LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </FormField>

                <FormField label="Event Date" required>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left")}>
                        {form.eventDate
                          ? format(new Date(form.eventDate + "T12:00:00"), "EEE, MMM d, yyyy")
                          : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[70]" align="start">
                      <Calendar
                        mode="single"
                        selected={form.eventDate ? new Date(form.eventDate + "T12:00:00") : undefined}
                        onSelect={(d) => {
                          if (d) {
                            set("eventDate", format(d, "yyyy-MM-dd"));
                            setDateOpen(false);
                          }
                        }}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </FormField>

                <FormField label="Venue" required>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => set("venue", e.target.value)}
                    placeholder="e.g. Chase Center, San Francisco"
                    className={inputClass}
                  />
                </FormField>
              </div>

              {/* Broadcast config */}
              <div className="space-y-1 pt-2">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-medium">Broadcast Configuration</span>
                <div className="h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Show Type">
                  <select value={form.showType} onChange={(e) => set("showType", e.target.value)} className={selectClass}>
                    {SHOW_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Partner">
                  <select value={PARTNERS.includes(form.partner) ? form.partner : "Other"} onChange={(e) => set("partner", e.target.value)} className={selectClass}>
                    {PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {(form.partner === "Other" || !PARTNERS.includes(form.partner)) && (
                    <input
                      type="text"
                      value={otherPartner}
                      onChange={(e) => setOtherPartner(e.target.value)}
                      placeholder="Enter partner name"
                      className={cn(inputClass, "mt-2")}
                    />
                  )}
                </FormField>

                <FormField label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value as BinderStatus)} className={selectClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </FormField>

                <FormField label="ISO Count">
                  {!customIso ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {ISO_PRESETS.map((n) => (
                        <button
                          key={n}
                          onClick={() => handleIsoChange(n)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-sm border transition-colors font-mono",
                            form.isoCount === n
                              ? "border-crimson bg-crimson/10 text-crimson"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => setCustomIso(true)}
                        className="px-3 py-1.5 text-sm rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                      >
                        Custom
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={28}
                        value={form.isoCount}
                        onChange={(e) => handleIsoChange(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                        className={cn(inputClass, "w-24 font-mono")}
                      />
                      <button
                        onClick={() => { setCustomIso(false); handleIsoChange(12); }}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Presets
                      </button>
                    </div>
                  )}
                  {showIsoWarning && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      Reducing ISO count will remove signal rows {form.isoCount + 1}–{oldIsoCount}
                    </div>
                  )}
                </FormField>

                <FormField label="Return Feed">
                  <button
                    onClick={() => set("returnRequired", !form.returnRequired)}
                    className={cn(
                      "text-sm px-3 py-2 rounded-sm border transition-colors",
                      form.returnRequired
                        ? "border-crimson/40 bg-crimson/10 text-crimson"
                        : "border-border bg-secondary text-muted-foreground"
                    )}
                  >
                    {form.returnRequired ? "Required" : "Not Required"}
                  </button>
                </FormField>

                <FormField label="Commercial Behavior">
                  <select value={form.commercials} onChange={(e) => set("commercials", e.target.value)} className={selectClass}>
                    {COMMERCIALS.map((c) => (
                      <option key={c} value={c}>
                        {c === "local-insert" ? "Local Insert" : c === "pass-through" ? "Pass-through" : "None"}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Transport */}
              <div className="space-y-1 pt-2">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-medium">Transport</span>
                <div className="h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Primary Transport">
                  <select value={form.primaryTransport} onChange={(e) => set("primaryTransport", e.target.value)} className={selectClass}>
                    {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Backup Transport">
                  <select value={form.backupTransport} onChange={(e) => set("backupTransport", e.target.value)} className={selectClass}>
                    {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Notes */}
              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Additional notes…"
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </FormField>

              {/* Delete section — edit mode only */}
              {mode === "edit" && onDelete && (
                <div className="pt-4 border-t border-border">
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete this binder
                    </button>
                  ) : (
                    <div className="steel-panel p-4 border-destructive/30">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Confirm Deletion</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-4">
                        This will permanently delete this binder, all signal configurations, assets, and checklist data. This action cannot be undone.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            onDelete();
                            onClose();
                          }}
                          className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90 transition-colors"
                        >
                          Delete Permanently
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim() || !form.venue.trim()}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mode === "create" ? "Create Binder" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
