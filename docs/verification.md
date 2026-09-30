# Lumeya release verification

Lumeya's public frontend remains static HTML, CSS and vanilla JavaScript. The
repository-level verification layer uses Node.js standard-library APIs only;
there is no frontend build or test dependency installation step.

## Prerequisites

- Node.js 18 or newer.
- No Supabase, Telegram or Vercel credentials.
- Git is recommended for the secret scan so ignored local environment files
  are not read.

## Commands

Run the complete local and CI gate:

```sh
npm run verify
```

The complete command includes a temporary HTTP server bound to
`127.0.0.1`. In a restricted sandbox that forbids local port binding, run the
deterministic non-network portion instead:

```sh
npm run verify:static-only
```

The full HTTP smoke check must still pass in CI or another environment that
allows a loopback listener before release.

Individual checks are also available:

```sh
npm run verify:pages
npm run verify:links
npm run verify:assets
npm run verify:js
npm run verify:static
npm run verify:mvp
npm run verify:journey
npm run verify:security
npm run verify:secrets
npm run verify:smoke
```

Every command exits with status 0 only when its selected checks pass.

## Release contract

| Check | Enforced contract |
| --- | --- |
| `pages` | Every registered public and account HTML file exists and is non-empty. The Public Discovery registry includes `map.html`, `about.html`, and `suggest.html`. Unregistered root HTML is reported. |
| `links` | Local HTML and JavaScript page references exist. Pure and cross-page fragments must resolve to an actual target ID. External URLs are intentionally not fetched. |
| `assets` | Referenced local scripts, styles, media and CSS `url()` assets exist. |
| `js` | Root frontend scripts, bot scripts and inline page scripts parse with `node --check`; application code is not executed. |
| `static` | Every HTML file has its required document markers. Unbalanced `script`, `style`, or `div` tags are release failures. |
| `mvp` | Public pages declare English, core pages expose exactly Discover, Services, Practitioners, Map, Events and About in primary navigation, required discovery scripts are connected, legacy/account/language controls are not visible in the core shell, the map has Leaflet resources, the suggestion page has a form, and every new-tab link has a safe `rel`. |
| `journey` | The factual Deep Massage → Ivan → Santiago Studio → request slice has symmetric relationships and working local routes; conceptual places and synthetic map coordinates are rejected. |
| `security` | Browser configuration has no hard-coded Supabase project, the request migration exposes only the narrow RPC, legacy RPCs are revoked, rate/retention controls exist, and the no-account Telegram/admin-notification path is connected. |
| `secrets` | Tracked and unignored source text is scanned for a small set of obvious private-key, provider-token, bot-token and privileged literal-assignment patterns. Values are never printed. |
| `smoke` | Every expected page and key public asset returns HTTP 200 with the expected content type from a local static server. |

The contract and page/script registries live in `verify/config.js`. Product
changes that add or replace a required public page must update that registry in
the same change.

The current integration contract requires `discovery-data.js` on catalog and
profile surfaces, `profile-enhancements.js` plus the profile data hooks on each
practitioner page, and `public-forms.js` on the public suggestion page. The
legacy identity-dependent `submission-requests.js` is intentionally excluded
from the public deployment and must not be referenced by HTML.

## Continuous integration

`.github/workflows/verify.yml` runs `npm run verify` on every push and pull
request with read-only repository permissions. The project has no root runtime
dependencies, so CI intentionally does not run `npm install`.

## Deployment boundary

`.vercelignore` keeps the static-site deployment separate from the bot,
environment files, documentation, verification tooling, agent configuration,
accidental legacy folders and unused source videos. Only the two videos still
referenced by the public site are included. This boundary complements—but does
not replace—secret scanning and production environment review.

## Deliberate limitations

- These checks do not contact Supabase, Telegram, Vercel or arbitrary external
  links.
- Syntax and source contracts do not prove browser behavior, accessibility,
  responsive layout, network requests, RLS/RPC behavior or successful form
  delivery.
- The secret scan is heuristic and cannot prove that repository history or
  external deployment configuration is clean.
- Final release verification still requires browser QA, online/offline form
  tests, Supabase security checks, preview-deployment HTTP checks, and
  post-deploy production checks.

After applying migration 0016 to the confirmed Lumeya project, run the disposable
live database contract from `bot/`:

```sh
npm run test:public-mvp
```

This requires the dedicated project's URL, publishable key and service-role key
in the local environment. It must never be run against another ecosystem
project.

## M2 focused checks

`npm run verify:editorial` uses Node's existing test runner, temporary public fixture roots and private mode-700 directories. It tests real filesystem/HTTP persistence and subprocess restart, exact retry deduplication, clarification/rejection/approval gates, reviewed corrections, stale-edit refusal, interrupted publication regeneration, private-field rejection, CLI output privacy, anonymous HTTP denials and event-reader error/empty/unconfigured paths. Fixtures never write to live services or the repository's public catalogue. Deterministic event-client fixtures prove code behaviour only; they do not prove Supabase or worker integration. The full `npm run verify` includes these focused checks before the existing release gate. Loopback HTTP tests require an environment that allows local port binding.

## M3 pre-release read-only evidence and tester guide — 2026-09-30

### Four-minute demonstration

