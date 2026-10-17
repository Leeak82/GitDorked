import { describe, expect, it } from 'vitest';
import { sampleTools } from './seeds';
import { filterTools } from './search';

describe('filterTools', () => {
  it('filters by query, category, and tags without mutating tools', () => {
    expect(filterTools(sampleTools, { query: 'config' }).map((tool) => tool.id)).toContain(
      'tool-github-config-research'
    );
    expect(filterTools(sampleTools, { category: 'Dorks' }).map((tool) => tool.id)).toEqual([
      'tool-public-docs-domain'
    ]);
    expect(filterTools(sampleTools, { tags: ['dependency'] }).map((tool) => tool.id)).toEqual(
      expect.arrayContaining(['tool-dependency-advisory-review', 'tool-github-dependency-files'])
    );
  });
});
