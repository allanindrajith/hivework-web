import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT =
  process.env.HIVEWORK_REPO_ROOT || path.resolve(__dirname, '../../Hivework');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const lines = match[1].split(/\r?\n/);
  const data = {};
  let currentKey = null;
  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      let val = keyMatch[2].trim();
      if (val === '>-' || val === '>' || val === '|-' || val === '|') {
        val = '';
      } else if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      data[currentKey] = val;
    } else if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      const part = line.trim();
      if (part) {
        data[currentKey] = data[currentKey] ? `${data[currentKey]} ${part}` : part;
      }
    }
  }
  return data;
}

function walkDirForMarkdown(dir) {
  const files = [];
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

export function buildCatalog(repoRoot) {
  if (!repoRoot || typeof repoRoot !== 'string') {
    throw new Error('A valid repoRoot directory path must be provided');
  }

  const toolsPath = path.join(repoRoot, 'tools.json');
  const divisionsPath = path.join(repoRoot, 'divisions.json');
  const runbooksPath = path.join(repoRoot, 'strategy/runbooks.json');
  const logoPath = path.join(repoRoot, 'assets/logo.svg');
  const logoIconPath = path.join(repoRoot, 'assets/logo-icon.svg');

  if (!fs.existsSync(toolsPath)) {
    throw new Error(`tools.json not found at ${toolsPath}`);
  }
  if (!fs.existsSync(divisionsPath)) {
    throw new Error(`divisions.json not found at ${divisionsPath}`);
  }
  if (!fs.existsSync(runbooksPath)) {
    throw new Error(`strategy/runbooks.json not found at ${runbooksPath}`);
  }
  if (!fs.existsSync(logoPath)) {
    throw new Error(`assets/logo.svg not found at ${logoPath}`);
  }
  if (!fs.existsSync(logoIconPath)) {
    throw new Error(`assets/logo-icon.svg not found at ${logoIconPath}`);
  }

  let toolsJson;
  let divisionsJson;
  let runbooksJson;

  try {
    toolsJson = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse tools.json: ${err.message}`);
  }

  try {
    divisionsJson = JSON.parse(fs.readFileSync(divisionsPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse divisions.json: ${err.message}`);
  }

  try {
    runbooksJson = JSON.parse(fs.readFileSync(runbooksPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse strategy/runbooks.json: ${err.message}`);
  }

  if (!toolsJson.tools || typeof toolsJson.tools !== 'object' || Object.keys(toolsJson.tools).length === 0) {
    throw new Error('tools.json must contain a non-empty "tools" object');
  }
  if (!divisionsJson.divisions || typeof divisionsJson.divisions !== 'object' || Object.keys(divisionsJson.divisions).length === 0) {
    throw new Error('divisions.json must contain a non-empty "divisions" object');
  }
  if (!Array.isArray(runbooksJson.runbooks) || runbooksJson.runbooks.length === 0) {
    throw new Error('strategy/runbooks.json must contain a non-empty "runbooks" array');
  }

  const tools = Object.values(toolsJson.tools).sort((a, b) => a.order - b.order);

  const divisions = [];
  let totalAgents = 0;

  for (const [key, meta] of Object.entries(divisionsJson.divisions)) {
    const divDir = path.join(repoRoot, key);
    if (!fs.existsSync(divDir)) {
      throw new Error(`Division directory "${key}" not found at ${divDir}`);
    }
    const mdFiles = walkDirForMarkdown(divDir);
    totalAgents += mdFiles.length;

    const agents = mdFiles.map((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fm = parseFrontmatter(content);
      const relPath = path.relative(repoRoot, filePath).split(path.sep).join('/');
      return {
        name: fm.name || path.basename(filePath, '.md'),
        description: fm.description || '',
        slug: path.basename(filePath, '.md'),
        path: relPath,
      };
    });

    const samples = agents.slice(0, 4).map(({ name, description, slug }) => ({
      name,
      description,
      slug,
    }));

    divisions.push({
      id: key,
      slug: key,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      agentCount: mdFiles.length,
      samples,
      agents,
    });
  }

  const skillsDir = path.join(repoRoot, 'skills');
  const skills = [];
  if (fs.existsSync(skillsDir)) {
    const entries = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      let fm = {};
      if (fs.existsSync(skillFile)) {
        fm = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
      }
      skills.push({
        slug: entry.name,
        name: fm.name || entry.name,
        description: fm.description || '',
        path: `skills/${entry.name}/SKILL.md`,
      });
    }
  }

  const agentsDir = path.join(repoRoot, 'agents');
  const reviewers = [];
  if (fs.existsSync(agentsDir)) {
    const entries = fs
      .readdirSync(agentsDir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
      .sort((a, b) => a.localeCompare(b));

    for (const fileName of entries) {
      const fullPath = path.join(agentsDir, fileName);
      const fm = parseFrontmatter(fs.readFileSync(fullPath, 'utf8'));
      const slug = path.basename(fileName, '.md');
      reviewers.push({
        slug,
        name: fm.name || slug,
        description: fm.description || '',
        path: `agents/${fileName}`,
      });
    }
  }

  const employeesDir = path.join(repoRoot, 'employees');
  const employees = [];
  if (fs.existsSync(employeesDir)) {
    const entries = fs
      .readdirSync(employeesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const empJsonPath = path.join(employeesDir, entry.name, 'employee.json');
      const workProfilePath = path.join(employeesDir, entry.name, 'work-profile.json');
      if (fs.existsSync(empJsonPath) && fs.existsSync(workProfilePath)) {
        try {
          const ej = JSON.parse(fs.readFileSync(empJsonPath, 'utf8'));
          const wp = JSON.parse(fs.readFileSync(workProfilePath, 'utf8'));
          const routinesDir = path.join(employeesDir, entry.name, 'routines');
          const routineDirs = fs.existsSync(routinesDir)
            ? fs
                .readdirSync(routinesDir, { withFileTypes: true })
                .filter((r) => r.isDirectory() && !r.name.startsWith('.'))
                .map((r) => r.name)
            : [];
          const routineKeys = Object.keys(wp.routines || {});
          const combinedRoutines = Array.from(new Set([...routineDirs, ...routineKeys])).sort();

          employees.push({
            slug: ej.slug || entry.name,
            name: ej.name || entry.name,
            role: ej.role || '',
            version: ej.version || '1.0.0',
            license: ej.license || 'MIT',
            repository: ej.repository || 'https://github.com/allanindrajith/hivework',
            objective: wp.objective || '',
            standup: wp.standup || '',
            reviewer: wp.reviewer || '',
            routineCount: combinedRoutines.length,
            routines: combinedRoutines,
            path: `employees/${entry.name}`,
          });
        } catch {
          // Ignore unparseable employee entries
        }
      }
    }
  }

  const runbooks = runbooksJson.runbooks.map((r) => ({
    ...r,
    totalAgents: new Set(r.roster?.flatMap((g) => g.agents || []) || []).size,
  }));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      agents: totalAgents,
      divisions: divisions.length,
      tools: tools.length,
      skills: skills.length,
      reviewers: reviewers.length,
      runbooks: runbooks.length,
      employees: employees.length,
    },
    tools,
    divisions,
    skills,
    reviewers,
    runbooks,
    employees,
  };
}

function extractCatalogPayload(catalog) {
  return {
    totals: catalog?.totals,
    tools: catalog?.tools,
    divisions: catalog?.divisions,
    skills: catalog?.skills,
    reviewers: catalog?.reviewers,
    runbooks: catalog?.runbooks,
    employees: catalog?.employees,
  };
}

export function syncCatalog(repoRoot = DEFAULT_REPO_ROOT) {
  const data = buildCatalog(repoRoot);

  const appDir =
    repoRoot === DEFAULT_REPO_ROOT
      ? path.resolve(__dirname, '..')
      : path.join(repoRoot, 'app');
  const targetJsonPath = path.join(appDir, 'src/data/catalog.generated.json');
  let shouldWriteJson = true;

  if (fs.existsSync(targetJsonPath)) {
    try {
      const existingRaw = fs.readFileSync(targetJsonPath, 'utf8');
      const existing = JSON.parse(existingRaw);
      if (
        existing &&
        typeof existing === 'object' &&
        typeof existing.generatedAt === 'string' &&
        existing.generatedAt.trim().length > 0
      ) {
        const nextPayload = JSON.parse(JSON.stringify(extractCatalogPayload(data)));
        const existingPayload = extractCatalogPayload(existing);
        if (isDeepStrictEqual(existingPayload, nextPayload)) {
          data.generatedAt = existing.generatedAt;
          const nextRaw = JSON.stringify(data, null, 2) + '\n';
          if (existingRaw === nextRaw) {
            shouldWriteJson = false;
          }
        }
      }
    } catch {
      // Ignore unreadable or malformed existing catalog JSON and regenerate cleanly.
    }
  }

  if (shouldWriteJson) {
    fs.mkdirSync(path.dirname(targetJsonPath), { recursive: true });
    fs.writeFileSync(targetJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  const publicDir = path.join(appDir, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'assets/logo.svg'), path.join(publicDir, 'logo.svg'));
  fs.copyFileSync(path.join(repoRoot, 'assets/logo-icon.svg'), path.join(publicDir, 'logo-icon.svg'));

  syncDesktopApp(appDir);

  console.log(
    `[sync-catalog] ✓ ${shouldWriteJson ? 'Synced' : 'Up-to-date'} catalog (${data.totals.agents} agents, ${data.totals.skills} skills, ${data.totals.employees} employees, ${data.totals.tools} tools, ${data.totals.divisions} divisions) -> ${targetJsonPath}`
  );
  return data;
}

function syncDesktopApp(appDir) {
  const siblingAppDir = path.resolve(appDir, '../Hivework-app');
  if (!fs.existsSync(siblingAppDir)) return;

  const tauriConfPath = path.join(siblingAppDir, 'src-tauri/tauri.conf.json');
  if (!fs.existsSync(tauriConfPath)) return;

  try {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    const version = tauriConf.version;
    if (!version) return;

    const updaterPath = path.join(appDir, 'public/updater.json');
    if (fs.existsSync(updaterPath)) {
      const updater = JSON.parse(fs.readFileSync(updaterPath, 'utf8'));
      if (updater.version !== version) {
        updater.version = version;
        fs.writeFileSync(updaterPath, JSON.stringify(updater, null, 2) + '\n', 'utf8');
        console.log(`[sync-catalog] ✓ Synced public/updater.json to v${version}`);
      }
    }

    const dmgSource = path.join(siblingAppDir, 'src-tauri/target/release/bundle/dmg/Hivework.dmg');
    if (fs.existsSync(dmgSource)) {
      const dmgDest = path.join(appDir, 'public/downloads/Hivework.dmg');
      const rootDmgDest = path.join(appDir, 'public/Hivework.dmg');
      fs.mkdirSync(path.dirname(dmgDest), { recursive: true });
      fs.copyFileSync(dmgSource, dmgDest);
      fs.copyFileSync(dmgSource, rootDmgDest);
      const stats = fs.statSync(dmgSource);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`[sync-catalog] ✓ Synced desktop app bundle v${version} (${sizeMb} MB) -> public/downloads/Hivework.dmg`);
    }
  } catch (err) {
    console.warn(`[sync-catalog] ⚠ Could not auto-sync desktop app: ${err.message}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    syncCatalog();
  } catch (err) {
    console.error(`[sync-catalog] ✗ ${err.message}`);
    process.exit(1);
  }
}
