-- Deterministic dental fixture data for development and integration tests.
-- This file is safe to rerun after clearing the tenant schema.
CREATE SCHEMA IF NOT EXISTS tenant_vps_dental;
SET search_path TO tenant_vps_dental, public;

INSERT INTO public.tenants (id, name, slug, industry_id, schema_name, email, city, state, country, subscription_status, settings)
SELECT '11111111-1111-4111-8111-111111111111', 'V.P.S. Dental & Oral Care', 'vps-dental', id, 'tenant_vps_dental', 'info@vpsdental.com', 'Kanpur', 'Uttar Pradesh', 'India', 'active', '{"timezone":"Asia/Kolkata","branding":{"primaryColor":"#005db6","accentColor":"#a23858","logo":"🦷"}}'
FROM public.industries WHERE code = 'dental'
ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, subscription_status = 'active';

INSERT INTO public.tenants (id, name, slug, industry_id, schema_name, email, city, state, country, subscription_status, settings)
SELECT '33333333-3333-4333-8333-333333333333', 'ABC Dental Care', 'abc-dental', id, 'tenant_abc_dental', 'info@abcdental.test', 'Satna', 'Madhya Pradesh', 'India', 'active', '{"timezone":"Asia/Kolkata","branding":{"primaryColor":"#0f766e","accentColor":"#d97706","logo":"🦷"}}'
FROM public.industries WHERE code = 'dental'
ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, subscription_status = 'active';

