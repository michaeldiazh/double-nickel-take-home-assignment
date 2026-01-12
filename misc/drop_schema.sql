-- Drop Schema Script
-- This script drops all database objects in the correct order
-- Run this before applying the new schema

-- Drop triggers first
DROP TRIGGER IF EXISTS update_conversation_job_requirements_updated_at ON conversation_job_requirements;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.are_all_requirements_completed(uuid);
DROP FUNCTION IF EXISTS public.get_conversation_job_facts(uuid);
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid);
DROP FUNCTION IF EXISTS public.get_conversation_requirements(uuid);
DROP FUNCTION IF EXISTS public.get_next_pending_requirement(uuid);

-- Drop tables (in order to respect foreign key constraints)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_job_requirements CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_requirements CASCADE;
DROP TABLE IF EXISTS job_facts CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types/enums
DROP TYPE IF EXISTS public.conversation_status_enum CASCADE;
DROP TYPE IF EXISTS public.message_sender_enum CASCADE;
DROP TYPE IF EXISTS public.requirement_status_enum CASCADE;
DROP TYPE IF EXISTS public.screening_decision_enum CASCADE;

-- Drop extension (optional - only if you want to remove it completely)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Note: The uuid-ossp extension is kept as it may be used by other schemas
-- If you want to drop it, uncomment the line above
