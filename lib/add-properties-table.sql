-- FASE 0.3: Add missing properties table
-- This adds the properties table that was missing from the schema

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  rating DECIMAL(3, 2) DEFAULT 5.0,
  verified BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  max_guests INTEGER DEFAULT 2,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for properties table
CREATE POLICY "properties_public_read" ON properties FOR SELECT USING (true);
CREATE POLICY "properties_host_create" ON properties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "properties_host_update" ON properties FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "properties_host_delete" ON properties FOR DELETE USING (auth.uid() = host_id);

GRANT ALL ON properties TO service_role;
