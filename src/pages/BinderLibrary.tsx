import { useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { mockBinders, type BinderStatus } from "@/data/mock-binders";
import { BinderCard } from "@/components/BinderCard";
import { MobileBinderCard } from "@/components/mobile/MobileBinderCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | BinderStatus | "today" | "this-week";

export default function BinderLibrary() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const isMobile = useIsMobile();

  const filtered = mockBinders.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      b.partner.toLowerCase().includes(q) ||
      b.venue.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    switch (statusFilter) {
      case "all":
        return true;
      case "today": {
        const today = new Date().toISOString().slice(0, 10);
        return b.eventDate === today;
      }
      case "this-week": {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        const d = new Date(b.eventDate);
        return d >= now && d <= weekEnd;
      }
      default:
        return b.status === statusFilter;
    }
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-6 md:mb-8"
      >
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-medium text-foreground tracking-tight">
            Binder Library
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {filtered.length} binder{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Desktop: full button. Mobile: icon only */}
        <a
          href="/binders/new"
          className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-primary text-primary-foreground text-xs font-medium tracking-wide uppercase rounded-md hover:glow-red transition-all duration-200 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Binder</span>
        </a>
      </motion.div>

      {/* Search + filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-2 md:gap-3 mb-6 min-w-0"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search binders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Mobile: Status dropdown. Desktop: keep filter button */}
        {isMobile ? (
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[100px] shrink-0 h-9 text-xs bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[130px] shrink-0 h-9 text-xs bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border rounded-md hover:border-primary hover:text-foreground transition-colors shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </>
        )}
      </motion.div>

      {/* Binder list: mobile = stacked cards, desktop = grid */}
      {isMobile ? (
        <div className="flex flex-col gap-2 w-full max-w-full">
          {filtered.map((binder, i) => (
            <motion.div
              key={binder.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
            >
              <MobileBinderCard binder={binder} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">
                No binders match "{search}"
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((binder, i) => (
            <motion.div
              key={binder.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
            >
              <BinderCard binder={binder} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-sm text-muted-foreground">
                No binders match "{search}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
