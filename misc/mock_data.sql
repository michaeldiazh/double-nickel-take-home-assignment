-- Mock Data for Double Nickel Take-Home Challenge
-- All IDs are UUIDv4 format (version 4, variant bits set correctly)
-- Using only valid hex characters (0-9, a-f)

-- Clear existing data (optional - use with caution)
-- TRUNCATE TABLE messages CASCADE;
-- TRUNCATE TABLE conversation_job_requirements CASCADE;
-- TRUNCATE TABLE conversations CASCADE;
-- TRUNCATE TABLE applications CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE jobs CASCADE;
-- TRUNCATE TABLE job_requirements CASCADE;
-- TRUNCATE TABLE job_facts CASCADE;

-- Users
INSERT INTO users (id, first_name, last_name, email, password, address, apt_num, state, zip_code) VALUES
('11111111-1111-4111-8111-111111111111', 'John', 'Doe', 'john.doe@example.com', 'password123', '123 Main Street', 'Apt 4B', 'CA', '90210'),
('22222222-2222-4222-8222-222222222222', 'Jane', 'Smith', 'jane.smith@example.com', 'password123', '456 Oak Avenue', NULL, 'NY', '10001'),
('33333333-3333-4333-8333-333333333333', 'Bob', 'Johnson', 'bob.johnson@example.com', 'password123', '789 Pine Road', 'Suite 200', 'TX', '75001'),
('44444444-4444-4444-8444-444444444444', 'Alice', 'Williams', 'alice.williams@example.com', 'password123', '321 Elm Street', NULL, 'FL', '33101'),
('55555555-5555-4555-8555-555555555555', 'Charlie', 'Brown', 'charlie.brown@example.com', 'password123', '654 Maple Drive', 'Unit 5', 'IL', '60601');

-- Jobs
INSERT INTO jobs (id, name, description, location, is_active, payment_info) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Truck Driver', 'Long-haul truck driver position requiring CDL Class A license. Must have 2+ years experience.', 'Los Angeles, CA', true, '{"hourly_rate": 25, "benefits": ["health", "dental", "401k"]}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Delivery Driver', 'Local delivery driver position. Flexible schedule, company vehicle provided.', 'San Francisco, CA', true, '{"hourly_rate": 20, "benefits": ["health"]}'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Warehouse Associate', 'Warehouse operations position. Forklift certification preferred.', 'Houston, TX', true, '{"hourly_rate": 18, "benefits": ["health", "dental"]}'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Logistics Coordinator', 'Coordinate shipping and receiving operations. Office-based position.', 'Miami, FL', true, '{"salary": 45000, "benefits": ["health", "dental", "401k", "pto"]}'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Fleet Manager', 'Manage fleet operations and maintenance. Management experience required.', 'Chicago, IL', false, '{"salary": 65000, "benefits": ["health", "dental", "401k", "pto", "bonus"]}');

