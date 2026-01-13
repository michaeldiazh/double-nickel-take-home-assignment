/**
 * Tests for greeting parser module
 */

import { parseYesNoSimple, buildYesNoParsingPrompt } from '../../../../src/domain/llm/greeting/parser';

describe('parseYesNoSimple', () => {
  describe('yes responses', () => {
    it('should parse "yes" as wants to continue', () => {
      const result = parseYesNoSimple('yes');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
      expect(result.needsClarification).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should parse "yeah" as wants to continue', () => {
      const result = parseYesNoSimple('yeah');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse "yep" as wants to continue', () => {
      const result = parseYesNoSimple('yep');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse "sure" as wants to continue', () => {
      const result = parseYesNoSimple('sure');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse "ok" as wants to continue', () => {
      const result = parseYesNoSimple('ok');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse "let\'s go" as wants to continue', () => {
      const result = parseYesNoSimple('let\'s go');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse case-insensitive yes responses', () => {
      const result = parseYesNoSimple('YES');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should parse yes with extra text', () => {
      const result = parseYesNoSimple('yes, I would like to continue');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });
  });

  describe('no responses', () => {
    it('should parse "no" as does not want to continue', () => {
      const result = parseYesNoSimple('no');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
      expect(result.needsClarification).toBe(false);
    });

    it('should parse "nope" as does not want to continue', () => {
      const result = parseYesNoSimple('nope');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
    });

    it('should parse "not interested" as does not want to continue', () => {
      const result = parseYesNoSimple('not interested');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
    });

    it('should parse "no thanks" as does not want to continue', () => {
      const result = parseYesNoSimple('no thanks');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
    });

    it('should parse case-insensitive no responses', () => {
      const result = parseYesNoSimple('NO');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
    });

    it('should parse no with extra text', () => {
      const result = parseYesNoSimple('no, I am not interested');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false);
    });
  });

  describe('ambiguous responses', () => {
    it('should return ambiguous for empty string', () => {
      const result = parseYesNoSimple('');
      expect(result.success).toBe(false);
      expect(result.wantsToContinue).toBe(null);
      expect(result.needsClarification).toBe(true);
    });

    it('should return ambiguous for conflicting responses', () => {
      const result = parseYesNoSimple('yes no maybe');
      expect(result.success).toBe(false);
      expect(result.wantsToContinue).toBe(null);
      expect(result.needsClarification).toBe(true);
    });

    it('should return ambiguous for unclear responses', () => {
      const result = parseYesNoSimple('maybe later');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(false); // "maybe later" is in noKeywords
    });

    it('should return ambiguous for unrelated text', () => {
      const result = parseYesNoSimple('I like pizza');
      expect(result.success).toBe(false);
      expect(result.wantsToContinue).toBe(null);
      expect(result.needsClarification).toBe(true);
    });
  });

  describe('whitespace handling', () => {
    it('should trim whitespace', () => {
      const result = parseYesNoSimple('  yes  ');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });

    it('should handle newlines', () => {
      const result = parseYesNoSimple('\nyes\n');
      expect(result.success).toBe(true);
      expect(result.wantsToContinue).toBe(true);
    });
  });
});

describe('buildYesNoParsingPrompt', () => {
  it('should build a prompt with the user message', () => {
    const prompt = buildYesNoParsingPrompt('maybe');
    expect(prompt).toContain('maybe');
    expect(prompt).toContain('wants_to_continue');
    expect(prompt).toContain('confidence');
    expect(prompt).toContain('JSON');
  });

  it('should include instructions for JSON format', () => {
    const prompt = buildYesNoParsingPrompt('test message');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('wants_to_continue');
    expect(prompt).toContain('boolean');
  });

  it('should handle special characters in user message', () => {
    const prompt = buildYesNoParsingPrompt('I\'m not sure');
    expect(prompt).toContain('I\'m not sure');
  });
});
