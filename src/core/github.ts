import type { GitHubRepository, GitHubTool, ValidationIssue } from './domain';
import { redactSensitiveText } from './safety';

const githubHostnames = new Set(['github.com', 'www.github.com']);
const repoNamePattern = /^[A-Za-z0-9_.-]{1,100}$/;
const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const reservedOwners = new Set(['features', 'marketplace', 'orgs', 'pricing', 'search', 'settings', 'topics']);

const nativeGitHubTools = [
  {
    id: 'github-home',
    title: 'Repository Home',
    description: 'Open the canonical GitHub repository page.',
    pathTemplate: '/{{owner}}/{{repo}}',
    tags: ['orientation', 'github'],
    risk: {
      level: 'low',
      summary: 'Repository locator only.',
      safeUse: 'Open public metadata and avoid copying sensitive values.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only opens a GitHub URL derived from the validated owner and repo.'
    }
  },
  {
    id: 'github-code-browser',
    title: 'Code Browser',
    description: 'Open the repository file tree on GitHub.',
    pathTemplate: '/{{owner}}/{{repo}}/tree/HEAD',
    tags: ['orientation', 'source'],
    risk: {
      level: 'low',
      summary: 'Repository navigation.',
      safeUse: 'Inspect files manually and redact sensitive values in notes.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only derives a GitHub URL from the pasted repository URL.'
    }
  },
  {
    id: 'github-code-search',
    title: 'Repository Code Search',
    description: 'Open GitHub search scoped to this repository for filenames, config keys, or framework terms.',
    pathTemplate: '/search?q=repo%3A{{owner}}%2F{{repo}}+{{term}}&type=code',
    tags: ['code', 'search'],
    risk: {
      level: 'low',
      summary: 'Public GitHub search only.',
      safeUse: 'Use descriptive terms, not live credentials or private content.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Launches a public GitHub search URL. Do not paste secrets as search terms.'
    }
  },
  {
    id: 'github-pulse',
    title: 'Repository Pulse',
    description: 'Review recent activity, merged pull requests, and open issue movement.',
    pathTemplate: '/{{owner}}/{{repo}}/pulse',
    tags: ['activity', 'triage'],
    risk: {
      level: 'low',
      summary: 'Public repository activity view.',
      safeUse: 'Use for orientation and avoid collecting private user data.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only opens GitHub pages derived from the pasted repository URL.'
    }
  },
  {
    id: 'github-releases',
    title: 'Releases',
    description: 'Inspect release history, published artifacts, and version notes.',
    pathTemplate: '/{{owner}}/{{repo}}/releases',
    tags: ['release', 'versions'],
    risk: {
      level: 'low',
      summary: 'Public release metadata.',
      safeUse: 'Use maintainer-published release notes as context for remediation.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only opens GitHub pages derived from the pasted repository URL.'
    }
  },
  {
    id: 'github-security-advisories',
    title: 'Security Advisories',
    description: 'Review public repository security advisories when maintainers have published them.',
    pathTemplate: '/{{owner}}/{{repo}}/security/advisories',
    tags: ['security', 'dependency'],
    risk: {
      level: 'low',
      summary: 'Public repository page.',
      safeUse: 'Use as a starting point for remediation planning.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only opens GitHub pages derived from the pasted repository URL.'
    }
  },
  {
    id: 'github-dependency-graph',
    title: 'Dependency Graph',
    description: 'Open GitHub dependency graph when enabled and authorized.',
    pathTemplate: '/{{owner}}/{{repo}}/network/dependencies',
    tags: ['dependency', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'May reveal dependency security details for repositories you can access.',
      safeUse: 'Use only where authorized and keep remediation notes value-free.'
    },
    authorization: {
      scope: 'owned-or-authorized',
      reminder: 'Restricted to owned or explicitly authorized repositories.'
    }
  },
  {
    id: 'github-dependabot',
    title: 'Dependabot Alerts',
    description: 'Jump to Dependabot alert triage for repositories you own or administer.',
    pathTemplate: '/{{owner}}/{{repo}}/security/dependabot',
    tags: ['dependency', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'May reveal private vulnerability details for repos you can access.',
      safeUse: 'Use only on repositories you own or are authorized to review.'
    },
    authorization: {
      scope: 'owned-or-authorized',
      reminder: 'Restricted to owned or explicitly authorized repositories.'
    }
  },
  {
    id: 'github-actions',
    title: 'Actions Workflow Runs',
    description: 'Inspect CI history, failed workflows, and release automation for a repository.',
    pathTemplate: '/{{owner}}/{{repo}}/actions',
    tags: ['ci', 'release'],
    risk: {
      level: 'low',
      summary: 'Repository workflow metadata only.',
      safeUse: 'Review logs responsibly; never copy exposed secret values.'
    },
    authorization: {
      scope: 'owned-or-authorized',
      reminder: 'Workflow logs should be reviewed only where you have authorization.'
    }
  },
  {
    id: 'github-dependency-files',
    title: 'Dependency File Search',
    description: 'Search the repository for common dependency manifests and lockfiles.',
    pathTemplate: '/search?q=repo%3A{{owner}}%2F{{repo}}+%28filename%3Apackage.json+OR+filename%3Apackage-lock.json+OR+filename%3Ayarn.lock+OR+filename%3Apnpm-lock.yaml+OR+filename%3Arequirements.txt+OR+filename%3Apyproject.toml+OR+filename%3Ago.mod+OR+filename%3ACargo.lock%29&type=code',
    tags: ['dependency', 'search'],
    risk: {
      level: 'low',
      summary: 'Public GitHub search only.',
      safeUse: 'Review manifests and lockfiles without collecting credential values.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Launches a public GitHub search URL scoped to the validated repository.'
    }
  },
  {
    id: 'github-ci-config',
    title: 'CI Configuration Search',
    description: 'Search for GitHub Actions and common CI configuration files.',
    pathTemplate: '/search?q=repo%3A{{owner}}%2F{{repo}}+%28path%3A.github%2Fworkflows+OR+filename%3A.gitlab-ci.yml+OR+filename%3AJenkinsfile+OR+filename%3A.circleci%29&type=code',
    tags: ['ci', 'search'],
    risk: {
      level: 'medium',
      summary: 'CI files can reference secret names or deployment systems.',
      safeUse: 'Record workflow names and secret reference names only, never values.'
    },
    authorization: {
      scope: 'owned-or-authorized',
      reminder: 'Review CI details only for repositories you own or are authorized to assess.'
    }
  },
  {
    id: 'github-config-exposure',
    title: 'Configuration Exposure Search',
    description: 'Search for filenames commonly involved in authorized configuration exposure review.',
    pathTemplate: '/search?q=repo%3A{{owner}}%2F{{repo}}+%28filename%3A.env+OR+filename%3A.env.example+OR+filename%3A.env.sample+OR+filename%3Aconfig.yml+OR+filename%3Aconfig.yaml+OR+filename%3Asettings.py+OR+filename%3Aapplication.properties%29&type=code',
    tags: ['configuration', 'exposure', 'authorized'],
    risk: {
      level: 'high',
      summary: 'May locate sensitive configuration paths.',
      safeUse: 'Record repository, path, and suspected type only. Do not copy or validate values.'
    },
    authorization: {
      scope: 'owned-or-authorized',
      reminder: 'Use only for owned or explicitly authorized repositories.'
    }
  },
  {
    id: 'github-permalink',
    title: 'File Finder',
    description: 'Open the repository file finder for quick manual inspection.',
    pathTemplate: '/{{owner}}/{{repo}}/find/HEAD',
    tags: ['navigation', 'files'],
    risk: {
      level: 'low',
      summary: 'Navigation helper.',
      safeUse: 'Use manual review and avoid collecting sensitive values.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Only derives a GitHub URL from a validated owner and repo.'
    }
  }
 ] as const;

