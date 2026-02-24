import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Phone, Mail, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { staffStore, type StaffMember } from "@/stores/staff-store";

const TAGS = ["NHL", "Partner", "Vendor", "Truck", "Transmission"];

function StaffFormModal({ open, onClose, onSubmit, initial, mode }: {
  open: boolean; onClose: () => void; onSubmit: (data: Omit<StaffMember, "id">) => void;
  initial?: Partial<StaffMember>; mode: "create" | "edit";
}) {
  const [form, setForm] = useState<Omit<StaffMember, "id">>({
    name: initial?.name || "", org: initial?.org || "", role: initial?.role || "",
    phone: initial?.phone || "", email: initial?.email || "",
    notes: initial?.notes || "", tags: initial?.tags || [],
  });

  const set = <K extends keyof Omit<StaffMember, "id">>(k: K, v: Omit<StaffMember, "id">[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleTag = (tag: string) =>
    setForm((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] }));

  if (!open) return null;

  const inputClass = "w-full text-sm bg-secondary border border-border rounded-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors";

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
          className="steel-panel w-full max-w-md mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">{mode === "create" ? "Add Staff" : "Edit Staff"}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Organization</label>
                <input value={form.org} onChange={(e) => set("org", e.target.value)} className={inputClass} placeholder="e.g. NHL, ESPN" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Role</label>
                <input value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass} placeholder="e.g. Tech Manager" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="212-555-0100" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Email</label>
                <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="name@org.com" />
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 text-[11px] rounded-sm border transition-colors ${
                      form.tags.includes(tag) ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>{tag}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                className={`${inputClass} resize-none`} rows={2} placeholder="Notes…" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => { if (form.name.trim()) { onSubmit(form); onClose(); } }}
              disabled={!form.name.trim()}
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-40">
              {mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [, forceUpdate] = useState(0);

  const allStaff = useMemo(() => staffStore.getAll(), [formOpen, editingStaff]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allStaff.filter((m) => {
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.org.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
      const matchesTag = !tagFilter || m.tags.includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [search, tagFilter, allStaff]);

  const handleCreate = (data: Omit<StaffMember, "id">) => {
    staffStore.create(data);
    forceUpdate((n) => n + 1);
  };

  const handleEdit = (data: Omit<StaffMember, "id">) => {
    if (editingStaff) {
      staffStore.update(editingStaff.id, data);
      setEditingStaff(null);
      forceUpdate((n) => n + 1);
    }
  };

  const handleDelete = (id: string) => {
    staffStore.delete(id);
    forceUpdate((n) => n + 1);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">{allStaff.length} contacts</p>
        </div>
        <button onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-sm border border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </motion.div>

      {/* Search + Tag Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex gap-1">
          {TAGS.map((tag) => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`px-2 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                tagFilter === tag ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.03 }}
            className="steel-panel p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">{member.name}</h3>
                <p className="text-[10px] text-muted-foreground">{member.role} · {member.org}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingStaff(member)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(member.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> <span className="font-mono">{member.phone}</span> <CopyButton text={member.phone} />
              </div>
            )}
            {member.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" /> <span>{member.email}</span> <CopyButton text={member.email} />
              </div>
            )}
            {member.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {member.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase rounded bg-secondary text-muted-foreground border border-border">{tag}</span>
                ))}
              </div>
            )}
            {member.notes && <p className="text-[10px] text-muted-foreground italic">{member.notes}</p>}
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="steel-panel px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No staff match your search.</p>
        </div>
      )}

      <StaffFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} mode="create" />
      {editingStaff && (
        <StaffFormModal open={true} onClose={() => setEditingStaff(null)} onSubmit={handleEdit}
          initial={editingStaff} mode="edit" />
      )}
    </div>
  );
}
