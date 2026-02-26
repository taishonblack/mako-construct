
-- Quinn day-based conversation threads
CREATE TABLE public.quinn_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date_key TEXT NOT NULL, -- e.g. '2026-02-26'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_key)
);
ALTER TABLE public.quinn_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own threads" ON public.quinn_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own threads" ON public.quinn_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own threads" ON public.quinn_threads FOR DELETE USING (auth.uid() = user_id);

-- Quinn messages within threads
CREATE TABLE public.quinn_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.quinn_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'quinn'
  content TEXT NOT NULL DEFAULT '',
  quick_replies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quinn_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own messages" ON public.quinn_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quinn_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users can create own messages" ON public.quinn_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quinn_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);

-- Quinn operational memory per user
CREATE TABLE public.quinn_profile (
  user_id UUID PRIMARY KEY,
  last_binder_id UUID,
  last_control_room TEXT DEFAULT '',
  last_route_view TEXT DEFAULT 'topology',
  last_partner TEXT DEFAULT '',
  last_league TEXT DEFAULT 'NHL',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quinn_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.quinn_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own profile" ON public.quinn_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.quinn_profile FOR UPDATE USING (auth.uid() = user_id);

-- Admin question queue
CREATE TABLE public.quinn_admin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  binder_id UUID,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'answered'
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.quinn_admin_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own questions" ON public.quinn_admin_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create questions" ON public.quinn_admin_queue FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quinn document uploads
CREATE TABLE public.quinn_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quinn_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own documents" ON public.quinn_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create documents" ON public.quinn_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quinn extraction results from documents
CREATE TABLE public.quinn_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.quinn_documents(id) ON DELETE CASCADE,
  binder_id UUID,
  extracted_json JSONB NOT NULL DEFAULT '{}',
  confidence_json JSONB NOT NULL DEFAULT '{}',
  confirmed_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quinn_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own extractions" ON public.quinn_extractions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quinn_documents d WHERE d.id = document_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can create extractions" ON public.quinn_extractions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quinn_documents d WHERE d.id = document_id AND d.user_id = auth.uid())
);
