-- Crear función para ejecutar RLS setup
CREATE OR REPLACE FUNCTION public.setup_rls()
RETURNS void AS $$
BEGIN
  -- Enable RLS on all tables
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

  -- Drop existing insecure policies
  DROP POLICY IF EXISTS "Public read" ON users;
  DROP POLICY IF EXISTS "Users can access their own data" ON users;
  DROP POLICY IF EXISTS "allow_all" ON users;
  DROP POLICY IF EXISTS "allow_all" ON properties;
  DROP POLICY IF EXISTS "allow_all" ON bookings;
  DROP POLICY IF EXISTS "allow_all" ON conversations;
  DROP POLICY IF EXISTS "allow_all" ON messages;
  DROP POLICY IF EXISTS "allow_all" ON ratings;
  DROP POLICY IF EXISTS "allow_all" ON magic_links;

  -- USERS TABLE
  CREATE POLICY "users_view_own" ON users FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  CREATE POLICY "public_host_profiles" ON users FOR SELECT USING (user_type = 'host');

  -- PROPERTIES TABLE
  CREATE POLICY "properties_public_read" ON properties FOR SELECT USING (true);
  CREATE POLICY "properties_host_create" ON properties FOR INSERT WITH CHECK (auth.uid() = host_id);
  CREATE POLICY "properties_host_modify" ON properties FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
  CREATE POLICY "properties_host_delete" ON properties FOR DELETE USING (auth.uid() = host_id);

  -- BOOKINGS TABLE
  CREATE POLICY "bookings_guest_read" ON bookings FOR SELECT USING (auth.uid() = guest_id);
  CREATE POLICY "bookings_host_read" ON bookings FOR SELECT USING (auth.uid() = host_id);
  CREATE POLICY "bookings_guest_create" ON bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
  CREATE POLICY "bookings_guest_update" ON bookings FOR UPDATE USING (auth.uid() = guest_id) WITH CHECK (auth.uid() = guest_id);
  CREATE POLICY "bookings_host_update" ON bookings FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

  -- CONVERSATIONS TABLE
  CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (auth.uid() IN (guest_id, host_id));
  CREATE POLICY "conversations_create" ON conversations FOR INSERT WITH CHECK (true);

  -- MESSAGES TABLE
  CREATE POLICY "messages_read" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE guest_id = auth.uid() OR host_id = auth.uid()));
  CREATE POLICY "messages_create" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

  -- RATINGS TABLE
  CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (true);
  CREATE POLICY "ratings_guest_create" ON ratings FOR INSERT WITH CHECK (auth.uid() = guest_id);

  -- MAGIC_LINKS TABLE
  CREATE POLICY "magic_links_create" ON magic_links FOR INSERT WITH CHECK (true);
  CREATE POLICY "magic_links_read" ON magic_links FOR SELECT USING (true);

  -- Grant permissions
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
END;
$$ LANGUAGE plpgsql;
