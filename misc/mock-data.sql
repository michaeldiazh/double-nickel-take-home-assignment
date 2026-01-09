-- ============================================
-- MOCK DATA FOR TRUCK DRIVER JOB PLATFORM
-- ============================================
-- This script populates the database with realistic
-- truck driver job application data
-- ============================================

-- ============================================
-- LOOKUP TABLES: Job Facts Types
-- ============================================

INSERT INTO job_facts_type (fact_type, fact_description) VALUES
('ROUTE_TYPE', 'Type of route (local, regional, OTR, dedicated)'),
('EQUIPMENT', 'Type of truck/equipment used (dry van, flatbed, refrigerated, etc.)'),
('BENEFITS', 'Benefits package details (health insurance, 401k, etc.)'),
('SCHEDULE', 'Work schedule information (home daily, weekly, etc.)'),
('COMPANY_SIZE', 'Company size and fleet information'),
('SAFETY_RATING', 'DOT safety rating and company safety record'),
('MILES_PER_WEEK', 'Average miles driven per week'),
('LOAD_TYPE', 'Type of freight/cargo typically hauled');

-- ============================================
-- LOOKUP TABLES: Job Requirement Types
-- ============================================

INSERT INTO job_requirement_type (requirement_type, requirement_description) VALUES
('CDL_CLASS', 'CDL class requirement (Class A, B, or C)'),
('YEARS_EXPERIENCE', 'Minimum years of commercial driving experience'),
('DRIVING_RECORD', 'Driving record requirements (clean MVR, no accidents, etc.)'),
('ENDORSEMENTS', 'CDL endorsements required (Hazmat, Tanker, Doubles/Triples, etc.)'),
('AGE_REQUIREMENT', 'Minimum age requirement'),
('PHYSICAL_EXAM', 'DOT physical exam requirement'),
('DRUG_TEST', 'Drug test requirement and policy'),
('BACKGROUND_CHECK', 'Background check requirements'),
('GEOGRAPHIC_RESTRICTION', 'Geographic restrictions or preferred locations');

-- ============================================
-- ADDRESSES
-- ============================================

-- User addresses
INSERT INTO address (id, address, city, apt_number, state, zip_code) VALUES
('11111111-1111-1111-1111-111111111111', '123 Main Street', 'Brooklyn', '4B', 'NY', '11201'),
('22222222-2222-2222-2222-222222222222', '456 Oak Avenue', 'Queens', NULL, 'NY', '11101'),
('33333333-3333-3333-3333-333333333333', '789 Pine Road', 'Bronx', '12', 'NY', '10451'),
('44444444-4444-4444-4444-444444444444', '321 Elm Street', 'Staten Island', NULL, 'NY', '10301'),
('55555555-5555-5555-5555-555555555555', '654 Maple Drive', 'Manhattan', '8F', 'NY', '10001');

-- Job/Company addresses
INSERT INTO address (id, address, city, apt_number, state, zip_code) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1000 Logistics Way', 'Jersey City', NULL, 'NJ', '07302'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2500 Freight Boulevard', 'Newark', NULL, 'NJ', '07102'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '500 Transport Drive', 'Elizabeth', NULL, 'NJ', '07201'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '750 Highway Plaza', 'Secaucus', NULL, 'NJ', '07094'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '1500 Distribution Center', 'Paterson', NULL, 'NJ', '07501');

-- ============================================
-- USERS (Truck Drivers)
-- ============================================

