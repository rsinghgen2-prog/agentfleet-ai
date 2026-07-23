# 🗄️ Database Models & Relations - Complete Guide

## Overview

Multi-tenant PostgreSQL database with separate schemas per tenant for data isolation and security.

---

## 🏗️ Schema Architecture

### **1. Public Schema** (Shared)
Contains platform-level data shared across all tenants:
- `industries` - Available industries (dental, hospital, school, etc.)
- `subscription_plans` - Pricing tiers (Free, Starter, Growth, Scale)
- `tenants` - Organization/company records
- `super_admins` - Platform administrators

### **2. Tenant Schemas** (Isolated)
Each tenant gets their own schema: `tenant_[uuid]`
Contains all business data for that organization.

### **3. Admin Schema** (System)
Platform-level administrative data and logs.

---

## 📊 Entity Relationship Diagram

```
PUBLIC SCHEMA
┌──────────────┐
│  industries  │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐      1:N     ┌────────────────────┐
│   tenants    │◄─────────────┤ subscription_plans │
└──────┬───────┘              └────────────────────┘
       │
       │ Creates
       ▼
┌──────────────────────────────┐
│   tenant_[uuid] SCHEMA       │
├──────────────────────────────┤
│  users                       │
│  roles                       │
│  permissions                 │
│  patients (dental/hospital)  │
│  students (school)           │
│  appointments                │
│  contacts                    │
│  campaigns                   │
│  messages                    │
│  invoices                    │
│  payments                    │
│  analytics_events            │
│  audit_logs                  │
└──────────────────────────────┘
```

---

## 🔐 User & Role System

### **Role Hierarchy**

```
┌─────────────────────────────────────┐
│         SUPER ADMIN                 │
│  (Platform Level - All Tenants)     │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────▼──────┐    ┌───────▼────────┐
│   ADMIN   │    │  ADMIN (T2)    │
│ (Tenant1) │    │                │
└────┬──────┘    └───────┬────────┘
     │                   │
  ┌──┴───┬───────────┬───┴──┐
  │      │           │      │
┌─▼──┐ ┌─▼──┐   ┌───▼─┐  ┌─▼──┐
│Semi│ │Semi│   │Semi │  │Semi│
│Admin││Admin│   │Admin│  │Admin│
└─┬──┘ └─┬──┘   └──┬──┘  └─┬──┘
  │      │         │       │
  ▼      ▼         ▼       ▼
Customers/Users (Patients, Students, etc.)
```

### **Permission Model**

```typescript
// User permissions stored as JSONB
{
  "users": ["create", "read", "update", "delete"],
  "appointments": ["create", "read", "update"],
  "patients": ["read"],
  "billing": ["read"],
  "analytics": ["read"]
}
```

---

## 📋 Core Tables

### **PUBLIC.tenants**
```sql
tenants
├── id (UUID, PK)
├── name (VARCHAR)
├── slug (VARCHAR, UNIQUE)
├── industry_id (UUID, FK → industries)
├── subscription_plan_id (UUID, FK → subscription_plans)
├── schema_name (VARCHAR, UNIQUE)
├── subscription_status (ENUM)
└── settings (JSONB)
```

**Relationships:**
- `1:N` with tenant schema users
- `N:1` with industries
- `N:1` with subscription_plans

---

### **TENANT.users** (Per Tenant)
```sql
users
├── id (UUID, PK)
├── tenant_id (UUID)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── full_name (VARCHAR)
├── role (ENUM: admin, semi_admin, customer, doctor, nurse, teacher)
├── department (VARCHAR)
├── permissions (JSONB)
└── is_active (BOOLEAN)
```

**Relationships:**
- `1:N` with appointments (as assigned_to)
- `1:N` with campaigns (as creator)
- `1:N` with audit_logs

---

### **TENANT.patients** (Dental/Hospital)
```sql
patients
├── id (UUID, PK)
├── first_name, last_name (VARCHAR)
├── date_of_birth (DATE)
├── phone, email (VARCHAR)
├── medical_history (JSONB)
├── allergies (TEXT[])
└── insurance_provider (VARCHAR)
```

**Relationships:**
- `1:N` with appointments
- `1:N` with invoices

**Industry-Specific Fields:**
- **Dental:** `dental_history`, `last_cleaning_date`
- **Hospital:** `blood_group`, `insurance_policy_number`

---

### **TENANT.students** (School)
```sql
students
├── id (UUID, PK)
├── first_name, last_name (VARCHAR)
├── student_id (VARCHAR, UNIQUE)
├── date_of_birth (DATE)
├── guardian_name, guardian_phone (VARCHAR)
├── grade_level, class_section (VARCHAR)
└── enrollment_date (DATE)
```

**Relationships:**
- `1:N` with invoices (tuition)
- `1:N` with attendance records (future)

---

### **TENANT.appointments** (Dental/Hospital)
```sql
appointments
├── id (UUID, PK)
├── patient_id (UUID, FK → patients)
├── assigned_to (UUID, FK → users)
├── appointment_date, appointment_time
├── duration (INTEGER minutes)
├── appointment_type (VARCHAR)
├── status (ENUM: scheduled, confirmed, in_progress, completed, cancelled)
├── diagnosis, treatment_plan (TEXT/JSONB)
└── follow_up_required (BOOLEAN)
```

