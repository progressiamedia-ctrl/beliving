-- FASE 0.2: Fix RLS - Remove insecure policies and add secure ones
-- Based on actual schema in complete-schema.sql

-- ============================================
-- DROP INSECURE POLICIES (with OR true)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Guests can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;
DROP POLICY IF EXISTS "Guests can create ratings" ON ratings;

-- ============================================
-- USERS TABLE - Secure Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "users_view_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can view public host profiles
CREATE POLICY "users_view_hosts"
  ON users FOR SELECT
  USING (user_type = 'host');

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BOOKINGS TABLE - Secure Policies
-- ============================================

-- Guests can view their own bookings
CREATE POLICY "bookings_guest_view"
  ON bookings FOR SELECT
  USING (guest_id = auth.uid());

-- Hosts can view bookings for their properties
CREATE POLICY "bookings_host_view"
  ON bookings FOR SELECT
  USING (host_id = auth.uid());

-- Guests can create bookings
CREATE POLICY "bookings_guest_create"
  ON bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

-- Guests can update their own bookings
CREATE POLICY "bookings_guest_update"
  ON bookings FOR UPDATE
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

-- Hosts can update bookings (status, etc.)
CREATE POLICY "bookings_host_update"
  ON bookings FOR UPDATE
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- ============================================
-- CONVERSATIONS TABLE - Secure Policies
-- ============================================

-- Participants can view conversations
CREATE POLICY "conversations_view"
  ON conversations FOR SELECT
  USING (guest_id = auth.uid() OR host_id = auth.uid());

-- Users can create conversations
CREATE POLICY "conversations_create"
  ON conversations FOR INSERT
  WITH CHECK (guest_id = auth.uid() OR host_id = auth.uid());

-- Participants can update conversations
CREATE POLICY "conversations_update"
  ON conversations FOR UPDATE
  USING (guest_id = auth.uid() OR host_id = auth.uid())
  WITH CHECK (guest_id = auth.uid() OR host_id = auth.uid());

-- ============================================
-- MESSAGES TABLE - Secure Policies
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "messages_view"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- Users can send messages
CREATE POLICY "messages_create"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================
-- RATINGS TABLE - Secure Policies
-- ============================================

-- Public can view ratings
CREATE POLICY "ratings_view"
  ON ratings FOR SELECT
  USING (true);

-- Guests can create ratings
CREATE POLICY "ratings_create"
  ON ratings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

-- ============================================
-- MAGIC_LINKS TABLE - Secure Policies
-- ============================================

-- Allow creating magic links
CREATE POLICY "magic_links_create"
  ON magic_links FOR INSERT
  WITH CHECK (true);

-- Allow reading magic links for verification
CREATE POLICY "magic_links_read"
  ON magic_links FOR SELECT
  USING (true);

-- ============================================
-- Grant permissions to service role
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
