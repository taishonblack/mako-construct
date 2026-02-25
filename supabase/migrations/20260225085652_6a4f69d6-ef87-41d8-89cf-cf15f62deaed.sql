-- Create article type enum
CREATE TYPE public.wiki_article_type AS ENUM (
  'solve', 'standard', 'workflow', 'diagram', 'vendor_procedure', 'post_mortem', 'reference'
);

-- Create wiki category enum
CREATE TYPE public.wiki_category AS ENUM (
  'signal_standards', 'encoder_standards', 'decoder_topology', 'transport_profiles',
  'comms_standards', 'production_protocols', 'naming_conventions', 'checklist_templates',
  'field_solves', 'drawings_diagrams'
);

-- Main articles table
CREATE TABLE public.wiki_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category public.wiki_category NOT NULL DEFAULT 'field_solves',
  article_type public.wiki_article_type NOT NULL DEFAULT 'reference',
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  structured_content JSONB NOT NULL DEFAULT '{}',
  related_binder_id TEXT DEFAULT NULL,
  related_route_id TEXT DEFAULT NULL,
  created_by TEXT NOT NULL DEFAULT 'System',
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1
);

ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wiki articles" ON public.wiki_articles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wiki articles" ON public.wiki_articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update wiki articles" ON public.wiki_articles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete wiki articles" ON public.wiki_articles FOR DELETE USING (true);

-- Version history
CREATE TABLE public.wiki_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  category public.wiki_category NOT NULL,
  article_type public.wiki_article_type NOT NULL,
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  structured_content JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wiki versions" ON public.wiki_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wiki versions" ON public.wiki_versions FOR INSERT WITH CHECK (true);

-- Links between articles and entities
CREATE TABLE public.wiki_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'reference',
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wiki links" ON public.wiki_links FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wiki links" ON public.wiki_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete wiki links" ON public.wiki_links FOR DELETE USING (true);

-- Suggestion feedback
CREATE TABLE public.wiki_suggestion_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_suggestion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read suggestion feedback" ON public.wiki_suggestion_feedback FOR SELECT USING (true);
CREATE POLICY "Anyone can insert suggestion feedback" ON public.wiki_suggestion_feedback FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_wiki_articles_category ON public.wiki_articles(category);
CREATE INDEX idx_wiki_articles_type ON public.wiki_articles(article_type);
CREATE INDEX idx_wiki_articles_tags ON public.wiki_articles USING GIN(tags);
CREATE INDEX idx_wiki_articles_updated ON public.wiki_articles(updated_at DESC);
CREATE INDEX idx_wiki_versions_article ON public.wiki_versions(article_id, version_number DESC);
CREATE INDEX idx_wiki_links_article ON public.wiki_links(article_id);
CREATE INDEX idx_wiki_links_entity ON public.wiki_links(entity_type, entity_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wiki_articles_updated_at
  BEFORE UPDATE ON public.wiki_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Full text search
ALTER TABLE public.wiki_articles ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX idx_wiki_articles_fts ON public.wiki_articles USING GIN(fts);