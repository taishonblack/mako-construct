import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Plus, LogIn } from "lucide-react";
import type { WikiCategory, WikiArticleType } from "@/lib/wiki-types";
import { useWikiArticles, useWikiArticle } from "@/hooks/use-wiki";
import { useOptionalAuth } from "@/contexts/AuthContext";
import WikiHome from "@/components/wiki/WikiHome";
import WikiArticleList from "@/components/wiki/WikiArticleList";
import WikiArticleView from "@/components/wiki/WikiArticleView";
import WikiArticleEditor from "@/components/wiki/WikiArticleEditor";
import WikiSearchBar from "@/components/wiki/WikiSearchBar";

type View =
  | { kind: "home" }
  | { kind: "category"; category: WikiCategory }
  | { kind: "article"; id: string }
  | { kind: "edit"; id: string | null; defaultCategory?: WikiCategory; defaultType?: WikiArticleType }
  | { kind: "addSolve"; prefill?: { title?: string; tags?: string[]; relatedRouteId?: string } };

export default function WikiPage() {
  const auth = useOptionalAuth();
  const isLoggedIn = !!auth?.user;
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>(() => {
    const articleId = searchParams.get("article");
    if (articleId) return { kind: "article", id: articleId };
    const addSolve = searchParams.get("addSolve");
    if (addSolve) {
      return {
        kind: "addSolve",
        prefill: {
          relatedRouteId: searchParams.get("routeId") || undefined,
          title: searchParams.get("signal") ? `${searchParams.get("signal")} — ` : undefined,
          tags: [searchParams.get("transport"), searchParams.get("signal")].filter(Boolean) as string[],
        },
      };
    }
    return { kind: "home" };
  });
  const { articles, loading, refetch } = useWikiArticles(
    view.kind === "category" ? view.category : null
  );
  const allArticles = useWikiArticles(null);
  const articleDetail = useWikiArticle(
    view.kind === "article" ? view.id : view.kind === "edit" && view.id ? view.id : null
  );

  function goHome() { setView({ kind: "home" }); refetch(); allArticles.refetch(); }
  function goCategory(cat: WikiCategory) { setView({ kind: "category", category: cat }); }
  function goArticle(id: string) { setView({ kind: "article", id }); }
  function goEdit(id: string | null, defaultCategory?: WikiCategory) {
    if (!isLoggedIn) return; // gated by UI
    setView({ kind: "edit", id, defaultCategory });
  }


  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-medium text-foreground tracking-tight">Wiki</h1>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="w-full max-w-xs">
              <WikiSearchBar onSelect={goArticle} />
            </div>
            {isLoggedIn ? (
              <button
                onClick={() => goEdit(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity shrink-0"
              >
                <Plus className="w-3 h-3" /> New Article
              </button>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-secondary transition-colors shrink-0">
                <LogIn className="w-3 h-3" /> Sign in to contribute
              </Link>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Broadcast operations knowledge system — every show makes it smarter
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {view.kind === "home" && (
          <WikiHome
            articles={allArticles.articles}
            onSelectCategory={goCategory}
            onSelectArticle={goArticle}
          />
        )}

        {view.kind === "category" && (
          <WikiArticleList
            category={view.category}
            articles={articles}
            onBack={goHome}
            onSelect={goArticle}
            onNew={() => goEdit(null, view.category)}
          />
        )}

        {view.kind === "article" && articleDetail.article && (
          <WikiArticleView
            article={articleDetail.article}
            onBack={() => {
              if (articleDetail.article) goCategory(articleDetail.article.category);
              else goHome();
            }}
            onEdit={() => goEdit(articleDetail.article!.id)}
            onDeleted={goHome}
            onRefresh={() => {
              // Force re-fetch by resetting to same view
              const id = articleDetail.article!.id;
              setView({ kind: "home" });
              setTimeout(() => setView({ kind: "article", id }), 50);
            }}
          />
        )}

        {view.kind === "edit" && (
          <WikiArticleEditor
            article={view.id ? articleDetail.article : null}
            defaultCategory={view.defaultCategory}
            onSaved={(a) => { goArticle(a.id); refetch(); allArticles.refetch(); }}
            onCancel={() => {
              if (view.id) goArticle(view.id);
              else goHome();
            }}
          />
        )}

        {view.kind === "addSolve" && (
          <WikiArticleEditor
            defaultCategory="field_solves"
            defaultType="solve"
            prefill={view.prefill}
            onSaved={(a) => { goArticle(a.id); refetch(); allArticles.refetch(); }}
            onCancel={goHome}
          />
        )}

        {loading && view.kind !== "home" && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
