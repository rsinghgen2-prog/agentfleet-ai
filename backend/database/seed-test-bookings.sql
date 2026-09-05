-- Idempotent test bookings for dashboard / consultation flows.
-- VPS: 6 patients assigned to Dr. Rajeev Pratap Singh (1 past, 2 today, 3 future).
-- ABC: 6 patients assigned to Dr. Abhijeej Baghel with the same mix.

CREATE SCHEMA IF NOT EXISTS tenant_vps_dental;
CREATE SCHEMA IF NOT EXISTS tenant_abc_dental;

SET search_path TO tenant_vps_dental, public;

INSERT INTO patients (first_name,last_name,date_of_birth,gender,email,phone,city,state,address_line1,dental_history,last_cleaning_date,notes,created_by)
SELECT v.first_name, v.last_name, v.date_of_birth::date, v.gender, v.email, v.phone, v.city, v.state, v.address_line1, v.dental_history::jsonb, v.last_cleaning_date::date, v.notes, u.id
FROM (
  VALUES
    ('Riya','Sen','1993-06-21','Female','riya.sen@example.test','+91-9000001101','Kanpur','Uttar Pradesh','14 Mall Road','{"conditions":["sensitivity"],"risk":"low"}','2026-07-12','Past completed visit for Dr. Rajeev Pratap Singh'),
    ('Nikhil','Bansal','1989-01-09','Male','nikhil.bansal@example.test','+91-9000001102','Kanpur','Uttar Pradesh','22 Swaroop Nagar','{"conditions":["cavity"],"risk":"medium"}','2026-08-01','Today morning visit for Dr. Rajeev Pratap Singh'),
    ('Sana','Qureshi','1996-11-04','Female','sana.qureshi@example.test','+91-9000001103','Kanpur','Uttar Pradesh','8 Civil Lines','{"conditions":["filling"],"risk":"medium"}','2026-07-28','Today in-progress visit for Dr. Rajeev Pratap Singh'),
    ('Mohit','Agarwal','1984-04-17','Male','mohit.agarwal@example.test','+91-9000001104','Kanpur','Uttar Pradesh','5 Kakadeo','{"conditions":["gum_disease"],"risk":"high"}','2026-06-20','Tomorrow visit for Dr. Rajeev Pratap Singh'),
    ('Diya','Nair','1999-08-30','Female','diya.nair@example.test','+91-9000001105','Kanpur','Uttar Pradesh','31 Kidwai Nagar','{"conditions":[],"risk":"low"}','2026-08-18','Next-week visit for Dr. Rajeev Pratap Singh'),
    ('Arnav','Gupta','1991-12-02','Male','arnav.gupta@example.test','+91-9000001106','Kanpur','Uttar Pradesh','19 Tilak Nagar','{"conditions":["root_canal"],"risk":"medium"}','2026-05-22','Near-future visit for Dr. Rajeev Pratap Singh')
) AS v(first_name,last_name,date_of_birth,gender,email,phone,city,state,address_line1,dental_history,last_cleaning_date,notes)
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1
) u
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE lower(p.email) = v.email);

UPDATE appointments a
SET assigned_to = u.id, updated_at = NOW()
FROM (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u
WHERE a.assigned_to IS NULL;

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,diagnosis,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE - 7, '11:00'::time, 30, 'Checkup', 'completed', 'Post-cleaning review', 'Assigned to Dr. Rajeev Pratap Singh', 'Mild sensitivity; oral hygiene reinforced', TRUE, CURRENT_DATE + 90, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'riya.sen@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE - 7 AND a.appointment_time = '11:00');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE, '09:15'::time, 30, 'Consultation', 'confirmed', 'Tooth pain assessment', 'Assigned to Dr. Rajeev Pratap Singh', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'nikhil.bansal@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE AND a.appointment_time = '09:15');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE, '17:00'::time, 45, 'Cavity Filling', 'in_progress', 'Molar filling session', 'Assigned to Dr. Rajeev Pratap Singh — open consultation', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'sana.qureshi@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE AND a.appointment_time = '17:00');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 1, '14:00'::time, 30, 'Cleaning', 'scheduled', 'Preventive cleaning', 'Assigned to Dr. Rajeev Pratap Singh', TRUE, CURRENT_DATE + 180, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'mohit.agarwal@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 1 AND a.appointment_time = '14:00');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 3, '10:30'::time, 45, 'Root Canal', 'scheduled', 'First root canal session', 'Assigned to Dr. Rajeev Pratap Singh', TRUE, CURRENT_DATE + 17, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'arnav.gupta@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 3 AND a.appointment_time = '10:30');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 7, '12:00'::time, 30, 'Whitening Consultation', 'scheduled', 'Discuss whitening options', 'Assigned to Dr. Rajeev Pratap Singh', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE full_name = 'Dr. Rajeev Pratap Singh' AND is_active ORDER BY email = 'rsingh.gen3@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'diya.nair@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 7 AND a.appointment_time = '12:00');

