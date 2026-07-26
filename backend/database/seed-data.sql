-- ==============================================
-- AgentFleet AI - Sample Data for Development
-- V.P.S. Dental & Oral Care - Dr. Rajeev Pratap Singh
-- ==============================================

-- Switch to the tenant schema (replace with actual tenant UUID)
SET search_path TO tenant_vps_dental, public;

-- ==============================================
-- SAMPLE PATIENTS
-- ==============================================

-- Insert sample patients
INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address_line1, city, state, postal_code, dental_history, last_cleaning_date) VALUES
('Guy', 'Hawkins', '1995-03-15', 'Male', '+91-9876543210', 'guy.hawkins@email.com', '123 Main Street', 'Kanpur', 'Uttar Pradesh', '208001', '{"cavities": 2, "root_canals": 0, "implants": 0}', '2026-06-15'),
('Jane', 'Cooper', '1988-07-22', 'Female', '+91-9876543211', 'jane.cooper@email.com', '456 Park Avenue', 'Kanpur', 'Uttar Pradesh', '208002', '{"cavities": 0, "root_canals": 1, "implants": 0}', '2026-05-10'),
('Leslie', 'Alexander', '1992-11-08', 'Male', '+91-9876543212', 'leslie.alex@email.com', '789 Lake Drive', 'Kanpur', 'Uttar Pradesh', '208003', '{"cavities": 1, "root_canals": 0, "implants": 0}', '2026-06-01'),
('Jenny', 'Wilson', '2000-01-30', 'Female', '+91-9876543213', 'jenny.wilson@email.com', '321 River Road', 'Kanpur', 'Uttar Pradesh', '208004', '{"cavities": 0, "root_canals": 0, "implants": 0}', '2026-07-01'),
('Robert', 'Fox', '1985-05-12', 'Male', '+91-9876543214', 'robert.fox@email.com', '654 Hill Street', 'Kanpur', 'Uttar Pradesh', '208005', '{"cavities": 3, "root_canals": 1, "implants": 0}', '2026-04-20'),
('Esther', 'Howard', '1998-09-25', 'Female', '+91-9876543215', 'esther.howard@email.com', '987 Garden Lane', 'Kanpur', 'Uttar Pradesh', '208006', '{"cavities": 0, "root_canals": 0, "implants": 0}', '2026-06-28'),
('Cameron', 'Williamson', '1990-12-14', 'Male', '+91-9876543216', 'cameron.w@email.com', '147 Beach Road', 'Kanpur', 'Uttar Pradesh', '208007', '{"cavities": 2, "root_canals": 0, "implants": 1}', '2026-05-15'),
('Brooklyn', 'Simmons', '1994-04-18', 'Female', '+91-9876543217', 'brooklyn.s@email.com', '258 Forest Path', 'Kanpur', 'Uttar Pradesh', '208008', '{"cavities": 1, "root_canals": 0, "implants": 0}', '2026-07-05');

-- ==============================================
-- SAMPLE APPOINTMENTS
-- ==============================================

-- Get today's date dynamically
DO $$
DECLARE
    today DATE := CURRENT_DATE;
    tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
    next_week DATE := CURRENT_DATE + INTERVAL '7 days';
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
    patient4_id UUID;
    patient5_id UUID;
    patient6_id UUID;
    patient7_id UUID;
    patient8_id UUID;
    doctor_id UUID;
