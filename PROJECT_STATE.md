# Lumeya — Current Implementation State

Technical snapshot for the Lumeya repository and its Stage 4 handoff when shared with ChatGPT. Stage 1–3 documents describe product intent and project boundaries, not shipped integrations.

## 1. Current product

This checkout contains a public, guest-only discovery MVP for holistic and nature-oriented services, practitioners, organisations, places, and events. The broader mapped vision is an international service-centred network; Provider Space, personal workspaces, and other later capabilities remain future product context rather than a completed platform.

## 2. Major capabilities

- **Public discovery — implemented as structured static content.** Discover, Services/categories, Practitioners/providers, Places/map, Events, About, Join Lumeya, and public request pages render from a validated catalogue. Editorial records live in `content-source/published/catalog.json`; `scripts/catalog.js` generates the browser export `discovery-data.js`. Blank entity templates and a publication workflow are documented in `docs/catalog-publishing.md`. The release-gate journey remains `Deep Massage & Tea Ceremony → Ivan Protinyak → Santiago Studio Praha → public request`.
- **Categories and provider records — implemented.** Categories include body and movement, holistic wellbeing, relationships and personal growth, nature-oriented living and craft, and community and creative work. Empty categories remain browsable and invite relevant provider submissions. The provider template and shared directory support both practitioners and organisations; there is no organisation record in the current catalogue.
- **Map — list-first with verified-pin enforcement.** Providers and places remain visible in the filtered list, including records without precise locations. A marker requires coordinates explicitly marked verified with a public source URL; inactive places remain list-only. Current published records contain no verified coordinates, so the Map control is disabled and the list remains available.
- **Public requests and provider intake — existing guest contract reused.** General requests and the Join Lumeya intake use only the existing `suggest_listing` and `looking_for` contract. Provider intake accepts the supported practitioner/service/place types; it does not create accounts or publish records. Browser QA confirmed the Join intake client is configured and the submit action is enabled; no request was submitted, so remote RPC health remains unverified. The existing explicit copy/Telegram fallback remains available.
- **Events — dated schedule separated from undated formats.** Event formats are static, explicitly undated catalogue records. The Events page now reuses the homepage's read-only Supabase schedule query. During browser QA the scheduled-event read returned an empty upcoming schedule on some loads and an unavailable response on others; live schedule health remains uncertain.
- **Legacy platform — retained, not an authenticated product.** Account, calendar, favourites, booking, community, and provider-facing files remain in the repository. The public MVP forces guest identity and clears legacy browser IDs. These older flows are dormant or otherwise outside the public MVP and must not be described as secure authenticated capabilities.

## 3. Technical foundation

The frontend is a multi-page static site written in HTML, CSS, and vanilla JavaScript, with no compile/build step. Structured editorial JSON is validated and rendered to `discovery-data.js`; browser code consumes only that published export. The browser loads Supabase JS for the existing public request RPC and scheduled-event query, Leaflet for mapping, and hosted fonts. Browser identity is deliberately disabled; the site uses a publishable Supabase key only. Failed public-form drafts are local and unencrypted. `.vercelignore` excludes `content-source/` and `scripts/` from the public deployment input.

The separate `bot/` Node.js service uses Telegraf and `supabase-js`. It supports the Telegram request fallback, service-role database operations, and a polling worker that sends queued public requests to the configured admin chat. Delivery requires a running worker and its external credentials; the 90-day cleanup RPC needs a separately configured scheduler or service-role caller. Their current availability was not checked. The root `.vercelignore` keeps the static-site deployment boundary separate from the bot and verification tooling. The repository documents a GitHub Actions verification workflow.

## 4. Useful code map

- `index.html`, `services.html`, `masters.html`, `map.html`, `events.html`, `about.html`, `join.html`, `suggest.html` — public discovery shell and forms.
- `content-source/published/catalog.json`, `content-source/templates/`, `scripts/catalog.js`, `docs/catalog-publishing.md` — structured content, blank templates, validation/publication tooling and editor workflow.
- `discovery-data.js` — generated public records; `home-discovery.js`, `services.js`, `masters.js`, `spaces.js`, `map.js`, and `events.js` render and filter them.
- `public-config.js`, `auth.js`, `public-forms.js` — public Supabase client setup, guest-only identity, validation, RPC submission, and local/Telegram fallback.
- `home-events.js` — read-only scheduled-event query shared by Discover and Events.
- `bot/bot.js`, `bot/migrations/0016_public_discovery_security.sql` — Telegram request handling/notification worker and public request security boundary.
- `verify/run.js`, `verify/config.js`, `docs/verification.md` — local release gate and its contract. Run `npm run verify`; use `npm run verify:static-only` when loopback HTTP binding is unavailable.

## 5. Current limitations and decisions

- Published catalogue content is static and generated from the validated JSON source. The current map has no verified listing coordinates. Nature-oriented/ecological/craft categories are available for future sourced content but have no catalogue service entries today.
- The Join Lumeya online intake depends on the configured publishable client and the existing `submit_public_discovery_request` RPC. The route's current remote health and the event schedule's current results were not checked.
- Browser login and the legacy private workflows are not implemented as a secure authenticated experience. Never restore caller-supplied Telegram IDs as identity.
- Request notification and 90-day request expiry depend on a continuously available worker or equivalent scheduled service-role caller. The public intake has validation, a honeypot, and basic database rate limiting when request headers are available, but no edge-level rate limit or CAPTCHA. Failed-request drafts are not encrypted.
- `docs/security.md` records that migration 0016 was applied and live request/RLS checks passed on 2026-08-31. It also records a mismatch between the remote migration history and pre-existing legacy schema objects. Treat both as historical notes; remote state was not rechecked here, and the older migrations must not be assumed to reproduce the live database exactly.
- Keep the static discovery MVP and its narrow request path as the current implementation boundary. Stage 1–3 concepts do not automatically expand this scope.

## 6. Verification checkpoint

Reviewed 2026-09-29 on branch `codex/lumeya-public-mvp-rc`. `npm run catalog:validate`, `npm run catalog:check`, and `npm run verify:static-only` passed. `npm run verify` passed all 10 checks, including its loopback HTTP smoke test (`fetched=40`).

Browser QA completed in native Chrome using the local preview at `http://127.0.0.1:4173/`; no `file://` URL was used. The desktop viewport was 1512 × 805 and the mobile viewport was 375 × 812. Home/Discover, Services and the empty nature-and-craft category, Practitioners/providers, Places/map, Events, About, and Join were reviewed; no horizontal overflow was found at either checked width. Search and no-match states were checked for services, providers, places, and event formats. Keyboard-only navigation showed a visible focus ring on the skip link and menu control; Enter opened the menu and moved focus to its close control, Escape closed it and restored focus, and `aria-expanded` updated. No verified public map points were available, so the locations remained in the list without synthetic pins. Scheduled-event reads varied between an empty upcoming schedule and an unavailable response. Join showed the online intake as configured, but no request was submitted. Remote RPC health, bot uptime, and deployed-site state were not tested. The 2026-08-31 live verification recorded in `docs/security.md` remains historical and was not repeated.
