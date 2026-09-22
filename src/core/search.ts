import type { ToolEntry } from './domain';

export interface ToolFilter {
  query?: string;
  category?: string;
  tags?: readonly string[];
}

export function filterTools(tools: readonly ToolEntry[], filter: ToolFilter): ToolEntry[] {
  const query = filter.query?.trim().toLowerCase() ?? '';
  const tags = new Set(filter.tags ?? []);

  return tools.filter((tool) => {
    const searchableText = [
      tool.title,
      tool.description,
      tool.whyUseful,
      tool.howToUse,
      tool.category,
      tool.risk.summary,
      tool.authorization.reminder,
      ...tool.tags
    ].join(' ');
    const matchesQuery = query.length === 0 || searchableText.toLowerCase().includes(query);
    const matchesCategory = !filter.category || tool.category === filter.category;
    const matchesTags = tags.size === 0 || tool.tags.some((tag) => tags.has(tag));

    return matchesQuery && matchesCategory && matchesTags;
  });
}
