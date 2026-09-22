export type RiskLevel = 'low' | 'medium' | 'high';

export type AuthorizationScope = 'public-only' | 'owned-or-authorized' | 'local-only';

export interface RiskMetadata {
  level: RiskLevel;
  summary: string;
  safeUse: string;
}

export interface AuthorizationMetadata {
  scope: AuthorizationScope;
  reminder: string;
}

export type VariableKind = 'text' | 'url' | 'domain' | 'owner' | 'repo' | 'enum';

export interface VariableOption {
  value: string;
  label: string;
}

export interface Variable {
  id: string;
  label: string;
  kind: VariableKind;
  required: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: readonly VariableOption[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface QueryTemplate {
  id: string;
  label: string;
  description: string;
  template: string;
  variables: readonly Variable[];
  outputKind: 'search-query' | 'url' | 'checklist';
  launchUrlTemplate?: string;
}

export interface ToolEntry {
  id: string;
  title: string;
  description: string;
  whyUseful: string;
  howToUse: string;
  category: string;
  tags: readonly string[];
  risk: RiskMetadata;
  authorization: AuthorizationMetadata;
  template: QueryTemplate;
  createdAt: string;
  updatedAt: string;
}

export type RecipeStepKind = 'tool' | 'guidance' | 'checklist';

export interface RecipeStep {
  id: string;
  kind: RecipeStepKind;
  title: string;
  guidance: string;
  toolEntryId?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  tags: readonly string[];
  risk: RiskMetadata;
  authorization: AuthorizationMetadata;
  steps: readonly RecipeStep[];
}

export interface ValidationIssue {
  variableId: string;
  message: string;
}

export interface InterpolationResult {
  output: string;
  issues: readonly ValidationIssue[];
}

export interface PersistedState {
  favoriteToolIds: string[];
  recentInterpolations: Array<{
    toolEntryId: string;
    values: Record<string, string>;
    output: string;
    createdAt: string;
  }>;
  recentRepos: Array<{
    owner: string;
    repo: string;
    url: string;
    createdAt: string;
  }>;
}

export interface GitHubRepository {
  owner: string;
  repo: string;
  url: string;
}

export type RepositoryToolSource = 'github-native' | 'external';

export interface GitHubTool {
  id: string;
  title: string;
  description: string;
  pathTemplate?: string;
  urlTemplate?: string;
  tags: readonly string[];
  risk: RiskMetadata;
  authorization: AuthorizationMetadata;
  source: RepositoryToolSource;
  provider: string;
  whyUseful: string;
  loginRequirement: string;
  pricing: string;
}
