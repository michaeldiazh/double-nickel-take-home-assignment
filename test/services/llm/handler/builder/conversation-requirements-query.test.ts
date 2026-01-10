import { buildConversationRequirementsQuery } from '../../../../../src/services/llm/handler/builder/conversation-requirements-query';

describe('buildConversationRequirementsQuery', () => {
  const mockConversationId = '11111111-1111-4111-8111-111111111111';

  it('should return query and values object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('values');
    expect(typeof result.query).toBe('string');
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should include conversationId in values array', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.values).toContain(mockConversationId);
  });

  it('should select from conversation_requirements table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('from conversation_requirements');
  });

  it('should include json_agg in select clause', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('json_agg');
    expect(result.query.toLowerCase()).toContain('as conversation_requirements');
  });

  it('should include join with job_requirements table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('join job_requirements');
    expect(result.query.toLowerCase()).toContain('requirement_id');
  });

  it('should include join with job_requirement_type table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('join job_requirement_type');
    expect(result.query.toLowerCase()).toContain('job_requirement_type_id');
  });

  it('should include join with job table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('join job');
    expect(result.query.toLowerCase()).toContain('job_requirements.job_id');
  });

  it('should include join with conversation table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('join conversation');
    expect(result.query.toLowerCase()).toContain('conversation_id');
  });

  it('should include join with application table', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('join application');
    expect(result.query.toLowerCase()).toContain('app_id');
  });

  it('should include where clause filtering by conversation id', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('where');
    expect(result.query.toLowerCase()).toContain('conversation_id');
  });

  it('should include group by clause for conversation_id', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('group by');
    expect(result.query.toLowerCase()).toContain('conversation_requirements.conversation_id');
  });

  it('should include order by priority in json_agg', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('order by');
    expect(result.query.toLowerCase()).toContain('job_requirements.priority');
    expect(result.query.toLowerCase()).toContain('asc');
  });

  it('should include json_build_object in the select column', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    expect(result.query.toLowerCase()).toContain('json_build_object');
  });

  it('should include all required conversation requirement fields in json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for conversation requirement fields
    expect(result.query).toContain('conversation_requirements.id');
    expect(result.query).toContain('conversation_requirements.message_id');
    expect(result.query).toContain('conversation_requirements.status');
    expect(result.query).toContain('conversation_requirements.value');
    expect(result.query).toContain('conversation_requirements.last_updated');
    expect(result.query).toContain('conversation_requirements.created_at');
  });

  it('should include conversation fields in nested json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for conversation fields
    expect(result.query).toContain('conversation.id');
    expect(result.query).toContain('conversation.app_id');
    expect(result.query).toContain('conversation.is_active');
    expect(result.query).toContain('conversation.screening_decision');
    expect(result.query).toContain('conversation.screening_summary');
    expect(result.query).toContain('conversation.screening_reasons');
    expect(result.query).toContain('conversation.ended_at');
  });

  it('should include application fields in nested json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for application fields
    expect(result.query).toContain('application.id');
    expect(result.query).toContain('application.user_id');
    expect(result.query).toContain('application.job_id');
    expect(result.query).toContain('application.applied_on');
    expect(result.query).toContain('application.status');
  });

  it('should include job requirements fields in nested json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for job requirement fields
    expect(result.query).toContain('job_requirements.id');
    expect(result.query).toContain('job_requirements.criteria');
    expect(result.query).toContain('job_requirements.priority');
    expect(result.query).toContain('job_requirements.created_at');
    expect(result.query).toContain('job_requirements.updated_at');
  });

  it('should include job fields in nested json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for job fields
    expect(result.query).toContain('job.id');
    expect(result.query).toContain('job.name');
    expect(result.query).toContain('job.description');
    expect(result.query).toContain('job.payment_type');
    expect(result.query).toContain('job.hourly_pay');
    expect(result.query).toContain('job.miles_pay');
    expect(result.query).toContain('job.salary_pay');
    expect(result.query).toContain('job.address_id');
    expect(result.query).toContain('job.is_active');
  });

  it('should include requirement type fields in nested json_build_object', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check for requirement type fields
    expect(result.query).toContain('job_requirement_type.id');
    expect(result.query).toContain('job_requirement_type.requirement_type');
    expect(result.query).toContain('job_requirement_type.requirement_description');
  });

  it('should use parameterized query (not string interpolation)', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // The conversationId should not appear directly in the query string
    expect(result.query).not.toContain(mockConversationId);
    // But should be in values array
    expect(result.values).toContain(mockConversationId);
  });

  it('should generate different queries for different conversation IDs', () => {
    const conversationId1 = '11111111-1111-4111-8111-111111111111';
    const conversationId2 = '22222222-2222-4222-8222-222222222222';

    const result1 = buildConversationRequirementsQuery(conversationId1);
    const result2 = buildConversationRequirementsQuery(conversationId2);

    // Queries should be structurally the same
    expect(result1.query).toBe(result2.query);
    // But values should be different
    expect(result1.values).toContain(conversationId1);
    expect(result2.values).toContain(conversationId2);
    expect(result1.values).not.toEqual(result2.values);
  });

  it('should generate valid PostgreSQL query structure', () => {
    const result = buildConversationRequirementsQuery(mockConversationId);

    // Check query structure order: SELECT ... FROM ... JOIN ... WHERE ... GROUP BY
    const queryLower = result.query.toLowerCase();
    const selectIndex = queryLower.indexOf('select');
    const fromIndex = queryLower.indexOf('from');
    const joinIndex = queryLower.indexOf('join');
    const whereIndex = queryLower.indexOf('where');
    const groupByIndex = queryLower.indexOf('group by');

    expect(selectIndex).toBeGreaterThanOrEqual(0);
    expect(fromIndex).toBeGreaterThan(selectIndex);
    expect(joinIndex).toBeGreaterThan(fromIndex);
    expect(whereIndex).toBeGreaterThan(joinIndex);
    expect(groupByIndex).toBeGreaterThan(whereIndex);
  });
});