**Relationships:**
- `N:1` with patients
- `N:1` with users (doctor/dentist)

---

### **TENANT.contacts**
```sql
contacts
├── id (UUID, PK)
├── name, phone, email (VARCHAR)
├── tags (TEXT[])
├── groups (TEXT[])
├── custom_fields (JSONB)
└── is_opted_in (BOOLEAN)
```

**Relationships:**
- `1:N` with messages
- `N:N` with campaigns

---

### **TENANT.campaigns**
```sql
campaigns
├── id (UUID, PK)
├── name, description (VARCHAR/TEXT)
├── message_type (ENUM: whatsapp, sms)
├── message_content (TEXT)
├── target_contacts (UUID[])
├── status (ENUM: draft, scheduled, sending, sent, failed)
├── scheduled_at (TIMESTAMP)
├── sent_count, delivered_count, failed_count (INTEGER)
└── created_by (UUID, FK → users)
```

**Relationships:**
- `1:N` with messages
- `N:1` with users (creator)

---

### **TENANT.messages**
```sql
messages
├── id (UUID, PK)
├── campaign_id (UUID, FK → campaigns)
├── contact_id (UUID, FK → contacts)
├── type, content (VARCHAR/TEXT)
├── recipient_phone (VARCHAR)
├── status (ENUM: pending, sent, delivered, failed, read)
├── sent_at, delivered_at, read_at (TIMESTAMP)
├── provider, provider_message_id (VARCHAR)
└── cost_usd (DECIMAL)
```

**Relationships:**
- `N:1` with campaigns
- `N:1` with contacts

---

### **TENANT.invoices**
```sql
invoices
├── id (UUID, PK)
├── invoice_number (VARCHAR, UNIQUE)
├── billing_date, due_date (DATE)
├── subtotal, tax_amount, total_amount (DECIMAL)
├── status (ENUM: pending, paid, overdue, cancelled)
├── customer_id (UUID) -- polymorphic (patient/student)
├── line_items (JSONB)
└── created_by (UUID, FK → users)
```

**Relationships:**
- `1:N` with payments
- `N:1` with users (creator)

**Line Items Structure (JSONB):**
```json
[
  {
    "description": "Root Canal Treatment",
    "quantity": 1,
    "unit_price": 500.00,
    "total": 500.00
  }
]
```

---

### **TENANT.payments**
```sql
payments
├── id (UUID, PK)
├── invoice_id (UUID, FK → invoices)
├── amount, currency (DECIMAL/VARCHAR)
├── payment_method (ENUM: card, upi, bank_transfer)
├── payment_provider (VARCHAR: stripe, razorpay)
├── provider_payment_id (VARCHAR)
├── status (ENUM: pending, completed, failed, refunded)
└── processed_at (TIMESTAMP)
```

**Relationships:**
- `N:1` with invoices

---

### **TENANT.analytics_events**
```sql
analytics_events
├── id (UUID, PK)
├── event_type (VARCHAR: page_view, message_sent, etc.)
├── event_category, event_action (VARCHAR)
├── user_id (UUID, FK → users)
├── event_data (JSONB)
├── session_id, ip_address, user_agent (VARCHAR)
└── occurred_at (TIMESTAMP)
```

---

### **TENANT.audit_logs**
```sql
audit_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── action (VARCHAR: create, update, delete)
├── entity_type, entity_id (VARCHAR/UUID)
├── old_values, new_values, changes (JSONB)
├── ip_address, user_agent (VARCHAR)
└── created_at (TIMESTAMP)
```

---

## 🔄 Common Query Patterns

### **Get User with Role & Permissions**
```sql
SELECT u.*, r.permissions
FROM users u
LEFT JOIN roles r ON u.role = r.code
WHERE u.email = $1 AND u.is_active = TRUE;
```

### **Get Today's Appointments for Doctor**
```sql
SELECT a.*, p.first_name, p.last_name, p.phone
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.assigned_to = $1 
  AND a.appointment_date = CURRENT_DATE
ORDER BY a.appointment_time;
```

### **Campaign Performance**
```sql
SELECT 
  c.id,
  c.name,
  COUNT(m.id) as total_sent,
  SUM(CASE WHEN m.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN m.status = 'read' THEN 1 ELSE 0 END) as opened,
  ROUND(AVG(m.cost_usd), 4) as avg_cost
FROM campaigns c
LEFT JOIN messages m ON c.id = m.campaign_id
WHERE c.created_by = $1
GROUP BY c.id, c.name
ORDER BY c.created_at DESC;
```

---

## 🔒 Security & Data Isolation

### **Row-Level Security (RLS)**
```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users in their tenant
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### **Tenant Context**
```sql
-- Set tenant context for session
SET app.current_tenant = 'tenant_uuid_here';
```

---

## 📈 Scalability Considerations

### **Indexing Strategy**
- Primary keys on all `id` fields
- Foreign keys indexed automatically
- Composite indexes on frequently queried combinations
- Text search indexes on name fields

### **Partitioning (Future)**
```sql
-- Partition messages by month
CREATE TABLE messages_2026_07 PARTITION OF messages
FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

### **Archiving**
- Move old messages/events to archive tables
- Keep last 12 months in active tables

---

**Version:** 1.0  
**Database:** PostgreSQL 15+  
**ORM:** Prisma/TypeORM
