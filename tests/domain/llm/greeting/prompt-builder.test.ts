/**
 * Tests for greeting prompt builder module
 */

import {
  buildPendingGreetingSystemPromptMessage,
  buildGoodLuckSystemPromptMessage,
} from '../../../../src/domain/prompts/builders/message-builders/greeting';

describe('buildPendingGreetingSystemPromptMessage', () => {
  it('should build a prompt with user first name and job title', () => {
    const prompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: 'John',
      job_title: 'CDL-A Truck Driver',
    });

    expect(prompt).toContain('John');
    expect(prompt).toContain('CDL-A Truck Driver');
  });

  it('should include company name', () => {
    const prompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: 'Jane',
      job_title: 'Regional Driver',
    });

    expect(prompt).toContain('Happy Hauler Trucking Co');
  });

  it('should include greeting instructions', () => {
    const prompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: 'Bob',
      job_title: 'Long Haul Driver',
    });

    expect(prompt).toContain('greet');
    expect(prompt).toContain('pre-approval');
  });

  it('should include guidelines', () => {
    const prompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: 'Alice',
      job_title: 'Local Driver',
    });

    expect(prompt).toContain('friendly');
    expect(prompt).toContain('professional');
  });

  it('should handle special characters in names', () => {
    const prompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: "O'Brien",
      job_title: 'Driver',
    });

    expect(prompt).toContain("O'Brien");
  });
});

describe('buildGoodLuckSystemPromptMessage', () => {
  it('should build a prompt with user first name and job title', () => {
    const prompt = buildGoodLuckSystemPromptMessage({
      user_first_name: 'John',
      job_title: 'CDL-A Truck Driver',
    });

    expect(prompt).toContain('John');
    expect(prompt).toContain('CDL-A Truck Driver');
  });

  it('should include company name', () => {
    const prompt = buildGoodLuckSystemPromptMessage({
      user_first_name: 'Jane',
      job_title: 'Regional Driver',
    });

    expect(prompt).toContain('Happy Hauler Trucking Co');
  });

  it('should include good luck message instructions', () => {
    const prompt = buildGoodLuckSystemPromptMessage({
      user_first_name: 'Bob',
      job_title: 'Long Haul Driver',
    });

    expect(prompt).toContain('good luck');
    expect(prompt).toContain('declined');
  });

  it('should mention the user declined', () => {
    const prompt = buildGoodLuckSystemPromptMessage({
      user_first_name: 'Alice',
      job_title: 'Local Driver',
    });

    expect(prompt).toContain('declined');
  });
});
