-- Tighten wiki_links policies
DROP POLICY "Anyone can insert wiki links" ON public.wiki_links;
DROP POLICY "Anyone can delete wiki links" ON public.wiki_links;

CREATE POLICY "Authenticated users can create wiki links"
  ON public.wiki_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete wiki links"
  ON public.wiki_links FOR DELETE
  USING (auth.role() = 'authenticated');

-- Tighten wiki_versions policies
DROP POLICY "Anyone can insert wiki versions" ON public.wiki_versions;

CREATE POLICY "Authenticated users can create wiki versions"
  ON public.wiki_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Tighten wiki_suggestion_feedback policies
DROP POLICY "Anyone can insert suggestion feedback" ON public.wiki_suggestion_feedback;

CREATE POLICY "Authenticated users can create suggestion feedback"
  ON public.wiki_suggestion_feedback FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');