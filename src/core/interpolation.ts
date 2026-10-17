import type { InterpolationResult, QueryTemplate, ValidationIssue, Variable } from './domain';
import { redactSensitiveText } from './safety';

const tokenPattern = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g;
const idPattern = /^[a-z][a-z0-9-]*$/;

export function interpolateTemplate(
  template: QueryTemplate,
  rawValues: Record<string, string>
): InterpolationResult {
  const issues = validateTemplate(template).concat(validateVariables(template.variables, rawValues));
  const values = withDefaults(template.variables, rawValues);
  const output = redactSensitiveText(template.template.replace(tokenPattern, (_, variableId: string) => {
    const variable = template.variables.find((candidate) => candidate.id === variableId);
    if (!variable) {
      return '';
    }

    return normalizeValue(values[variableId] ?? '');
  }));

  return { output, issues };
}

export function buildLaunchUrl(template: QueryTemplate, output: string): string | null {
  if (!template.launchUrlTemplate) {
    return template.outputKind === 'url' && output.startsWith('https://') ? output : null;
  }

  const encodedOutput = encodeURIComponent(output);
  const url = template.launchUrlTemplate.replaceAll('{{query}}', encodedOutput).replaceAll('{{url}}', encodedOutput);

  try {
    const parsed = new URL(url);
    if (!['www.google.com', 'github.com'].includes(parsed.hostname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateTemplate(template: QueryTemplate): ValidationIssue[] {
  const declaredIds = new Set<string>();
  const issues: ValidationIssue[] = [];

  for (const variable of template.variables) {
    if (!idPattern.test(variable.id)) {
      issues.push({ variableId: variable.id, message: `${variable.label} has an invalid variable id.` });
    }

    if (declaredIds.has(variable.id)) {
      issues.push({ variableId: variable.id, message: `${variable.label} is declared more than once.` });
    }

    declaredIds.add(variable.id);
  }

  for (const templateId of getTemplateVariableIds(template.template)) {
    if (!declaredIds.has(templateId)) {
      issues.push({ variableId: templateId, message: `Template references undeclared variable "${templateId}".` });
    }
  }

  for (const variable of template.variables) {
    if (!getTemplateVariableIds(template.template).includes(variable.id)) {
      issues.push({ variableId: variable.id, message: `${variable.label} is declared but not used.` });
    }
  }

  return issues;
}

export function validateVariables(
  variables: readonly Variable[],
  rawValues: Record<string, string>
): ValidationIssue[] {
  return variables.flatMap((variable) => validateVariable(variable, rawValues[variable.id]));
}

export function getTemplateVariableIds(template: string): string[] {
  const ids = new Set<string>();
  for (const match of template.matchAll(tokenPattern)) {
    ids.add(match[1]);
  }
  return [...ids].sort();
}

function validateVariable(variable: Variable, rawValue: string | undefined): ValidationIssue[] {
  const value = normalizeValue(rawValue ?? variable.defaultValue ?? '');
  const issues: ValidationIssue[] = [];

  if (variable.required && value.length === 0) {
    issues.push({ variableId: variable.id, message: `${variable.label} is required.` });
    return issues;
  }

  if (value.length === 0) {
    return issues;
  }

  if (variable.minLength !== undefined && value.length < variable.minLength) {
    issues.push({
      variableId: variable.id,
      message: `${variable.label} must be at least ${variable.minLength} characters.`
    });
  }

  if (variable.maxLength !== undefined && value.length > variable.maxLength) {
    issues.push({
      variableId: variable.id,
      message: `${variable.label} must be ${variable.maxLength} characters or fewer.`
    });
  }

  const kindIssue = validateKind(variable, value);
  if (kindIssue) {
    issues.push(kindIssue);
  }

  if (variable.pattern && !new RegExp(variable.pattern).test(value)) {
    issues.push({ variableId: variable.id, message: `${variable.label} has an invalid format.` });
  }

  return issues;
}

function validateKind(variable: Variable, value: string): ValidationIssue | null {
  if (variable.kind === 'text' && /[\r\n]/.test(value)) {
    return { variableId: variable.id, message: `${variable.label} must be a single line.` };
  }

  if (variable.kind === 'domain' && !/^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(value)) {
    return { variableId: variable.id, message: `${variable.label} must be a domain.` };
  }

  if (variable.kind === 'url') {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { variableId: variable.id, message: `${variable.label} must be an HTTP(S) URL.` };
      }
    } catch {
      return { variableId: variable.id, message: `${variable.label} must be a valid URL.` };
    }
  }

  if ((variable.kind === 'owner' || variable.kind === 'repo') && !/^[a-zA-Z0-9_.-]+$/.test(value)) {
    return { variableId: variable.id, message: `${variable.label} contains unsupported characters.` };
  }

  if (
    variable.kind === 'enum' &&
    variable.options &&
    !variable.options.some((option) => option.value === value)
  ) {
    return { variableId: variable.id, message: `${variable.label} must be one of the allowed options.` };
  }

  return null;
}

function withDefaults(variables: readonly Variable[], rawValues: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    variables.map((variable) => [variable.id, rawValues[variable.id] ?? variable.defaultValue ?? ''])
  );
}

function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