const externalRepoTools: readonly GitHubTool[] = [
  {
    id: 'github-dev',
    title: 'github.dev Web Editor',
    description: "Open the repository in GitHub's browser-based VS Code editor.",
    whyUseful: 'Fast code browsing and lightweight edits without cloning the repository locally.',
    urlTemplate: 'https://github.dev/{{owner}}/{{repo}}',
    tags: ['editor', 'github', 'source'],
    source: 'github-native',
    provider: 'GitHub',
    loginRequirement: 'GitHub sign-in is required to use the github.dev editor.',
    pricing: 'Free.',
    risk: {
      level: 'low',
      summary: 'First-party GitHub browser editor.',
      safeUse: 'Do not paste secrets into edits or commit sensitive values.'
    },
    authorization: {
      scope: 'public-only',
      reminder: 'Public repository browsing is safe; private repository use requires your own authorized GitHub access.'
    }
  },
  {
    id: 'gitdiagram',
    title: 'GitDiagram',
    description: 'Generate an interactive architecture diagram for a GitHub repository.',
    whyUseful: 'Turns repository structure into a visual system map with links back to source files.',
    urlTemplate: 'https://gitdiagram.com/{{owner}}/{{repo}}',
    tags: ['architecture', 'diagram', 'external'],
    source: 'external',
    provider: 'GitDiagram',
    loginRequirement: "Public repositories can be opened without a GitHub token; private repository access uses GitDiagram's private-repository flow.",
    pricing: 'Public repository diagrams are available through the hosted service; private/API limits may vary.',
    risk: {
      level: 'medium',
      summary: 'Repository content is processed by an external service.',
      safeUse: "Prefer public repositories. Use private repositories only when authorized and only through the provider's documented private-repo flow."
    },
    authorization: {
      scope: 'public-only',
      reminder: 'This direct transform is intended for public repositories; do not embed credentials in the URL.'
    }
  },
  {
    id: 'gitingest',
    title: 'GitIngest',
    description: 'Create a prompt-friendly text digest and tree from a Git repository.',
    whyUseful: 'Produces compact repository context for review, documentation, and LLM-assisted analysis.',
    urlTemplate: 'https://gitingest.com/{{owner}}/{{repo}}',
    tags: ['digest', 'llm', 'external'],
    source: 'external',
    provider: 'GitIngest',
    loginRequirement: 'Public repositories do not require login; private repositories use a personal access token entered on GitIngest.',
    pricing: 'No hosted price is stated on the public ingest page; public repository ingestion is available without a payment prompt.',
    risk: {
      level: 'medium',
      summary: 'Repository content is sent to an external ingestion service.',
      safeUse: 'Use public repositories or explicitly authorized private repositories. Never place a token in the GitDorked URL field.'
    },
    authorization: {
      scope: 'public-only',
      reminder: "This direct transform is for public repositories; private access belongs in the provider's documented token flow."
    }
  },
  {
    id: 'deepwiki',
    title: 'DeepWiki',
    description: 'Open AI-generated repository documentation and searchable codebase context.',
    whyUseful: 'Provides architecture explanations, documentation pages, and repository-oriented research context.',
    urlTemplate: 'https://deepwiki.com/{{owner}}/{{repo}}',
    tags: ['documentation', 'wiki', 'external'],
    source: 'external',
    provider: 'DeepWiki',
    loginRequirement: "Public DeepWiki pages are viewable directly; private repository indexing uses DeepWiki's private-repository flow.",
    pricing: 'Public repository pages are available on the hosted service; separate agent or private features may have different terms.',
    risk: {
      level: 'medium',
      summary: 'Repository content and generated documentation are handled by an external service.',
      safeUse: 'Use public repositories or repositories you are authorized to index. Do not embed credentials in launch URLs.'
    },
    authorization: {
      scope: 'public-only',
      reminder: "This transform opens public repository documentation; use the provider's private flow only for repositories you control."
    }
  }
];