INSERT INTO users (id, first_name, last_name, email, password_hash, address_id, last_logged_in) VALUES
('11111111-1111-1111-1111-111111111111', 'John', 'Smith', 'john.smith@email.com', '$2b$10$examplehash1', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
('22222222-2222-2222-2222-222222222222', 'Maria', 'Garcia', 'maria.garcia@email.com', '$2b$10$examplehash2', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 hours'),
('33333333-3333-3333-3333-333333333333', 'Robert', 'Johnson', 'robert.johnson@email.com', '$2b$10$examplehash3', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '1 week'),
('44444444-4444-4444-4444-444444444444', 'Jennifer', 'Williams', 'jennifer.williams@email.com', '$2b$10$examplehash4', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 days'),
('55555555-5555-5555-5555-555555555555', 'Michael', 'Brown', 'michael.brown@email.com', '$2b$10$examplehash5', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '1 day');

-- ============================================
-- JOBS (Truck Driver Positions)
-- ============================================

INSERT INTO job (id, name, description, payment_type, hourly_pay, miles_pay, salary_pay, address_id, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Regional CDL-A Truck Driver', 
 'Seeking experienced Class A CDL drivers for regional routes. Home weekly. Dry van freight. Must have 2+ years experience and clean driving record.',
 'MILES', NULL, 0.65, NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Local Delivery Driver - Class B',
 'Local delivery driver position. Home daily. Class B CDL required. 1+ years experience preferred. Great benefits package.',
 'HOUR', 28.50, NULL, NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', TRUE),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'OTR Flatbed Driver',
 'Over-the-road flatbed driver needed. 3+ years experience required. Hazmat endorsement preferred. Competitive pay and benefits.',
 'MILES', NULL, 0.72, NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', TRUE),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Dedicated Route Driver - Refrigerated',
 'Dedicated route driver for refrigerated freight. Consistent schedule, home weekly. Class A CDL with 2+ years experience required.',
 'SALARY', NULL, NULL, 75000.00, 'dddddddd-dddd-dddd-dddd-dddddddddddd', TRUE),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Local Class A Driver - Construction',
 'Local Class A driver for construction materials. Home daily. Must have 1+ years experience and clean MVR. Hourly pay with overtime.',
 'HOUR', 32.00, NULL, NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', TRUE);

-- ============================================
-- JOB FACTS
-- ============================================

-- Get fact type IDs (assuming they're inserted in order: 1-8)
INSERT INTO job_facts (job_id, fact_type_id, content) VALUES
-- Regional CDL-A Driver facts
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Regional routes covering Northeast and Mid-Atlantic states'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Dry van trailers, 53-foot'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Health insurance, 401k with match, paid vacation'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Home weekly, typically out Monday-Friday'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Mid-size fleet of 200+ trucks'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, 'DOT Safety Rating: Satisfactory'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, 'Average 2,500-3,000 miles per week'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 'General freight, no-touch freight'),

-- Local Class B Driver facts
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Local routes within 100-mile radius'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'Box trucks and straight trucks, Class B'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 'Full benefits, dental, vision, life insurance'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 'Home daily, Monday-Friday schedule'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 'Local delivery company, 50+ vehicles'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 6, 'Excellent safety record, no recent violations'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 7, 'Average 400-500 miles per week'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 8, 'Retail and commercial deliveries'),

-- OTR Flatbed Driver facts
('cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 'Over-the-road, nationwide routes'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Flatbed trailers, 48-foot and 53-foot'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 'Comprehensive benefits, 401k, health/dental/vision'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 'Home every 2-3 weeks, 2-3 days off'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 'Large fleet, 500+ trucks'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 6, 'DOT Safety Rating: Satisfactory, CSA score: Good'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 7, 'Average 2,800-3,200 miles per week'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 8, 'Construction materials, machinery, steel'),

-- Dedicated Refrigerated Driver facts
('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 'Dedicated route, same lanes weekly'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 'Refrigerated trailers, temperature-controlled'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 3, 'Excellent benefits package, profit sharing'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 'Home weekly, consistent schedule'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 5, 'Established company, 300+ refrigerated units'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 6, 'Outstanding safety record, award-winning fleet'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 7, 'Average 2,200-2,600 miles per week'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 8, 'Food and beverage products'),

-- Local Construction Driver facts
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 'Local routes, primarily NYC metro area'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, 'Dump trucks, flatbeds, Class A'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 'Union benefits, health insurance, pension'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4, 'Home daily, typical construction hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, 'Construction materials supplier, 75+ trucks'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 6, 'Strong safety program, ongoing training'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 7, 'Average 300-400 miles per week'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 8, 'Construction materials, aggregates, concrete');

-- ============================================
-- JOB REQUIREMENTS
-- ============================================

-- Get requirement type IDs (assuming they're inserted in order: 1-9)
INSERT INTO job_requirements (id, job_id, job_requirement_type_id, criteria, priority) VALUES
-- Regional CDL-A Driver requirements
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '{"cdl_class": "A", "required": true}', 1),
('11111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '{"min_years": 2, "required": true}', 1),
('11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '{"max_violations": 0, "max_accidents": 0, "required": true}', 1),
('11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, '{"min_age": 21, "required": true}', 2),
('11111111-1111-1111-1111-111111111115', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, '{"current_dot_physical": true, "required": true}', 1),
('11111111-1111-1111-1111-111111111116', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, '{"pre_employment": true, "random_testing": true, "required": true}', 1),

-- Local Class B Driver requirements
('22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '{"cdl_class": "B", "required": true}', 1),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, '{"min_years": 1, "preferred": true}', 2),
('22222222-2222-2222-2222-222222222223', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, '{"max_violations": 2, "max_accidents": 1, "required": true}', 1),
('22222222-2222-2222-2222-222222222224', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, '{"min_age": 21, "required": true}', 2),
('22222222-2222-2222-2222-222222222225', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 6, '{"current_dot_physical": true, "required": true}', 1),
('22222222-2222-2222-2222-222222222226', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 7, '{"pre_employment": true, "required": true}', 1),

-- OTR Flatbed Driver requirements
('33333333-3333-3333-3333-333333333331', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, '{"cdl_class": "A", "required": true}', 1),
('33333333-3333-3333-3333-333333333332', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, '{"min_years": 3, "required": true}', 1),
('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, '{"max_violations": 0, "max_accidents": 0, "required": true}', 1),
('33333333-3333-3333-3333-333333333334', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, '{"hazmat": "preferred", "tanker": "preferred", "required": false}', 2),
('33333333-3333-3333-3333-333333333335', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, '{"min_age": 23, "required": true}', 2),
('33333333-3333-3333-3333-333333333336', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 6, '{"current_dot_physical": true, "required": true}', 1),
('33333333-3333-3333-3333-333333333337', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 7, '{"pre_employment": true, "random_testing": true, "required": true}', 1),

-- Dedicated Refrigerated Driver requirements
('44444444-4444-4444-4444-444444444441', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '{"cdl_class": "A", "required": true}', 1),
('44444444-4444-4444-4444-444444444442', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, '{"min_years": 2, "required": true}', 1),
('44444444-4444-4444-4444-444444444443', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, '{"max_violations": 1, "max_accidents": 0, "required": true}', 1),
('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5, '{"min_age": 21, "required": true}', 2),
('44444444-4444-4444-4444-444444444445', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 6, '{"current_dot_physical": true, "required": true}', 1),
('44444444-4444-4444-4444-444444444446', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 7, '{"pre_employment": true, "random_testing": true, "required": true}', 1),

-- Local Construction Driver requirements
('55555555-5555-5555-5555-555555555551', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, '{"cdl_class": "A", "required": true}', 1),
('55555555-5555-5555-5555-555555555552', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, '{"min_years": 1, "required": true}', 1),
('55555555-5555-5555-5555-555555555553', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, '{"max_violations": 2, "max_accidents": 1, "required": true}', 1),
('55555555-5555-5555-5555-555555555554', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, '{"min_age": 21, "required": true}', 2),
('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 6, '{"current_dot_physical": true, "required": true}', 1),
('55555555-5555-5555-5555-555555555556', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 7, '{"pre_employment": true, "required": true}', 1);

-- ============================================
-- APPLICATIONS
-- ============================================

INSERT INTO application (id, user_id, job_id, applied_on, status) VALUES
-- John Smith applications
('aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '5 days', 'IN_PROGRESS'),
('bbbbbbbb-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '3 days', 'SUBMITTED'),

-- Maria Garcia applications
('aaaaaaaa-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days', 'IN_PROGRESS'),
('bbbbbbbb-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '1 day', 'SUBMITTED'),

-- Robert Johnson applications
('aaaaaaaa-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '7 days', 'HIRED'),
('bbbbbbbb-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '10 days', 'REJECTED'),

-- Jennifer Williams applications
('aaaaaaaa-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '4 days', 'IN_PROGRESS'),

-- Michael Brown applications
('aaaaaaaa-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '6 days', 'WITHDRAWN'),
('bbbbbbbb-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '1 day', 'SUBMITTED');

-- ============================================
-- CONVERSATIONS
-- ============================================

INSERT INTO conversation (id, app_id, is_active, screening_decision, screening_summary, screening_reasons, ended_at) VALUES
-- Active conversations
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-1111-1111-1111-111111111111', TRUE, 'PENDING', NULL, NULL, NULL),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-2222-2222-2222-222222222222', TRUE, 'PENDING', NULL, NULL, NULL),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-4444-4444-4444-444444444444', TRUE, 'PENDING', NULL, NULL, NULL),

-- Completed conversations
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-3333-3333-3333-333333333333', FALSE, 'APPROVED', 
 'Candidate meets all requirements. 5 years OTR experience, clean driving record, current DOT physical, Hazmat endorsement. Strong references.',
 '{"experience": "exceeds_requirement", "driving_record": "clean", "endorsements": "hazmat_present", "references": "positive"}',
 NOW() - INTERVAL '2 days'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-3333-3333-3333-333333333333', FALSE, 'DENIED',
 'Candidate does not meet minimum experience requirement. Only 1 year of experience, position requires 2+ years.',
 '{"experience": "insufficient", "years_experience": 1, "required_years": 2}',
 NOW() - INTERVAL '5 days');

-- ============================================
-- MESSAGES
-- ============================================

-- Messages for active conversation 1 (John Smith - Regional Driver)
INSERT INTO message (id, conversation_id, sender, content, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SYSTEM', 
 'Welcome! I''ll help you complete the screening process for the Regional CDL-A Truck Driver position. Let''s start by verifying your qualifications.',
 NOW() - INTERVAL '5 days'),

('11111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Hi John! I see you''ve applied for our Regional CDL-A Truck Driver position. To proceed, I need to verify a few things. First, do you have a valid Class A CDL?',
 NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),

('11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'Yes, I have a Class A CDL. I''ve had it for 3 years now.',
 NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),

('11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Great! How many years of commercial driving experience do you have?',
 NOW() - INTERVAL '5 days' + INTERVAL '3 minutes'),

('11111111-1111-1111-1111-111111111115', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'I have about 3 years of experience driving OTR routes.',
 NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'),

('11111111-1111-1111-1111-111111111116', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Perfect! Can you tell me about your driving record? Any violations or accidents in the past 3 years?',
 NOW() - INTERVAL '5 days' + INTERVAL '6 minutes'),

('11111111-1111-1111-1111-111111111117', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'No violations or accidents. Clean record.',
 NOW() - INTERVAL '5 days' + INTERVAL '8 minutes'),

('11111111-1111-1111-1111-111111111118', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Excellent! Do you have a current DOT physical exam certificate?',
 NOW() - INTERVAL '5 days' + INTERVAL '9 minutes'),

('11111111-1111-1111-1111-111111111119', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'Yes, I have a current DOT physical. It expires in 6 months.',
 NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),

('11111111-1111-1111-1111-111111111120', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Great! How old are you?',
 NOW() - INTERVAL '5 days' + INTERVAL '11 minutes'),

('11111111-1111-1111-1111-111111111121', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'I am 28 years old.',
 NOW() - INTERVAL '5 days' + INTERVAL '12 minutes'),

('11111111-1111-1111-1111-111111111122', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSISTANT',
 'Perfect! Are you willing to take a pre-employment drug test and agree to random drug testing?',
 NOW() - INTERVAL '5 days' + INTERVAL '13 minutes'),

('11111111-1111-1111-1111-111111111123', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER',
 'Yes, absolutely. I have no problem with drug testing.',
 NOW() - INTERVAL '5 days' + INTERVAL '14 minutes');

-- Messages for active conversation 2 (Maria Garcia - Local Driver)
INSERT INTO message (id, conversation_id, sender, content, created_at) VALUES
('22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SYSTEM',
 'Welcome! I''ll help you complete the screening process for the Local Delivery Driver - Class B position.',
 NOW() - INTERVAL '2 days'),

('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ASSISTANT',
 'Hi Maria! Thanks for applying. This is a local position with home daily. Do you have a Class B CDL?',
 NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),

('22222222-2222-2222-2222-222222222223', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER',
 'Yes, I have my Class B CDL.',
 NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),

('22222222-2222-2222-2222-222222222224', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ASSISTANT',
 'How much experience do you have with local delivery routes?',
 NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'),

('22222222-2222-2222-2222-222222222225', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ASSISTANT',
 'How old are you?',
 NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),

('22222222-2222-2222-2222-222222222226', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER',
 'I am 24 years old.',
 NOW() - INTERVAL '2 days' + INTERVAL '6 minutes'),

('22222222-2222-2222-2222-222222222227', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ASSISTANT',
 'Do you have a current DOT physical exam?',
 NOW() - INTERVAL '2 days' + INTERVAL '7 minutes'),

('22222222-2222-2222-2222-222222222228', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER',
 'Yes, I have a current DOT physical.',
 NOW() - INTERVAL '2 days' + INTERVAL '8 minutes'),

('22222222-2222-2222-2222-222222222229', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ASSISTANT',
 'Are you willing to take a pre-employment drug test?',
 NOW() - INTERVAL '2 days' + INTERVAL '9 minutes'),

('22222222-2222-2222-2222-222222222230', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'USER',
 'Yes, I am willing to take a drug test.',
 NOW() - INTERVAL '2 days' + INTERVAL '10 minutes');

-- Messages for completed conversation (Robert Johnson - Hired)
INSERT INTO message (id, conversation_id, sender, content, created_at) VALUES
('33333333-3333-3333-3333-333333333331', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'SYSTEM',
 'Welcome! I''ll help you complete the screening process for the OTR Flatbed Driver position.',
 NOW() - INTERVAL '7 days'),

('33333333-3333-3333-3333-333333333332', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ASSISTANT',
 'Hi Robert! I see you have extensive experience. Can you confirm you have 3+ years of OTR experience?',
 NOW() - INTERVAL '7 days' + INTERVAL '1 minute'),

('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'USER',
 'Yes, I have 5 years of OTR experience, mostly with flatbed.',
 NOW() - INTERVAL '7 days' + INTERVAL '2 minutes'),

('33333333-3333-3333-3333-333333333334', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ASSISTANT',
 'Perfect! Do you have a Hazmat endorsement?',
 NOW() - INTERVAL '7 days' + INTERVAL '3 minutes'),

('33333333-3333-3333-3333-333333333335', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'USER',
 'Yes, I have Hazmat, Tanker, and Doubles/Triples endorsements.',
 NOW() - INTERVAL '7 days' + INTERVAL '4 minutes'),

('33333333-3333-3333-3333-333333333336', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ASSISTANT',
 'Excellent! Your qualifications look great. We''ll be in touch soon with next steps.',
 NOW() - INTERVAL '7 days' + INTERVAL '5 minutes');

-- ============================================
-- CONVERSATION REQUIREMENTS
-- ============================================

-- Conversation requirements for active conversation 1 (John Smith)
INSERT INTO conversation_requirements (id, conversation_id, requirement_id, message_id, status, value) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111113', 'MET',
 '{"cdl_class": "A", "confirmed": true}'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111115', 'MET',
 '{"years_experience": 3, "meets_requirement": true}'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111117', 'MET',
 '{"violations": 0, "accidents": 0, "clean_record": true}'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111118', 'PENDING',
 NULL),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111116', NULL, 'PENDING', NULL),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111121', 'MET',
 '{"age": 28, "meets_requirement": true}'),
('f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111119', 'MET',
 '{"has_current_dot_physical": true, "confirmed": true}'),
('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111123', 'MET',
 '{"agrees_to_pre_employment": true, "agrees_to_random_testing": true, "confirmed": true}');

-- Conversation requirements for active conversation 2 (Maria Garcia)
INSERT INTO conversation_requirements (id, conversation_id, requirement_id, message_id, status, value) VALUES
('aaaaaaaa-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222223', 'MET',
 '{"cdl_class": "B", "confirmed": true}'),

('bbbbbbbb-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222222', NULL, 'PENDING', NULL),
('cccccccc-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222224', '22222222-2222-2222-2222-222222222226', 'MET',
 '{"age": 24, "meets_requirement": true}'),
('dddddddd-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222225', '22222222-2222-2222-2222-222222222228', 'MET',
 '{"has_current_dot_physical": true, "confirmed": true}'),
('eeeeeeee-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222226', '22222222-2222-2222-2222-222222222230', 'MET',
 '{"agrees_to_pre_employment": true, "confirmed": true}');

-- Conversation requirements for completed conversation (Robert Johnson - Hired)
INSERT INTO conversation_requirements (id, conversation_id, requirement_id, message_id, status, value) VALUES
('aaaaaaaa-3333-3333-3333-333333333331', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
 '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333332', 'MET',
 '{"cdl_class": "A", "confirmed": true}'),

('bbbbbbbb-3333-3333-3333-333333333332', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
 '33333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'MET',
 '{"years_experience": 5, "meets_requirement": true, "exceeds_requirement": true}'),

('cccccccc-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
 '33333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333335', 'MET',
 '{"hazmat": true, "tanker": true, "doubles_triples": true, "endorsements_confirmed": true}');

-- ============================================
-- END OF MOCK DATA
-- ============================================

