/**
 * Hivework Data Model & Catalog Schema
 * Matches src/data/catalog.generated.json
 */

export interface CatalogTotals {
  agents: number;
  divisions: number;
  tools: number;
  skills: number;
  reviewers: number;
  runbooks: number;
}

export interface ToolScope {
  user: boolean;
  project: boolean;
}

export interface ToolDetect {
  dirs: string[];
  agentsDir: string | null;
}

export interface ToolVersion {
  bin: string;
  args: string[];
}

export interface ToolDest {
  user: string[];
  project: string[];
}

export interface ToolEntry {
  id: string;
  label: string;
  short: string;
  kebab: string;
  accent: string;
  icon: string | null;
  order: number;
  scope: ToolScope;
  detect: ToolDetect;
  version: ToolVersion;
  format: string;
  installKind: 'per-agent' | 'roster' | 'plugin';
  slugFrom?: string | null;
  slugPrefix?: string;
  dest: ToolDest;
}

export interface DivisionSample {
  name: string;
  description: string;
  slug: string;
}

export interface AgentEntry {
  name: string;
  description: string;
  slug: string;
  path: string;
}

export interface DivisionEntry {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  agentCount: number;
  samples: DivisionSample[];
  agents: AgentEntry[];
}

export interface SkillEntry {
  slug: string;
  name: string;
  description: string;
  path: string;
}

export interface ReviewerEntry {
  slug: string;
  name: string;
  description: string;
  path: string;
}

export interface RunbookRosterGroup {
  group: string;
  activation: string;
  agents: string[];
}

export interface RunbookEntry {
  slug: string;
  title: string;
  mode: string;
  duration: string;
  summary: string;
  doc: string;
  roster: RunbookRosterGroup[];
  totalAgents: number;
}

export interface CatalogData {
  generatedAt: string;
  totals: CatalogTotals;
  tools: ToolEntry[];
  divisions: DivisionEntry[];
  skills: SkillEntry[];
  reviewers: ReviewerEntry[];
  runbooks: RunbookEntry[];
}

export type CliCommandMode = 'local' | 'bootstrap';

export interface CliOptions {
  mode?: CliCommandMode;
  repoUrl?: string;
  tool?: string;
  division?: string;
  skills?: boolean;
  link?: boolean;
  dryRun?: boolean;
  noInteractive?: boolean;
  agent?: string;
  agents?: string[];
}

export interface SiteConfig {
  domain: string;
  siteUrl: string;
  creatorName: string;
  creatorUrl: string;
  buyMeACoffeeUrl?: string;
  primaryEmail: string;
  forwardTargetEmail: string;
  repoUrl: string;
  xUrl: string;
  githubUrl?: string;
}
