
-- ============================================
-- Staff Contacts (shared org-wide)
-- ============================================
CREATE TABLE public.staff_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  org text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read staff contacts" ON public.staff_contacts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create staff contacts" ON public.staff_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update staff contacts" ON public.staff_contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete staff contacts" ON public.staff_contacts FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_staff_contacts_updated_at BEFORE UPDATE ON public.staff_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Team Members (shared org-wide)
-- ============================================
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  access text NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create team members" ON public.team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team members" ON public.team_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete team members" ON public.team_members FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Binders (shared org-wide, JSONB for complex nested data)
-- ============================================
CREATE TABLE public.binders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  partner text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  event_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  iso_count integer NOT NULL DEFAULT 12,
  open_issues integer NOT NULL DEFAULT 0,
  transport text NOT NULL DEFAULT 'SRT',
  league text NOT NULL DEFAULT 'NHL',
  container_id text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.binders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read binders" ON public.binders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create binders" ON public.binders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update binders" ON public.binders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete binders" ON public.binders FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_binders_updated_at BEFORE UPDATE ON public.binders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Routes (shared org-wide, JSONB for complex nested objects)
-- ============================================
CREATE TABLE public.routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name text NOT NULL DEFAULT '',
  route_data jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create routes" ON public.routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update routes" ON public.routes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete routes" ON public.routes FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Routers (shared org-wide)
-- ============================================
CREATE TABLE public.routers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  crosspoints jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read routers" ON public.routers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create routers" ON public.routers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update routers" ON public.routers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete routers" ON public.routers FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_routers_updated_at BEFORE UPDATE ON public.routers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Binder Templates (shared org-wide)
-- ============================================
CREATE TABLE public.binder_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.binder_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read binder templates" ON public.binder_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create binder templates" ON public.binder_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete binder templates" ON public.binder_templates FOR DELETE USING (auth.role() = 'authenticated');
