-- =====================================================
-- TENANT SCHEMA TABLES
-- This schema is created for EACH tenant
-- Schema name: tenant_[uuid]
-- =====================================================

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

-- Users table (per tenant)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- reference to public.tenants

    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,

    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'admin', 'semi_admin', 'customer'
    department VARCHAR(100), -- for semi-admins
    permissions JSONB DEFAULT '[]', -- custom permissions array

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,

    -- Security
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}', -- custom fields per industry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'semi_admin', 'customer', 'doctor', 'nurse', 'teacher', 'staff'))
);

-- Roles (customizable per tenant)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE, -- cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL, -- 'users', 'appointments', 'billing'
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDUSTRY-SPECIFIC TABLES
-- =====================================================

-- DENTAL/HOSPITAL: Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),

    -- Address
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),

    -- Medical
    medical_history JSONB DEFAULT '{}',
    allergies TEXT[],
    current_medications TEXT[],

    -- Insurance (Hospital)
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),

    -- Dental specific
    dental_history JSONB DEFAULT '{}',
    last_cleaning_date DATE,

    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- DENTAL/HOSPITAL: Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id), -- doctor/dentist

    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    appointment_type VARCHAR(100), -- 'checkup', 'cleaning', 'surgery'

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'

    -- Details
    reason TEXT,
    notes TEXT,
    diagnosis TEXT,
    treatment_plan JSONB,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,


-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Message
    message_type VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms'
    message_content TEXT NOT NULL,
    message_template_id UUID,

    -- Targeting
    target_contacts UUID[], -- array of contact IDs
    target_groups TEXT[],
    target_tags TEXT[],

    -- Scheduling
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,

    -- Stats
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Messages (individual message tracking)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),

    -- Message
    type VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms'
    content TEXT NOT NULL,

    -- Recipient
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'

    -- Delivery
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    -- Provider
    provider VARCHAR(50), -- 'twilio', 'vonage'
    provider_message_id VARCHAR(255),

    -- Cost
    cost_usd DECIMAL(10,4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Templates
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms'
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- ['name', 'date']

    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- BILLING & PAYMENTS
-- =====================================================

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_number VARCHAR(100) NOT NULL UNIQUE,

    -- Billing
    billing_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    paid_at TIMESTAMP,

    -- Payment
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),

    -- Customer (for non-subscription invoices)
    customer_id UUID, -- could be patient, student, etc.
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),

    -- Line items
    line_items JSONB DEFAULT '[]',

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_id UUID REFERENCES invoices(id),

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment Method
    payment_method VARCHAR(50) NOT NULL, -- 'card', 'upi', 'bank_transfer'
    payment_provider VARCHAR(50), -- 'stripe', 'razorpay'

    -- Provider Details
    provider_payment_id VARCHAR(255),
    provider_response JSONB,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'

    -- Timestamps
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

-- Analytics Events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'message_sent', 'appointment_created'
    event_category VARCHAR(100),
    event_action VARCHAR(100),

    -- User
    user_id UUID REFERENCES users(id),

    -- Data
    event_data JSONB DEFAULT '{}',

    -- Session
    session_id VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Timestamp
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- Action
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(100) NOT NULL, -- 'user', 'patient', 'appointment'
    entity_id UUID,

    -- Details
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    -- Notification
    type VARCHAR(50) NOT NULL, -- 'appointment_reminder', 'payment_due', 'message_received'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Action
    action_url TEXT,
    action_label VARCHAR(100),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Patients
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_active ON patients(is_active);

-- Appointments
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(assigned_to);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Students
CREATE INDEX idx_students_name ON students(last_name, first_name);
CREATE INDEX idx_students_grade ON students(grade_level);

-- Contacts
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at);

-- Messages
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- Invoices
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Analytics
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_occurred ON analytics_events(occurred_at);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

-- SCHOOL: Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    student_id VARCHAR(50) UNIQUE,

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Guardian Info
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_email VARCHAR(255),
    guardian_relation VARCHAR(50),

    -- Academic
    grade_level VARCHAR(50),
    class_section VARCHAR(50),
    enrollment_date DATE,

    -- Address
    address_line1 VARCHAR(255),
    city VARCHAR(100),

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MESSAGE AUTOMATION
-- =====================================================

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),

    -- Grouping
    tags TEXT[] DEFAULT '{}',
    groups TEXT[] DEFAULT '{}',

    -- Custom fields
    custom_fields JSONB DEFAULT '{}',

    -- Status
    is_opted_in BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
