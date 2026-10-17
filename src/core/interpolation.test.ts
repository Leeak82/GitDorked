import { describe, expect, it } from 'vitest';
import { buildLaunchUrl, getTemplateVariableIds, interpolateTemplate, validateTemplate, validateVariables } from './interpolation';
import type { QueryTemplate, Variable } from './domain';

const variables: readonly Variable[] = [
  { id: 'domain', label: 'Domain', kind: 'domain', required: true },
  { id: 'filetype', label: 'File type', kind: 'enum', required: false, defaultValue: 'pdf', options: [{ label: 'PDF', value: 'pdf' }] }
];

const template: QueryTemplate = {
  id: 'template-test',
  label: 'Test',
  description: 'Test template',
  template: 'site:{{ domain }} filetype:{{filetype}}',
  variables,
  outputKind: 'search-query'
};

describe('interpolation', () => {
  it('interpolates with normalized values and defaults deterministically', () => {
    const result = interpolateTemplate(template, { domain: '  Example.COM  ' });

    expect(result.output).toBe('site:Example.COM filetype:pdf');
    expect(result.issues).toEqual([]);
  });

  it('returns sorted unique template variable ids', () => {
    expect(getTemplateVariableIds('{{repo}} {{ owner }} {{repo}}')).toEqual(['owner', 'repo']);
  });

  it('validates required, domain, enum, text, and length contracts', () => {
    expect(validateVariables(variables, { domain: 'not a domain', filetype: 'exe' })).toEqual([
      { variableId: 'domain', message: 'Domain must be a domain.' },
      { variableId: 'filetype', message: 'File type must be one of the allowed options.' }
    ]);

    expect(
      validateVariables([{ id: 'term', label: 'Term', kind: 'text', required: true, minLength: 3 }], { term: 'a' })
    ).toEqual([{ variableId: 'term', message: 'Term must be at least 3 characters.' }]);
  });

  it('builds only allowlisted launch URLs and encodes the query', () => {
    const googleTemplate = { ...template, launchUrlTemplate: 'https://www.google.com/search?q={{query}}' };
    expect(buildLaunchUrl(googleTemplate, 'site:example.com filetype:pdf')).toBe(
      'https://www.google.com/search?q=site%3Aexample.com%20filetype%3Apdf'
    );
    expect(
      buildLaunchUrl({ ...template, launchUrlTemplate: 'https://example.org/?q={{query}}' }, 'test')
    ).toBeNull();
  });

  it('validates template declaration drift', () => {
    expect(
      validateTemplate({
        ...template,
        template: '{{known}} {{missing}}',
        variables: [{ id: 'known', label: 'Known', kind: 'text', required: true }, { id: 'unused', label: 'Unused', kind: 'text', required: false }]
      })
    ).toEqual([
      { variableId: 'missing', message: 'Template references undeclared variable "missing".' },
      { variableId: 'unused', message: 'Unused is declared but not used.' }
    ]);
  });
});

