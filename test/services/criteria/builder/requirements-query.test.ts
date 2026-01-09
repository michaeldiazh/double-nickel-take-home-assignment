import { buildJsonObject, buildRequirementsByJobIdQuery } from '../../../../src/services/criteria/builder/requirements-query';

describe('buildJsonObject', () => {
  describe('simple fields (no newlines)', () => {
    it('should build a simple jsonb_build_object with single field', () => {
      const fields: [string, string][] = [['id', 'table.id']];
      const result = buildJsonObject(fields);

      expect(result).toBe(`jsonb_build_object(
    'id', table.id
  )`);
    });

    it('should build a jsonb_build_object with multiple simple fields', () => {
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['name', 'table.name'],
        ['value', 'table.value'],
      ];
      const result = buildJsonObject(fields);

      expect(result).toBe(`jsonb_build_object(
    'id', table.id,
    'name', table.name,
    'value', table.value
  )`);
    });

    it('should handle empty fields array', () => {
      const fields: [string, string][] = [];
      const result = buildJsonObject(fields);

      expect(result).toBe(`jsonb_build_object(
    
  )`);
    });
  });

  describe('nested JSON objects (with newlines)', () => {
    it('should properly indent nested JSON objects', () => {
      const nestedJson = `jsonb_build_object(
    'nestedId', nested.id,
    'nestedName', nested.name
  )`;
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['nested', nestedJson],
      ];
      const result = buildJsonObject(fields);

      expect(result).toBe(`jsonb_build_object(
    'id', table.id,
    'nested', jsonb_build_object(
        'nestedId', nested.id,
        'nestedName', nested.name
      )
  )`);
    });

    it('should handle multiple nested JSON objects', () => {
      const nested1 = `jsonb_build_object(
    'id', nested1.id
  )`;
      const nested2 = `jsonb_build_object(
    'id', nested2.id,
    'name', nested2.name
  )`;
      const fields: [string, string][] = [
        ['topLevel', 'table.value'],
        ['nested1', nested1],
        ['nested2', nested2],
      ];
      const result = buildJsonObject(fields);

      expect(result).toBe(`jsonb_build_object(
    'topLevel', table.value,
    'nested1', jsonb_build_object(
        'id', nested1.id
      ),
    'nested2', jsonb_build_object(
        'id', nested2.id,
        'name', nested2.name
      )
  )`);
    });
  });

  describe('custom indentation', () => {
    it('should use custom indent string', () => {
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['name', 'table.name'],
      ];
      const result = buildJsonObject(fields, '      ');

      expect(result).toBe(`jsonb_build_object(
      'id', table.id,
      'name', table.name
  )`);
    });

    it('should apply custom indent to nested objects', () => {
      const nestedJson = `jsonb_build_object(
    'nestedId', nested.id
  )`;
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['nested', nestedJson],
      ];
      const result = buildJsonObject(fields, '      ');

      expect(result).toBe(`jsonb_build_object(
      'id', table.id,
      'nested', jsonb_build_object(
          'nestedId', nested.id
        )
  )`);
    });

    it('should handle tab indentation', () => {
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['name', 'table.name'],
      ];
      const result = buildJsonObject(fields, '\t');

      expect(result).toBe(`jsonb_build_object(
\t'id', table.id,
\t'name', table.name
  )`);
    });
  });

  describe('edge cases', () => {
    it('should handle fields with special characters in keys', () => {
      const fields: [string, string][] = [
        ['key_with_underscore', 'table.column'],
        ['key-with-dash', 'table.column2'],
        ['keyWithCamelCase', 'table.column3'],
      ];
      const result = buildJsonObject(fields);

      expect(result).toContain("'key_with_underscore', table.column");
      expect(result).toContain("'key-with-dash', table.column2");
      expect(result).toContain("'keyWithCamelCase', table.column3");
    });

    it('should handle values with complex column references', () => {
      const fields: [string, string][] = [
        ['id', 'table.id'],
        ['alias', 'table.column AS alias'],
        ['calculated', 'table.value1 + table.value2'],
      ];
      const result = buildJsonObject(fields);

      expect(result).toContain("'id', table.id");
      expect(result).toContain("'alias', table.column AS alias");
      expect(result).toContain("'calculated', table.value1 + table.value2");
    });

    it('should handle nested object with custom indent', () => {
      const nestedJson = `jsonb_build_object(
      'deepId', deep.id
    )`;
      const fields: [string, string][] = [
        ['top', 'table.value'],
        ['deep', nestedJson],
      ];
      const result = buildJsonObject(fields, '    ');

      // The nested object should have its first line unindented, then subsequent lines indented
      expect(result).toContain("'deep', jsonb_build_object(");
      expect(result).toContain("    'deepId', deep.id");
    });
  });
});

describe('buildRequirementsByJobIdQuery', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';

  it('should return query and values object', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('values');
    expect(typeof result.query).toBe('string');
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should include jobId in values array', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.values).toContain(mockJobId);
  });

  it('should select from job_requirements table', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('from job_requirements');
  });

  it('should include jsonb_array_agg in select clause', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('jsonb_array_agg');
    expect(result.query.toLowerCase()).toContain('as requirements');
  });

  it('should include join with job_requirement_type table', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('join job_requirement_type');
    expect(result.query.toLowerCase()).toContain('job_requirement_type_id');
  });

  it('should include where clause filtering by job id', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('where');
    expect(result.query.toLowerCase()).toContain('job_id');
  });

  it('should include group by clause for job_id', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('group by');
    expect(result.query.toLowerCase()).toContain('job_requirements.job_id');
  });

  it('should include order by priority in jsonb_array_agg', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('order by');
    expect(result.query.toLowerCase()).toContain('job_requirements.priority');
    expect(result.query.toLowerCase()).toContain('asc');
  });

  it('should include jsonb_build_object in the select column', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    expect(result.query.toLowerCase()).toContain('jsonb_build_object');
  });

  it('should include all required job requirement fields in jsonb_build_object', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    // Check for job requirement fields
    expect(result.query).toContain('job_requirements.id');
    expect(result.query).toContain('job_requirements.job_id');
    expect(result.query).toContain('job_requirements.job_requirement_type_id');
    expect(result.query).toContain('job_requirements.criteria');
    expect(result.query).toContain('job_requirements.priority');
  });

  it('should include requirement type fields in nested jsonb_build_object', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    // Check for requirement type fields
    expect(result.query).toContain('job_requirement_type.id');
    expect(result.query).toContain('job_requirement_type.requirement_type');
    expect(result.query).toContain('job_requirement_type.requirement_description');
  });

  it('should use parameterized query (not string interpolation)', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

    // The jobId should not appear directly in the query string
    expect(result.query).not.toContain(mockJobId);
    // But should be in values array
    expect(result.values).toContain(mockJobId);
  });

  it('should generate different queries for different job IDs', () => {
    const jobId1 = '11111111-1111-1111-1111-111111111111';
    const jobId2 = '22222222-2222-2222-2222-222222222222';

    const result1 = buildRequirementsByJobIdQuery(jobId1);
    const result2 = buildRequirementsByJobIdQuery(jobId2);

    // Queries should be structurally the same
    expect(result1.query).toBe(result2.query);
    // But values should be different
    expect(result1.values).toContain(jobId1);
    expect(result2.values).toContain(jobId2);
    expect(result1.values).not.toEqual(result2.values);
  });

  it('should generate valid PostgreSQL query structure', () => {
    const result = buildRequirementsByJobIdQuery(mockJobId);

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

