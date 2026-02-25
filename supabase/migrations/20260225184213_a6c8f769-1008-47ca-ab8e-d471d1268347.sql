-- Allow anon users to insert/update/delete for development seeding
DROP POLICY IF EXISTS "Authenticated users can create staff contacts" ON public.staff_contacts;
CREATE POLICY "Anyone can create staff contacts" ON public.staff_contacts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update staff contacts" ON public.staff_contacts;
CREATE POLICY "Anyone can update staff contacts" ON public.staff_contacts FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete staff contacts" ON public.staff_contacts;
CREATE POLICY "Anyone can delete staff contacts" ON public.staff_contacts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can create routes" ON public.routes;
CREATE POLICY "Anyone can create routes" ON public.routes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update routes" ON public.routes;
CREATE POLICY "Anyone can update routes" ON public.routes FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete routes" ON public.routes;
CREATE POLICY "Anyone can delete routes" ON public.routes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can create routers" ON public.routers;
CREATE POLICY "Anyone can create routers" ON public.routers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update routers" ON public.routers;
CREATE POLICY "Anyone can update routers" ON public.routers FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete routers" ON public.routers;
CREATE POLICY "Anyone can delete routers" ON public.routers FOR DELETE USING (true);