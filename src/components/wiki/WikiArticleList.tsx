import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import {
  Radio, Cpu, Monitor, Wifi, Headphones, FileCheck, ClipboardList, Tag, BookOpen,
  Wrench, PenTool,
} from "lucide-react";
import type { WikiArticle, WikiCategory, WikiArticleType } from "@/lib/wiki-types";
import { CATEGORY_META, ARTICLE_TYPE_META, ALL_ARTICLE_TYPES } from "@/lib/wiki-types";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Cpu, Monitor, Wifi, Headphones, FileCheck, ClipboardList, Tag, Wrench, PenTool, BookOpen,
};

interface Props {
  category: WikiCategory;
  articles: WikiArticle[];
  onBack: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function WikiArticleList({ category, articles, onBack, onSelect, onNew }: Props) {
  const meta = CATEGORY_META[category];
  const Icon = ICON_MAP[meta.icon] || BookOpen;
  const [typeFilter, setTypeFilter] = useState<WikiArticleType | "">("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = articles;
    if (typeFilter) list = list.filter(a => a.article_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, typeFilter, search]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1 rounded hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-medium text-foreground">{meta.label}</h2>
        <span className="text-xs text-muted-foreground">({articles.length})</span>
        <button
          onClick={onNew}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3 h-3" /> New Article
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{meta.description}</p>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:border-primary text-foreground"
          />
        </div>
        <button
          onClick={() => setTypeFilter("")}
          className={`text-[10px] px-2 py-1 rounded border transition-colors ${!typeFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
        >
          All
        </button>
        {ALL_ARTICLE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
            className={`text-[10px] px-2 py-1 rounded border transition-colors ${typeFilter === t ? ARTICLE_TYPE_META[t].color : "border-border text-muted-foreground hover:bg-secondary"}`}
          >
            {ARTICLE_TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Article rows */}
      <div className="space-y-1">
        {filtered.map(a => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded hover:bg-secondary/50 transition-colors text-left border border-transparent hover:border-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-foreground">{a.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${ARTICLE_TYPE_META[a.article_type].color}`}>
                  {ARTICLE_TYPE_META[a.article_type].label}
                </span>
              </div>
              {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {a.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  v{a.version} · {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })} by {a.updated_by}
                </span>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
