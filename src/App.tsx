import { useEffect, useMemo, useState } from 'react';
import {
  BrowserLocalStore,
  buildGitHubToolUrl,
  buildLaunchUrl,
  defaultPersistedState,
  filterTools,
  githubTools,
  hasSensitiveText,
  interpolateTemplate,
  normalizeForDisplay,
  parseGitHubRepository,
  sampleRecipes,
  sampleTools,
  type GitHubRepository,
  type GitHubTool,
  type PersistedState,
  type Recipe,
  type ToolEntry
} from './core';
import './styles.css';

type View = 'catalog' | 'repo' | 'recipes' | 'saved';
type ActionStatus = { tone: 'good' | 'warn'; message: string } | null;

const store = new BrowserLocalStore<PersistedState>('gitdorked:v1', defaultPersistedState);
const maxHistoryItems = 8;
const nativeRepoTools = githubTools.filter((tool) => tool.source === 'github-native');
const externalRepoTools = githubTools.filter((tool) => tool.source === 'external');

function App() {
  const [view, setView] = useState<View>('catalog');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedToolId, setSelectedToolId] = useState(sampleTools[0]?.id ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [persistedState, setPersistedState] = useState<PersistedState>(defaultPersistedState);
  const [repoInput, setRepoInput] = useState('');
  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [status, setStatus] = useState<ActionStatus>(null);

  useEffect(() => {
    void store.load().then(setPersistedState);
  }, []);

  const categories = useMemo(() => ['All', ...new Set(sampleTools.map((tool) => tool.category))].sort(), []);
  const filteredTools = useMemo(
    () => filterTools(sampleTools, { query, category: category === 'All' ? undefined : category }),
    [category, query]
  );
  const selectedTool = sampleTools.find((tool) => tool.id === selectedToolId) ?? filteredTools[0] ?? sampleTools[0];
  const interpolation = selectedTool ? interpolateTemplate(selectedTool.template, values) : null;
  const launchUrl = selectedTool && interpolation ? buildLaunchUrl(selectedTool.template, interpolation.output) : null;
  const favoriteIds = new Set(persistedState.favoriteToolIds);
  const favoriteTools = persistedState.favoriteToolIds
    .map((toolId) => sampleTools.find((tool) => tool.id === toolId))
    .filter((tool): tool is ToolEntry => Boolean(tool));
  const repoParse = parseGitHubRepository(repoInput);

  useEffect(() => {
    if (!selectedTool || filteredTools.some((tool) => tool.id === selectedTool.id)) {
      return;
    }

    setSelectedToolId(filteredTools[0]?.id ?? sampleTools[0]?.id ?? '');
    setValues({});
  }, [filteredTools, selectedTool]);

  function persist(nextState: PersistedState) {
    setPersistedState(nextState);
    void store.save(nextState);
  }

  function toggleFavorite(tool: ToolEntry) {
    const nextFavorites = favoriteIds.has(tool.id)
      ? persistedState.favoriteToolIds.filter((toolId) => toolId !== tool.id)
      : [tool.id, ...persistedState.favoriteToolIds];
    persist({ ...persistedState, favoriteToolIds: nextFavorites });
  }

  function rememberInterpolation(tool: ToolEntry, output: string) {
    const entry = {
      toolEntryId: tool.id,
      values: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, normalizeForDisplay(value)])),
      output: normalizeForDisplay(output),
      createdAt: new Date().toISOString()
    };
    persist({
      ...persistedState,
      recentInterpolations: [
        entry,
        ...persistedState.recentInterpolations.filter((item) => item.output !== entry.output)
      ].slice(0, maxHistoryItems)
    });
  }

  function rememberRepo(repo: GitHubRepository) {
    persist({
      ...persistedState,
      recentRepos: [
        { ...repo, createdAt: new Date().toISOString() },
        ...persistedState.recentRepos.filter((item) => item.url !== repo.url)
      ].slice(0, maxHistoryItems)
    });
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(normalizeForDisplay(text));
      setStatus({ tone: 'good', message: `${label} copied.` });
    } catch {
      setStatus({ tone: 'warn', message: 'Clipboard access was blocked by the browser.' });
    }
  }

  function openUrl(url: string | null, label: string) {
    if (!url) {
      setStatus({ tone: 'warn', message: `${label} is not available until the input is valid.` });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setStatus({ tone: 'good', message: `${label} opened in a new tab.` });
  }

  function useTool(tool: ToolEntry) {
    setSelectedToolId(tool.id);
    setValues({});
    setView('catalog');
  }

  const canUseOutput = Boolean(interpolation && interpolation.issues.length === 0 && interpolation.output.trim());

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Offline OSINT toolbox</p>
          <h1>GitDorked</h1>
          <p className="masthead-copy">
            Build public-source queries, derive allowlisted repository links, and keep local research notes free of
            secret values.
          </p>
        </div>
        <div className="stats-row" aria-label="Catalog summary">
          <span>{sampleTools.length} tools</span>
          <span>{sampleRecipes.length} recipes</span>
          <span>{favoriteTools.length} saved</span>
        </div>
      </header>

      <nav className="top-nav" aria-label="Primary">
        {[
          ['catalog', 'Catalog'],
          ['repo', 'Repo Tools'],
          ['recipes', 'Recipes'],
          ['saved', 'Saved']
        ].map(([id, label]) => (
          <button
            aria-current={view === id ? 'page' : undefined}
            className={view === id ? 'nav-button active' : 'nav-button'}
            key={id}
            onClick={() => setView(id as View)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {status ? <p className={`status-message ${status.tone}`}>{status.message}</p> : null}

      {view === 'catalog' ? (
        <section className="content-grid" aria-label="Catalog and query builder">
          <aside className="tool-browser">
            <div className="toolbar">
              <label className="field">
                <span>Search catalog</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="dependency, github, exposure"
                  type="search"
                />
              </label>
              <label className="field">
                <span>Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((categoryName) => (
                    <option key={categoryName}>{categoryName}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="tool-list" aria-label="Tool entries">
              {filteredTools.map((tool) => (
                <ToolCard
                  favorite={favoriteIds.has(tool.id)}
                  key={tool.id}
                  onSelect={() => useTool(tool)}
                  selected={tool.id === selectedTool?.id}
                  tool={tool}
                />
              ))}
              {filteredTools.length === 0 ? <p className="empty-state">No tools match this search.</p> : null}
            </div>
          </aside>

          {selectedTool && interpolation ? (
            <section className="builder-panel" aria-label="Query builder">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{selectedTool.category}</p>
                  <h2>{selectedTool.title}</h2>
                </div>
                <button className="secondary-button" onClick={() => toggleFavorite(selectedTool)} type="button">
                  {favoriteIds.has(selectedTool.id) ? 'Remove Favorite' : 'Add Favorite'}
                </button>
              </div>

              <p className="description">{selectedTool.description}</p>
              <div className="guidance-grid">
                <InfoBlock title="Why it helps" value={selectedTool.whyUseful} />
                <InfoBlock title="Safe use" value={selectedTool.risk.safeUse} />
                <InfoBlock title="Authorization" value={selectedTool.authorization.reminder} />
              </div>

              <div className="variable-stack">
                {selectedTool.template.variables.map((variable) => (
                  <label className="field" key={variable.id}>
                    <span>{variable.label}</span>
                    {variable.kind === 'enum' && variable.options ? (
                      <select
                        value={values[variable.id] ?? variable.defaultValue ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [variable.id]: event.target.value }))
                        }
                      >
                        {variable.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={values[variable.id] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [variable.id]: event.target.value }))
                        }
                        placeholder={variable.placeholder}
                      />
                    )}
                    {variable.description ? <small>{variable.description}</small> : null}
                  </label>
                ))}
              </div>

              <output className="query-output" aria-label="Interpolated output">
                {interpolation.output || 'Complete the required fields to build an output.'}
              </output>

              {hasSensitiveText(Object.values(values).join(' ')) ? (
                <p className="warning">Sensitive-looking input was redacted before display, copy, or launch.</p>
              ) : null}

              {interpolation.issues.length > 0 ? (
                <ul className="issue-list">
                  {interpolation.issues.map((issue) => (
                    <li key={`${issue.variableId}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}

              <div className="action-row">
                <button
                  disabled={!canUseOutput}
                  onClick={() => {
                    if (!selectedTool || !interpolation) {
                      return;
                    }
                    rememberInterpolation(selectedTool, interpolation.output);
                    void copyText(interpolation.output, 'Output');
                  }}
                  type="button"
                >
                  Copy Output
                </button>
                <button
                  disabled={!canUseOutput || !launchUrl}
                  onClick={() => {
                    if (!selectedTool || !interpolation) {
                      return;
                    }
                    rememberInterpolation(selectedTool, interpolation.output);
                    openUrl(launchUrl, 'Tool');
                  }}
                  type="button"
                >
                  Open
                </button>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {view === 'repo' ? (
        <section className="repo-layout" aria-label="Repository URL tools">
          <div className="builder-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Allowlisted URL utilities</p>
                <h2>Repository Tools</h2>
              </div>
            </div>
            <p className="description">
              Paste a GitHub repository URL. GitDorked derives only owner and repo, rejects token-bearing URLs, and
              builds allowlisted GitHub-native or verified external service URLs without embedding credentials.
            </p>
            <label className="field">
              <span>GitHub repository URL</span>
              <input
                value={repoInput}
                onChange={(event) => setRepoInput(event.target.value)}
                placeholder="https://github.com/owner/repo"
                type="url"
              />
            </label>
            <label className="field">
              <span>Optional code search term</span>
              <input
                value={repoSearchTerm}
                onChange={(event) => setRepoSearchTerm(event.target.value)}
                placeholder="filename:package.json"
              />
            </label>
            {repoParse.repo ? (
              <p className="repo-canonical">Canonical: {repoParse.repo.url}</p>
            ) : (
              <ul className="issue-list">
                {repoParse.issues.map((issue) => (
                  <li key={issue.message}>{issue.message}</li>
                ))}
              </ul>
            )}
          </div>

          <section className="repo-tool-section" aria-label="GitHub native repository tools">
            <div className="repo-tool-section-heading">
              <p className="eyebrow">GitHub native</p>
              <h3>First-party repository tools</h3>
            </div>
            <div className="url-tool-grid">
              {nativeRepoTools.map((tool) => (
                <RepositoryToolCard
                  key={tool.id}
                  onCopy={(url) => void copyText(url, tool.title)}
                  onOpen={(url) => openUrl(url, tool.title)}
                  onRemember={rememberRepo}
                  repo={repoParse.repo}
                  searchTerm={repoSearchTerm}
                  tool={tool}
                />
              ))}
            </div>
          </section>

          <section className="repo-tool-section" aria-label="External repository services">
            <div className="repo-tool-section-heading">
              <p className="eyebrow">External services</p>
              <h3>Verified repo URL transforms</h3>
            </div>
            <div className="url-tool-grid">
              {externalRepoTools.map((tool) => (
                <RepositoryToolCard
                  key={tool.id}
                  onCopy={(url) => void copyText(url, tool.title)}
                  onOpen={(url) => openUrl(url, tool.title)}
                  onRemember={rememberRepo}
                  repo={repoParse.repo}
                  searchTerm={repoSearchTerm}
                  tool={tool}
                />
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {view === 'recipes' ? <RecipePanel onUseTool={useTool} recipes={sampleRecipes} /> : null}

      {view === 'saved' ? (
        <SavedPanel
          favorites={favoriteTools}
          history={persistedState.recentInterpolations}
          onCopy={(text) => void copyText(text, 'Saved output')}
          onUseTool={useTool}
          repos={persistedState.recentRepos}
        />
      ) : null}

      <footer className="app-footer">
        <span>GitDorked — public-source OSINT & GitHub research toolbox.</span>
        <a
          className="bmc-link"
          href="https://buymeacoffee.com/anthonyleebuilds"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Buy me a coffee
        </a>
      </footer>
    </main>
  );
}

function ToolCard({
  favorite,
  onSelect,
  selected,
  tool
}: {
  favorite: boolean;
  onSelect: () => void;
  selected: boolean;
  tool: ToolEntry;
}) {
  return (
    <button className={selected ? 'tool-card active' : 'tool-card'} onClick={onSelect} type="button">
      <span>{tool.category}</span>
      <strong>{tool.title}</strong>
      <small>{tool.description}</small>
      <em>
        {tool.risk.level} risk {favorite ? ' | favorite' : ''}
      </em>
    </button>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <article className="info-block">
      <span>{title}</span>
      <p>{value}</p>
    </article>
  );
}

function RepositoryToolCard({
  onCopy,
  onOpen,
  onRemember,
  repo,
  searchTerm,
  tool
}: {
  onCopy: (url: string) => void;
  onOpen: (url: string) => void;
  onRemember: (repo: GitHubRepository) => void;
  repo?: GitHubRepository;
  searchTerm: string;
  tool: GitHubTool;
}) {
  const url = repo ? buildGitHubToolUrl(tool, repo, searchTerm) : '';

  return (
    <article className="url-tool-card">
      <div className="repo-tool-badges">
        <span>{tool.source === 'github-native' ? 'GitHub native' : 'External service'}</span>
        <span>{tool.risk.level} risk</span>
      </div>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
      <dl className="repo-tool-details">
        <div>
          <dt>Why useful</dt>
          <dd>{tool.whyUseful}</dd>
        </div>
        <div>
          <dt>Login</dt>
          <dd>{tool.loginRequirement}</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{tool.pricing}</dd>
        </div>
        <div>
          <dt>Safety</dt>
          <dd>{tool.risk.safeUse}</dd>
        </div>
      </dl>
      <code className="repo-launch-url">{url || 'Enter a valid GitHub repository URL to generate this launch URL.'}</code>
      <small>{tool.authorization.reminder}</small>
      <div className="action-row">
        <button
          disabled={!repo}
          onClick={() => {
            if (!repo) {
              return;
            }
            onRemember(repo);
            onCopy(url);
          }}
          type="button"
        >
          Copy URL
        </button>
        <button
          disabled={!repo}
          onClick={() => {
            if (!repo) {
              return;
            }
            onRemember(repo);
            onOpen(url);
          }}
          type="button"
        >
          Open
        </button>
      </div>
    </article>
  );
}

function RecipePanel({ onUseTool, recipes }: { onUseTool: (tool: ToolEntry) => void; recipes: readonly Recipe[] }) {
  return (
    <section className="recipe-grid" aria-label="Research recipes">
      {recipes.map((recipe) => (
        <article className="recipe-card" key={recipe.id}>
          <span>{recipe.tags.join(' / ')}</span>
          <h2>{recipe.title}</h2>
          <p>{recipe.description}</p>
          <ol>
            {recipe.steps.map((step) => {
              const tool = step.toolEntryId ? sampleTools.find((candidate) => candidate.id === step.toolEntryId) : null;
              return (
                <li key={step.id}>
                  <strong>{step.title}</strong>
                  <p>{step.guidance}</p>
                  {tool ? (
                    <button onClick={() => onUseTool(tool)} type="button">
                      Use {tool.title}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </article>
      ))}
    </section>
  );
}

function SavedPanel({
  favorites,
  history,
  onCopy,
  onUseTool,
  repos
}: {
  favorites: readonly ToolEntry[];
  history: PersistedState['recentInterpolations'];
  onCopy: (text: string) => void;
  onUseTool: (tool: ToolEntry) => void;
  repos: PersistedState['recentRepos'];
}) {
  return (
    <section className="saved-layout" aria-label="Favorites and history">
      <article className="builder-panel">
        <h2>Favorites</h2>
        {favorites.length > 0 ? (
          <div className="compact-list">
            {favorites.map((tool) => (
              <button key={tool.id} onClick={() => onUseTool(tool)} type="button">
                {tool.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-state">No favorites yet. Add useful catalog tools as you work.</p>
        )}
      </article>

      <article className="builder-panel">
        <h2>Recent Outputs</h2>
        {history.length > 0 ? (
          <div className="history-list">
            {history.map((item) => (
              <div className="history-item" key={`${item.toolEntryId}-${item.createdAt}`}>
                <code>{item.output}</code>
                <button onClick={() => onCopy(item.output)} type="button">
                  Copy
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Copy or open a valid catalog output to add local history.</p>
        )}
      </article>

      <article className="builder-panel">
        <h2>Recent Repositories</h2>
        {repos.length > 0 ? (
          <div className="history-list">
            {repos.map((repo) => (
              <div className="history-item" key={`${repo.url}-${repo.createdAt}`}>
                <code>{repo.url}</code>
                <button onClick={() => onCopy(repo.url)} type="button">
                  Copy
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Open or copy a repository tool URL to add local repo history.</p>
        )}
      </article>
    </section>
  );
}

export default App;
