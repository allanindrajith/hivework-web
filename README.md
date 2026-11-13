# hivework-web

Source for [hivework.online](https://hivework.online): a static Vite + React site that lists the Hivework agents, skills, employees and runbooks, and builds copy-paste install commands for the installer in [allanindrajith/hivework](https://github.com/allanindrajith/hivework).

## Requirements

- Node 22.12+ or 24+ (required by Vitest 5)
- npm
- For `npm run sync` only: a checkout of the main `hivework` repo

## Quick start

```bash
npm ci        # install dependencies
npm test      # unit and component tests
npm run dev   # local dev server
npm run build # type-check, bundle to dist/, verify relative asset paths
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest, once |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run build` | `tsc --noEmit`, `vite build`, then `scripts/verify-dist.mjs` |
| `npm run sync` | Regenerates `src/data/catalog.generated.json` and copies the logos from the main repo |
| `npm run sync:desktop` | Same as `sync`, and also copies the desktop DMG from `../Hivework-app` into `public/downloads/` |
| `npm run deploy` | Tests, build, then `rsync --delete` of `dist/` to the `cpanel` SSH host. Overwrites the live site |

## Syncing the catalog

The catalog is generated from the main repo. By default the script looks for it at `../Hivework` (capital H). Point it elsewhere with `HIVEWORK_REPO_ROOT`:

```bash
git clone https://github.com/allanindrajith/hivework.git ../hivework
HIVEWORK_REPO_ROOT=../hivework npm run sync
```

Sync from a commit that is already pushed. If the catalog lists agents or skills the public repo does not have yet, visitors get `Unknown agent` errors and dead GitHub links.

## Installer contract test

`src/__tests__/installerContract.test.ts` checks that every flag, tool, agent, skill, employee and runbook the site shows exists in the main repo. It is skipped unless `HIVEWORK_REPO_ROOT` is set. Run it before every deploy:

```bash
HIVEWORK_REPO_ROOT=../hivework npm run deploy
```

## Deploying

See [docs/deploy-hivework-online.md](docs/deploy-hivework-online.md).
