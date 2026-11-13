# Deploying `hivework.online` on Namecheap

How to build the static bundle, upload it to the `hivework.online` cPanel folder, set up `hello@hivework.online` forwarding, and check the live site. All commands run from the repository root.

---

## 1. Sync the catalog (only when the main repo changed)

```bash
HIVEWORK_REPO_ROOT=../hivework npm run sync
```

This reads `tools.json`, `divisions.json`, `strategy/runbooks.json`, division agents, `skills/`, `agents/` and `employees/` from the main repo, writes `src/data/catalog.generated.json`, and copies `assets/logo.svg` and `assets/logo-icon.svg` into `public/`.

To also publish a new desktop build, use `npm run sync:desktop`. It copies `../Hivework-app/src-tauri/target/release/bundle/dmg/Hivework.dmg` to `public/downloads/Hivework.dmg` and prints its SHA-256. Check that the DMG is signed and notarized before you deploy it:

```bash
codesign -dv public/downloads/Hivework.dmg
spctl -a -t open --context context:primary-signature -v public/downloads/Hivework.dmg
```

## 2. Build

```bash
npm ci        # first run only
npm run build
```

`npm run build` runs three steps:

1. `tsc --noEmit` — strict type-check.
2. `vite build` — bundles to `dist/` with `base: './'`, so asset links stay relative.
3. `node scripts/verify-dist.mjs` — fails if `dist/index.html` contains root-anchored `/assets/` or `/logo` links.

Optional local preview:

```bash
python3 -m http.server 4173 -d dist
# open http://localhost:4173, then Ctrl+C
```

## 3. Upload

### Option A: `npm run deploy` (rsync)

```bash
HIVEWORK_REPO_ROOT=../hivework npm run deploy
```

This runs the tests (including the installer contract test when `HIVEWORK_REPO_ROOT` is set), builds, then runs:

```bash
rsync -avz --delete --exclude='.well-known' --exclude='cgi-bin' dist/ cpanel:~/hivework.online/
```

It needs an SSH host alias `cpanel` in `~/.ssh/config` that points at the hosting account. `--delete` removes any file on the server that is not in `dist/`.

### Option B: cPanel File Manager

> Do not upload into `public_html/` itself. Keep the site in its own folder so it cannot overwrite your other domains.

1. In cPanel → **Domains**, set the document root of `hivework.online` to its own folder, for example `public_html/hivework.online`.
2. In **File Manager**, open that folder and upload the **contents** of `dist/` (not the `dist/` folder):
   ```text
   public_html/hivework.online/
   ├── .htaccess
   ├── index.html
   ├── logo.svg
   ├── logo-icon.svg
   ├── updater.json
   ├── downloads/Hivework.dmg
   └── assets/
       ├── index-*.css
       └── index-*.js
   ```
   `.htaccess` is a hidden file. Enable "Show Hidden Files" in File Manager settings so it is not skipped.
3. In **SSL/TLS Status**, run AutoSSL for `hivework.online` (and `www`), then enable **Force HTTPS Redirect** under **Domains**.

## 4. Email forwarding (`hello@hivework.online` → `hello@itsallan.me`)

### Option A: Namecheap domain dashboard (BasicDNS / PremiumDNS)

1. **Domain List** → **Manage** next to `hivework.online`.
2. Nameservers: **Namecheap BasicDNS** (or PremiumDNS).
3. **Mail Settings** → **Email Forwarding**.
4. **Redirect Email** → **Add Forwarder**: alias `hello`, forward to `hello@itsallan.me`.

### Option B: cPanel forwarders (hosting nameservers)

If the domain uses `dns1/dns2.namecheaphosting.com`: cPanel → **Email** → **Forwarders** → **Add Forwarder**, address `hello`, domain `hivework.online`, destination `hello@itsallan.me`.

Forwarding is incoming only. Replies go out from `hello@itsallan.me` unless you create a real mailbox for `hello@hivework.online` and add it as a send-as alias with SPF and DKIM set up.

## 5. Post-deploy checks

- [ ] `https://hivework.online` loads over HTTPS with a valid certificate; `http://` redirects to `https://`.
- [ ] DevTools Network: `./logo.svg`, `./logo-icon.svg`, `./assets/*.css`, `./assets/*.js` return 200; no console errors.
- [ ] `https://hivework.online/agents/` redirects to `/agents` and the page renders (not blank).
- [ ] Copy one command from each section (Hero, Harnesses, Agents, Runbooks, Skills, Employees) and run it in a fresh clone of the main repo.
- [ ] `https://hivework.online/downloads/Hivework.dmg` downloads and opens without a Gatekeeper warning.
- [ ] Send a test email to `hello@hivework.online` and confirm it arrives in `hello@itsallan.me`.
