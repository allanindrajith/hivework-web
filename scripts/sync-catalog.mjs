import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';

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
        } catch (err) {
          console.warn(`[sync-catalog] ⚠ Skipped employee "${entry.name}": ${err.message}`);
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

export function syncCatalog(repoRoot = DEFAULT_REPO_ROOT, { withDesktop = false } = {}) {
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

  // Publishing a binary is opt-in: `npm run sync:desktop`. A plain catalog sync never copies a DMG.
  if (withDesktop) {
    syncDesktopApp(appDir);
  }

  console.log(
    `[sync-catalog] ✓ ${shouldWriteJson ? 'Synced' : 'Up-to-date'} catalog (${data.totals.agents} agents, ${data.totals.skills} skills, ${data.totals.employees} employees, ${data.totals.tools} tools, ${data.totals.divisions} divisions) -> ${targetJsonPath}`
  );
  return data;
}

const MACH_CPU = { 0x0100000c: 'aarch64', 0x01000007: 'x86_64' };
const UPDATE_BUNDLE = 'Hivework.app.tar.gz';

/** Returns the Tauri arch names ('aarch64', 'x86_64') a Mach-O executable header declares. */
export function machoArchs(buf) {
  if (buf.length < 8) return [];
  if (buf.readUInt32BE(0) === 0xcafebabe) {
    const count = buf.readUInt32BE(4);
    const archs = [];
    for (let i = 0; i < count && 8 + i * 20 + 4 <= buf.length; i += 1) {
      const arch = MACH_CPU[buf.readUInt32BE(8 + i * 20)];
      if (arch) archs.push(arch);
    }
    return archs;
  }
  if (buf.readUInt32LE(0) === 0xfeedfacf) {
    const arch = MACH_CPU[buf.readUInt32LE(4)];
    return arch ? [arch] : [];
  }
  return [];
}

/** Reads the first executable under *.app/Contents/MacOS/ from a gzipped tarball. */
function readAppExecutable(tarGzPath) {
  const tar = gunzipSync(fs.readFileSync(tarGzPath));
  const field = (header, start, end) => header.toString('utf8', start, end).replace(/\0.*$/s, '');
  let paxPath = null;
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    const name = field(header, 0, 100);
    if (!name) break;
    const size = parseInt(field(header, 124, 136).trim() || '0', 8);
    const body = tar.subarray(offset + 512, offset + 512 + size);
    const type = String.fromCharCode(header[156] || 0x30);
    offset += 512 + Math.ceil(size / 512) * 512;

    if (type === 'x') {
      // PAX extended header (bsdtar/GNU tar): may override the next entry's path.
      paxPath = body.toString('utf8').match(/^\d+ path=(.*)$/m)?.[1] ?? null;
      continue;
    }
    const prefix = field(header, 345, 500);
    const fullName = paxPath ?? (prefix ? `${prefix}/${name}` : name);
    paxPath = null;
    const baseName = fullName.split('/').pop() ?? '';
    // Skip AppleDouble metadata files (._name) that macOS tar adds next to real files.
    if (type === '0' && !baseName.startsWith('._') && /\.app\/Contents\/MacOS\/[^/]+$/.test(fullName)) {
      return body;
    }
  }
  return null;
}

