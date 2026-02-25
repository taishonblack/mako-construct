import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WikiArticle, WikiVersion, WikiLink, WikiCategory, WikiArticleType, StructuredContent } from "@/lib/wiki-types";
import { defaultContentForType } from "@/lib/wiki-types";
import { getDisplayName } from "@/hooks/use-display-name";
import { seedWikiIfEmpty } from "@/data/seed-wiki";

/** Get the best available author name: profile display_name > localStorage > 'System' */
async function getAuthorName(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
    if (profile?.display_name) return profile.display_name;
  }
  return getDisplayName() || "System";
}

// ─── Fetch all articles ──────────────────────────────────────
export function useWikiArticles(category?: WikiCategory | null) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    await seedWikiIfEmpty();
    let q = supabase.from("wiki_articles").select("*").order("updated_at", { ascending: false });
    if (category) q = q.eq("category", category);
    const { data } = await q;
    setArticles((data as unknown as WikiArticle[]) || []);
    setLoading(false);
  }, [category]);

  useEffect(() => { refetch(); }, [refetch]);

  return { articles, loading, refetch };
}

// ─── Fetch single article ────────────────────────────────────
export function useWikiArticle(id: string | null) {
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setArticle(null); return; }
    setLoading(true);
    supabase.from("wiki_articles").select("*").eq("id", id).single()
      .then(({ data }) => { setArticle((data as unknown as WikiArticle) || null); setLoading(false); });
  }, [id]);

  return { article, loading };
}

// ─── Versions ────────────────────────────────────────────────
export function useWikiVersions(articleId: string | null) {
  const [versions, setVersions] = useState<WikiVersion[]>([]);

  useEffect(() => {
    if (!articleId) { setVersions([]); return; }
    supabase.from("wiki_versions").select("*").eq("article_id", articleId)
      .order("version_number", { ascending: false })
      .then(({ data }) => setVersions((data as unknown as WikiVersion[]) || []));
  }, [articleId]);

  return versions;
}

// ─── Links for an article ────────────────────────────────────
export function useWikiLinks(articleId: string | null) {
  const [links, setLinks] = useState<WikiLink[]>([]);
  const refetch = useCallback(async () => {
    if (!articleId) { setLinks([]); return; }
    const { data } = await supabase.from("wiki_links").select("*").eq("article_id", articleId);
    setLinks((data as unknown as WikiLink[]) || []);
  }, [articleId]);
  useEffect(() => { refetch(); }, [refetch]);
  return { links, refetch };
}

// ─── Links for an entity (route/binder) ──────────────────────
export function useEntityWikiLinks(entityType: string, entityId: string) {
  const [links, setLinks] = useState<(WikiLink & { article?: WikiArticle })[]>([]);
  const refetch = useCallback(async () => {
    if (!entityId) { setLinks([]); return; }
    const { data } = await supabase.from("wiki_links").select("*").eq("entity_type", entityType).eq("entity_id", entityId);
    const linkData = (data as unknown as WikiLink[]) || [];
    // Fetch articles for each link
    if (linkData.length > 0) {
      const ids = linkData.map(l => l.article_id);
      const { data: arts } = await supabase.from("wiki_articles").select("*").in("id", ids);
      const artMap = new Map((arts as unknown as WikiArticle[] || []).map(a => [a.id, a]));
      setLinks(linkData.map(l => ({ ...l, article: artMap.get(l.article_id) })));
    } else {
      setLinks([]);
    }
  }, [entityType, entityId]);
  useEffect(() => { refetch(); }, [refetch]);
  return { links, refetch };
}

// ─── Search ──────────────────────────────────────────────────
export async function searchWikiArticles(query: string): Promise<WikiArticle[]> {
  if (!query.trim()) return [];
  // Use ilike for simple search across title, description, and tags
  const { data } = await supabase.from("wiki_articles").select("*")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(20);
  return (data as unknown as WikiArticle[]) || [];
}

// ─── Mutations ───────────────────────────────────────────────
export async function createWikiArticle(article: {
  title: string;
  category: WikiCategory;
  article_type: WikiArticleType;
  tags: string[];
  description: string;
  structured_content: StructuredContent;
  attachments?: unknown[];
  related_binder_id?: string;
  related_route_id?: string;
}): Promise<WikiArticle | null> {
  const author = await getAuthorName();
  const insertPayload: Record<string, unknown> = {
    title: article.title,
    category: article.category,
    article_type: article.article_type,
    tags: article.tags,
    description: article.description,
    structured_content: article.structured_content,
    related_binder_id: article.related_binder_id || null,
    related_route_id: article.related_route_id || null,
    attachments: article.attachments || [],
    created_by: author,
    updated_by: author,
    version: 1,
  };
  const { data, error } = await supabase.from("wiki_articles").insert(insertPayload as any).select().single();
  if (error) { console.error("create wiki article error:", error); return null; }
  return data as unknown as WikiArticle;
}

