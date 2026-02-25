-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role_title TEXT DEFAULT '',
  organization TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for wiki attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('wiki-attachments', 'wiki-attachments', true, 20971520);

-- Storage policies
CREATE POLICY "Wiki attachments are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wiki-attachments');

CREATE POLICY "Authenticated users can upload wiki attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'wiki-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their wiki attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'wiki-attachments' AND auth.role() = 'authenticated');

-- Add attachments column to wiki_articles
ALTER TABLE public.wiki_articles ADD COLUMN attachments JSONB DEFAULT '[]';

-- Update wiki article policies to require auth for writes, keep public read
DROP POLICY "Anyone can insert wiki articles" ON public.wiki_articles;
DROP POLICY "Anyone can update wiki articles" ON public.wiki_articles;
DROP POLICY "Anyone can delete wiki articles" ON public.wiki_articles;

CREATE POLICY "Authenticated users can create wiki articles"
  ON public.wiki_articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update wiki articles"
  ON public.wiki_articles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete wiki articles"
  ON public.wiki_articles FOR DELETE
  USING (auth.role() = 'authenticated');