/** Newest Hivework*.dmg in the Tauri bundle folder (Tauri names it Hivework_<version>_<arch>.dmg). */
function findLatestDmg(dmgDir) {
  if (!fs.existsSync(dmgDir)) return null;
  const candidates = fs
    .readdirSync(dmgDir)
    .filter((f) => /^Hivework.*\.dmg$/i.test(f))
    .map((f) => path.join(dmgDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

function copyWithChecksum(source, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  const sha256 = createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
  const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
  console.log(`[sync-catalog] ✓ ${path.basename(source)} (${sizeMb} MB) -> ${path.relative(process.cwd(), dest)}`);
  console.log(`[sync-catalog]   sha256 ${sha256}`);
}

/**
 * Publishes the sibling Hivework-app build: the DMG for first installs, and the signed updater
 * bundle plus public/updater.json for in-app updates. Only architectures actually present in the
 * app binary are listed, so an arm64-only build is never offered to Intel Macs.
 */
export function syncDesktopApp(appDir) {
  const siblingAppDir = path.resolve(appDir, '../Hivework-app');
  const tauriConfPath = path.join(siblingAppDir, 'src-tauri/tauri.conf.json');
  if (!fs.existsSync(tauriConfPath)) {
    console.warn(`[sync-catalog] ⚠ No desktop app at ${siblingAppDir}; skipped.`);
    return;
  }

  try {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    const version = tauriConf.version;
    if (!version) throw new Error('tauri.conf.json has no version');
    const bundleDir = path.join(siblingAppDir, 'src-tauri/target/release/bundle');
    const downloadsDir = path.join(appDir, 'public/downloads');

    const dmgSource = findLatestDmg(path.join(bundleDir, 'dmg'));
    if (dmgSource) {
      copyWithChecksum(dmgSource, path.join(downloadsDir, 'Hivework.dmg'));
    } else {
      console.warn('[sync-catalog] ⚠ No Hivework*.dmg in the app bundle folder; DMG not updated.');
    }

    const bundleSource = path.join(bundleDir, 'macos', UPDATE_BUNDLE);
    const sigSource = `${bundleSource}.sig`;
    if (!fs.existsSync(bundleSource) || !fs.existsSync(sigSource)) {
      console.warn('[sync-catalog] ⚠ Signed updater bundle (.tar.gz + .sig) not found; updater.json not changed.');
      return;
    }
    // Tauri leaves the old .sig in place when a build runs without TAURI_SIGNING_PRIVATE_KEY.
    // Publishing that pair would make every in-app update fail signature verification.
    if (fs.statSync(sigSource).mtimeMs + 1000 < fs.statSync(bundleSource).mtimeMs) {
      console.warn(
        `[sync-catalog] ⚠ ${UPDATE_BUNDLE}.sig is older than the bundle (rebuilt without the signing key); updater not published.`
      );
      return;
    }
    const executable = readAppExecutable(bundleSource);
    const archs = executable ? machoArchs(executable) : [];
    if (archs.length === 0) {
      throw new Error(`could not read the app architecture from ${UPDATE_BUNDLE}`);
    }

    const endpoint = tauriConf.plugins?.updater?.endpoints?.[0] ?? 'https://hivework.online/updater.json';
    const bundleUrl = new URL(`downloads/${UPDATE_BUNDLE}`, endpoint).toString();
    const signature = fs.readFileSync(sigSource, 'utf8').trim();

    copyWithChecksum(bundleSource, path.join(downloadsDir, UPDATE_BUNDLE));

    const updaterPath = path.join(appDir, 'public/updater.json');
    const previous = fs.existsSync(updaterPath) ? JSON.parse(fs.readFileSync(updaterPath, 'utf8')) : {};
    const updater = {
      version,
      notes: previous.notes ?? `Hivework v${version}`,
      pub_date: fs.statSync(bundleSource).mtime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      platforms: Object.fromEntries(archs.map((arch) => [`darwin-${arch}`, { signature, url: bundleUrl }])),
    };
    fs.writeFileSync(updaterPath, JSON.stringify(updater, null, 2) + '\n', 'utf8');
    console.log(`[sync-catalog] ✓ public/updater.json -> v${version} for ${archs.map((a) => `darwin-${a}`).join(', ')}`);
  } catch (err) {
    console.warn(`[sync-catalog] ⚠ Could not sync desktop app: ${err.message}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    syncCatalog(DEFAULT_REPO_ROOT, { withDesktop: process.argv.includes('--with-desktop') });
  } catch (err) {
    console.error(`[sync-catalog] ✗ ${err.message}`);
    process.exit(1);
  }
}
