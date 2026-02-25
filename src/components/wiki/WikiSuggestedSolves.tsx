import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lightbulb, ExternalLink, Link2, X, Clock } from "lucide-react";
import type { WikiArticle } from "@/lib/wiki-types";
import { ARTICLE_TYPE_META } from "@/lib/wiki-types";
import { getSuggestedArticles, createWikiLink, dismissSuggestion, snoozeSuggestion } from "@/hooks/use-wiki";
import { formatDistanceToNow } from "date-fns";

interface Props {
  entityType: string;
  entityId: string;
  context: {
    transportType?: string;
    encoderBrand?: string;
    decoderBrand?: string;
    signalName?: string;
    controlRoom?: string;
    tags?: string[];
  };
  onOpenArticle?: (id: string) => void;
  onAddSolve?: () => void;
}

export default function WikiSuggestedSolves({ entityType, entityId, context, onOpenArticle, onAddSolve }: Props) {
  const [suggestions, setSuggestions] = useState<WikiArticle[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSuggestedArticles(context).then(setSuggestions);
  }, [context.transportType, context.encoderBrand, context.decoderBrand, context.signalName, context.controlRoom]);

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  if (visible.length === 0 && !onAddSolve) return null;

  async function handleAttach(articleId: string) {
    await createWikiLink({ article_id: articleId, entity_type: entityType, entity_id: entityId, link_type: "solve" });
  }

  async function handleDismiss(articleId: string) {
    setDismissed(prev => new Set(prev).add(articleId));
    await dismissSuggestion(articleId, entityType, entityId);
  }

  return (
    <div className="rounded border border-border bg-secondary/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-medium text-foreground">
          Suggested Solves {visible.length > 0 && `(${visible.length})`}
        </span>
        {visible.length > 0 && !expanded && (
          <span className="text-xs text-muted-foreground truncate flex-1 ml-1">
            {visible[0].title}
          </span>
        )}
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground ml-auto shrink-0" /> :
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {visible.map(s => (
            <div key={s.id} className="p-2.5 rounded bg-secondary/40 border border-border">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm text-foreground">{s.title}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded border ${ARTICLE_TYPE_META[s.article_type].color}`}>
                      {ARTICLE_TYPE_META[s.article_type].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })} by {s.updated_by}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {onOpenArticle && (
                  <button onClick={() => onOpenArticle(s.id)}
                    className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" /> Open
                  </button>
                )}
                <button onClick={() => handleAttach(s.id)}
                  className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                  <Link2 className="w-2.5 h-2.5" /> Attach
                </button>
                <button onClick={() => handleDismiss(s.id)}
                  className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                  <X className="w-2.5 h-2.5" /> Dismiss
                </button>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No suggestions for this context</p>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-border">
            {onAddSolve && (
              <button onClick={onAddSolve}
                className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                + Add Solve
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
