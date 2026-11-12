import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function verifyDistHtml(html) {
  if (typeof html !== 'string') {
    throw new Error('Expected html content as string');
  }
  const rootAssetPattern = /(href|src)=["']\/(assets|logo)/i;
  if (rootAssetPattern.test(html)) {
    throw new Error(
      'HTML contains root-anchored asset URLs (/assets/ or /logo). Must use relative ./ paths (base: "./") for static hosting.'
    );
  }
}

export function verifyDist(distDir = path.resolve(__dirname, '../dist')) {
  const htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`dist index.html not found at: ${htmlPath}. Run 'npm run build' first.`);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  verifyDistHtml(html);
  console.log(`[verify-dist] ✓ Verified relative asset paths in ${htmlPath}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    verifyDist();
  } catch (err) {
    console.error(`[verify-dist] ✗ ${err.message}`);
    process.exit(1);
  }
}