export async function updateWikiArticle(
  id: string,
  patch: Partial<Pick<WikiArticle, "title" | "category" | "article_type" | "tags" | "description" | "structured_content" | "attachments" | "related_binder_id" | "related_route_id">>,
  changeSummary?: string
): Promise<WikiArticle | null> {
  const author = await getAuthorName();

  // Fetch current to snapshot version
  const { data: current } = await supabase.from("wiki_articles").select("*").eq("id", id).single();
  if (!current) return null;
  const cur = current as unknown as WikiArticle;

  // Save version snapshot
  const versionPayload: Record<string, unknown> = {
    article_id: id,
    version_number: cur.version,
    title: cur.title,
    category: cur.category,
    article_type: cur.article_type,
    tags: cur.tags,
    description: cur.description,
    structured_content: cur.structured_content,
    change_summary: changeSummary || "",
    created_by: author,
  };
  await supabase.from("wiki_versions").insert(versionPayload as any);

  // Update article
  const updatePayload: Record<string, unknown> = { ...patch, updated_by: author, version: cur.version + 1 };
  const { data, error } = await supabase.from("wiki_articles").update(updatePayload as any).eq("id", id).select().single();
  if (error) { console.error("update wiki article error:", error); return null; }
  return data as unknown as WikiArticle;
}

export async function deleteWikiArticle(id: string): Promise<boolean> {
  const { error } = await supabase.from("wiki_articles").delete().eq("id", id);
  return !error;
}

export async function restoreWikiVersion(articleId: string, version: WikiVersion): Promise<WikiArticle | null> {
  return updateWikiArticle(articleId, {
    title: version.title,
    category: version.category,
    article_type: version.article_type,
    tags: version.tags,
    description: version.description,
    structured_content: version.structured_content,
  }, `Restored to v${version.version_number}`);
}

export async function createWikiLink(link: { article_id: string; entity_type: string; entity_id: string; link_type?: string }): Promise<WikiLink | null> {
  const author = await getAuthorName();
  const payload: Record<string, unknown> = {
    article_id: link.article_id,
    entity_type: link.entity_type,
    entity_id: link.entity_id,
    link_type: link.link_type || "reference",
    created_by: author,
  };
  const { data, error } = await supabase.from("wiki_links").insert(payload as any).select().single();
  if (error) { console.error("create wiki link error:", error); return null; }
  return data as unknown as WikiLink;
}

export async function deleteWikiLink(id: string): Promise<boolean> {
  const { error } = await supabase.from("wiki_links").delete().eq("id", id);
  return !error;
}

// ─── Suggestion logic (MVP keyword matching) ─────────────────
export async function getSuggestedArticles(context: {
  transportType?: string;
  encoderBrand?: string;
  decoderBrand?: string;
  signalName?: string;
  controlRoom?: string;
  tags?: string[];
}): Promise<WikiArticle[]> {
  // Build search terms from context
  const terms = [
    context.transportType,
    context.encoderBrand,
    context.decoderBrand,
    context.signalName,
    context.controlRoom,
    ...(context.tags || []),
  ].filter(Boolean) as string[];

  if (terms.length === 0) return [];

  // Search for articles matching any term
  const orClauses = terms.map(t => `title.ilike.%${t}%,description.ilike.%${t}%`).join(",");
  const { data } = await supabase.from("wiki_articles").select("*")
    .or(orClauses)
    .order("updated_at", { ascending: false })
    .limit(5);
  return (data as unknown as WikiArticle[]) || [];
}

export async function dismissSuggestion(articleId: string, entityType: string, entityId: string) {
  await supabase.from("wiki_suggestion_feedback").insert({
    article_id: articleId,
    entity_type: entityType,
    entity_id: entityId,
    action: "dismiss",
  } as any);
}

export async function snoozeSuggestion(articleId: string, entityType: string, entityId: string) {
  await supabase.from("wiki_suggestion_feedback").insert({
    article_id: articleId,
    entity_type: entityType,
    entity_id: entityId,
    action: "snooze",
  } as any);
}
