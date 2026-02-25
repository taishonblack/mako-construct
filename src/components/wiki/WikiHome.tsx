import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radio, Cpu, Monitor, Wifi, Headphones, FileCheck, ClipboardList, Tag, BookOpen,
  Wrench, PenTool, Clock, TrendingUp,
} from "lucide-react";
import type { WikiArticle, WikiCategory } from "@/lib/wiki-types";
import { CATEGORY_META, ARTICLE_TYPE_META } from "@/lib/wiki-types";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Cpu, Monitor, Wifi, Headphones, FileCheck, ClipboardList, Tag, Wrench, PenTool, BookOpen,
};

interface Props {
  articles: WikiArticle[];
  onSelectCategory: (cat: WikiCategory) => void;
  onSelectArticle: (id: string) => void;
}

export default function WikiHome({ articles, onSelectCategory, onSelectArticle }: Props) {
  const recentlyUpdated = useMemo(() => articles.slice(0, 6), [articles]);
  const recentSolves = useMemo(() => articles.filter(a => a.article_type === "solve").slice(0, 4), [articles]);
  const categoryCounts = useMemo(() => {
    const map: Partial<Record<WikiCategory, number>> = {};
    for (const a of articles) map[a.category] = (map[a.category] || 0) + 1;
    return map;
  }, [articles]);

  return (
    <div className="space-y-8">
      {/* Category grid */}
      <div>
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Knowledge Domains</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {(Object.entries(CATEGORY_META) as [WikiCategory, typeof CATEGORY_META[WikiCategory]][]).map(([key, meta], i) => {
            const Icon = ICON_MAP[meta.icon] || BookOpen;
            const count = categoryCounts[key] || 0;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectCategory(key)}
                className="p-4 rounded bg-secondary/30 hover:bg-secondary/60 border border-transparent hover:border-border transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  {count > 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recently Updated */}
      {recentlyUpdated.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Recently Updated</h2>
          </div>
          <div className="space-y-1">
            {recentlyUpdated.map(a => (
              <button
                key={a.id}
                onClick={() => onSelectArticle(a.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">{a.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTICLE_TYPE_META[a.article_type].color}`}>
                      {ARTICLE_TYPE_META[a.article_type].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {CATEGORY_META[a.category]?.label} · Updated {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })} by {a.updated_by}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Solves */}
      {recentSolves.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Recent Field Solves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentSolves.map(a => (
              <button
                key={a.id}
                onClick={() => onSelectArticle(a.id)}
                className="p-3 rounded bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors text-left"
              >
                <span className="text-sm text-foreground">{a.title}</span>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {a.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No articles yet. Create your first article to start building institutional knowledge.</p>
        </div>
      )}
    </div>
  );
}
