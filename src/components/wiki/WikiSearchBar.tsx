import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { WikiArticle } from "@/lib/wiki-types";
import { CATEGORY_META, ARTICLE_TYPE_META } from "@/lib/wiki-types";
import { searchWikiArticles } from "@/hooks/use-wiki";
import { formatDistanceToNow } from "date-fns";

interface Props {
  onSelect: (id: string) => void;
}

export default function WikiSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiArticle[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const r = await searchWikiArticles(q);
    setResults(r);
    setSearching(false);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder="Search wiki..."
          className="w-full pl-8 pr-8 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:border-primary text-foreground"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (query.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {searching && <p className="text-xs text-muted-foreground p-3">Searching...</p>}
          {!searching && results.length === 0 && query.trim() && (
            <p className="text-xs text-muted-foreground p-3">No results for "{query}"</p>
          )}
          {results.map(a => (
            <button
              key={a.id}
              onClick={() => { onSelect(a.id); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{a.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTICLE_TYPE_META[a.article_type].color}`}>
                  {ARTICLE_TYPE_META[a.article_type].label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {CATEGORY_META[a.category]?.label} · {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
