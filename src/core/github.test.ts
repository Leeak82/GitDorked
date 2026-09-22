import { describe, expect, it } from 'vitest';
import { buildGitHubToolUrl, githubTools, parseGitHubRepository } from './github';

describe('github repository URL utilities', () => {
  it('parses accepted repository URLs into canonical owner/repo values', () => {
    expect(parseGitHubRepository('https://github.com/openai/openai-node').repo).toEqual({
      owner: 'openai',
      repo: 'openai-node',
      url: 'https://github.com/openai/openai-node'
    });

    expect(parseGitHubRepository('https://www.github.com/OWNER/repo_name?tab=readme#readme').repo).toEqual({
      owner: 'OWNER',
      repo: 'repo_name',
      url: 'https://github.com/OWNER/repo_name'
    });

    expect(parseGitHubRepository('github.com/example/repo.git').repo?.url).toBe('https://github.com/example/repo');
  });

  it('rejects malformed, nested, non-https, and credential-bearing URLs', () => {
    const invalidInputs = [
      'git@github.com:example/repo.git',
      'http://github.com/example/repo',
      'https://gitlab.com/example/repo',
      'https://github.com/example/repo/issues/1',
      'https://github.com/search/repo',
      'https://ghp_exampletoken@github.com/example/repo',
      'https://github.com/-bad/repo',
      'https://github.com/example/bad repo'
    ];

    for (const input of invalidInputs) {
      expect(parseGitHubRepository(input).issues.length).toBeGreaterThan(0);
    }
  });

  it('builds allowlisted GitHub tool URLs and redacts sensitive search terms', () => {
    const repo = parseGitHubRepository('https://github.com/example/repo').repo;
    const tool = githubTools.find((candidate) => candidate.id === 'github-code-search');

    expect(repo).toBeDefined();
    expect(tool).toBeDefined();
    expect(buildGitHubToolUrl(tool!, repo!, 'token=ghp_abcdefghijklmnopqrstuvwxyz')).toContain(
      '%5BREDACTED%5D'
    );
    expect(buildGitHubToolUrl(tool!, repo!, 'filename:package.json')).toBe(
      'https://github.com/search?q=repo%3Aexample%2Frepo+filename%3Apackage.json&type=code'
    );
  });

  it('generates the verified repository URL transforms', () => {
    const repo = parseGitHubRepository('https://github.com/example/repo').repo!;
    const expected = {
      'github-dev': 'https://github.dev/example/repo',
      gitdiagram: 'https://gitdiagram.com/example/repo',
      gitingest: 'https://gitingest.com/example/repo',
      deepwiki: 'https://deepwiki.com/example/repo'
    };

    for (const [id, url] of Object.entries(expected)) {
      const tool = githubTools.find((candidate) => candidate.id === id);
      expect(tool).toBeDefined();
      expect(buildGitHubToolUrl(tool!, repo)).toBe(url);
    }
  });

  it('keeps every repository tool on the explicit host allowlist with required metadata', () => {
    const repo = parseGitHubRepository('https://github.com/example/repo').repo!;
    const allowedHosts = new Set(['github.com', 'github.dev', 'gitdiagram.com', 'gitingest.com', 'deepwiki.com']);

    for (const tool of githubTools) {
      expect(allowedHosts.has(new URL(buildGitHubToolUrl(tool, repo, 'readme')).hostname)).toBe(true);
      expect(tool.whyUseful.length).toBeGreaterThan(10);
      expect(tool.loginRequirement.length).toBeGreaterThan(3);
      expect(tool.pricing.length).toBeGreaterThan(2);
    }
  });
});
