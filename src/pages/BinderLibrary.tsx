import { useState, useMemo, useCallback } from "react";
import { Search, Plus, SlidersHorizontal, FileText, MessageSquare, Trash2, X, CheckSquare, Archive, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { useBinders } from "@/hooks/use-binders";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { binderStore } from "@/stores/binder-store";
import { supabase } from "@/integrations/supabase/client";
import { BinderCard } from "@/components/BinderCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ImportSourceType } from "@/lib/import-types";

export default function BinderLibrary() {
  const [search, setSearch] = useState("");
  const context = useOutletContext<{ openImport?: (s: ImportSourceType, file?: File) => void }>();
  const { binders, loading, refresh } = useBinders();
  const auth = useOptionalAuth();
  const userId = auth?.user?.id;

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState<"archived" | "completed" | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  useMemo(() => {
    if (!userId) return;
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").then(({ data }) => {
      setIsAdmin(!!(data && data.length > 0));
    });
  }, [userId]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await binderStore.delete(id);
    if (ok) {
      toast.success("Binder deleted");
      refresh();
    } else {
      toast.error("Failed to delete binder");
    }
  }, [refresh]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(filtered.map((b) => b.id)));
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true);
    let deleted = 0;
    for (const id of selected) {
      const ok = await binderStore.delete(id);
      if (ok) deleted++;
    }
    setBulkDeleting(false);
    setShowBulkConfirm(false);
    exitSelectMode();
    toast.success(`${deleted} binder${deleted !== 1 ? "s" : ""} deleted`);
    refresh();
  }, [selected, refresh, exitSelectMode]);

  const handleBulkStatus = useCallback(async () => {
    if (!showStatusConfirm) return;
    setBulkUpdating(true);
    let updated = 0;
    for (const id of selected) {
      const ok = await binderStore.update(id, { status: showStatusConfirm });
      if (ok) updated++;
    }
    setBulkUpdating(false);
    setShowStatusConfirm(null);
    exitSelectMode();
    toast.success(`${updated} binder${updated !== 1 ? "s" : ""} marked as ${showStatusConfirm}`);
    refresh();
  }, [selected, showStatusConfirm, refresh, exitSelectMode]);

  const filtered = useMemo(() => binders.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.partner.toLowerCase().includes(q) ||
      b.venue.toLowerCase().includes(q)
    );
  }), [binders, search]);

  // Re-bind selectAll after filtered is computed
  const handleSelectAll = () => {
    setSelected(new Set(filtered.map((b) => b.id)));
  };

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8 gap-3"
      >
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Binder Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} binder{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !selectMode && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setSelectMode(true)}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Select
            </Button>
          )}
          {context?.openImport && !selectMode && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => context.openImport!("callsheet")}
            >
              <FileText className="w-3.5 h-3.5" />
              Import Call Sheet
            </Button>
          )}
          {!selectMode && (
            <>
              <a
                href="/binders/new?mode=quinn"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-xs font-medium tracking-wide uppercase rounded-md border border-border hover:border-primary hover:text-primary transition-all duration-200"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Create with Quinn
              </a>
              <a
                href="/binders/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-medium tracking-wide uppercase rounded-md hover:glow-red transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                New Binder
              </a>
            </>
          )}
        </div>
      </motion.div>

      {/* Bulk select toolbar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-4 p-3 bg-secondary border border-border rounded-md"
          >
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={(checked) => {
                if (checked) handleSelectAll();
                else setSelected(new Set());
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xs text-muted-foreground flex-1">
              {selected.size} of {filtered.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              disabled={selected.size === 0}
              onClick={() => setShowStatusConfirm("completed")}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Complete ({selected.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              disabled={selected.size === 0}
              onClick={() => setShowStatusConfirm("archived")}
            >
              <Archive className="w-3.5 h-3.5" />
              Archive ({selected.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5"
              disabled={selected.size === 0}
              onClick={() => setShowBulkConfirm(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selected.size})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={exitSelectMode}
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} binder{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected binders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Deleting…" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk status change confirmation */}
      <AlertDialog open={!!showStatusConfirm} onOpenChange={(open) => { if (!open) setShowStatusConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showStatusConfirm === "archived" ? "Archive" : "Mark as Completed"} {selected.size} binder{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showStatusConfirm === "archived"
                ? "Archived binders will be moved out of your active view."
                : "This will mark the selected binders as completed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatus} disabled={bulkUpdating}>
              {bulkUpdating ? "Updating…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search + filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="relative flex-1 min-w-0 max-w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search binders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border rounded-md hover:border-crimson hover:text-foreground transition-colors shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
      </motion.div>

      {/* Binder grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((binder, i) => (
          <motion.div
            key={binder.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
          >
            <BinderCard
              binder={binder}
              canDelete={!selectMode && (isAdmin || (!!userId && binder.createdBy === userId))}
              onDelete={handleDelete}
              selectMode={selectMode}
              selected={selected.has(binder.id)}
              onToggleSelect={toggleSelect}
            />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-sm text-muted-foreground">No binders match "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