SET search_path TO tenant_abc_dental, public;

INSERT INTO patients (first_name,last_name,date_of_birth,gender,email,phone,city,state,address_line1,dental_history,last_cleaning_date,notes,created_by)
SELECT v.first_name, v.last_name, v.date_of_birth::date, v.gender, v.email, v.phone, v.city, v.state, v.address_line1, v.dental_history::jsonb, v.last_cleaning_date::date, v.notes, u.id
FROM (
  VALUES
    ('Leela','Tiwari','1990-03-14','Female','leela.tiwari@example.test','+91-9100001101','Satna','Madhya Pradesh','12 Rewa Road','{"conditions":["sensitivity"],"risk":"low"}','2026-07-08','Past completed visit'),
    ('Yash','Mishra','1986-10-25','Male','yash.mishra@example.test','+91-9100001102','Satna','Madhya Pradesh','4 Station Road','{"conditions":["cavity"],"risk":"medium"}','2026-08-04','Today morning visit'),
    ('Pooja','Saxena','1997-05-19','Female','pooja.saxena@example.test','+91-9100001103','Satna','Madhya Pradesh','27 Civil Lines','{"conditions":["filling"],"risk":"medium"}','2026-07-22','Today in-progress visit'),
    ('Karan','Dubey','1983-09-11','Male','karan.dubey@example.test','+91-9100001104','Satna','Madhya Pradesh','9 Birla Road','{"conditions":["gum_disease"],"risk":"high"}','2026-06-15','Tomorrow visit'),
    ('Ishita','Jain','2001-02-07','Female','ishita.jain@example.test','+91-9100001105','Satna','Madhya Pradesh','18 City Centre','{"conditions":[],"risk":"low"}','2026-08-20','Next-week visit'),
    ('Vedant','Shah','1992-07-28','Male','vedant.shah@example.test','+91-9100001106','Satna','Madhya Pradesh','6 Patel Nagar','{"conditions":["root_canal"],"risk":"medium"}','2026-05-30','Near-future visit')
) AS v(first_name,last_name,date_of_birth,gender,email,phone,city,state,address_line1,dental_history,last_cleaning_date,notes)
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1
) u
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE lower(p.email) = v.email);

UPDATE appointments a
SET assigned_to = u.id, updated_at = NOW()
FROM (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u
WHERE a.assigned_to IS NULL;

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,diagnosis,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE - 7, '10:00'::time, 30, 'Checkup', 'completed', 'Post-cleaning review', 'Assigned to clinic dentist', 'Stable after scaling', TRUE, CURRENT_DATE + 90, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'leela.tiwari@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE - 7 AND a.appointment_time = '10:00');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE, '11:30'::time, 30, 'Consultation', 'confirmed', 'Tooth pain assessment', 'Assigned to clinic dentist', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'yash.mishra@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE AND a.appointment_time = '11:30');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE, '16:00'::time, 45, 'Cavity Filling', 'in_progress', 'Molar filling session', 'Open consultation test visit', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'pooja.saxena@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE AND a.appointment_time = '16:00');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 1, '14:30'::time, 30, 'Cleaning', 'scheduled', 'Preventive cleaning', 'Assigned to clinic dentist', TRUE, CURRENT_DATE + 180, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'karan.dubey@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 1 AND a.appointment_time = '14:30');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 3, '09:30'::time, 45, 'Root Canal', 'scheduled', 'First root canal session', 'Assigned to clinic dentist', TRUE, CURRENT_DATE + 17, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'vedant.shah@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 3 AND a.appointment_time = '09:30');

INSERT INTO appointments (patient_id,assigned_to,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by)
SELECT p.id, u.id, CURRENT_DATE + 7, '11:00'::time, 30, 'Whitening Consultation', 'scheduled', 'Discuss whitening options', 'Assigned to clinic dentist', FALSE, NULL, u.id
FROM patients p
JOIN (SELECT id FROM users WHERE is_active ORDER BY email = 'rsingh.niit02@gmail.com' DESC LIMIT 1) u ON TRUE
WHERE p.email = 'ishita.jain@example.test'
AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.appointment_date = CURRENT_DATE + 7 AND a.appointment_time = '11:00');
