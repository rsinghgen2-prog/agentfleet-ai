-- AgentFleet AI tenant template
-- Execute after setting search_path to a validated tenant schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_login_ip INET,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(30),
  email VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  medical_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  dental_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_cleaning_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30 CHECK (duration > 0 AND duration <= 480),
  appointment_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  diagnosis TEXT,
  treatment_plan JSONB,
  follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

CREATE TABLE IF NOT EXISTS clinic_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  clinic_name VARCHAR(255) NOT NULL,
  clinic_email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  appointment_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'units',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dentist_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_active_name ON patients (is_active, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_search_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_active_category ON inventory_items (is_active, category);
CREATE INDEX IF NOT EXISTS idx_dentist_notes_updated ON dentist_notes (updated_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patients_updated_at ON patients;
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS inventory_updated_at ON inventory_items;
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS dentist_notes_updated_at ON dentist_notes;
CREATE TRIGGER dentist_notes_updated_at BEFORE UPDATE ON dentist_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();