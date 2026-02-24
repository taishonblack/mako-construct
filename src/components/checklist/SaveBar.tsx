import { motion, AnimatePresence } from "framer-motion";
import { Save, Undo2 } from "lucide-react";

interface SaveBarProps {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ isDirty, onSave, onDiscard }: SaveBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-6 py-3 bg-secondary/95 border-t border-border backdrop-blur-sm md:bottom-0 bottom-16"
        >
          <span className="text-xs text-muted-foreground tracking-wider uppercase">Unsaved changes</span>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-wider uppercase font-medium bg-primary text-primary-foreground rounded-sm hover:glow-red transition-all"
          >
            <Save className="w-3 h-3" /> Save
          </button>
          <button
            onClick={onDiscard}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-wider uppercase font-medium text-muted-foreground border border-border rounded-sm hover:text-foreground transition-colors"
          >
            <Undo2 className="w-3 h-3" /> Discard
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
