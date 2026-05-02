-- FASE 0.2: Enable RLS on all tables
-- This script enables Row Level Security for all tables
-- Note: Uses auth.uid() for Supabase Auth users
-- For localStorage-based auth, validation is done in application code

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Drop existing insecure policies (they used OR true)
DROP POLICY IF EXISTS "Public read" ON users;
DROP POLICY IF EXISTS "Users can access their own data" ON users;
DROP POLICY IF EXISTS "allow_all" ON users;
DROP POLICY IF EXISTS "allow_all" ON properties;
DROP POLICY IF EXISTS "allow_all" ON bookings;
DROP POLICY IF EXISTS "allow_all" ON conversations;
DROP POLICY IF EXISTS "allow_all" ON messages;
DROP POLICY IF EXISTS "allow_all" ON ratings;
DROP POLICY IF EXISTS "allow_all" ON magic_links;

-- ============================================
-- USERS TABLE
-- ============================================

-- 1. Users can view their own profile
CREATE POLICY "users_view_own"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Public profiles for hosts (for public pages)
CREATE POLICY "public_host_profiles"
  ON users
  FOR SELECT
  USING (user_type = 'host');

-- ============================================
-- PROPERTIES TABLE
-- ============================================

-- 1. Everyone can read properties (public catalog)
CREATE POLICY "properties_public_read"
  ON properties
  FOR SELECT
  USING (true);

-- 2. Hosts can create properties
CREATE POLICY "properties_host_create"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- 3. Hosts can update/delete their own properties
CREATE POLICY "properties_host_modify"
  ON properties
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "properties_host_delete"
  ON properties
  FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================
-- BOOKINGS TABLE
-- ============================================

-- 1. Guests can view their own bookings
CREATE POLICY "bookings_guest_read"
  ON bookings
  FOR SELECT
  USING (auth.uid() = guest_id);

-- 2. Hosts can view bookings for their properties
CREATE POLICY "bookings_host_read"
  ON bookings
  FOR SELECT
  USING (auth.uid() = host_id);

-- 3. Guests can create bookings
CREATE POLICY "bookings_guest_create"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- 4. Guests can update their own bookings (cancel)
CREATE POLICY "bookings_guest_update"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = guest_id)
  WITH CHECK (auth.uid() = guest_id);

-- 5. Hosts can update bookings for their properties
CREATE POLICY "bookings_host_update"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

-- 1. Participants can read conversations
CREATE POLICY "conversations_read"
  ON conversations
  FOR SELECT
  USING (auth.uid() IN (guest_id, host_id));

-- 2. System can create conversations (from booking)
-- Allow anyone to create (validated in app code)
CREATE POLICY "conversations_create"
  ON conversations
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- MESSAGES TABLE
-- ============================================

-- 1. Only conversation participants can read messages
CREATE POLICY "messages_read"
  ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- 2. Authenticated users can create messages
CREATE POLICY "messages_create"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- RATINGS TABLE
-- ============================================

-- 1. Everyone can read ratings (public reviews)
CREATE POLICY "ratings_public_read"
  ON ratings
  FOR SELECT
  USING (true);

-- 2. Guests can create ratings for their bookings
CREATE POLICY "ratings_guest_create"
  ON ratings
  FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- ============================================
-- MAGIC_LINKS TABLE
-- ============================================

-- 1. Allow creating magic links (registration flow)
CREATE POLICY "magic_links_create"
  ON magic_links
  FOR INSERT
  WITH CHECK (true);

-- 2. Allow reading magic links by email (verification)
CREATE POLICY "magic_links_read"
  ON magic_links
  FOR SELECT
  USING (true);

-- Grant proper permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify RLS is enabled
-- Run this query to check: SELECT * FROM pg_tables WHERE tablename IN ('users', 'properties', 'bookings', 'conversations', 'messages', 'ratings', 'magic_links');