export const githubTools: readonly GitHubTool[] = [
  ...nativeGitHubTools.map((tool) => ({
    ...tool,
    source: 'github-native' as const,
    provider: 'GitHub',
    whyUseful: tool.description,
    loginRequirement:
      tool.authorization.scope === 'public-only'
        ? 'Public repository pages usually work without sign-in; private repository access requires GitHub authentication.'
        : 'GitHub sign-in and permission to the repository may be required for this view.',
    pricing: 'Free GitHub web view.'
  })),
  ...externalRepoTools
];

export function parseGitHubRepository(input: string): { repo?: GitHubRepository; issues: ValidationIssue[] } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { issues: [{ variableId: 'github-url', message: 'GitHub repository URL is required.' }] };
  }

  if (/^git@github\.com:/i.test(trimmed) || /^ssh:\/\//i.test(trimmed)) {
    return { issues: [{ variableId: 'github-url', message: 'Only HTTPS GitHub repository URLs are accepted.' }] };
  }

  const normalizedInput = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalizedInput);
    if (url.username || url.password) {
      return { issues: [{ variableId: 'github-url', message: 'Credential-bearing URLs are not accepted.' }] };
    }

    if (url.protocol !== 'https:') {
      return { issues: [{ variableId: 'github-url', message: 'Only HTTPS GitHub repository URLs are accepted.' }] };
    }

    if (!githubHostnames.has(url.hostname.toLowerCase())) {
      return { issues: [{ variableId: 'github-url', message: 'Only github.com repository URLs are accepted.' }] };
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length !== 2) {
      return { issues: [{ variableId: 'github-url', message: 'Expected a GitHub repository URL like https://github.com/owner/repo.' }] };
    }

    const [owner, rawRepo] = pathSegments;
    const repo = rawRepo?.replace(/\.git$/i, '');

    if (!owner || !repo) {
      return { issues: [{ variableId: 'github-url', message: 'Expected a GitHub repository URL like https://github.com/owner/repo.' }] };
    }

    if (reservedOwners.has(owner.toLowerCase())) {
      return { issues: [{ variableId: 'github-url', message: 'The GitHub owner segment is reserved and cannot identify a repository owner.' }] };
    }

    if (!ownerPattern.test(owner)) {
      return { issues: [{ variableId: 'github-url', message: 'The GitHub owner segment is malformed.' }] };
    }

    if (!repoNamePattern.test(repo)) {
      return { issues: [{ variableId: 'github-url', message: 'The GitHub repository segment is malformed.' }] };
    }

    return {
      repo: {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`
      },
      issues: []
    };
  } catch {
    return { issues: [{ variableId: 'github-url', message: 'Enter a valid GitHub repository URL.' }] };
  }
}

const repositoryToolHostnames = new Set([
  'github.com',
  'github.dev',
  'gitdiagram.com',
  'gitingest.com',
  'deepwiki.com'
]);

export function buildGitHubToolUrl(tool: GitHubTool, repo: GitHubRepository, term = ''): string {
  const safeTerm = redactSensitiveText(term.trim());
  const template = tool.urlTemplate ?? (tool.pathTemplate ? `https://github.com${tool.pathTemplate}` : '');

  if (!template) {
    throw new Error(`Repository tool "${tool.id}" has no URL template.`);
  }

  const output = template
    .replaceAll('{{owner}}', encodeURIComponent(repo.owner))
    .replaceAll('{{repo}}', encodeURIComponent(repo.repo))
    .replaceAll('{{term}}', encodeURIComponent(safeTerm));
  const url = new URL(output);

  if (url.protocol !== 'https:' || !repositoryToolHostnames.has(url.hostname.toLowerCase())) {
    throw new Error(`Repository tool "${tool.id}" produced a non-allowlisted URL.`);
  }

  return url.toString();
}
