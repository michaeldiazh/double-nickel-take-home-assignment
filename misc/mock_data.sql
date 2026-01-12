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
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Regional CDL-A Driver', 'Regional truck driver position covering Northeast and Mid-Atlantic states. Home weekly.', 'Northeast/Mid-Atlantic', true, '{"hourly_rate": 25, "benefits": ["health", "dental", "401k"]}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Local Class B Driver', 'Local delivery driver position within 100-mile radius. Home daily, Monday-Friday schedule.', 'Local Area', true, '{"hourly_rate": 20, "benefits": ["health", "dental", "vision", "life"]}'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'OTR Flatbed Driver', 'Over-the-road flatbed driver position with nationwide routes. Home every 2-3 weeks.', 'Nationwide', true, '{"hourly_rate": 28, "benefits": ["health", "dental", "vision", "401k"]}'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Dedicated Refrigerated Driver', 'Dedicated refrigerated route with consistent lanes. Home weekly.', 'Dedicated Route', true, '{"hourly_rate": 26, "benefits": ["health", "dental", "401k", "profit_sharing"]}'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Local Construction Driver', 'Local construction materials driver in NYC metro area. Home daily.', 'NYC Metro', true, '{"hourly_rate": 24, "benefits": ["health", "pension", "union_benefits"]}');

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

