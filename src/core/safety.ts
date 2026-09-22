const secretPatterns: readonly RegExp[] = [
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  /\b(xox[baprs]-[0-9A-Za-z-]{16,})\b/g,
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[^'"\s]{8,}/gi
];

export function redactSensitiveText(value: string): string {
  return secretPatterns.reduce((current, pattern) => current.replace(pattern, '[REDACTED]'), value);
}

export function hasSensitiveText(value: string): boolean {
  return secretPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

export function normalizeForDisplay(value: string): string {
  return redactSensitiveText(value.trim().replace(/\s+/g, ' '));
}
