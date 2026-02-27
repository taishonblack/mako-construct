
-- Route Profiles (global baseline snapshots)
CREATE TABLE public.route_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'global',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.route_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read route profiles" ON public.route_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create route profiles" ON public.route_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update route profiles" ON public.route_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete route profiles" ON public.route_profiles FOR DELETE USING (true);

-- Route Profile Routes (ISO lines inside a profile)
CREATE TABLE public.route_profile_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_profile_id uuid NOT NULL REFERENCES public.route_profiles(id) ON DELETE CASCADE,
  iso_number int NOT NULL,
  truck_sdi_n int NOT NULL,
  flypack_id text NOT NULL DEFAULT 'Flypack1',
  flypack_sdi_n int NOT NULL,
  encoder_brand text NOT NULL DEFAULT 'Videon',
  videon_unit int NOT NULL,
  videon_input_slot int NOT NULL,
  videon_input_label text NOT NULL,
  tx_label text NOT NULL,
  transport_protocol text NOT NULL DEFAULT 'SRT',
  cloud_endpoint text NOT NULL DEFAULT 'TBD',
  receiver_brand text NOT NULL DEFAULT 'Magewell',
  magewell_unit int,
  lawo_vsm_name text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.route_profile_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read route profile routes" ON public.route_profile_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can create route profile routes" ON public.route_profile_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update route profile routes" ON public.route_profile_routes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete route profile routes" ON public.route_profile_routes FOR DELETE USING (true);

CREATE INDEX idx_route_profile_routes_profile ON public.route_profile_routes(route_profile_id);

-- Route Aliases (nomenclature layer)
CREATE TABLE public.route_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_profile_route_id uuid NOT NULL REFERENCES public.route_profile_routes(id) ON DELETE CASCADE,
  alias_type text NOT NULL,
  alias_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(route_profile_route_id, alias_type)
);

ALTER TABLE public.route_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read route aliases" ON public.route_aliases FOR SELECT USING (true);
CREATE POLICY "Anyone can create route aliases" ON public.route_aliases FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update route aliases" ON public.route_aliases FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete route aliases" ON public.route_aliases FOR DELETE USING (true);

-- Add route_mode and route_profile_id to binders
ALTER TABLE public.binders
  ADD COLUMN IF NOT EXISTS route_mode text NOT NULL DEFAULT 'use_default',
  ADD COLUMN IF NOT EXISTS route_profile_id uuid REFERENCES public.route_profiles(id);

-- Binder Route Overrides (differences vs base profile)
CREATE TABLE public.binder_route_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id uuid NOT NULL REFERENCES public.binders(id) ON DELETE CASCADE,
  route_profile_route_id uuid NOT NULL REFERENCES public.route_profile_routes(id) ON DELETE CASCADE,
  fields_changed jsonb NOT NULL DEFAULT '{}',
  before jsonb NOT NULL DEFAULT '{}',
  after jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.binder_route_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read binder route overrides" ON public.binder_route_overrides FOR SELECT USING (true);
CREATE POLICY "Anyone can create binder route overrides" ON public.binder_route_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update binder route overrides" ON public.binder_route_overrides FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete binder route overrides" ON public.binder_route_overrides FOR DELETE USING (true);

CREATE INDEX idx_binder_route_overrides_binder ON public.binder_route_overrides(binder_id);

-- Binder Routes (for custom mode only)
CREATE TABLE public.binder_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id uuid NOT NULL REFERENCES public.binders(id) ON DELETE CASCADE,
  iso_number int NOT NULL,
  chain jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.binder_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read binder routes" ON public.binder_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can create binder routes" ON public.binder_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update binder routes" ON public.binder_routes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete binder routes" ON public.binder_routes FOR DELETE USING (true);

CREATE INDEX idx_binder_routes_binder ON public.binder_routes(binder_id);

-- Updated_at triggers
CREATE TRIGGER update_route_profiles_updated_at BEFORE UPDATE ON public.route_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_route_profile_routes_updated_at BEFORE UPDATE ON public.route_profile_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
