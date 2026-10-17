import { describe, expect, it } from 'vitest';
import { sampleRecipes, sampleTools } from './seeds';
import { validateTemplate } from './interpolation';

describe('sample seeds', () => {
  it('provide valid declarative tool entries without live secret values', () => {
    expect(sampleTools.length).toBeGreaterThanOrEqual(3);

    for (const tool of sampleTools) {
      expect(validateTemplate(tool.template)).toEqual([]);
      expect(tool.risk.safeUse.toLowerCase()).toContain('secret');
      expect(JSON.stringify(tool)).not.toMatch(/sk-[a-z0-9]|ghp_[a-z0-9]|-----BEGIN/i);
    }
  });

  it('keeps tool and template ids unique with meaningful catalog coverage', () => {
    const toolIds = sampleTools.map((tool) => tool.id);
    const templateIds = sampleTools.map((tool) => tool.template.id);

    expect(new Set(toolIds).size).toBe(toolIds.length);
    expect(new Set(templateIds).size).toBe(templateIds.length);
    expect(sampleTools.length).toBeGreaterThanOrEqual(20);
    expect(sampleTools.some((tool) => tool.category === 'Dorks')).toBe(true);
    expect(sampleTools.some((tool) => tool.category === 'GitHub Dorks')).toBe(true);
    expect(sampleTools.some((tool) => tool.authorization.scope === 'owned-or-authorized')).toBe(true);
  });

  it('recipes reference existing tool ids only', () => {
    const toolIds = new Set(sampleTools.map((tool) => tool.id));

    for (const recipe of sampleRecipes) {
      for (const step of recipe.steps) {
        if (step.toolEntryId) {
          expect(toolIds.has(step.toolEntryId)).toBe(true);
        }
      }
    }
  });
});

