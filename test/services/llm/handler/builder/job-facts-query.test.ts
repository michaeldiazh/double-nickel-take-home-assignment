import { buildJobFactsQuery } from '../../../../../src/services/llm/handler/builder/job-facts-query';

describe('buildJobFactsQuery', () => {
  const mockJobId = '33333333-3333-4333-8333-333333333333';

  it('should return query and values object', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('values');
    expect(typeof result.query).toBe('string');
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should include jobId in values array', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.values).toContain(mockJobId);
  });

  it('should select from job_facts table', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('from job_facts');
  });

  it('should include json_agg in select clause', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('json_agg');
    expect(result.query.toLowerCase()).toContain('as job_facts');
  });

  it('should include join with job_facts_type table', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('join job_facts_type');
    expect(result.query.toLowerCase()).toContain('fact_type_id');
  });

  it('should include join with job table', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('join job');
    expect(result.query.toLowerCase()).toContain('job_facts.job_id');
  });

  it('should include where clause filtering by job id', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('where');
    expect(result.query.toLowerCase()).toContain('job_facts.job_id');
  });

  it('should include group by clause for job_id', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('group by');
    expect(result.query.toLowerCase()).toContain('job_facts.job_id');
  });

  it('should include order by created_at in json_agg', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('order by');
    expect(result.query.toLowerCase()).toContain('job_facts.created_at');
    expect(result.query.toLowerCase()).toContain('asc');
  });

  it('should include json_build_object in the select column', () => {
    const result = buildJobFactsQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('json_build_object');
  });

  it('should include all required job fact fields in json_build_object', () => {
    const result = buildJobFactsQuery(mockJobId);

    // Check for job fact fields
    expect(result.query).toContain('job_facts.id');
    expect(result.query).toContain('job_facts.content');
    expect(result.query).toContain('job_facts.created_at');
    expect(result.query).toContain('job_facts.updated_at');
  });

  it('should include job fields in nested json_build_object', () => {
    const result = buildJobFactsQuery(mockJobId);

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

  it('should include fact type fields in nested json_build_object', () => {
    const result = buildJobFactsQuery(mockJobId);

    // Check for fact type fields
    expect(result.query).toContain('job_facts_type.id');
    expect(result.query).toContain('job_facts_type.fact_type');
    expect(result.query).toContain('job_facts_type.fact_description');
  });

  it('should use parameterized query (not string interpolation)', () => {
    const result = buildJobFactsQuery(mockJobId);

    // The jobId should not appear directly in the query string
    expect(result.query).not.toContain(mockJobId);
    // But should be in values array
    expect(result.values).toContain(mockJobId);
  });

  it('should generate different queries for different job IDs', () => {
    const jobId1 = '33333333-3333-4333-8333-333333333333';
    const jobId2 = '44444444-4444-4444-8444-444444444444';

    const result1 = buildJobFactsQuery(jobId1);
    const result2 = buildJobFactsQuery(jobId2);

    // Queries should be structurally the same
    expect(result1.query).toBe(result2.query);
    // But values should be different
    expect(result1.values).toContain(jobId1);
    expect(result2.values).toContain(jobId2);
    expect(result1.values).not.toEqual(result2.values);
  });

  it('should generate valid PostgreSQL query structure', () => {
    const result = buildJobFactsQuery(mockJobId);

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

