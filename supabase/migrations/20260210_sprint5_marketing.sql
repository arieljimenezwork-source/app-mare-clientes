-- =====================================================================
-- SPRINT 5: Marketing & Polish — Mare Cafe
-- Fecha: 10 de Febrero 2026
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. CAMPAIGNS TABLE (Full Definition)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_code text NOT NULL,
    title text NOT NULL,
    content text,
    html text, -- For the generated HTML email
    audience text DEFAULT 'all', -- 'all', 'vip', 'churned', etc.
    status text CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')) DEFAULT 'draft',
    
    -- Metrics
    sent_count int DEFAULT 0,
    open_count int DEFAULT 0,
    click_count int DEFAULT 0,
    
    scheduled_at timestamptz,
    sent_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. CAMPAIGN LOGS (Detailed delivery logs - Optional but recommended)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    email text NOT NULL,
    status text CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complaint')) DEFAULT 'sent',
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_logs ENABLE ROW LEVEL SECURITY;

-- Admins manage all campaigns
CREATE POLICY "campaigns_admin_all" ON campaigns 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins view logs
CREATE POLICY "campaign_logs_admin_select" ON campaign_logs 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─────────────────────────────────────────────────────────────────────
-- 4. INDICES
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_shop_code ON campaigns(shop_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON campaign_logs(campaign_id);
