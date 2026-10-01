# Lumeya milestone plan — M3 Production release checkpoint (2026-10-01)

The sole implementation snapshot is [PROJECT_STATE.md](../../../PROJECT_STATE.md). This plan records milestone decisions; the original May plan below is historical context and does not authorize its private-platform/account features.

| Milestone | Decision | Scope/result |
| --- | --- | --- |
| M1 | Accepted by the user | Public discovery foundation and browser QA, baseline `3886eb0` + `4b908fd`; continue HEAD without resetting. |
| M2 | Locally accepted | Existing real service/contact paths and a demonstrated private operator receipt → clarification/review → explicit approval → generated publication → reviewed correction flow. Persistence, retries, rejection/anonymous boundaries, errors and desktop/mobile/keyboard checks passed. Remote receipt/delivery and first real provider editorial approval remain separately unverified. |
| M3 | SQL, hosted receipt and frontend release verified; delivery/retention pending | Only 0017 was applied to Production after compatible scoped prerequisites passed. Actual PostgREST retry/conflict/concurrency/rate-limit/legacy/permission checks and a synthetic browser receipt passed. Current frontend is Ready in Production at `d0eda61`; worker and retention execution remain unverified. |

M1 and M2 remain accepted as recorded in [PROJECT_STATE.md](../../../PROJECT_STATE.md). Local M2 preserves the static catalogue/request contract, existing CLI and loopback preview; synthetic publication used isolated temporary copies. No CMS, dashboard, My Space or Provider Space was introduced. One existing Lila offer/contact remains the sourced presentation example; ecological/craft services remain missing.

The [existing verification record and demo/tester guide](../../verification.md) separate local SQL, hosted catalog, actual PostgREST and deployed browser evidence. The user subsequently authorized applying only 0017 to Production, releasing the current frontend and bounded hosted E2E without new services/features. That sequence ran backend first. Production deployment `2ZLPDXpaQwgt8PbZ8nd6BiCM5qj8` is Ready/Current at `d0eda610f4653610aee2e69edfad24cc58508c24`, source `main`. Twelve public asset bytes match the release SHA; Join is 200. Browser service → practitioner → place → synthetic request yielded a persisted receipt. SQL roles/RLS and helper privacy remain restricted. Supabase has no pg_cron and Vercel has no configured cron jobs; an external worker/retention runtime remains unknown.

## Next unfinished work and release sequence

1. **Completed: scoped preconditions and backend application.** Only `bot/migrations/0017_idempotent_public_discovery_requests.sql` ran through the verified existing Production SQL Editor. Its source matched the repository file. The new retry column/valid partial unique index, keyed RPC and private Invoker helper are present with empty search paths. Browser roles have no direct table/column access; helper execution is denied. Server-role defaults/legacy ACLs remain as observed. No old migration replay or reset ran. The migration-history schema/table were absent before application; a SQL Editor application does not register a CLI migration-history entry.
2. **Completed: bounded hosted receipt and frontend checks.** Actual public-key PostgREST calls passed exact sequential/concurrent retry, generic changed-payload rejection, distinct keys, separate rate limiting, invalid input, legacy compatibility and anonymous table/update/helper denial. Only five API rows and one browser request were created, all visibly synthetic. The original payloads and 90-day expiry defaults were verified through exact test filters. Six-row cleanup is prepared and awaiting the CUA action-time deletion confirmation. The optional non-production live harness was not weakened or used against Production.
3. **Completed: current frontend release.** Checks passed before normal fast-forward pushes. The manual Preview action was rejected by automatic approval review and was not executed. Direct Production deployment from verified `main` succeeded through existing Vercel UI. No new service, function outside 0017, account, cloud branch, credentials or hosting configuration was introduced. Fresh Join and Events browser checks passed; earlier unchanged mobile/keyboard QA remains dated evidence, not a new hosted mobile test.
4. **Next coherent unfinished work: worker and retention execution.** Obtain the actual existing Lumeya worker host/process and retention caller mapping, verify their target and safe execution evidence, and bound any necessary notification/cleanup activation separately. Source defaults remain 60-second polls, batches of 20, 15-minute reclaim and eight claim attempts. In this Production observation all six synthetic receipts were still pending with zero attempts; no notification delivery was proven. The expiry default is not deletion, and no schedule on the mapped Supabase/Vercel platforms was found. Do not start a new service or broad cleanup under this handoff. Real provider source/identity approval and first real editorial intake/publication remain operator acceptance; ecological/craft content remains missing.
5. **Safe disable/rollback remains available.** In an authorized frontend config release, empty both `window.LumeyaConfig.supabaseUrl` and `supabasePublishableKey` in `public-config.js`, then verify existing unconfigured/contact states and shared live-reader states. Keep M3 keyed forms and stored retry keys. Do not restore pre-M3 intake code or manually resend an uncertain receipt before an operator checks it. Preserve additive backend column/index/functions and existing request data; fix forward rather than dropping idempotency objects.

