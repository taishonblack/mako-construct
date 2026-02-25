import { useState, useCallback } from "react";
import { ArrowLeft, Save, Plus, Trash2, X } from "lucide-react";
import type { WikiArticle, WikiCategory, WikiArticleType, StructuredContent, SolveContent, BlockContent, WorkflowContent } from "@/lib/wiki-types";
import {
  CATEGORY_META, ARTICLE_TYPE_META, ALL_CATEGORIES, ALL_ARTICLE_TYPES,
  defaultContentForType, isSolveContent, isBlockContent, isWorkflowContent,
} from "@/lib/wiki-types";
import { createWikiArticle, updateWikiArticle } from "@/hooks/use-wiki";

interface Props {
  article?: WikiArticle | null;
  defaultCategory?: WikiCategory;
  defaultType?: WikiArticleType;
  /** Prefill context for Add Solve flow */
  prefill?: {
    title?: string;
    description?: string;
    tags?: string[];
    relatedRouteId?: string;
    relatedBinderId?: string;
  };
  onSaved: (article: WikiArticle) => void;
  onCancel: () => void;
}

export default function WikiArticleEditor({ article, defaultCategory, defaultType, prefill, onSaved, onCancel }: Props) {
  const isNew = !article;
  const [title, setTitle] = useState(article?.title || prefill?.title || "");
  const [category, setCategory] = useState<WikiCategory>(article?.category || defaultCategory || "field_solves");
  const [articleType, setArticleType] = useState<WikiArticleType>(article?.article_type || defaultType || "reference");
  const [tags, setTags] = useState<string[]>(article?.tags || prefill?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState(article?.description || prefill?.description || "");
  const [content, setContent] = useState<StructuredContent>(
    article?.structured_content || defaultContentForType(defaultType || articleType)
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const relatedRouteId = article?.related_route_id || prefill?.relatedRouteId || null;
  const relatedBinderId = article?.related_binder_id || prefill?.relatedBinderId || null;

  function handleTypeChange(newType: WikiArticleType) {
    setArticleType(newType);
    // Reset content if switching type on new article
    if (isNew) setContent(defaultContentForType(newType));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await createWikiArticle({
          title, category, article_type: articleType, tags, description, structured_content: content,
          related_binder_id: relatedBinderId || undefined,
          related_route_id: relatedRouteId || undefined,
        });
        if (created) onSaved(created);
      } else {
        const updated = await updateWikiArticle(article!.id, {
          title, category, article_type: articleType, tags, description, structured_content: content,
          related_binder_id: relatedBinderId,
          related_route_id: relatedRouteId,
        }, changeSummary || undefined);
        if (updated) onSaved(updated);
      }
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-1 rounded hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-medium text-foreground">{isNew ? "New Article" : "Edit Article"}</h2>
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="steel-panel p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            placeholder="Article title..." />
        </div>

        {/* Category + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as WikiCategory)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_META[c].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Article Type</label>
            <select value={articleType} onChange={e => handleTypeChange(e.target.value as WikiArticleType)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {ALL_ARTICLE_TYPES.map(t => (
                <option key={t} value={t}>{ARTICLE_TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            placeholder="Brief description..." />
        </div>

        {/* Tags */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Tags</label>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {tags.map(t => (
              <span key={t} className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                {t}
                <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-destructive">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              className="flex-1 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Add tag..." />
            <button onClick={addTag} className="px-2 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Change summary (edit only) */}
        {!isNew && (
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Change Summary</label>
            <input value={changeSummary} onChange={e => setChangeSummary(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="What changed? (optional)" />
          </div>
        )}

        {/* Structured content editor */}
        <div className="border-t border-border pt-5">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Content</h3>

          {/* Solve content */}
          {isSolveContent(content) && <SolveEditor content={content} onChange={c => setContent(c)} />}

          {/* Block content */}
          {isBlockContent(content) && <BlockEditor content={content} onChange={c => setContent(c)} />}

          {/* Workflow content */}
          {isWorkflowContent(content) && <WorkflowEditor content={content} onChange={c => setContent(c)} />}
        </div>
      </div>
    </div>
  );
}

// ─── Solve editor ────────────────────────────────────────────
function SolveEditor({ content, onChange }: { content: SolveContent; onChange: (c: SolveContent) => void }) {
  const update = (field: keyof SolveContent, value: string | string[]) => onChange({ ...content, [field]: value });

  return (
    <div className="space-y-4">
      {(["problem", "symptoms", "rootCause", "verification", "notes"] as const).map(field => (
        <div key={field}>
          <label className="text-xs text-muted-foreground mb-1 block capitalize">{field === "rootCause" ? "Root Cause" : field}</label>
          <textarea value={content[field] as string} onChange={e => update(field, e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
        </div>
      ))}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Fix Steps</label>
        {content.fixSteps.map((step, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <span className="text-xs text-primary font-mono mt-2 shrink-0">{i + 1}.</span>
            <input value={step} onChange={e => {
              const steps = [...content.fixSteps];
              steps[i] = e.target.value;
              update("fixSteps", steps);
            }}
              className="flex-1 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            <button onClick={() => update("fixSteps", content.fixSteps.filter((_, j) => j !== i))}
              className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => update("fixSteps", [...content.fixSteps, ""])}
          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
          <Plus className="w-3 h-3" /> Add step
        </button>
      </div>
    </div>
  );
}

// ─── Block editor ────────────────────────────────────────────
function BlockEditor({ content, onChange }: { content: BlockContent; onChange: (c: BlockContent) => void }) {
  function updateBlock(idx: number, patch: Partial<BlockContent["blocks"][0]>) {
    const blocks = content.blocks.map((b, i) => i === idx ? { ...b, ...patch } : b);
    onChange({ blocks });
  }
  function addBlock() {
    onChange({ blocks: [...content.blocks, { heading: "", items: [""] }] });
  }
  function removeBlock(idx: number) {
    onChange({ blocks: content.blocks.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5">
      {content.blocks.map((block, bi) => (
        <div key={bi} className="p-3 rounded bg-secondary/20 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <input value={block.heading} onChange={e => updateBlock(bi, { heading: e.target.value })}
              className="flex-1 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground font-medium focus:outline-none focus:border-primary"
              placeholder="Section heading..." />
            <button onClick={() => removeBlock(bi)} className="p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {block.items.map((item, ii) => (
            <div key={ii} className="flex gap-2 mb-1">
              <span className="w-1 h-1 rounded-full bg-primary mt-2.5 shrink-0" />
              <input value={item} onChange={e => {
                const items = [...block.items];
                items[ii] = e.target.value;
                updateBlock(bi, { items });
              }}
                className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none text-sm text-foreground py-0.5" />
              <button onClick={() => updateBlock(bi, { items: block.items.filter((_, j) => j !== ii) })}
                className="p-0.5 text-muted-foreground hover:text-destructive opacity-50 hover:opacity-100">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button onClick={() => updateBlock(bi, { items: [...block.items, ""] })}
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
      ))}
      <button onClick={addBlock}
        className="text-xs text-primary hover:underline flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add section
      </button>
    </div>
  );
}

// ─── Workflow editor ─────────────────────────────────────────
function WorkflowEditor({ content, onChange }: { content: WorkflowContent; onChange: (c: WorkflowContent) => void }) {
  function updateStep(idx: number, patch: Partial<WorkflowContent["steps"][0]>) {
    const steps = content.steps.map((s, i) => i === idx ? { ...s, ...patch } : s);
    onChange({ steps });
  }
  return (
    <div className="space-y-3">
      {content.steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-mono shrink-0 mt-1">
            {i + 1}
          </div>
          <div className="flex-1 space-y-1">
            <input value={step.title} onChange={e => updateStep(i, { title: e.target.value })}
              className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground font-medium focus:outline-none focus:border-primary"
              placeholder="Step title..." />
            <textarea value={step.description} onChange={e => updateStep(i, { description: e.target.value })} rows={2}
              className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
              placeholder="Description..." />
          </div>
          <button onClick={() => onChange({ steps: content.steps.filter((_, j) => j !== i) })}
            className="p-1 text-muted-foreground hover:text-destructive mt-1"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <button onClick={() => onChange({ steps: [...content.steps, { title: "", description: "" }] })}
        className="text-xs text-primary hover:underline flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add step
      </button>
    </div>
  );
}