Run this path on the current public URL after confirming which build is deployed. A read-only check on 2026-09-30 reached `https://lumeya-wellbeing-discovery.vercel.app/` (HTTP 200; title “Lumeya — Holistic discovery”) and a fresh browser test found the existing service/contact path works. The dashboard reports Production commit `eb0fda8` (Ready, 31 Aug) and says that pushing to the `main` Production Branch updates Production. The current hosted build is behind local M2: it serves `discovery-data.js?v=1` and `services.js?v=4`; hosted `join.html` returns HTTP 404. Do not present local M2’s Join/editorial UI as hosted until an authorized deployment is verified.

1. **0:00–1:00 — Search for Lila.** Open Services, search “Lila”, and read the published status, delivery, location, provider, price and duration labels. Say that price and duration are not published and availability is by arrangement; do not infer dates, outcomes, licensing or service availability.
2. **1:00–2:00 — Check the provider/contact.** Open Violetta’s profile and show the listed public `@violettablago` Telegram destination. A read-only GET on the linked Telegram URL returned HTTP 200 and title “Telegram: Contact @violettablago”. Do not send a message during the demo; the provider identity/availability is not independently confirmed.
3. **2:00–3:00 — Follow the core contextual request.** Search for “Deep Massage & Tea Ceremony”, choose its request action, and confirm the service and “in person” preference prefill. Explain that the request is addressed to the Lumeya operator, not directly to Ivan, and that it is not a booking.
4. **3:00–4:00 — Explain review and events.** Show Join only on an authorized M2 candidate deployment because it is 404 on the current hosted build. Explain explicit editorial review and correction, then show the current Events page. The deployed M1 page currently says the event source is not connected and makes no Events request; the same mapped project’s anonymous Events REST read returned HTTP 200 with zero future rows. On the M2 build, confirm that the public page shows the empty schedule state when the live read returns no rows; undated event formats do not imply a scheduled date.

### Tester instructions and feedback route

When the M2 deployment and hosted intake are verified, test as a guest in current desktop Chrome/Firefox/Safari and a 375 px mobile viewport. Check search/no-match and category reset, the service-to-provider/place/format route, contact recipient and next step, keyboard skip-link/menu/focus return, and absence of horizontal overflow. Confirm unavailable versus empty versus unconfigured messages. The `join.html` provider form should receive only real public listing information; never submit an invented provider for a production test.

For tester comments, use the existing `suggest.html#looking-for` form. Set Topic to **“Lumeya MVP feedback”** and describe the page, action, expected/observed result, browser/device/viewport, and keyboard step if relevant. Leave location empty unless it matters. Add a reply contact only if a response is wanted. Do not submit medical histories, client records, credentials, financial details, or another person's contact data. This form currently needs `submit_public_discovery_request` and an operator/worker path; do not use it for test feedback until release and hosted delivery are confirmed. Copy/open-Telegram controls do not send a message by themselves.

### Limitations and release blockers

- The current hosted site is older than local M2. `join.html` returns 404; the hosted Events page says the source is not connected and emitted no Events REST request in the browser. Mapped Chrome Profile 17 read-only dashboard access confirmed Production Branch `main`, a connected Git repository, Ready production commit `eb0fda8`, and the primary domain. Vercel API listing returned 403 and no Vercel CLI is installed; the mapped Chrome route exposed the project settings, connected repository, production branch and current deployment.
- The local M2 editorial queue is not a hosted operator handoff. Supabase management connector reads are denied; no valid request RPC was invoked. OpenAPI introspection returned 401; a no-argument GET returned PGRST202, which is not an RPC execution test. A public GET of `public_discovery_requests` returned 401/PGRST42501, confirming anon read denial on that endpoint. A public Events read returned 200/empty.
- Current RPC SQL inserts a new row for every valid call. Its IP/user-agent fingerprint provides rate limiting, not content idempotency. A same-payload retry can create a second request and notification. Supabase management calls, including branch listing, returned permission errors; no existing non-production test branch could be confirmed. The M3 request form has not been exercised with a valid payload.
- The bot requires a running process, service-role environment, `BOT_TOKEN` and `ADMIN_CHAT_ID`. Repository source documents a polling worker and 90-day expiry function, but no current worker uptime, admin delivery or retention schedule is verified. No service-role environment value was read.
- The existing Lila record is suitable as the sole sourced presentation example; its profile/contact match project-supplied information and the public Telegram page exists, but identity, qualification, availability and outcomes are not independently verified. Other ecological/craft service content is missing. The map has no verified pins and the live scheduled-event list was empty at the time of the check. No accounts, booking, payment, certification or personal workspace are included in this MVP.

No hosted form submission, Telegram message, migration, deployment or release-triggering push ran during these checks. [Vercel documents automatic deployments for connected Git pushes](https://vercel.com/docs/git); the mapped project settings confirm `main` as Production Branch. Pushing the current M2 candidate there would publish it. The remote delivery branch still has M1-era commit `eb0fda8`, while local M2 is at `b86d2fd`. M3 is not accepted until the hosted retry defect is resolved and safely tested, operator delivery/retention are verified, the user explicitly authorizes the Production push, and the M2 candidate's production URL is verified on desktop and mobile.
