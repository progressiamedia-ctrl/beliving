-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  user_type VARCHAR NOT NULL CHECK (user_type IN ('guest', 'host')),
  first_name VARCHAR,
  last_name VARCHAR,
  avatar_url VARCHAR,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR NOT NULL,
  guest_id UUID NOT NULL REFERENCES users(id),
  host_id UUID NOT NULL REFERENCES users(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  nights INT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  guest_name VARCHAR NOT NULL,
  guest_email VARCHAR NOT NULL,
  guest_phone VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in),
  CONSTRAINT valid_price CHECK (total_price > 0)
);

-- Magic Links Table
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  property_id VARCHAR NOT NULL,
  guest_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_booking_rating UNIQUE (booking_id)
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  guest_id UUID NOT NULL REFERENCES users(id),
  host_id UUID NOT NULL REFERENCES users(id),
  guest_name VARCHAR NOT NULL,
  host_name VARCHAR NOT NULL,
  guest_email VARCHAR NOT NULL,
  host_email VARCHAR NOT NULL,
  property_id VARCHAR NOT NULL,
  property_title VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_name VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_ratings_property_id ON ratings(property_id);
CREATE INDEX IF NOT EXISTS idx_ratings_guest_id ON ratings(guest_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_id ON conversations(guest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_host_id ON conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id OR true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for bookings table
CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  USING (guest_id = auth.uid() OR host_id = auth.uid() OR true);

CREATE POLICY "Guests can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

-- RLS Policies for conversations table
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (guest_id = auth.uid() OR host_id = auth.uid() OR true);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (guest_id = auth.uid() OR host_id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can view conversation messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR true);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for ratings table
CREATE POLICY "Users can view ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Guests can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (guest_id = auth.uid());
