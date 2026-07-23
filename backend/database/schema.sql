-- =====================================================
-- AgentFleet AI - PostgreSQL Database Schema
-- Multi-Tenant SaaS Platform
-- =====================================================

-- =====================================================
-- PUBLIC SCHEMA (Shared across all tenants)
-- =====================================================

-- Industries table
CREATE TABLE IF NOT EXISTS public.industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE, -- 'dental', 'hospital', 'school', 'retail'
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Free', 'Starter', 'Growth', 'Scale'
    code VARCHAR(50) NOT NULL UNIQUE,
    price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_inr DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    message_limit INTEGER DEFAULT 100,
    user_limit INTEGER DEFAULT 5,
    features JSONB, -- {"whatsapp": true, "analytics": true}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Organizations)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    industry_id UUID REFERENCES public.industries(id),
    subscription_plan_id UUID REFERENCES public.subscription_plans(id),
    schema_name VARCHAR(100) NOT NULL UNIQUE, -- 'tenant_uuid'
    domain VARCHAR(255), -- custom domain (future)
    
    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    postal_code VARCHAR(20),
    
    -- Subscription
    subscription_status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'suspended', 'cancelled'
    trial_ends_at TIMESTAMP,
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    
    -- Settings
    settings JSONB DEFAULT '{}', -- tenant-specific configurations
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- System super admins (platform level)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default super admin
INSERT INTO public.super_admins (email, password_hash, full_name) 
VALUES ('rsingh.gen2@gmail.com', '$2a$10$encrypted_Aug@2026', 'Super Administrator')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- TENANT SCHEMA TEMPLATE
-- (Created dynamically for each tenant)
-- =====================================================

-- Create function to setup new tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID, schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Set search path
    EXECUTE format('SET search_path TO %I', schema_name);
    
    -- Create tables in tenant schema
    -- (SQL continues in next file due to length)
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_tenants_industry ON public.tenants(industry_id);
CREATE INDEX idx_tenants_subscription ON public.tenants(subscription_plan_id);
CREATE INDEX idx_tenants_status ON public.tenants(subscription_status);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert industries
INSERT INTO public.industries (name, code, description, icon) VALUES
('Dental Clinic', 'dental', 'Dental care and orthodontics', 'smile'),
('Hospital', 'hospital', 'General and specialized hospitals', 'hospital'),
('School', 'school', 'Educational institutions', 'graduation-cap'),
('Retail', 'retail', 'Retail and e-commerce', 'shopping-cart'),
('Restaurant', 'restaurant', 'Food and beverage services', 'utensils'),
('Real Estate', 'real_estate', 'Property management', 'building'),
('Fitness', 'fitness', 'Gyms and fitness centers', 'dumbbell'),
('Salon & Spa', 'salon', 'Beauty and wellness', 'scissors')
ON CONFLICT (code) DO NOTHING;

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, code, price_usd, price_inr, message_limit, user_limit, features) VALUES
('Free', 'free', 0, 0, 100, 1, '{"whatsapp": true, "sms": true, "analytics": false, "api": false}'),
('Starter', 'starter', 29, 2399, 1000, 5, '{"whatsapp": true, "sms": true, "analytics": true, "api": false}'),
('Growth', 'growth', 99, 8199, 10000, 20, '{"whatsapp": true, "sms": true, "analytics": true, "api": true, "advanced_analytics": true}'),
('Scale', 'scale', 299, 24799, -1, -1, '{"whatsapp": true, "sms": true, "analytics": true, "api": true, "advanced_analytics": true, "white_label": true, "dedicated_support": true}')
ON CONFLICT (code) DO NOTHING;
