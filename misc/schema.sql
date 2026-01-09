-- Enable UUID extension (required for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Payment type enum for Job table
CREATE TYPE payment_type_enum AS ENUM ('HOUR', 'MILES', 'SALARY');

-- Application status enum
CREATE TYPE application_status_enum AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'WITHDRAWN', 'HIRED', 'REJECTED');

-- Screening decision enum for Conversation table
CREATE TYPE screening_decision_enum AS ENUM ('APPROVED', 'DENIED', 'PENDING');

-- Message sender enum
CREATE TYPE message_sender_enum AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- Requirement status enum for ConversationRequirements
CREATE TYPE requirement_status_enum AS ENUM ('PENDING', 'MET', 'NOT_MET');

-- ============================================
-- TABLES
-- ============================================

-- Address table (referenced by User and Job)
CREATE TABLE address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT,
    city TEXT,
    apt_number TEXT,
    state CHAR(2),
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JobFactsType table (lookup table)
CREATE TABLE job_facts_type (
    id SERIAL PRIMARY KEY,
    fact_type VARCHAR(50) UNIQUE NOT NULL,
    fact_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JobRequirementType table (lookup table)
CREATE TABLE job_requirement_type (
    id SERIAL PRIMARY KEY,
    requirement_type VARCHAR(50) UNIQUE NOT NULL,
    requirement_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    address_id UUID NOT NULL REFERENCES address(id) ON DELETE RESTRICT,
    last_logged_in TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job table
CREATE TABLE job (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    payment_type payment_type_enum NOT NULL,
    hourly_pay NUMERIC(10, 2),
    miles_pay NUMERIC(10, 2),
    salary_pay NUMERIC(10, 2),
    address_id UUID NOT NULL REFERENCES address(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure only one payment type is set
    CONSTRAINT check_payment_type CHECK (
        (payment_type = 'HOUR' AND hourly_pay IS NOT NULL AND miles_pay IS NULL AND salary_pay IS NULL) OR
        (payment_type = 'MILES' AND miles_pay IS NOT NULL AND hourly_pay IS NULL AND salary_pay IS NULL) OR
        (payment_type = 'SALARY' AND salary_pay IS NOT NULL AND hourly_pay IS NULL AND miles_pay IS NULL)
    )
);

-- JobFacts table
CREATE TABLE job_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    fact_type_id INTEGER NOT NULL REFERENCES job_facts_type(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique fact type per job
    CONSTRAINT unique_job_fact_type UNIQUE (job_id, fact_type_id)
);

-- JobRequirements table
CREATE TABLE job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    job_requirement_type_id INTEGER NOT NULL REFERENCES job_requirement_type(id) ON DELETE CASCADE,
    criteria JSONB NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application table
CREATE TABLE application (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    applied_on TIMESTAMPTZ DEFAULT NOW(),
    status application_status_enum DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique application per user per job
    CONSTRAINT unique_user_job_application UNIQUE (user_id, job_id)
);

-- Conversation table
CREATE TABLE conversation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    screening_decision screening_decision_enum DEFAULT 'PENDING',
    screening_summary TEXT,
    screening_reasons JSONB,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message table
CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender message_sender_enum NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ConversationRequirements junction table
CREATE TABLE conversation_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
    message_id UUID REFERENCES message(id) ON DELETE SET NULL,
    status requirement_status_enum DEFAULT 'PENDING',
    value JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique conversation-requirement pair
    CONSTRAINT unique_conversation_requirement UNIQUE (conversation_id, requirement_id)
);

-- LLM Evaluation Audit table
CREATE TABLE llm_evaluation_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_requirement_id UUID NOT NULL REFERENCES conversation_requirements(id) ON DELETE CASCADE,
    -- Note: requirement_id can be accessed via conversation_requirement_id -> conversation_requirements.requirement_id
    -- Note: conversation_id can be accessed via conversation_requirement_id -> conversation_requirements.conversation_id
    requirement_type VARCHAR(50) NOT NULL,
    llm_value JSONB NOT NULL,
    llm_assessment_result VARCHAR(10),
    confidence DECIMAL(3,2),
    criteria JSONB NOT NULL,
    actual_result VARCHAR(10) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    discrepancy BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- User indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_address_id ON users(address_id);

-- Job indexes
CREATE INDEX idx_job_address_id ON job(address_id);
CREATE INDEX idx_job_is_active ON job(is_active);
CREATE INDEX idx_job_payment_type ON job(payment_type);

-- JobFacts indexes
CREATE INDEX idx_job_facts_job_id ON job_facts(job_id);
CREATE INDEX idx_job_facts_fact_type_id ON job_facts(fact_type_id);

-- JobRequirements indexes
CREATE INDEX idx_job_requirements_job_id ON job_requirements(job_id);
CREATE INDEX idx_job_requirements_job_requirement_type_id ON job_requirements(job_requirement_type_id);
CREATE INDEX idx_job_requirements_priority ON job_requirements(priority);

-- Application indexes
CREATE INDEX idx_application_user_id ON application(user_id);
CREATE INDEX idx_application_job_id ON application(job_id);
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_application_applied_on ON application(applied_on);

-- Conversation indexes
CREATE INDEX idx_conversation_app_id ON conversation(app_id);
CREATE INDEX idx_conversation_is_active ON conversation(is_active);
CREATE INDEX idx_conversation_screening_decision ON conversation(screening_decision);

-- Message indexes
CREATE INDEX idx_message_conversation_id_created_at ON message(conversation_id, created_at);
CREATE INDEX idx_message_created_at ON message(created_at);
CREATE INDEX idx_message_sender ON message(sender);

-- ConversationRequirements indexes
CREATE INDEX idx_conversation_requirements_requirement_id ON conversation_requirements(requirement_id);
CREATE INDEX idx_conversation_requirements_message_id ON conversation_requirements(message_id);
CREATE INDEX idx_conversation_requirements_status ON conversation_requirements(status);

-- LLM Evaluation Audit indexes
CREATE INDEX idx_llm_audit_requirement_type ON llm_evaluation_audit(requirement_type);
CREATE INDEX idx_llm_audit_discrepancy ON llm_evaluation_audit(discrepancy) WHERE discrepancy = true;
CREATE INDEX idx_llm_audit_model ON llm_evaluation_audit(model_name);
CREATE INDEX idx_llm_audit_confidence ON llm_evaluation_audit(confidence) WHERE confidence IS NOT NULL;
CREATE INDEX idx_llm_audit_created_at ON llm_evaluation_audit(created_at);
CREATE INDEX idx_llm_audit_conversation_requirement ON llm_evaluation_audit(conversation_requirement_id);
CREATE INDEX idx_llm_audit_type_confidence_discrepancy ON llm_evaluation_audit(requirement_type, confidence, discrepancy) WHERE confidence IS NOT NULL;

-- ============================================
-- TRIGGERS (for updated_at timestamps)
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_address_updated_at BEFORE UPDATE ON address
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_facts_type_updated_at BEFORE UPDATE ON job_facts_type
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_requirement_type_updated_at BEFORE UPDATE ON job_requirement_type
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_updated_at BEFORE UPDATE ON job
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_facts_updated_at BEFORE UPDATE ON job_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_requirements_updated_at BEFORE UPDATE ON job_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_updated_at BEFORE UPDATE ON application
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_updated_at BEFORE UPDATE ON conversation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_requirements_last_updated BEFORE UPDATE ON conversation_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_evaluation_audit_updated_at BEFORE UPDATE ON llm_evaluation_audit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE address IS 'Stores address details for users and jobs';
COMMENT ON TABLE job_facts_type IS 'Lookup table defining types of facts associated with jobs';
COMMENT ON TABLE job_requirement_type IS 'Lookup table defining types of requirements for jobs';
COMMENT ON TABLE users IS 'Stores user profile information';
COMMENT ON TABLE job IS 'Stores details about job postings';
COMMENT ON TABLE job_facts IS 'Stores specific facts about a job, categorized by JobFactsType';
COMMENT ON TABLE job_requirements IS 'Lists specific requirements for a job, categorized by JobRequirementType';
COMMENT ON TABLE application IS 'Records job applications made by users';
COMMENT ON TABLE conversation IS 'Manages conversations related to job applications, including screening decisions';
COMMENT ON TABLE message IS 'Stores individual messages within a conversation';
COMMENT ON TABLE conversation_requirements IS 'Junction table linking conversations to job requirements and tracking their status';
COMMENT ON TABLE llm_evaluation_audit IS 'Audit table tracking LLM assessments vs actual calculated results. Used for debugging, quality metrics, model comparison, and future RAG (Retrieval Augmented Generation) implementation. Stores LLM responses, confidence scores, and discrepancies for analysis and improvement.';

