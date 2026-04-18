-- Khmer POS — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Staff profiles (linked to auth.users via id)
CREATE TABLE staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cashier', 'waiter', 'kitchen', 'manager')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu items
CREATE TABLE menu (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_kh TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image TEXT,
  description TEXT,
  ingredients TEXT[] DEFAULT '{}',
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Restaurant tables
CREATE TABLE tables (
  id BIGSERIAL PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  current_order_id UUID,
  capacity INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  table_id TEXT,
  table_number INT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'sent_to_kitchen', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'khqr')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status_history JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurant settings (key-value with JSON)
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'restaurant',
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE id = auth.uid() AND active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user has one of the given roles
CREATE OR REPLACE FUNCTION has_role(allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = ANY(allowed_roles);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- MENU: public read, manager write
CREATE POLICY "Menu: public read" ON menu FOR SELECT USING (true);
CREATE POLICY "Menu: manager insert" ON menu FOR INSERT WITH CHECK (has_role(ARRAY['manager']));
CREATE POLICY "Menu: manager update" ON menu FOR UPDATE USING (has_role(ARRAY['manager']));
CREATE POLICY "Menu: manager delete" ON menu FOR DELETE USING (has_role(ARRAY['manager']));

-- ORDERS: authenticated read, staff create/update, manager delete
CREATE POLICY "Orders: staff read" ON orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Orders: staff create" ON orders FOR INSERT WITH CHECK (has_role(ARRAY['cashier', 'waiter', 'manager']));
CREATE POLICY "Orders: staff update" ON orders FOR UPDATE USING (has_role(ARRAY['cashier', 'waiter', 'kitchen', 'manager']));
CREATE POLICY "Orders: manager delete" ON orders FOR DELETE USING (has_role(ARRAY['manager']));

-- TABLES: authenticated read, staff write
CREATE POLICY "Tables: staff read" ON tables FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Tables: staff insert" ON tables FOR INSERT WITH CHECK (has_role(ARRAY['cashier', 'waiter', 'manager']));
CREATE POLICY "Tables: staff update" ON tables FOR UPDATE USING (has_role(ARRAY['cashier', 'waiter', 'manager']));

-- STAFF: authenticated read, manager write
CREATE POLICY "Staff: staff read" ON staff FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff: manager insert" ON staff FOR INSERT WITH CHECK (has_role(ARRAY['manager']));
CREATE POLICY "Staff: manager update" ON staff FOR UPDATE USING (has_role(ARRAY['manager']));
CREATE POLICY "Staff: manager delete" ON staff FOR DELETE USING (has_role(ARRAY['manager']));

-- SETTINGS: authenticated read, manager write
CREATE POLICY "Settings: staff read" ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Settings: manager insert" ON settings FOR INSERT WITH CHECK (has_role(ARRAY['manager']));
CREATE POLICY "Settings: manager update" ON settings FOR UPDATE USING (has_role(ARRAY['manager']));

-- ============================================================
-- 3. REALTIME (enable for tables that need live updates)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE menu;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;

-- ============================================================
-- 4. STORAGE BUCKET (for menu images)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

CREATE POLICY "Menu images: public read" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Menu images: manager upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND has_role(ARRAY['manager']));
CREATE POLICY "Menu images: manager delete" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images' AND has_role(ARRAY['manager']));
