
CREATE TABLE public.binder_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  binder_id uuid REFERENCES public.binders(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL DEFAULT 'user',
  actor_name text NOT NULL DEFAULT 'System',
  action_type text NOT NULL,
  target text NOT NULL DEFAULT 'binder',
  target_id text,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric,
  source text NOT NULL DEFAULT 'ui',
  undo_token text,
  is_confirmed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.binder_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read binder activity" ON public.binder_activity FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create binder activity" ON public.binder_activity FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Authenticated users can update binder activity" ON public.binder_activity FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Authenticated users can delete binder activity" ON public.binder_activity FOR DELETE USING (auth.role() = 'authenticated'::text);

CREATE INDEX idx_binder_activity_binder_id ON public.binder_activity(binder_id);
CREATE INDEX idx_binder_activity_timestamp ON public.binder_activity(timestamp DESC);
