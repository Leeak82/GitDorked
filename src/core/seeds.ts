import type { Recipe, ToolEntry } from './domain';

const low = {
  level: 'low',
  summary: 'Public-source research query.',
  safeUse: 'Search public sources, avoid secrets, and record only non-sensitive findings.'
} as const;

const authorized = {
  scope: 'owned-or-authorized',
  reminder: 'Use this only for repositories, domains, or organizations you own or are explicitly authorized to assess.'
} as const;

const publicOnly = {
  scope: 'public-only',
  reminder: 'This uses public search indexes. Do not paste private data or live credentials into the query.'
} as const;

export const sampleTools: readonly ToolEntry[] = [
  {
    id: 'tool-public-docs-domain',
    title: 'Public Documents By Domain',
    description: 'Find indexed PDFs, spreadsheets, slide decks, and docs associated with a domain.',
    whyUseful: 'Public documents often reveal naming conventions, vendors, product details, and outdated contact paths.',
    howToUse: 'Enter the organization domain, choose a file family, copy or launch the query, then review results manually.',
    category: 'Dorks',
    tags: ['documents', 'domain', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-public-docs-domain',
      label: 'Domain document search',
      description: 'Searches public indexes for common document formats on a domain.',
      template: 'site:{{domain}} (filetype:{{filetype}})',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'domain', label: 'Domain', kind: 'domain', required: true, placeholder: 'example.com' },
        {
          id: 'filetype',
          label: 'File type',
          kind: 'enum',
          required: true,
          defaultValue: 'pdf',
          options: [
            { label: 'PDF', value: 'pdf' },
            { label: 'Spreadsheets', value: 'xls OR xlsx OR csv' },
            { label: 'Slide decks', value: 'ppt OR pptx' },
            { label: 'Docs', value: 'doc OR docx' }
          ]
        }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-github-config-research',
    title: 'GitHub Config Research',
    description: 'Find public configuration files in repositories scoped to an owner or organization.',
    whyUseful: 'Config files show frameworks, deployment patterns, dependency managers, and likely ownership areas.',
    howToUse: 'Enter a GitHub owner and a config filename or extension. Review metadata and paths, not secret values.',
    category: 'GitHub Dorks',
    tags: ['github', 'config', 'code'],
    risk: {
      level: 'medium',
      summary: 'May surface sensitive-looking public files.',
      safeUse: 'Use for authorized review and redact any secret-looking values.'
    },
    authorization: authorized,
    template: {
      id: 'template-github-config-research',
      label: 'GitHub config query',
      description: 'Scoped GitHub code search for configuration filenames.',
      template: 'org:{{owner}} filename:{{filename}}',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'owner', label: 'GitHub owner/org', kind: 'owner', required: true, placeholder: 'octo-org' },
        {
          id: 'filename',
          label: 'Filename',
          kind: 'enum',
          required: true,
          defaultValue: '.env.example',
          options: [
            { label: '.env.example', value: '.env.example' },
            { label: 'docker-compose.yml', value: 'docker-compose.yml' },
            { label: 'package.json', value: 'package.json' },
            { label: 'terraform', value: '.tf' }
          ]
        }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-dependency-advisory-review',
    title: 'Dependency Advisory Review',
    description: 'Search public advisories and dependency manifests for a package or ecosystem.',
    whyUseful: 'Pairs package names with advisories so remediation work starts from a concrete dependency surface.',
    howToUse: 'Enter a package name and ecosystem. Launch the query, then confirm results against maintainer advisories.',
    category: 'Dependencies',
    tags: ['dependency', 'advisory', 'remediation'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-dependency-advisory-review',
      label: 'Dependency advisory query',
      description: 'Finds public advisory and manifest references.',
      template: '"{{package}}" {{ecosystem}} (advisory OR vulnerability OR CVE)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'package', label: 'Package', kind: 'text', required: true, placeholder: 'lodash', minLength: 2 },
        {
          id: 'ecosystem',
          label: 'Ecosystem',
          kind: 'enum',
          required: true,
          defaultValue: 'npm',
          options: [
            { label: 'npm', value: 'npm' },
            { label: 'PyPI', value: 'pypi' },
            { label: 'Go', value: 'golang' },
            { label: 'Maven', value: 'maven' }
          ]
        }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-error-message-trace',
    title: 'Error Message Trace',
    description: 'Search exact public error strings without uploading logs or private stack traces.',
    whyUseful: 'Exact public errors can identify framework versions, common fixes, and misconfiguration patterns.',
    howToUse: 'Paste a short non-sensitive error line. Remove IDs, hosts, tokens, user data, and stack trace bodies first.',
    category: 'Troubleshooting',
    tags: ['errors', 'public', 'logs'],
    risk: {
      level: 'medium',
      summary: 'User input could contain private operational details.',
      safeUse: 'Only search sanitized snippets; GitDorked redacts common secret and token shapes before display.'
    },
    authorization: authorized,
    template: {
      id: 'template-error-message-trace',
      label: 'Sanitized error query',
      description: 'Exact-match query for a short sanitized error message.',
      template: '"{{error}}" {{framework}}',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'error', label: 'Sanitized error', kind: 'text', required: true, placeholder: 'Cannot find module', minLength: 4 },
        { id: 'framework', label: 'Framework', kind: 'text', required: false, placeholder: 'vite react' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-authorized-secret-exposure-paths',
    title: 'Authorized Secret Exposure Paths',
    description: 'Find public paths and filenames that may require remediation without displaying live secret values.',
    whyUseful: 'Helps owners identify risky files to remove, rotate, or rewrite from history.',
    howToUse: 'Scope to an owned organization or repo. Treat results as remediation leads and never validate credentials.',
    category: 'Repo Audit',
    tags: ['secrets', 'authorized', 'remediation'],
    risk: {
      level: 'high',
      summary: 'May locate secret-bearing files or historical references.',
      safeUse: 'Record file path, repository, and type only. Rotate credentials and secrets through official channels.'
    },
    authorization: authorized,
    template: {
      id: 'template-authorized-secret-exposure-paths',
      label: 'Owned repo secret-path query',
      description: 'Searches for risky filenames in an owned or authorized GitHub scope.',
      template: '{{scope}} (filename:.env OR filename:id_rsa OR filename:credentials OR filename:secrets.yml)',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'org:my-org OR repo:owner/repo' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-public-buckets-indexes',
    title: 'Public Storage Index Mentions',
    description: 'Find public pages that mention storage endpoints associated with a domain or brand.',
    whyUseful: 'Storage URLs in public pages can reveal documentation assets, archives, or mislinked public buckets.',
    howToUse: 'Enter an owned domain or brand string. Confirm ownership before investigating any storage location.',
    category: 'Exposure Review',
    tags: ['storage', 'domain', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'Can reveal public storage locations.',
      safeUse: 'Do not enumerate, download bulk content, or store secrets; use this as a remediation triage pointer.'
    },
    authorization: authorized,
    template: {
      id: 'template-public-buckets-indexes',
      label: 'Storage mention query',
      description: 'Finds public references to common storage hostnames.',
      template: '"{{brand}}" ("s3.amazonaws.com" OR "storage.googleapis.com" OR "blob.core.windows.net")',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'brand', label: 'Owned brand/domain', kind: 'text', required: true, placeholder: 'example.com', minLength: 3 }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-code-owner-map',
    title: 'Code Ownership Map',
    description: 'Find CODEOWNERS, maintainers, and contribution docs in public repositories.',
    whyUseful: 'Ownership files help route vulnerability reports, dependency upgrades, and documentation fixes.',
    howToUse: 'Scope to a GitHub owner or repository and inspect maintainership documents before opening issues.',
    category: 'GitHub Dorks',
    tags: ['github', 'ownership', 'triage'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-code-owner-map',
      label: 'Ownership file query',
      description: 'Searches for maintainer and CODEOWNERS files.',
      template: '{{scope}} (filename:CODEOWNERS OR filename:MAINTAINERS OR filename:CONTRIBUTING.md)',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'org:octo-org OR repo:owner/repo' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-release-notes-intel',
    title: 'Release Notes Intel',
    description: 'Find release notes, changelogs, and upgrade guides for a product or repository.',
    whyUseful: 'Release artifacts provide dates, breaking changes, fixed vulnerabilities, and migration clues.',
    howToUse: 'Enter a product or repository name and optionally a version to focus the public search.',
    category: 'Research',
    tags: ['release', 'docs', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-release-notes-intel',
      label: 'Release docs query',
      description: 'Searches public release artifacts.',
      template: '"{{project}}" {{version}} (changelog OR "release notes" OR upgrade)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'project', label: 'Project', kind: 'text', required: true, placeholder: 'react router', minLength: 2 },
        { id: 'version', label: 'Version', kind: 'text', required: false, placeholder: 'v7' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-github-dependency-files',
    title: 'GitHub Dependency File Sweep',
    description: 'Search an authorized GitHub scope for common dependency manifests and lockfiles.',
    whyUseful: 'Dependency manifests identify ecosystems, update surfaces, and package owners before remediation.',
    howToUse: 'Enter a repo or org scope. Review filenames and package names only; do not collect secret values.',
    category: 'Dependencies',
    tags: ['github', 'dependency', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'Repository dependency files may expose private package names.',
      safeUse: 'Use authorized scopes and keep notes free of secrets or private token values.'
    },
    authorization: authorized,
    template: {
      id: 'template-github-dependency-files',
      label: 'Dependency file query',
      description: 'Searches GitHub code for dependency manifests in an authorized scope.',
      template: '{{scope}} (filename:package.json OR filename:requirements.txt OR filename:pyproject.toml OR filename:go.mod OR filename:Gemfile.lock OR filename:Cargo.lock)',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'repo:owner/repo OR org:owner' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-github-ci-workflows',
    title: 'CI Workflow Discovery',
    description: 'Find workflow and pipeline configuration files in an owned repository or organization.',
    whyUseful: 'CI files reveal build systems, deploy paths, release gates, and secret reference names.',
    howToUse: 'Scope to an authorized repo or org and record workflow path, purpose, and owner only.',
    category: 'Repo Audit',
    tags: ['github', 'ci', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'Workflow files can mention deployment systems and secret names.',
      safeUse: 'Do not copy secret values or logs; record paths and remediation owners only.'
    },
    authorization: authorized,
    template: {
      id: 'template-github-ci-workflows',
      label: 'CI workflow query',
      description: 'Searches for common CI files.',
      template: '{{scope}} (path:.github/workflows OR filename:.gitlab-ci.yml OR filename:Jenkinsfile OR filename:circleci)',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'repo:owner/repo' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-subdomain-docs',
    title: 'Subdomain Documentation Clues',
    description: 'Find public pages that mention docs, developer portals, status pages, or support subdomains.',
    whyUseful: 'Subdomain mentions help map public knowledge bases and operational entry points.',
    howToUse: 'Enter a domain you own or are researching from public sources, then inspect indexed pages manually.',
    category: 'Research',
    tags: ['domain', 'docs', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-subdomain-docs',
      label: 'Subdomain docs query',
      description: 'Searches for common documentation and operations subdomains.',
      template: 'site:{{domain}} (docs OR developer OR status OR support OR api)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'domain', label: 'Domain', kind: 'domain', required: true, placeholder: 'example.com' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-paste-public-trace',
    title: 'Public Paste Reference Check',
    description: 'Search public web indexes for a non-sensitive project, domain, or brand string in paste contexts.',
    whyUseful: 'Paste references can indicate leaked notes or copied logs that need owner triage.',
    howToUse: 'Search only owned brands or public project names. Redact values and avoid opening suspicious payloads.',
    category: 'Exposure Review',
    tags: ['paste', 'brand', 'authorized'],
    risk: {
      level: 'high',
      summary: 'May surface sensitive-looking public snippets.',
      safeUse: 'Do not collect secrets. Capture URL, date, context, and suspected type for remediation only.'
    },
    authorization: authorized,
    template: {
      id: 'template-paste-public-trace',
      label: 'Paste reference query',
      description: 'Searches indexed paste contexts for an owned brand or project string.',
      template: '"{{term}}" (site:pastebin.com OR site:gist.github.com OR site:rentry.co OR site:paste.rs)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'term', label: 'Owned brand/project', kind: 'text', required: true, placeholder: 'example.com', minLength: 3 }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-security-policy-finder',
    title: 'Security Policy Finder',
    description: 'Find security.txt, SECURITY.md, vulnerability disclosure, and bug bounty policy pages.',
    whyUseful: 'Disclosure policies identify approved reporting paths and scope before any deeper review.',
    howToUse: 'Enter a domain or project name and use published scope rules before continuing research.',
    category: 'Triage',
    tags: ['policy', 'security', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-security-policy-finder',
      label: 'Security policy query',
      description: 'Searches for published vulnerability disclosure policies.',
      template: '"{{name}}" (security.txt OR SECURITY.md OR "vulnerability disclosure" OR "bug bounty")',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'name', label: 'Organization/project', kind: 'text', required: true, placeholder: 'example', minLength: 2 }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-package-maintainer-map',
    title: 'Package Maintainer Map',
    description: 'Find package registry pages and maintainer metadata for a public dependency.',
    whyUseful: 'Maintainer and registry metadata helps route dependency upgrade or vulnerability questions.',
    howToUse: 'Enter a package and ecosystem, then verify results on official package registry pages.',
    category: 'Dependencies',
    tags: ['package', 'maintainer', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-package-maintainer-map',
      label: 'Package maintainer query',
      description: 'Searches registry and maintainer pages.',
      template: '"{{package}}" {{ecosystem}} (maintainer OR repository OR homepage OR registry)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'package', label: 'Package', kind: 'text', required: true, placeholder: 'express', minLength: 2 },
        {
          id: 'ecosystem',
          label: 'Ecosystem',
          kind: 'enum',
          required: true,
          defaultValue: 'npm',
          options: [
            { label: 'npm', value: 'npm' },
            { label: 'PyPI', value: 'pypi' },
            { label: 'Maven', value: 'maven' },
            { label: 'RubyGems', value: 'rubygems' },
            { label: 'Cargo', value: 'cargo' }
          ]
        }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-infrastructure-as-code-map',
    title: 'Infrastructure-as-Code Map',
    description: 'Find Terraform, Helm, Docker, and Compose files in authorized GitHub scopes.',
    whyUseful: 'IaC files show deployment boundaries, managed services, regions, and remediation owners.',
    howToUse: 'Scope to owned repositories and record filenames, components, and owner teams only.',
    category: 'Repo Audit',
    tags: ['iac', 'github', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'Infrastructure files may reveal internal architecture.',
      safeUse: 'Use authorized scopes and avoid storing secrets, account IDs, or private endpoints.'
    },
    authorization: authorized,
    template: {
      id: 'template-infrastructure-as-code-map',
      label: 'IaC query',
      description: 'Searches for common infrastructure-as-code filenames.',
      template: '{{scope}} (filename:main.tf OR filename:Chart.yaml OR filename:docker-compose.yml OR filename:Dockerfile OR filename:kustomization.yaml)',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'org:my-org OR repo:owner/repo' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-public-index-of',
    title: 'Public Directory Listing Clues',
    description: 'Find indexed directory listing pages associated with an owned domain.',
    whyUseful: 'Directory listing clues can identify forgotten public folders and files for cleanup.',
    howToUse: 'Use on owned domains and inspect sparingly; record URL and category, not sensitive values.',
    category: 'Exposure Review',
    tags: ['domain', 'exposure', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'May reveal public directory listings.',
      safeUse: 'Do not bulk-download files or store secrets; create remediation notes from paths only.'
    },
    authorization: authorized,
    template: {
      id: 'template-public-index-of',
      label: 'Directory listing query',
      description: 'Searches public indexes for directory listing pages.',
      template: 'site:{{domain}} intitle:"index of" (backup OR config OR upload OR archive)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'domain', label: 'Owned domain', kind: 'domain', required: true, placeholder: 'example.com' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-issue-triage-context',
    title: 'Public Issue Triage Context',
    description: 'Find public issues and discussions for a project, package, or error phrase.',
    whyUseful: 'Public issue context can confirm known bugs, maintainer guidance, and workaround status.',
    howToUse: 'Enter a non-sensitive issue phrase and project name; keep private stack traces out of queries.',
    category: 'Troubleshooting',
    tags: ['issues', 'triage', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-issue-triage-context',
      label: 'Issue triage query',
      description: 'Searches public issue trackers and discussions.',
      template: '"{{phrase}}" "{{project}}" (site:github.com OR site:gitlab.com) (issues OR discussions)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'phrase', label: 'Sanitized phrase', kind: 'text', required: true, placeholder: 'timeout waiting for lock', minLength: 4 },
        { id: 'project', label: 'Project/package', kind: 'text', required: true, placeholder: 'vite', minLength: 2 }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-github-repository-discovery',
    title: 'GitHub Repository Discovery',
    description: 'Search public GitHub repositories by project term, description, README text, and optional language.',
    whyUseful: 'Finds upstream projects, examples, alternatives, and related repositories without leaving GitHub search.',
    howToUse: 'Enter a public project or technology term and optionally narrow by language.',
    category: 'GitHub Dorks',
    tags: ['github', 'repositories', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-github-repository-discovery',
      label: 'Repository discovery query',
      description: 'Searches public GitHub repository metadata and README text.',
      template: '{{term}} in:name,description,readme {{language}}',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=repositories',
      variables: [
        { id: 'term', label: 'Project/technology', kind: 'text', required: true, placeholder: 'local llm', minLength: 2 },
        {
          id: 'language',
          label: 'Language filter',
          kind: 'enum',
          required: false,
          defaultValue: '',
          options: [
            { label: 'Any language', value: '' },
            { label: 'TypeScript', value: 'language:TypeScript' },
            { label: 'JavaScript', value: 'language:JavaScript' },
            { label: 'Python', value: 'language:Python' },
            { label: 'C#', value: 'language:C#' },
            { label: 'Go', value: 'language:Go' }
          ]
        }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-github-release-automation',
    title: 'Release Automation Search',
    description: 'Find release workflow files and common release tooling in an owned or authorized GitHub scope.',
    whyUseful: 'Shows where tags, packages, changelogs, and release gates are automated before troubleshooting delivery.',
    howToUse: 'Scope to an owned repo or org and review workflow paths and release tooling references.',
    category: 'Repo Audit',
    tags: ['github', 'release', 'ci', 'authorized'],
    risk: {
      level: 'medium',
      summary: 'Release workflows can expose deployment structure and secret reference names.',
      safeUse: 'Use authorized scopes and record workflow paths or secret names only, never secret values.'
    },
    authorization: authorized,
    template: {
      id: 'template-github-release-automation',
      label: 'Release automation query',
      description: 'Searches for release-oriented workflow and configuration files.',
      template: '{{scope}} (path:.github/workflows release OR filename:.releaserc OR filename:.releaserc.json OR filename:.changeset OR "semantic-release")',
      launchUrlTemplate: 'https://github.com/search?q={{query}}&type=code',
      variables: [
        { id: 'scope', label: 'GitHub scope', kind: 'text', required: true, placeholder: 'repo:owner/repo' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  },
  {
    id: 'tool-public-tech-surface',
    title: 'Public Docs/API/Status Surface',
    description: 'Find indexed documentation, developer, API, and status pages on a public domain.',
    whyUseful: 'Quickly maps the public technical entry points that explain integrations, incidents, and supported workflows.',
    howToUse: 'Enter a domain and review only pages intentionally indexed for public access.',
    category: 'Research',
    tags: ['google', 'docs', 'api', 'status', 'public'],
    risk: low,
    authorization: publicOnly,
    template: {
      id: 'template-public-tech-surface',
      label: 'Public technical surface query',
      description: 'Searches indexed public technical pages under a domain.',
      template: 'site:{{domain}} (inurl:docs OR inurl:developer OR inurl:api OR inurl:status)',
      launchUrlTemplate: 'https://www.google.com/search?q={{query}}',
      variables: [
        { id: 'domain', label: 'Domain', kind: 'domain', required: true, placeholder: 'example.com' }
      ],
      outputKind: 'search-query'
    },
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22'
  }
];

export const sampleRecipes: readonly Recipe[] = [
  {
    id: 'recipe-owned-repo-baseline',
    title: 'Owned Repository Baseline',
    description: 'A short, non-invasive pass for understanding a repository before remediation work.',
    tags: ['github', 'authorized', 'triage'],
    risk: {
      level: 'medium',
      summary: 'Uses public and authorized repository pages only.',
      safeUse: 'Do not test credentials, exploit issues, or scan third-party infrastructure.'
    },
    authorization: authorized,
    steps: [
      {
        id: 'repo-map',
        kind: 'tool',
        title: 'Map ownership files',
        guidance: 'Start with ownership and contributing files so findings have a clear owner.',
        toolEntryId: 'tool-code-owner-map'
      },
      {
        id: 'repo-config',
        kind: 'tool',
        title: 'Review config surfaces',
        guidance: 'Search for config files and note frameworks, deployment services, and stale environments.',
        toolEntryId: 'tool-github-config-research'
      },
      {
        id: 'repo-secret-paths',
        kind: 'tool',
        title: 'Check secret-prone paths',
        guidance: 'Record repository, file path, and secret type only; rotate through approved channels.',
        toolEntryId: 'tool-authorized-secret-exposure-paths'
      }
    ]
  },
  {
    id: 'recipe-public-docs-review',
    title: 'Public Documentation Review',
    description: 'Discover public docs and turn them into clean research notes without collecting sensitive values.',
    tags: ['documents', 'public', 'osint'],
    risk: low,
    authorization: publicOnly,
    steps: [
      {
        id: 'docs-search',
        kind: 'tool',
        title: 'Search public documents',
        guidance: 'Start broad with PDFs and spreadsheets, then narrow to relevant titles and dates.',
        toolEntryId: 'tool-public-docs-domain'
      },
      {
        id: 'release-context',
        kind: 'tool',
        title: 'Add release context',
        guidance: 'Find release notes and changelogs for products named in the public documents.',
        toolEntryId: 'tool-release-notes-intel'
      },
      {
        id: 'notes',
        kind: 'checklist',
        title: 'Record only safe facts',
        guidance: 'Keep source URL, publication date, title, and non-sensitive summary. Avoid private emails, tokens, or personal data.'
      }
    ]
  },
  {
    id: 'recipe-dependency-remediation-brief',
    title: 'Dependency Remediation Brief',
    description: 'Collect public dependency context before opening an upgrade or advisory ticket.',
    tags: ['dependency', 'remediation', 'public'],
    risk: {
      level: 'medium',
      summary: 'Uses package and repository metadata only.',
      safeUse: 'Keep notes free of secrets, private package tokens, and exploit instructions.'
    },
    authorization: authorized,
    steps: [
      {
        id: 'dependency-files',
        kind: 'tool',
        title: 'Find dependency files',
        guidance: 'Identify manifests and lockfiles so the affected ecosystem is concrete.',
        toolEntryId: 'tool-github-dependency-files'
      },
      {
        id: 'advisory-context',
        kind: 'tool',
        title: 'Gather advisory context',
        guidance: 'Search public advisories and maintainer notes for the package and ecosystem.',
        toolEntryId: 'tool-dependency-advisory-review'
      },
      {
        id: 'maintainer-map',
        kind: 'tool',
        title: 'Map maintainers',
        guidance: 'Confirm the registry page, upstream repository, and maintainer contact path.',
        toolEntryId: 'tool-package-maintainer-map'
      },
      {
        id: 'remediation-note',
        kind: 'checklist',
        title: 'Draft the ticket',
        guidance: 'Include package, ecosystem, affected manifest path, advisory URL, owner, and next safe upgrade step.'
      }
    ]
  },
  {
    id: 'recipe-authorized-exposure-triage',
    title: 'Authorized Exposure Triage',
    description: 'A defensive pass for owned domains and repositories without harvesting sensitive values.',
    tags: ['authorized', 'exposure', 'remediation'],
    risk: {
      level: 'high',
      summary: 'May locate public paths that require cleanup or rotation.',
      safeUse: 'Record path and type only. Never validate, reuse, or store secrets.'
    },
    authorization: authorized,
    steps: [
      {
        id: 'policy-first',
        kind: 'tool',
        title: 'Confirm policy and scope',
        guidance: 'Find published security policy and verify the work is in scope.',
        toolEntryId: 'tool-security-policy-finder'
      },
      {
        id: 'config-paths',
        kind: 'tool',
        title: 'Check risky repository paths',
        guidance: 'Search for risky filenames and document path/type only.',
        toolEntryId: 'tool-authorized-secret-exposure-paths'
      },
      {
        id: 'public-indexes',
        kind: 'tool',
        title: 'Review public listing clues',
        guidance: 'Look for directory listing clues on owned domains without downloading bulk content.',
        toolEntryId: 'tool-public-index-of'
      },
      {
        id: 'paste-mentions',
        kind: 'tool',
        title: 'Check indexed paste mentions',
        guidance: 'Search owned brand terms and capture only source URL, date, and suspected exposure type.',
        toolEntryId: 'tool-paste-public-trace'
      }
    ]
  },
  {
    id: 'recipe-release-readiness-map',
    title: 'Release Readiness Map',
    description: 'Build a public-source view of release activity, CI, ownership, and upgrade notes.',
    tags: ['release', 'ci', 'github'],
    risk: {
      level: 'medium',
      summary: 'Mixes public release notes with authorized repository metadata.',
      safeUse: 'Do not store secrets from workflow logs or private operational details.'
    },
    authorization: authorized,
    steps: [
      {
        id: 'release-notes',
        kind: 'tool',
        title: 'Find release artifacts',
        guidance: 'Search changelogs and release notes for dates, fixes, and migration guidance.',
        toolEntryId: 'tool-release-notes-intel'
      },
      {
        id: 'ci-workflows',
        kind: 'tool',
        title: 'Locate CI workflows',
        guidance: 'Review workflow files for build and deploy stages where you are authorized.',
        toolEntryId: 'tool-github-ci-workflows'
      },
      {
        id: 'ownership',
        kind: 'tool',
        title: 'Confirm ownership',
        guidance: 'Find CODEOWNERS and contribution docs so follow-up has a real destination.',
        toolEntryId: 'tool-code-owner-map'
      }
    ]
  }
];
