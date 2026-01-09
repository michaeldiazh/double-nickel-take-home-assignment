-- ============================================
-- LLM EVALUATION AUDIT TABLE
-- ============================================
-- Tracks LLM assessments vs actual calculated results
-- Used for debugging, quality metrics, and future RAG implementation
-- ============================================

CREATE TABLE llm_evaluation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys for context
  conversation_requirement_id UUID NOT NULL REFERENCES conversation_requirements(id) ON DELETE CASCADE,
  -- Note: requirement_id can be accessed via conversation_requirement_id -> conversation_requirements.requirement_id
  -- Note: conversation_id can be accessed via conversation_requirement_id -> conversation_requirements.conversation_id
  
  -- Requirement context
  requirement_type VARCHAR(50) NOT NULL, -- CDL_CLASS, YEARS_EXPERIENCE, DRIVING_RECORD, etc.
  
  -- LLM's assessment (what LLM said)
  llm_value JSONB NOT NULL, -- Full value object from LLM (contains meets_requirement, confidence, etc.)
  llm_assessment_result VARCHAR(10), -- Extracted: what LLM thought (MET/NOT_MET/PENDING)
  confidence DECIMAL(3,2), -- LLM's confidence score (0.00 to 1.00), NULL if not provided by model
  
  -- Our actual calculation
  criteria JSONB NOT NULL, -- The criteria used for evaluation
  actual_result VARCHAR(10) NOT NULL, -- What we calculated (from conversation_requirements.status)
  
  -- Model information
  model_name VARCHAR(50) NOT NULL, -- 'gpt-4o', 'gemini-pro', 'claude-3-opus', etc.
  
  -- Comparison
  discrepancy BOOLEAN NOT NULL DEFAULT false, -- true if LLM assessment != actual result

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance and RAG queries
CREATE INDEX idx_llm_audit_requirement_type ON llm_evaluation_audit(requirement_type);
CREATE INDEX idx_llm_audit_discrepancy ON llm_evaluation_audit(discrepancy) WHERE discrepancy = true;
CREATE INDEX idx_llm_audit_model ON llm_evaluation_audit(model_name);
CREATE INDEX idx_llm_audit_confidence ON llm_evaluation_audit(confidence) WHERE confidence IS NOT NULL;
CREATE INDEX idx_llm_audit_created_at ON llm_evaluation_audit(created_at);
CREATE INDEX idx_llm_audit_conversation_requirement ON llm_evaluation_audit(conversation_requirement_id);

-- Composite index for common RAG queries (requirement type + confidence + discrepancy)
CREATE INDEX idx_llm_audit_type_confidence_discrepancy ON llm_evaluation_audit(requirement_type, confidence, discrepancy) 
  WHERE confidence IS NOT NULL;

