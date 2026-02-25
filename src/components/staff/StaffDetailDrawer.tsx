import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Copy, Check, Pencil, Trash2 } from "lucide-react";
import type { StaffMember } from "@/stores/staff-store";

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span className="group-hover:text-foreground">{copied ? "Copied" : label}</span>}
    </button>
  );
}

interface StaffDetailDrawerProps {
  member: StaffMember | null;
  onClose: () => void;
  onEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
}

export function StaffDetailDrawer({ member, onClose, onEdit, onDelete }: StaffDetailDrawerProps) {
  if (!member) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-sm font-medium text-foreground tracking-tight">Contact Details</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(member)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => { onDelete(member.id); onClose(); }}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Name + Role */}
          <div>
            <h3 className="text-lg font-medium text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {member.role}{member.role && member.org ? " · " : ""}{member.org}
            </p>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Contact</h4>
            {member.phone ? (
              <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-secondary/50 border border-border">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${member.phone}`} className="text-sm font-mono text-foreground hover:text-primary transition-colors">
                    {member.phone}
                  </a>
                </div>
                <CopyBtn text={member.phone} label="Copy" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No phone number</p>
            )}
            {member.email ? (
              <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-secondary/50 border border-border">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${member.email}`} className="text-sm text-foreground hover:text-primary transition-colors">
                    {member.email}
                  </a>
                </div>
                <CopyBtn text={member.email} label="Copy" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No email</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Tags</h4>
            {member.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-[10px] tracking-wider uppercase rounded-sm bg-secondary text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No tags</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h4 className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Notes</h4>
            {member.notes ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{member.notes}</p>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No notes</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
