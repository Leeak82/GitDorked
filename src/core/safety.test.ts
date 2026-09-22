import { describe, expect, it } from 'vitest';
import { hasSensitiveText, normalizeForDisplay, redactSensitiveText } from './safety';

describe('safety redaction', () => {
  it('redacts common token and credential shapes', () => {
    const input = [
      'ghp_abcdefghijklmnopqrstuvwxyz',
      'sk-abcdefghijklmnopqrstuvwxyz',
      'AKIAABCDEFGHIJKLMNOP',
      'token=abcdefghijklmnopqrstuvwxyz'
    ].join(' ');

    const redacted = redactSensitiveText(input);
    expect(redacted).not.toContain('ghp_');
    expect(redacted).not.toContain('sk-');
    expect(redacted).not.toContain('AKIA');
    expect(redacted).toContain('[REDACTED]');
    expect(hasSensitiveText(input)).toBe(true);
  });

  it('normalizes whitespace after redaction for display and storage', () => {
    expect(normalizeForDisplay('  safe   text  ')).toBe('safe text');
    expect(normalizeForDisplay('token=abcdefghijklmnopqrstuvwxyz')).toBe('[REDACTED]');
  });
});