-- Applications
INSERT INTO applications (id, user_id, job_id) VALUES
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
('b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', '33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
('d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', '11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
('e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', '44444444-4444-4444-8444-444444444444', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

-- Conversations
INSERT INTO conversations (id, application_id, is_active, conversation_status, screening_decision, screening_summary) VALUES
('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', true, 'DONE', 'APPROVED', 'Candidate meets all requirements. Approved for position.'),
('f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', true, 'ON_JOB_QUESTIONS', 'PENDING', NULL),
('f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', true, 'ON_REQ', 'PENDING', NULL),
('f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f4f4', 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', false, 'DONE', 'DENIED', 'Candidate does not meet minimum requirements.'),
('f5f5f5f5-f5f5-4f5f-8f5f-f5f5f5f5f5f5', 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', true, 'START', 'PENDING', NULL);

-- Messages (sample messages for conversations)
INSERT INTO messages (id, conversation_id, sender, content) VALUES
-- Conversation 1 (Approved)
('10101010-1010-4101-8101-101010101010', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'ASSISTANT', 'Hello! I''m here to help you with your application for the Truck Driver position. Let me start by asking you a few questions.'),
('20202020-2020-4202-8202-202020202020', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'USER', 'Hi, I''m interested in this position. I have 5 years of experience driving trucks.'),
('30303030-3030-4303-8303-303030303030', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'ASSISTANT', 'Great! Do you have a valid CDL Class A license?'),
('40404040-4040-4404-8404-404040404040', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'USER', 'Yes, I have a CDL Class A license that''s been valid for 5 years.'),

-- Conversation 2 (Pending - On Job Questions)
('50505050-5050-4505-8505-505050505050', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', 'ASSISTANT', 'Welcome! I''m here to help with your Delivery Driver application.'),
('60606060-6060-4606-8606-606060606060', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', 'USER', 'Hello, I''d like to apply.'),

-- Conversation 3 (Pending - On Requirements)
('70707070-7070-4707-8707-707070707070', 'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', 'ASSISTANT', 'Thank you for your interest in the Warehouse Associate position.'),
('80808080-8080-4808-8808-808080808080', 'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', 'USER', 'I have warehouse experience.'),

-- Conversation 4 (Denied)
('90909090-9090-4909-8909-909090909090', 'f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f4f4', 'ASSISTANT', 'Hello! Let''s start your application process.'),
('a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0', 'f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f4f4', 'USER', 'I don''t have much experience.'),

-- Conversation 5 (Pending - Start)
('b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0', 'f5f5f5f5-f5f5-4f5f-8f5f-f5f5f5f5f5f5', 'ASSISTANT', 'Welcome! I''m here to help with your Logistics Coordinator application.');

-- Job Requirements (for Truck Driver job)
INSERT INTO job_requirements (id, job_id, requirement_type, requirement_description, criteria, priority) VALUES
('11111111-1111-4111-8111-111111111112', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cdl_class', 'Must have valid CDL Class A license', '{"class": "A", "valid": true}', 1),
('22222222-2222-4222-8222-222222222223', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'years_experience', 'Minimum 2 years of truck driving experience', '{"min_years": 2}', 2),
('33333333-3333-4333-8333-333333333334', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'driving_record', 'Clean driving record required', '{"max_violations": 0, "max_accidents": 0}', 3),
('44444444-4444-4444-8444-444444444445', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'drug_test', 'Must pass drug test', '{"required": true}', 4),
('55555555-5555-4555-8555-555555555556', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'physical_exam', 'Must pass DOT physical exam', '{"required": true, "dot_certified": true}', 5);

-- Job Requirements (for Delivery Driver job)
INSERT INTO job_requirements (id, job_id, requirement_type, requirement_description, criteria, priority) VALUES
('66666666-6666-4666-8666-666666666667', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'driving_record', 'Clean driving record preferred', '{"max_violations": 2, "max_accidents": 1}', 1),
('77777777-7777-4777-8777-777777777778', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'age_requirement', 'Must be at least 21 years old', '{"min_age": 21}', 2);

-- Job Facts
INSERT INTO job_facts (id, job_id, fact_type, content) VALUES
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'company_info', 'We are a leading transportation company with over 20 years of experience.'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'benefits', 'We offer competitive pay, health insurance, dental, and 401k matching.'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'company_info', 'Fast-growing delivery service with flexible schedules.'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'benefits', 'Company vehicle provided, health insurance included.');

-- Conversation Job Requirements (for conversation 1 - some completed)
INSERT INTO conversation_job_requirements (id, conversation_id, job_requirement_id, status, extracted_value, evaluated_at) VALUES
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '11111111-1111-4111-8111-111111111112', 'MET', '{"class": "A", "valid": true}', NOW()),
('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '22222222-2222-4222-8222-222222222223', 'MET', '{"years": 5}', NOW()),
('e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '33333333-3333-4333-8333-333333333334', 'MET', '{"violations": 0, "accidents": 0}', NOW()),
('e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '44444444-4444-4444-8444-444444444445', 'MET', '{"passed": true}', NOW()),
('e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '55555555-5555-4555-8555-555555555556', 'MET', '{"passed": true, "dot_certified": true}', NOW());

-- Conversation Job Requirements (for conversation 2 - pending)
INSERT INTO conversation_job_requirements (id, conversation_id, job_requirement_id, status) VALUES
('f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f6f6', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '66666666-6666-4666-8666-666666666667', 'PENDING'),
('f7f7f7f7-f7f7-4f7f-8f7f-f7f7f7f7f7f7', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '77777777-7777-4777-8777-777777777778', 'PENDING');
