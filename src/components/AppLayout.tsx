import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";

export function AppLayout() {
  const [cmdOpen, setCmdOpen] = useState(false);

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <button
              onClick={() => setCmdOpen(true)}
              className="ml-auto flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <span>Search…</span>
              <kbd className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </SidebarProvider>
  );
}
