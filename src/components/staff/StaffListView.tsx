import { Phone, Mail, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { StaffMember } from "@/stores/staff-store";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={(e) => { e.stopPropagation(); copy(); }} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

interface StaffListViewProps {
  staff: StaffMember[];
  onEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
  onSelect?: (member: StaffMember) => void;
}

export function StaffListView({ staff, onEdit, onDelete, onSelect }: StaffListViewProps) {
  return (
    <div className="steel-panel overflow-hidden">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 px-4 py-2.5 border-b border-border text-[10px] tracking-wider uppercase text-muted-foreground">
        <span>Name / Role</span>
        <span>Phone</span>
        <span>Email</span>
        <span>Tags</span>
        <span className="w-16 text-right">Actions</span>
      </div>

      <div className="divide-y divide-border">
        {staff.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: i * 0.02 }}>
            {/* Desktop row */}
            <div onClick={() => onSelect?.(member)} className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{member.role}{member.role && member.org ? " · " : ""}{member.org}</p>
                {member.notes && <p className="text-[10px] text-muted-foreground/60 italic truncate mt-0.5">{member.notes}</p>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                {member.phone ? (
                  <>
                    <Phone className="w-3 h-3 shrink-0" />
                    <a href={`tel:${member.phone}`} className="font-mono hover:text-foreground truncate">{member.phone}</a>
                    <CopyBtn text={member.phone} />
                  </>
                ) : <span className="text-muted-foreground/40">—</span>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                {member.email ? (
                  <>
                    <Mail className="w-3 h-3 shrink-0" />
                    <a href={`mailto:${member.email}`} className="hover:text-foreground truncate">{member.email}</a>
                    <CopyBtn text={member.email} />
                  </>
                ) : <span className="text-muted-foreground/40">—</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {member.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase rounded bg-secondary text-muted-foreground border border-border">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 w-16 justify-end">
                <button onClick={() => onEdit(member)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => onDelete(member.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>

            {/* Mobile row */}
            <div onClick={() => onSelect?.(member)} className="md:hidden px-4 py-3 space-y-1.5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-[11px] text-muted-foreground">{member.role}{member.role && member.org ? " · " : ""}{member.org}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(member)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => onDelete(member.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="w-3 h-3" /> <span className="font-mono">{member.phone}</span>
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-foreground">
                    <Mail className="w-3 h-3" /> <span className="truncate max-w-[140px]">{member.email}</span>
                  </a>
                )}
              </div>
              {member.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {member.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase rounded bg-secondary text-muted-foreground border border-border">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No staff match your search.</p>
        </div>
      )}
    </div>
  );
}
