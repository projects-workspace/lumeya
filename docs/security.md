# Lumeya Public MVP Security Boundary

## Current browser model

The public MVP is guest-only. Browser authentication is deliberately dormant:

- a Telegram user ID in a URL is not accepted as proof of identity;
- no browser profile is restored from `localStorage`;
- private profile, booking, submission, favourite, subscription, and admin RPCs are not part of the public product;
- the browser uses only the Supabase publishable key loaded from `public-config.js`;
- the Supabase service-role key must exist only in the bot/server environment.

The repository still contains private-platform UI and bot workflows for future work. They are not a secure authenticated browser experience and must remain hidden/dormant until a real Supabase Auth session and matching RLS design are implemented.

## Public request intake

`suggest_listing` and `looking_for` requests use the isolated `public_discovery_requests` table. Public roles cannot select from, update, or delete this table. The M3 browser candidate calls `submit_idempotent_public_discovery_request`, a validated insert-only `SECURITY DEFINER` function with an empty `search_path`. The earlier ten-argument `submit_public_discovery_request` remains available for compatibility with older callers; it has no retry key and must not be used by new forms.

Migration `0017_idempotent_public_discovery_requests.sql` adds a private nullable UUID key and partial unique index without changing existing rows or the separate IP/user-agent rate limit. An exact repeat with the same key and normalized request returns the original receipt ID. Reusing that key with changed content returns only a generic conflict; a different key creates a separate request. The key is not added to `source_page`, public exports or operator message text. The actual SQL has been executed only in a disposable local Supabase PostgreSQL database; no hosted database has been changed.

The browser validates required values, length, enum, and URL format. The database repeats those checks. A honeypot field provides basic automated-spam filtering. The RPC also limits a browser fingerprint to five requests per hour when proxy headers are available. This is containment, not a replacement for edge-level abuse protection.

Form values are not autosaved while the user types. Before an online attempt, the current values and stable retry key are saved in that browser's `localStorage` for up to seven days; online submission is blocked when storage cannot keep the key across a reload. An uncertain online receipt keeps the same key for retry and hides the Telegram send option until an operator checks for the first receipt. A changed payload is rejected under the previous key, then requires a new explicit submit to create a distinct request. Local drafts are not encrypted. Forms tell users not to submit passwords, payment data, medical records, or other sensitive information.

Stored requests expire after 90 days. `delete_expired_public_discovery_requests` is callable only by the service role and must be scheduled by the production operator. The bot claims pending notifications with `FOR UPDATE SKIP LOCKED`, sends them to `ADMIN_CHAT_ID`, and records success or retry state.

## Migration status

Migration `0016_public_discovery_security.sql` was reported applied on 31 August 2026 to
Lumeya's dedicated project `ccwvyjszlrrluzplizsu`. That is historical evidence:
live verification at that time confirmed anonymous callers could read published
services, could not read the request table or private platform tables, and could
submit through the validated request RPC. One disposable request was submitted
and removed. Earlier M3 read-only checks also confirmed anonymous request-table
read denial; no hosted valid RPC call was made.

The historical remote migration table is empty even though legacy schema
objects already exist. Treat `bot/schema.sql` and migrations `0002`–`0015` as a
legacy reconstruction chain; do not reset/replay it on the live database.
On 2026-10-01, the actual 0017 SQL ran successfully in an isolated database
inside an already-running local Supabase PostgreSQL 17.6 container. Its minimal
pre-0017 request table was reconstructed from the documented 0016 table
definition and contained one synthetic legacy row. The database was removed
after checks. This does not prove the hosted schema matches that reconstruction,
and 0017 remains unapplied to hosted Supabase. No hosted mutation ran in this
pass.

The source has a notification worker that calls `claim_public_discovery_requests`
in batches, sends the request to `ADMIN_CHAT_ID`, and records notified/failed
state. Migration 0016 limits claim attempts and defines service-role-only
90-day expiry cleanup. A running worker, successful Telegram delivery and an
active cleanup schedule remain unverified and require external activation.

## Bot environment

The bot requires all of the following values at startup:

- `BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_CHAT_ID`
- `PUBLIC_SITE_URL`

`PUBLIC_SITE_URL` must be an absolute HTTPS URL. `ADMIN_CHAT_ID` must be a valid numeric Telegram chat ID. There are no personal or dead deployment defaults. Do not commit `.env` files, tokens, service-role keys, or production identifiers.

Optional comma-separated `ADMIN_USERNAMES` and `INSTRUCTOR_USERNAMES` values can support the legacy bot role-upgrade flow. They have no hard-coded personal defaults and do not replace database authorization.

The website fallback opens the bot with `start=public_request`. The user must paste the copied request into the chat. This flow skips the legacy profile middleware, so it does not create a platform account. The bot records the request when the new table is available and always attempts to notify the configured admin chat.

## Known limits before broad launch

- Live Supabase reachability, public grants, RLS, and request insertion are verified; bot availability and the final notification hop still require external verification.
- The public endpoint has validation, a honeypot and a basic database rate limit, but no CAPTCHA/Turnstile, reputation check or moderation queue UI.
- Telegram fallback also needs network access; it cannot deliver while the device is fully offline.
- The in-memory Telegram conversation session can be lost when the bot process restarts.
- Administrative review currently depends on direct database access and Telegram notification. The notification worker and retention cleanup require a continuously running bot process or equivalent scheduler.
- Legacy private-platform code remains in the repository. Re-enabling it requires real authentication, new authorization tests, and an RLS review; public caller-supplied IDs must not be restored as identity.

Before exposing the forms to high traffic, add edge-level rate limiting or Turnstile and verify the 90-day cleanup schedule.