INSERT INTO users (tenant_id, email, password_hash, full_name, role, permissions, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'dentist@vpsdental.com', crypt(:'seed_password', gen_salt('bf')), 'Dr. Rajeev Pratap Singh', 'admin', '["patients:read","patients:write","appointments:read","appointments:write","settings:write","inventory:write"]', TRUE),
  ('11111111-1111-4111-8111-111111111111', 'rsingh.gen3@gmail.com', crypt(:'seed_password', gen_salt('bf')), 'Dr. Rajeev Pratap Singh', 'admin', '["patients:read","patients:write","appointments:read","appointments:write","settings:write","inventory:write"]', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO clinic_settings (clinic_name, clinic_email, phone, address, branding, working_hours, appointment_settings, notifications)
VALUES ('V.P.S. Dental & Oral Care', 'info@vpsdental.com', '+91-XXXXXXXXXX', '{"line1":"128/31, F Block Kidwai Nagar","city":"Kanpur","state":"Uttar Pradesh","postalCode":"208011","country":"India"}', '{"primaryColor":"#005db6","accentColor":"#a23858","logo":"🦷"}', '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00","saturday":"10:00-14:00"}', '{"duration":45,"bufferMinutes":10,"emergencySlots":2}', '{"emailAlerts":true,"smsReminders":true}')
ON CONFLICT (id) DO UPDATE SET clinic_name = EXCLUDED.clinic_name, branding = EXCLUDED.branding;

INSERT INTO patients (first_name,last_name,date_of_birth,gender,email,phone,city,state,dental_history,last_cleaning_date,notes)
VALUES
('Aarav','Sharma','1995-03-15','Male','aarav@example.test','+91-9000000001','Kanpur','Uttar Pradesh','{"conditions":["braces"],"risk":"medium"}','2026-06-15','Active orthodontic treatment'),
('Meera','Cooper','1988-07-22','Female','meera@example.test','+91-9000000002','Kanpur','Uttar Pradesh','{"conditions":["root_canal"],"risk":"low"}','2026-05-10','Upcoming follow-up'),
('Kabir','Alexander','1992-11-08','Male','kabir@example.test','+91-9000000003','Kanpur','Uttar Pradesh','{"conditions":["cavity"],"risk":"medium"}','2026-06-01','Needs filling review'),
('Ananya','Wilson','2000-01-30','Female','ananya@example.test','+91-9000000004','Kanpur','Uttar Pradesh','{"conditions":[],"risk":"low"}','2026-07-01','New patient'),
('Rohan','Fox','1985-05-12','Male','rohan@example.test','+91-9000000005','Kanpur','Uttar Pradesh','{"conditions":["root_canal","cavity"],"risk":"high"}','2026-04-20','Requires treatment plan'),
('Isha','Howard','1998-09-25','Female','isha@example.test','+91-9000000006','Kanpur','Uttar Pradesh','{"conditions":[],"risk":"low"}','2026-06-28','Preventive care'),
('Vihaan','Williamson','1990-12-14','Male','vihaan@example.test','+91-9000000007','Kanpur','Uttar Pradesh','{"conditions":["implant"],"risk":"medium"}','2026-05-15','Implant review'),
('Tara','Simmons','1994-04-18','Female','tara@example.test','+91-9000000008','Kanpur','Uttar Pradesh','{"conditions":["cavity"],"risk":"medium"}','2026-07-05','Follow-up needed'),
('Dev','Patel','1979-02-11','Male','dev@example.test','+91-9000000009','Kanpur','Uttar Pradesh','{"conditions":["gum_disease"],"risk":"high"}','2026-03-12','Overdue cleaning'),
('Zoya','Khan','2010-08-19','Female','zoya@example.test','+91-9000000010','Kanpur','Uttar Pradesh','{"conditions":["braces"],"risk":"low"}','2026-07-10','Minor patient; guardian consent required')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (name,category,quantity,reorder_level,unit)
VALUES ('Dental Examination Kit','Diagnostic',24,10,'kits'),('Composite Resin A2','Restorative',8,10,'syringes'),('Nitrile Examination Gloves','Consumables',12,15,'boxes'),('Fluoride Varnish','Preventive',4,8,'packs'),('Sterilization Pouches','Sterilization',42,10,'packs'),('Orthodontic Brackets','Orthodontics',16,8,'sets')
ON CONFLICT DO NOTHING;

INSERT INTO appointments (patient_id,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date)
SELECT p.id, CURRENT_DATE, '08:00', 30, 'Checkup', 'confirmed', 'Regular checkup', 'Active patient', FALSE, NULL FROM patients p WHERE p.email='aarav@example.test'
UNION ALL SELECT p.id, CURRENT_DATE, '10:00', 45, 'Cleaning', 'scheduled', 'Preventive cleaning', 'Confirm SMS reminder', TRUE, CURRENT_DATE + 30 FROM patients p WHERE p.email='meera@example.test'
UNION ALL SELECT p.id, CURRENT_DATE, '14:00', 30, 'Cavity Filling', 'in_progress', 'Filling review', 'Review previous notes', FALSE, NULL FROM patients p WHERE p.email='kabir@example.test'
UNION ALL SELECT p.id, CURRENT_DATE, '16:00', 30, 'Consultation', 'scheduled', 'New patient assessment', 'Collect history', FALSE, NULL FROM patients p WHERE p.email='ananya@example.test'
UNION ALL SELECT p.id, CURRENT_DATE + 1, '09:00', 60, 'Root Canal', 'scheduled', 'Treatment session', 'Requires treatment plan', TRUE, CURRENT_DATE + 14 FROM patients p WHERE p.email='rohan@example.test'
UNION ALL SELECT p.id, CURRENT_DATE + 1, '11:00', 30, 'Cleaning', 'scheduled', 'Routine cleaning', NULL, FALSE, NULL FROM patients p WHERE p.email='isha@example.test'
UNION ALL SELECT p.id, CURRENT_DATE + 2, '15:00', 45, 'Implant Review', 'scheduled', 'Implant follow-up', 'Check healing', TRUE, CURRENT_DATE + 30 FROM patients p WHERE p.email='vihaan@example.test'
UNION ALL SELECT p.id, CURRENT_DATE + 7, '10:00', 30, 'Cavity Filling', 'scheduled', 'Molar filling', NULL, FALSE, NULL FROM patients p WHERE p.email='tara@example.test'
UNION ALL SELECT p.id, CURRENT_DATE - 30, '08:00', 30, 'Checkup', 'completed', 'Monthly checkup', 'Completed successfully', TRUE, CURRENT_DATE + 7 FROM patients p WHERE p.email='dev@example.test'
UNION ALL SELECT p.id, CURRENT_DATE - 45, '10:00', 30, 'Braces Adjustment', 'no_show', 'Monthly adjustment', 'Patient did not attend', TRUE, CURRENT_DATE + 3 FROM patients p WHERE p.email='zoya@example.test';

SET search_path TO tenant_abc_dental, public;

INSERT INTO users (tenant_id, email, password_hash, full_name, role, permissions, is_active)
VALUES ('33333333-3333-4333-8333-333333333333', 'rsingh.niit02@gmail.com', crypt(:'abc_seed_password', gen_salt('bf')), 'Dr. Abhijeej Baghel', 'admin', '["patients:read","patients:write","appointments:read","appointments:write","settings:write","inventory:write"]', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO clinic_settings (clinic_name, clinic_email, phone, address, branding, working_hours, appointment_settings, notifications)
VALUES ('ABC Dental Care', 'info@abcdental.test', '+91-XXXXXXXXXX', '{"line1":"abcd","city":"Satna","state":"Madhya Pradesh","postalCode":"485447","country":"India"}', '{"primaryColor":"#0f766e","accentColor":"#d97706","logo":"🦷"}', '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00","saturday":"10:00-14:00"}', '{"duration":45,"bufferMinutes":10,"emergencySlots":2}', '{"emailAlerts":true,"smsReminders":true}')
ON CONFLICT (id) DO UPDATE SET clinic_name = EXCLUDED.clinic_name, clinic_email = EXCLUDED.clinic_email, address = EXCLUDED.address, branding = EXCLUDED.branding;

INSERT INTO patients (first_name,last_name,date_of_birth,gender,email,phone,city,state,dental_history,last_cleaning_date,notes)
VALUES
('Nisha','Baghel','1991-02-18','Female','nisha@example.test','+91-9100000001','Satna','Madhya Pradesh','{"conditions":["cavity"],"risk":"medium"}','2026-06-12','ABC Dental Care test patient'),
('Arjun','Verma','1987-09-03','Male','arjun@example.test','+91-9100000002','Satna','Madhya Pradesh','{"conditions":[],"risk":"low"}','2026-07-03','ABC Dental Care follow-up test patient')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (name,category,quantity,reorder_level,unit)
VALUES ('Dental Examination Kit','Diagnostic',12,5,'kits'),('Nitrile Examination Gloves','Consumables',6,10,'boxes')
ON CONFLICT DO NOTHING;

INSERT INTO appointments (patient_id,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date)
SELECT p.id, CURRENT_DATE, '09:00', 30, 'Checkup', 'scheduled', 'Initial examination', 'ABC Dental Care test appointment', TRUE, CURRENT_DATE + 30 FROM patients p WHERE p.email='nisha@example.test'
UNION ALL SELECT p.id, CURRENT_DATE + 1, '11:00', 45, 'Cleaning', 'scheduled', 'Preventive cleaning', 'ABC Dental Care follow-up', FALSE, NULL FROM patients p WHERE p.email='arjun@example.test';
