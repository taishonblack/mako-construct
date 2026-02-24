import { useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { mockBinders } from "@/data/mock-binders";
import { BinderCard } from "@/components/BinderCard";

export default function BinderLibrary() {
  const [search, setSearch] = useState("");

  const filtered = mockBinders.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.partner.toLowerCase().includes(q) ||
      b.venue.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Binder Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} binder{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <a
          href="/binders/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-medium tracking-wide uppercase rounded-md hover:glow-red transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          New Binder
        </a>
      </motion.div>

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
            <BinderCard binder={binder} />
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