M1/M2 remain accepted. The deployed receipt path is verified, while full M3 operational acceptance remains pending worker delivery and retention execution. The historical May account/bookings/reminders/cabinet plan below does not authorize those features.

---

# Historical Santiago Platform: Current State And Next Work Plan (2026-05-13)

## Current State

The platform now has the working backend foundation for the first real MVP:

- Telegram profile login works through `get_profile_by_telegram_id`.
- The live database has services, events, favorites, subscriptions, reminder notifications, bookings, and submissions.
- Two public services exist in Supabase.
- One public test event exists for calendar and reminder testing.
- Saving an event creates a favorite, an active event reminder subscription, and two pending reminder jobs.
- The cabinet can show the logged-in admin profile and saved event reminder state.
- The Telegram bot is the main operational backend for role flows, submissions, and reminder delivery.

## Product Direction From User

Admin work should stay Telegram-first for now. The admin does not need a full website admin panel immediately.

Content will come later, after the mechanics work reliably.

The website should focus on being useful for visitors, residents, mentors, and later content discovery. The bot can continue doing heavy admin actions, while the site can show states and activate bot flows where needed.

## What We Still Do Not Have

### Mentor Profile System

The database can store users with an instructor role, and the bot can collect submissions, but the platform does not yet have a complete mentor profile system.

Missing:

- public mentor profile records connected to users;
- mentor profile listing on the website;
- profile publish/approve status;
- profile edit/update flow after initial approval;
- links between mentor, services, events, and future audience;
- mentor-specific cabinet view with real submitted/published items.

### Submission Review Visibility

The bot can collect submissions, and the database has a `submissions` table. The website admin panel does not need to manage them yet, but the system still needs a clean operational loop.

Missing:

- bot command/menu for admin to list pending submissions;
- approve/reject actions in Telegram;
- status updates in Supabase;
- Telegram notification back to mentor after approval/rejection;
- optional website cabinet visibility for mentor: pending, approved, rejected.

### Booking And Event Participation Loop

The website can request a booking through the database function, but the complete user journey is not finished.

Clarified scope:

- private bookings are not a global website list;
- users see only their own booking status;
- mentors/organizers see counts and private booking state only for their own events/services;
- admin/master sees platform counts and operational health, not casual access to all booking rows;
- public “I will come” participation is separate from private booking and can be shown on event pages;
- if event capacity is limited, the public page can show taken/left places.

### Notification Plan Beyond Reminders

Event reminders work for saved events. More notification types should be planned, but not all built immediately.

Useful next notifications:

- booking requested -> admin;
- booking approved/rejected -> user;
- submission approved/rejected -> mentor;
- new event from saved mentor -> user;
- new date/open seat for saved service -> user;
- discount/special offer for saved service -> user;
- event changed/cancelled -> saved/booked users.

Admin does not need separate website notifications now because Telegram is the admin control surface.

### Club / Resident Value Layer

The role exists, but the value is mostly promised by the site copy.

Missing:

- real club-only events;
- resident-only offers or discounts;
- early access logic;
- cabinet section with actual resident benefits;
- clear path for visitor to become resident;
- visibility rules tested with real resident account.

### Content Layer

Content is intentionally postponed until mechanics are ready.

Future content needs:

- real event/service/mentor content;
- images and media assets;
- published mentor profiles;
- real community/club offer;
- possibly projects/articles/content cards later.

### Deployment And Operations

The local system works, but production setup should be tightened later.

Needed:

- set `PUBLIC_SITE_URL` in `bot/.env`;
- confirm final deployed website URL;
- run bot 24/7 on server or hosting;
- remove or rename test event when real events are ready;
- commit and keep migrations in order;
- add a small smoke-test checklist for login, save, reminder, booking, and submission flows.

## Recommended Next Work

Build the next step as one combined Telegram-first operations plan:

1. Website booking requests create private Supabase bookings and show only the user's own status.
2. Public “I will come” participation is visible on the event page/calendar, including capacity counts when relevant.
3. Submission requests from mentors are stored in Supabase and visible to admin/master in Telegram.
4. Files stay in Telegram; the website cabinet shows only text/status/admin message/final link.
5. Admin/master answers each submission in Telegram: accept, reject, ask for info, or send final published link.
6. Mentor sees submitted/in-work/published/rejected request states in the website cabinet.
7. Mentor sees stats for their own linked events/services: saved count, public attendee count, booking count.
8. Admin/master can switch website cabinet view between admin, visitor, resident, and mentor to test the platform.

This keeps admin work inside the bot, while the website becomes the user-facing status and discovery layer.

## Later Work

After the above flow works:

1. Add mentor public profiles.
2. Add real club/resident content and restrictions.
3. Add saved-mentor and saved-service notifications.
4. Add better content and visuals.
5. Add website admin tools only if Telegram admin becomes too limiting.
