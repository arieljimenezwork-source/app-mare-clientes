-- =====================================================================
-- SPRINT 1: Migración Consolidada — Mare Cafe
-- Fecha: 10 de Febrero 2026
-- 
-- INSTRUCCIONES: Copiar TODO este archivo y pegarlo en el SQL Editor 
-- de Supabase. Ejecutar de una sola vez.
--
-- ⚠️ Todo es idempotente (IF NOT EXISTS / IF NOT EXISTS) — seguro 
-- para ejecutar múltiples veces sin romper nada.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- 1. MODIFICACIONES A TABLAS EXISTENTES
-- ─────────────────────────────────────────────────────────────────────

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_opt_in boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS shop_code text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count int DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS open_count int DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS click_count int DEFAULT 0;

-- transaction_logs
ALTER TABLE transaction_logs ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- 2. CATÁLOGO DE PRODUCTOS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    name text NOT NULL,
    icon text,
    sort_order int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    base_price numeric(10,2) NOT NULL DEFAULT 0,
    image_url text,
    tags text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    price_modifier numeric(10,2) DEFAULT 0,
    is_default boolean DEFAULT false,
    sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_addons (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) DEFAULT 0,
    addon_group text DEFAULT 'extras',
    is_active boolean DEFAULT true,
    sort_order int DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. POS / VENTAS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    staff_id uuid REFERENCES profiles(id),
    table_number int,
    subtotal numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    payment_method text CHECK (payment_method IN ('cash', 'card', 'mercadopago')) DEFAULT 'cash',
    status text CHECK (status IN ('open', 'closed', 'cancelled')) DEFAULT 'open',
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id),
    variant_id uuid REFERENCES product_variants(id),
    quantity int DEFAULT 1,
    unit_price numeric(10,2) DEFAULT 0,
    addons jsonb DEFAULT '[]'::jsonb,
    line_total numeric(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_closings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    closing_date date NOT NULL,
    total_cash numeric(10,2) DEFAULT 0,
    total_card numeric(10,2) DEFAULT 0,
    total_mercadopago numeric(10,2) DEFAULT 0,
    total_general numeric(10,2) DEFAULT 0,
    order_count int DEFAULT 0,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. LEALTAD / REFERIDOS / PUNTOS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_codes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    code text UNIQUE NOT NULL,
    uses_count int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id uuid REFERENCES profiles(id) NOT NULL,
    referred_id uuid REFERENCES profiles(id) NOT NULL,
    points_awarded int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS points_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shop_code text NOT NULL,
    amount int NOT NULL,
    type text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 5. MARKETING / NOTIFICACIONES
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_queue (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text CHECK (type IN ('email', 'push', 'in_app')) DEFAULT 'in_app',
    title text,
    body text,
    image_url text,
    status text CHECK (status IN ('pending', 'sent', 'read', 'failed')) DEFAULT 'pending',
    sent_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_rules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    trigger_type text CHECK (trigger_type IN ('welcome', 'reactivation_14d', 'birthday')) NOT NULL,
    template_id text,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. FAVORITOS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS favorites (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. RLS (Row Level Security) — Todas las tablas nuevas
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ─── Catálogo: Lectura pública, escritura admin ───

CREATE POLICY "product_categories_public_read" ON product_categories 
    FOR SELECT USING (true);
CREATE POLICY "product_categories_admin_write" ON product_categories 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "products_public_read" ON products 
    FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON products 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "product_variants_public_read" ON product_variants 
    FOR SELECT USING (true);
CREATE POLICY "product_variants_admin_write" ON product_variants 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "product_addons_public_read" ON product_addons 
    FOR SELECT USING (true);
CREATE POLICY "product_addons_admin_write" ON product_addons 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── POS: Staff y admin pueden leer/escribir ───

CREATE POLICY "orders_staff_access" ON orders 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barista'))
    );

CREATE POLICY "order_items_staff_access" ON order_items 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barista'))
    );

CREATE POLICY "daily_closings_admin_access" ON daily_closings 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── Lealtad: Usuarios ven lo suyo, admin ve todo ───

CREATE POLICY "referral_codes_own" ON referral_codes 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "referral_codes_admin" ON referral_codes 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "referral_logs_admin" ON referral_logs 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.uid() = referrer_id
    );

CREATE POLICY "points_ledger_own" ON points_ledger 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "points_ledger_admin" ON points_ledger 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── Notificaciones: Usuarios ven las suyas ───

CREATE POLICY "notification_queue_own" ON notification_queue 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_queue_admin" ON notification_queue 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── Automatizaciones: Solo admin ───

CREATE POLICY "automation_rules_admin" ON automation_rules 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── Favoritos: Usuarios manejan los suyos ───

CREATE POLICY "favorites_own_select" ON favorites 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_own_insert" ON favorites 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_own_delete" ON favorites 
    FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 8. FUNCIÓN SEGURA: add_stamp con validación de client_code
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION add_stamp(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    caller_client_code text;
    target_client_code text;
BEGIN
    -- Get caller info
    SELECT role, client_code INTO caller_role, caller_client_code 
    FROM profiles WHERE id = auth.uid();

    IF caller_role NOT IN ('barista', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can add stamps.';
    END IF;

    -- Get target client_code
    SELECT client_code INTO target_client_code 
    FROM profiles WHERE id = target_user_id;

    -- Cross-validate client_code (with backward compatibility)
    -- If target has a client_code AND it doesn't match caller's, reject
    IF target_client_code IS NOT NULL 
       AND caller_client_code IS NOT NULL 
       AND target_client_code != caller_client_code THEN
        RAISE EXCEPTION 'Client code mismatch: staff and customer belong to different cafés.';
    END IF;

    -- Upsert stamp count
    INSERT INTO stamps (user_id, count)
    VALUES (target_user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        count = stamps.count + 1,
        updated_at = now();

    -- Log transaction
    INSERT INTO transaction_logs (staff_id, user_id, type)
    VALUES (auth.uid(), target_user_id, 'add_stamp');
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 9. ÍNDICES para performance
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_shop_code ON products(shop_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_shop ON product_categories(shop_code);
CREATE INDEX IF NOT EXISTS idx_orders_shop_code ON orders(shop_code);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_campaigns_shop_code ON campaigns(shop_code);
CREATE INDEX IF NOT EXISTS idx_profiles_client_code ON profiles(client_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email_opt_in ON profiles(email_opt_in);

-- ─────────────────────────────────────────────────────────────────────
-- ✅ FIN DE MIGRACIÓN
-- Si todo ejecutó sin errores, la base de datos está lista para
-- Sprint 2 (Catálogo), Sprint 3 (POS), Sprint 4 (Lealtad) y 
-- Sprint 5 (Marketing).
-- ─────────────────────────────────────────────────────────────────────