BEGIN
    -- Get patient IDs
    SELECT id INTO patient1_id FROM patients WHERE first_name = 'Guy' AND last_name = 'Hawkins';
    SELECT id INTO patient2_id FROM patients WHERE first_name = 'Jane' AND last_name = 'Cooper';
    SELECT id INTO patient3_id FROM patients WHERE first_name = 'Leslie' AND last_name = 'Alexander';
    SELECT id INTO patient4_id FROM patients WHERE first_name = 'Jenny' AND last_name = 'Wilson';
    SELECT id INTO patient5_id FROM patients WHERE first_name = 'Robert' AND last_name = 'Fox';
    SELECT id INTO patient6_id FROM patients WHERE first_name = 'Esther' AND last_name = 'Howard';
    SELECT id INTO patient7_id FROM patients WHERE first_name = 'Cameron' AND last_name = 'Williamson';
    SELECT id INTO patient8_id FROM patients WHERE first_name = 'Brooklyn' AND last_name = 'Simmons';
    
    -- Get doctor ID (you'll need to create a user first or use NULL for testing)
    -- For now, we'll use NULL or you can replace with actual doctor_id
    
    -- TODAY'S APPOINTMENTS
    INSERT INTO appointments (patient_id, assigned_to, appointment_date, appointment_time, duration, appointment_type, status, reason, notes) VALUES
    (patient1_id, NULL, today, '08:00:00', 30, 'Weekly Visit', 'scheduled', 'Regular checkup', 'Patient requires braces adjustment'),
    (patient2_id, NULL, today, '10:00:00', 45, 'Weekly Visit', 'scheduled', 'Regular checkup', 'Cleaning and polishing'),
    (patient3_id, NULL, today, '14:00:00', 30, 'Weekly Visit', 'scheduled', 'Follow-up visit', 'Check cavity filling'),
    (patient4_id, NULL, today, '16:00:00', 30, 'Routine Checkup', 'scheduled', 'Annual checkup', 'First visit - comprehensive examination');
    
    -- TOMORROW'S APPOINTMENTS
    INSERT INTO appointments (patient_id, assigned_to, appointment_date, appointment_time, duration, appointment_type, status, reason, notes) VALUES
    (patient5_id, NULL, tomorrow, '09:00:00', 60, 'Root Canal', 'scheduled', 'Root canal treatment', 'First session of root canal'),
    (patient6_id, NULL, tomorrow, '11:00:00', 30, 'Cleaning', 'scheduled', 'Teeth cleaning', 'Regular dental cleaning'),
    (patient7_id, NULL, tomorrow, '15:00:00', 45, 'Implant Checkup', 'scheduled', 'Implant follow-up', 'Check implant healing');
    
    -- NEXT WEEK APPOINTMENTS
    INSERT INTO appointments (patient_id, assigned_to, appointment_date, appointment_time, duration, appointment_type, status, reason, notes) VALUES
    (patient8_id, NULL, next_week, '10:00:00', 30, 'Cavity Filling', 'scheduled', 'Cavity treatment', 'Fill cavity in molar'),
    (patient1_id, NULL, next_week + 1, '08:00:00', 30, 'Braces Adjustment', 'scheduled', 'Monthly braces adjustment', 'Regular braces check'),
    (patient2_id, NULL, next_week + 2, '10:00:00', 30, 'Follow-up', 'scheduled', 'Post-treatment checkup', 'Verify healing'),
    (patient3_id, NULL, next_week + 3, '14:00:00', 30, 'Consultation', 'scheduled', 'Whitening consultation', 'Discuss teeth whitening options'),
    (patient4_id, NULL, next_week + 5, '09:00:00', 45, 'Deep Cleaning', 'scheduled', 'Deep cleaning session', 'Scaling and polishing');
    
    -- PAST APPOINTMENTS (for history)
    INSERT INTO appointments (patient_id, assigned_to, appointment_date, appointment_time, duration, appointment_type, status, reason, diagnosis, notes) VALUES
    (patient1_id, NULL, today - 30, '08:00:00', 30, 'Checkup', 'completed', 'Monthly checkup', 'Multiple cavities detected in molars; slight enamel erosion observed', 'Prescribed fluoride toothpaste and scheduled filling'),
    (patient2_id, NULL, today - 45, '10:00:00', 60, 'Root Canal', 'completed', 'Root canal treatment', 'Root canal completed successfully', 'Recovery normal, follow-up scheduled');

END $$;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- View all patients
-- SELECT id, first_name, last_name, phone, email FROM patients ORDER BY first_name;

-- View today's appointments
-- SELECT 
--     a.appointment_date,
--     a.appointment_time,
--     a.appointment_type,
--     a.status,
--     p.first_name || ' ' || p.last_name AS patient_name,
--     p.phone
-- FROM appointments a
-- JOIN patients p ON a.patient_id = p.id
-- WHERE a.appointment_date = CURRENT_DATE
-- ORDER BY a.appointment_time;

-- View appointment counts by date
-- SELECT 
--     appointment_date,
--     COUNT(*) as appointment_count,
--     STRING_AGG(appointment_type, ', ') as types
-- FROM appointments
-- WHERE appointment_date >= CURRENT_DATE
-- GROUP BY appointment_date
-- ORDER BY appointment_date;

COMMIT;
