# Deploy markwernsdorfer.com via Plesk

> **Goal:** `git push` → Plesk pulls → site is live. No build step.

The live site sits at the repo root. Everything it needs is already
there: HTML, CSS, JS, images, logos, and the PHP contact-form
receiver. Legacy code is in `deprecated/` and is excluded from
deployment via `.pleskignore`.

---

## One-time Plesk setup

1. **Websites & Domains** → your domain → **Git**.
2. **Add repository** → paste the SSH/HTTPS URL of this repo.
3. Pick the branch you want Plesk to track (usually `main`).
4. **Deployment mode**: `Automatic — deploy updates when pushed`.
5. **Deployment path**: leave **blank** (or `/` — the default). The
   site is already at the repo root.
6. **Additional deploy actions**: leave empty — no build step needed.
7. **Save**. Plesk does the first pull immediately; from then on,
   every push to the tracked branch auto-deploys.

That's it. `git commit && git push` is the deploy flow.

---

## What gets deployed (and what doesn't)

`.pleskignore` at the repo root controls which paths Plesk copies
into the webroot. Excluded:

- `deprecated/` — the old Tailwind site, reference only
- `CLAUDE.md`, `DEPLOY.md`, `README.md`, any other `*.md` — dev docs
- `contact.node.js` — alternative Node.js receiver (PHP is used)
- `.git/`, `.gitignore`

Everything else in the repo root ships. `.htaccess` takes over once
files land in the webroot; it handles MIME types, cache headers,
compression, security headers, and blocks HTTP access to dotfiles /
leftover dev artifacts.

---

## Verify the contact form after first deploy

The form POSTs to `/contact.php`. To check it's wired up:

```bash
curl -X POST https://markwernsdorfer.com/contact.php \
  -d 'name=Test' -d 'email=test@example.com' -d 'msg=Hello'
```

Expected response:
```json
{"ok":true}
```

If you get `Mail send failed`, check Plesk's mail log (**Statistics →
Mail logs**). Usually the fix is:

1. **Mail → DNS Settings** — add SPF and DKIM for the domain, so
   outgoing mail from `noreply@markwernsdorfer.com` isn't rejected
   by Gmail.
2. **Mail** — create the actual `noreply@…` mailbox or configure
   the domain to use an external SMTP relay.

If you can't or don't want to use `mail()`, switch to the Node.js
receiver (`contact.node.js`) and point the form's `action` at it —
but this requires running a Node process, which Plesk supports but
adds operational overhead. The PHP version is the default.

---

## Local preview

No build step:

```bash
# static preview (contact form's PHP endpoint won't run)
python3 -m http.server 8787

# full preview with PHP contact receiver
php -S localhost:8787
```

Then open <http://localhost:8787/>.

---

## Force HTTPS

After Plesk provisions the Let's Encrypt cert:

1. **Websites & Domains → SSL/TLS Certificates** → install / renew.
2. Uncomment the `Force HTTPS` block at the bottom of `.htaccess`.
3. Commit + push.
