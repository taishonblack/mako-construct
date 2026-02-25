import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { ImportCallSheetDrawer } from "@/components/import/ImportCallSheetDrawer";
import { ImportMenuButton } from "@/components/import/ImportMenuButton";
import type { ImportFileInfo, ImportSourceType } from "@/lib/import-types";

export function AppLayout() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<ImportFileInfo | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleImportSelect = useCallback((sourceType: ImportSourceType) => {
    setImportFile({
      name: sourceType === "email" ? "call-sheet.eml" : sourceType === "paste" ? "pasted-text.txt" : "call-sheet.pdf",
      size: 245760,
      type: sourceType === "email" ? "message/rfc822" : "application/pdf",
      sourceType,
    });
    setImportOpen(true);
  }, []);

  // Global drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const f = files.find(f => f.name.endsWith(".pdf") || f.name.endsWith(".eml"));
    if (f) {
      const sourceType: ImportSourceType = f.name.endsWith(".eml") ? "email" : "pdf";
      setImportFile({
        name: f.name,
        size: f.size,
        type: f.type,
        sourceType,
      });
      setImportOpen(true);
    }
  }, []);

  return (
    <SidebarProvider>
      <div
        className="min-h-screen flex w-full max-w-full overflow-x-hidden bg-background"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!isMobile && <AppSidebar />}
        <div className="flex-1 min-w-0 flex flex-col">
          {isMobile ? (
            <MobileHeader onSearchClick={() => setCmdOpen(true)} />
          ) : (
            <header className="h-12 flex items-center border-b border-border px-4 bg-card">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="ml-auto flex items-center gap-2">
                <ImportMenuButton onSelect={handleImportSelect} />
                <button
                  onClick={() => setCmdOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  <span>Search…</span>
                  <kbd className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>
              </div>
            </header>
          )}
          <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
            <Outlet context={{ openImport: handleImportSelect }} />
          </main>
        </div>
      </div>
      {isMobile && <MobileBottomNav />}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <ImportCallSheetDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
        initialFile={importFile}
      />
    </SidebarProvider>
  );
}
