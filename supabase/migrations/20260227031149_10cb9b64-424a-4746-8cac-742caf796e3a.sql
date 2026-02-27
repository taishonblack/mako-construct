
-- Add canonical route fields to routes table
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS binder_id uuid REFERENCES public.binders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS iso_number integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

-- Create route_hops table
CREATE TABLE public.route_hops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  hop_type text NOT NULL DEFAULT 'custom',
  label text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'unknown',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_route_hops_route_id ON public.route_hops(route_id);
CREATE INDEX idx_routes_binder_id ON public.routes(binder_id);

-- Enable RLS
ALTER TABLE public.route_hops ENABLE ROW LEVEL SECURITY;

-- RLS policies for route_hops (match routes table pattern)
CREATE POLICY "Anyone can read route hops" ON public.route_hops FOR SELECT USING (true);
CREATE POLICY "Anyone can create route hops" ON public.route_hops FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update route hops" ON public.route_hops FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete route hops" ON public.route_hops FOR DELETE USING (true);

-- Updated_at trigger for route_hops
CREATE TRIGGER update_route_hops_updated_at
  BEFORE UPDATE ON public.route_hops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
