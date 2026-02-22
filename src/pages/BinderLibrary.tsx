import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { mockBinders } from "@/data/mock-binders";
import { BinderCard } from "@/components/BinderCard";

export default function BinderLibrary() {
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Binder Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockBinders.length} binders</p>
        </div>
        <a
          href="/binders/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-medium tracking-wide uppercase rounded-md hover:glow-red transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          New Binder
        </a>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search binders..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border rounded-md hover:border-crimson hover:text-foreground transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Binder grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockBinders.map((binder) => (
          <BinderCard key={binder.id} binder={binder} />
        ))}
      </div>
    </div>
  );
}
