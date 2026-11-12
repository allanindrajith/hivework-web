# Deploying `hivework.online` on Namecheap

This guide covers building the self-contained static bundle from `app/`, uploading it to a dedicated Namecheap cPanel folder for `hivework.online`, configuring `hello@hivework.online` email forwarding to `hello@itsallan.me`, and verifying the live deployment.

---

## 1. Build the Static Bundle (`app/dist/`)

Run the production build from the `app/` directory (run `npm install` first if `app/node_modules/` is not installed yet):

```bash
cd app
npm install   # first run only
npm run build
```

`npm run build` executes four steps in order:

1. **`prebuild` (`node scripts/sync-catalog.mjs`)** — Reads `tools.json`, `divisions.json`, `strategy/runbooks.json`, division `.md` personas, `skills/`, and `agents/*.md`, writes `app/src/data/catalog.generated.json`, and copies `assets/logo.svg` and `assets/logo-icon.svg` into `app/public/`.
2. **`tsc --noEmit`** — Runs strict TypeScript type-checking across `app/src/`.
3. **`vite build`** — Compiles the static bundle into `app/dist/` with `base: './'` so all script, stylesheet, and SVG references stay relative to the upload folder.
4. **`node scripts/verify-dist.mjs`** — Verifies `app/dist/index.html` contains only relative `./` asset URLs (zero root-anchored `/assets/` or `/logo` links).

> **Note:** If you want to add or update GitHub repository or social URLs before building, edit `app/src/data/site.ts` (`repoUrl`, `githubUrl`, `xUrl`) first, then re-run `npm run build`.

Optional local check before uploading (run from the repository root, or use `-d dist` from inside `app/`):

```bash
python3 -m http.server 4173 -d app/dist
# Open http://localhost:4173 in your browser, then Ctrl+C when finished
```

---

## 2. Upload `app/dist/` to a Dedicated Namecheap cPanel Folder

> **Warning — Do NOT upload into `public_html/` root:**
> Keep `hivework.online` isolated in its own subfolder (for example, `public_html/hivework.online/`). Uploading directly into `public_html/` will overwrite or collide with your primary hosting domain's files (such as `itsallan.me` or other existing sites).

### Step-by-Step cPanel Setup

1. **Assign the Addon Domain Document Root:**
   - Log in to Namecheap → **Hosting List** → **Go to cPanel**.
   - Open **Domains** (or **Addon Domains** on older cPanel themes).
   - Add or manage `hivework.online` and set its **Document Root** to a dedicated folder such as:
     ```text
     public_html/hivework.online
     ```
   - Confirm it is **not** pointing to `public_html` root.

2. **Upload the Contents of `app/dist/`:**
   - Open cPanel **File Manager** and navigate into `public_html/hivework.online/`.
   - Upload the **contents** inside `app/dist/`—not a nested `dist/` directory—so the folder layout looks like:
     ```text
     public_html/hivework.online/
     ├── index.html
     ├── logo.svg
     ├── logo-icon.svg
     └── assets/
         ├── index-*.css
         └── index-*.js
     ```
   - *Tip:* If uploading via ZIP, compress the files inside `app/dist/` (so `index.html` is at the top level of the ZIP), upload the archive to `public_html/hivework.online/`, click **Extract**, and delete the `.zip` file afterward.

3. **Provision SSL (HTTPS):**
   - In cPanel, open **SSL/TLS Status**, select `hivework.online` (and `www.hivework.online` if configured), and click **Run AutoSSL** (or apply your Namecheap SSL certificate).
   - Once the certificate shows active, enable **Force HTTPS Redirect** under cPanel → **Domains** for `hivework.online`.

---

## 3. Configure Namecheap Free Email Forwarding (`hello@hivework.online` → `hello@itsallan.me`)

Because the site advertises `hello@hivework.online` (with `hello@itsallan.me` as the direct inbox), configure an email forwarder matching the DNS setup used by `hivework.online`:

### Option A: Namecheap Domain Dashboard (BasicDNS / PremiumDNS)

1. In Namecheap → **Domain List**, click **Manage** next to `hivework.online`.
2. Ensure **Nameservers** use **Namecheap BasicDNS** (or PremiumDNS).
3. Under **Mail Settings**, select **Email Forwarding** (this automatically configures Namecheap's `eforward1–eforward5.registrar-servers.com` MX records).
4. Scroll to **Redirect Email** and click **Add Forwarder**:
   - **Alias:** `hello` (creates `hello@hivework.online`)
   - **Forward to:** `hello@itsallan.me`
   - Save with the checkmark icon.

### Option B: cPanel Email Forwarders (Namecheap Web Hosting DNS)

If `hivework.online` points to Namecheap Shared Hosting nameservers (`dns1/dns2.namecheaphosting.com`), configure forwarding inside cPanel instead:

1. In cPanel → **Email** → **Forwarders**, click **Add Forwarder**.
2. Set **Address to Forward** to `hello`, **Domain** to `hivework.online`, and **Destination** (`Forward to Email Address`) to `hello@itsallan.me`.
3. Save the forwarder.

### Send-As Alias Caveat (Important)

- **Incoming only:** Namecheap Free Email Forwarding (and cPanel forwarders) routes **incoming** messages sent to `hello@hivework.online` into `hello@itsallan.me`. It does **not** give you an outbound SMTP mailbox for `@hivework.online`.
- **Replying from `hello@itsallan.me`:** By default, replies sent from `hello@itsallan.me` will show `From: hello@itsallan.me`.
- **If you want replies to appear from `hello@hivework.online`:** Create a real cPanel email account for `hello@hivework.online` (or use Namecheap Private Email / an external SMTP relay) and add `hello@hivework.online` as a **Send-As** alias in your mail client using those SMTP credentials, with valid SPF/DKIM records published on `hivework.online`.

---

## 4. Post-Upload Verification Checklist

Verify every item against the live domain after DNS and AutoSSL propagation:

- [ ] **HTTPS Lock:** `https://hivework.online` loads over HTTPS with a valid certificate padlock and zero mixed-content warnings (and HTTP redirects cleanly to HTTPS).
- [ ] **Assets & Relative Paths:** Open browser DevTools (`Network` + `Console`) on `https://hivework.online` and confirm `./logo.svg`, `./logo-icon.svg`, `./assets/*.css`, and `./assets/*.js` return HTTP `200` with zero `404` responses or console errors.
- [ ] **Interactive Flows:** Verify quick-start tabs + Copy button, Model Matrix filters (`All (17)`, `Per-Agent`, `Roster`, `Plugin`) and tool inspector switching, Division search + `"Reset filter"`, and NEXUS runbook copy buttons on both desktop (`1440px`) and mobile (`375px`) viewports without horizontal overflow.
- [ ] **`itsallan.me` Links:** Click the `itsallan.me` links in the header, origin story creator card, and footer to confirm they open `https://itsallan.me` in a new tab.
- [ ] **Email Forwarding End-to-End Test:** Click `hello@hivework.online` (and test the Copy button), then send a real test message from an external address to `hello@hivework.online` and confirm delivery into `hello@itsallan.me`.
