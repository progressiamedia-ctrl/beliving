-- ADMIN DASHBOARD SETUP
-- Ejecuta este script en Supabase SQL Editor

-- 1. Add is_banned column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Update user_type CHECK constraint to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('guest', 'host', 'admin'));

-- 3. Update your email to admin role (CAMBIAR developer1@invertox.com con tu email)
UPDATE users SET user_type = 'admin' WHERE email = 'developer1@invertox.com';

-- Verificar que se actualizó correctamente
SELECT id, email, user_type FROM users WHERE email = 'developer1@invertox.com';
