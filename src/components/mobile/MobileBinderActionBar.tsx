import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Eye, Save, Undo2, AlertTriangle } from "lucide-react";

interface MobileBinderActionBarProps {
  previewMode: boolean;
  isLocked: boolean;
  checklistDirty: boolean;
  onToggleMode: () => void;
  onSaveChecklist: () => void;
  onDiscardChecklist: () => void;
}

export function MobileBinderActionBar({
  previewMode, isLocked, checklistDirty,
  onToggleMode, onSaveChecklist, onDiscardChecklist,
}: MobileBinderActionBarProps) {
  const showBar = !isLocked && (previewMode || checklistDirty);

  return (
    <AnimatePresence>
      {showBar && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/60 safe-bottom"
        >
          <div className="flex items-center justify-between px-4 py-2.5">
            {checklistDirty && !previewMode ? (
              <>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[10px] tracking-wider uppercase">Unsaved changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onDiscardChecklist}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-wider uppercase text-muted-foreground border border-border rounded-sm hover:text-foreground transition-colors"
                  >
                    <Undo2 className="w-3 h-3" /> Discard
                  </button>
                  <button
                    onClick={onSaveChecklist}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium bg-primary text-primary-foreground rounded-sm"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              </>
            ) : previewMode ? (
              <>
                <span className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-muted-foreground">
                  <Eye className="w-3 h-3" /> Preview Mode
                </span>
                <button
                  onClick={onToggleMode}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium bg-primary text-primary-foreground rounded-sm"
                >
                  <Pencil className="w-3 h-3" /> Edit Binder
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-primary">
                  <Pencil className="w-3 h-3" /> Editing
                </span>
                <button
                  onClick={onToggleMode}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-wider uppercase text-muted-foreground border border-border rounded-sm hover:text-foreground transition-colors"
                >
                  <Eye className="w-3 h-3" /> Exit Edit
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
