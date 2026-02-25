import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, Clock, Link2, ExternalLink } from "lucide-react";
import type { WikiArticle, WikiVersion } from "@/lib/wiki-types";
import { CATEGORY_META, ARTICLE_TYPE_META, isSolveContent, isBlockContent, isWorkflowContent } from "@/lib/wiki-types";
import { useWikiVersions, useWikiLinks, restoreWikiVersion, deleteWikiArticle } from "@/hooks/use-wiki";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  article: WikiArticle;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  onRefresh: () => void;
}

export default function WikiArticleView({ article, onBack, onEdit, onDeleted, onRefresh }: Props) {
  const versions = useWikiVersions(article.id);
  const { links } = useWikiLinks(article.id);
  const [showVersions, setShowVersions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const content = article.structured_content;

  async function handleRestore(v: WikiVersion) {
    setRestoring(true);
    await restoreWikiVersion(article.id, v);
    onRefresh();
    setRestoring(false);
    setShowVersions(false);
  }

  async function handleDelete() {
    await deleteWikiArticle(article.id);
    onDeleted();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={onBack} className="p-1 rounded hover:bg-secondary transition-colors mt-0.5">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-medium text-foreground">{article.title}</h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTICLE_TYPE_META[article.article_type].color}`}>
              {ARTICLE_TYPE_META[article.article_type].label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_META[article.category]?.label} · v{article.version} ·
            Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })} by {article.updated_by}
          </p>
          {article.description && <p className="text-sm text-muted-foreground mt-2">{article.description}</p>}
          {article.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {article.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-secondary transition-colors">
            <Clock className="w-3 h-3" /> History
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Version history panel */}
      {showVersions && (
        <div className="mb-6 p-4 rounded bg-secondary/30 border border-border">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Version History</h3>
          {versions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No previous versions</p>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">v{v.version_number}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(v.created_at), "MMM d, yyyy HH:mm")} by {v.created_by}
                    </span>
                    {v.change_summary && <p className="text-xs text-muted-foreground mt-0.5">{v.change_summary}</p>}
                  </div>
                  <button
                    onClick={() => handleRestore(v)}
                    disabled={restoring}
                    className="text-xs px-2 py-1 border border-border rounded text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked entities */}
      {links.length > 0 && (
        <div className="mb-6 p-3 rounded bg-secondary/20 border border-border">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
            <Link2 className="w-3 h-3" /> Linked Entities
          </h3>
          <div className="flex gap-2 flex-wrap">
            {links.map(l => (
              <span key={l.id} className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" />
                {l.entity_type}: {l.entity_id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="steel-panel p-6">
        {isSolveContent(content) && (
          <div className="space-y-5">
            {content.problem && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Problem</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{content.problem}</p>
              </div>
            )}
            {content.symptoms && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Symptoms</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{content.symptoms}</p>
              </div>
            )}
            {content.rootCause && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Root Cause</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{content.rootCause}</p>
              </div>
            )}
            {content.fixSteps.filter(Boolean).length > 0 && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Fix Steps</h3>
                <ol className="space-y-1.5">
                  {content.fixSteps.filter(Boolean).map((step, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-primary font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {content.verification && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Verification</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{content.verification}</p>
              </div>
            )}
            {content.notes && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Notes</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{content.notes}</p>
              </div>
            )}
          </div>
        )}

        {isBlockContent(content) && (
          <div className="space-y-6">
            {content.blocks.map((block, i) => (
              <div key={i}>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">{block.heading}</h3>
                <ul className="space-y-1.5">
                  {block.items.filter(Boolean).map((item, j) => (
                    <li key={j} className="text-sm text-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {isWorkflowContent(content) && (
          <div className="space-y-4">
            {content.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                  {step.description && <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{article.title}" and all its version history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