-- Job Requirements
-- Regional CDL-A Driver requirements
INSERT INTO job_requirements (id, job_id, requirement_type, requirement_description, criteria, priority) VALUES
('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'CDL_CLASS', 'Must have valid CDL Class A license', '{"required": true, "cdl_class": "A"}', 1),
('11111111-1111-4111-8111-111111111112', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'YEARS_EXPERIENCE', 'Minimum 2 years of truck driving experience', '{"min_years": 2, "required": true}', 1),
('11111111-1111-4111-8111-111111111113', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'DRIVING_RECORD', 'Clean driving record required', '{"required": true, "max_violations": 0, "max_accidents": 0}', 1),
('11111111-1111-4111-8111-111111111114', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'AGE_REQUIREMENT', 'Must be at least 21 years old', '{"required": true, "min_age": 21}', 2),
('11111111-1111-4111-8111-111111111115', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'PHYSICAL_EXAM', 'Must pass DOT physical exam', '{"required": true, "current_dot_physical": true}', 1),
('11111111-1111-4111-8111-111111111116', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'DRUG_TEST', 'Must pass drug test', '{"required": true, "pre_employment": true, "random_testing": true}', 1),

-- Local Class B Driver requirements
('22222222-2222-4222-8222-222222222221', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'CDL_CLASS', 'Must have valid CDL Class B license', '{"required": true, "cdl_class": "B"}', 1),
('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'YEARS_EXPERIENCE', 'Minimum 1 year of driving experience', '{"min_years": 1, "preferred": true}', 2),
('22222222-2222-4222-8222-222222222223', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'DRIVING_RECORD', 'Clean driving record preferred', '{"required": true, "max_violations": 2, "max_accidents": 1}', 1),
('22222222-2222-4222-8222-222222222224', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'AGE_REQUIREMENT', 'Must be at least 21 years old', '{"required": true, "min_age": 21}', 2),
('22222222-2222-4222-8222-222222222225', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'PHYSICAL_EXAM', 'Must pass DOT physical exam', '{"required": true, "current_dot_physical": true}', 1),
('22222222-2222-4222-8222-222222222226', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'DRUG_TEST', 'Must pass drug test', '{"required": true, "pre_employment": true}', 1),

-- OTR Flatbed Driver requirements
('33333333-3333-4333-8333-333333333331', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'CDL_CLASS', 'Must have valid CDL Class A license', '{"required": true, "cdl_class": "A"}', 1),
('33333333-3333-4333-8333-333333333332', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'YEARS_EXPERIENCE', 'Minimum 3 years of truck driving experience', '{"min_years": 3, "required": true}', 1),
('33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'DRIVING_RECORD', 'Clean driving record required', '{"required": true, "max_violations": 0, "max_accidents": 0}', 1),
('33333333-3333-4333-8333-333333333334', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'ENDORSEMENTS', 'Hazmat and Tanker endorsements preferred', '{"required": false, "hazmat": "preferred", "tanker": "preferred"}', 2),
('33333333-3333-4333-8333-333333333335', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'AGE_REQUIREMENT', 'Must be at least 23 years old', '{"required": true, "min_age": 23}', 2),
('33333333-3333-4333-8333-333333333336', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PHYSICAL_EXAM', 'Must pass DOT physical exam', '{"required": true, "current_dot_physical": true}', 1),
('33333333-3333-4333-8333-333333333337', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'DRUG_TEST', 'Must pass drug test', '{"required": true, "pre_employment": true, "random_testing": true}', 1),

-- Dedicated Refrigerated Driver requirements
('44444444-4444-4444-8444-444444444441', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'CDL_CLASS', 'Must have valid CDL Class A license', '{"required": true, "cdl_class": "A"}', 1),
('44444444-4444-4444-8444-444444444442', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'YEARS_EXPERIENCE', 'Minimum 2 years of truck driving experience', '{"min_years": 2, "required": true}', 1),
('44444444-4444-4444-8444-444444444443', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'DRIVING_RECORD', 'Clean driving record required', '{"required": true, "max_violations": 1, "max_accidents": 0}', 1),
('44444444-4444-4444-8444-444444444444', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'AGE_REQUIREMENT', 'Must be at least 21 years old', '{"required": true, "min_age": 21}', 2),
('44444444-4444-4444-8444-444444444445', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'PHYSICAL_EXAM', 'Must pass DOT physical exam', '{"required": true, "current_dot_physical": true}', 1),
('44444444-4444-4444-8444-444444444446', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'DRUG_TEST', 'Must pass drug test', '{"required": true, "pre_employment": true, "random_testing": true}', 1),

-- Local Construction Driver requirements
('55555555-5555-4555-8555-555555555551', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'CDL_CLASS', 'Must have valid CDL Class A license', '{"required": true, "cdl_class": "A"}', 1),
('55555555-5555-4555-8555-555555555552', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'YEARS_EXPERIENCE', 'Minimum 1 year of truck driving experience', '{"min_years": 1, "required": true}', 1),
('55555555-5555-4555-8555-555555555553', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'DRIVING_RECORD', 'Clean driving record required', '{"required": true, "max_violations": 2, "max_accidents": 1}', 1),
('55555555-5555-4555-8555-555555555554', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'AGE_REQUIREMENT', 'Must be at least 21 years old', '{"required": true, "min_age": 21}', 2),
('55555555-5555-4555-8555-555555555555', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'PHYSICAL_EXAM', 'Must pass DOT physical exam', '{"required": true, "current_dot_physical": true}', 1),
('55555555-5555-4555-8555-555555555556', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'DRUG_TEST', 'Must pass drug test', '{"required": true, "pre_employment": true}', 1);

-- Job Facts
INSERT INTO job_facts (id, job_id, fact_type, content) VALUES
-- Regional CDL-A Driver facts
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ROUTE_TYPE', 'Regional routes covering Northeast and Mid-Atlantic states'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'EQUIPMENT', 'Dry van trailers, 53-foot'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'BENEFITS', 'Health insurance, 401k with match, paid vacation'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SCHEDULE', 'Home weekly, typically out Monday-Friday'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'COMPANY_SIZE', 'Mid-size fleet of 200+ trucks'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SAFETY_RATING', 'DOT Safety Rating: Satisfactory'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'MILES_PER_WEEK', 'Average 2,500-3,000 miles per week'),
('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'LOAD_TYPE', 'General freight, no-touch freight'),

-- Local Class B Driver facts
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ROUTE_TYPE', 'Local routes within 100-mile radius'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'EQUIPMENT', 'Box trucks and straight trucks, Class B'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'BENEFITS', 'Full benefits, dental, vision, life insurance'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b4', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'SCHEDULE', 'Home daily, Monday-Friday schedule'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b5', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'COMPANY_SIZE', 'Local delivery company, 50+ vehicles'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b6', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'SAFETY_RATING', 'Excellent safety record, no recent violations'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b7', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'MILES_PER_WEEK', 'Average 400-500 miles per week'),
('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b8', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'LOAD_TYPE', 'Retail and commercial deliveries'),

-- OTR Flatbed Driver facts
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'ROUTE_TYPE', 'Over-the-road, nationwide routes'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c2', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'EQUIPMENT', 'Flatbed trailers, 48-foot and 53-foot'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c3', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'BENEFITS', 'Comprehensive benefits, 401k, health/dental/vision'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c4', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'SCHEDULE', 'Home every 2-3 weeks, 2-3 days off'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c5', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'COMPANY_SIZE', 'Large fleet, 500+ trucks'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c6', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'SAFETY_RATING', 'DOT Safety Rating: Satisfactory, CSA score: Good'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c7', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'MILES_PER_WEEK', 'Average 2,800-3,200 miles per week'),
('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c8', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'LOAD_TYPE', 'Construction materials, machinery, steel'),

-- Dedicated Refrigerated Driver facts
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'ROUTE_TYPE', 'Dedicated route, same lanes weekly'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d2', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'EQUIPMENT', 'Refrigerated trailers, temperature-controlled'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d3', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'BENEFITS', 'Excellent benefits package, profit sharing'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d4', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'SCHEDULE', 'Home weekly, consistent schedule'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d5', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'COMPANY_SIZE', 'Established company, 300+ refrigerated units'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d6', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'SAFETY_RATING', 'Outstanding safety record, award-winning fleet'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d7', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'MILES_PER_WEEK', 'Average 2,200-2,600 miles per week'),
('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d8', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'LOAD_TYPE', 'Food and beverage products'),

-- Local Construction Driver facts
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'ROUTE_TYPE', 'Local routes, primarily NYC metro area'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e2', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'EQUIPMENT', 'Dump trucks, flatbeds, Class A'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e3', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'BENEFITS', 'Union benefits, health insurance, pension'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e4', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'SCHEDULE', 'Home daily, typical construction hours'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e5', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'COMPANY_SIZE', 'Construction materials supplier, 75+ trucks'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e6', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'SAFETY_RATING', 'Strong safety program, ongoing training'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e7', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'MILES_PER_WEEK', 'Average 300-400 miles per week'),
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e8', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'LOAD_TYPE', 'Construction materials, aggregates, concrete');

-- Conversation Job Requirements (for conversation 1 - some completed)
INSERT INTO conversation_job_requirements (id, conversation_id, job_requirement_id, status, extracted_value, evaluated_at) VALUES
('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '11111111-1111-4111-8111-111111111112', 'MET', '{"class": "A", "valid": true}', NOW()),
('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '22222222-2222-4222-8222-222222222223', 'MET', '{"years": 5}', NOW()),
('e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '33333333-3333-4333-8333-333333333334', 'MET', '{"violations": 0, "accidents": 0}', NOW()),
('e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '44444444-4444-4444-8444-444444444445', 'MET', '{"passed": true}', NOW()),
('e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '55555555-5555-4555-8555-555555555556', 'MET', '{"passed": true, "dot_certified": true}', NOW());

-- Conversation Job Requirements (for conversation 2 - pending)
-- Conversation 2 is for Local Class B Driver job (bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb)
INSERT INTO conversation_job_requirements (id, conversation_id, job_requirement_id, status) VALUES
('f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f6f6', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222221', 'PENDING'),
('f7f7f7f7-f7f7-4f7f-8f7f-f7f7f7f7f7f7', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222222', 'PENDING'),
('f8f8f8f8-f8f8-4f8f-8f8f-f8f8f8f8f8f8', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222223', 'PENDING'),
('f9f9f9f9-f9f9-4f9f-8f9f-f9f9f9f9f9f9', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222224', 'PENDING'),
('fa1a1a1a-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222225', 'PENDING'),
('fb1b1b1b-b1b1-4b1b-8b1b-b1b1b1b1b1b1', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '22222222-2222-4222-8222-222222222226', 'PENDING');
