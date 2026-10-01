# Lumeya Telegram Bot

This bot currently provides Lumeya's public request notification path while legacy scheduling and club workflows remain dormant on the public website.

## Setup Instructions

1. Make sure you have [Node.js](https://nodejs.org/) installed on your machine or server.
2. Open your terminal and navigate to this `bot` folder:
   ```bash
   cd path/to/Santiago/bot
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a file named `.env` in this `bot` directory and add the following keys:

```env
# From @BotFather in Telegram
BOT_TOKEN=replace_with_your_botfather_token

# From your Supabase Project Settings -> API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# The Telegram Chat ID where you want application notifications sent. 
# You can use your own personal Telegram ID for testing.
ADMIN_CHAT_ID=your_telegram_id_here

# Public URL for website login links sent by the bot.
PUBLIC_SITE_URL=https://your-public-site.example

# Optional worker interval; defaults to NOTIFICATION_POLL_MS or 60000
PUBLIC_REQUEST_POLL_MS=60000

# Required only for the disposable live public-MVP database test
SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

**⚠️ IMPORTANT:** For `SUPABASE_SERVICE_ROLE_KEY`, you must use the `service_role` secret key, NOT the public `anon` key. This allows the bot to bypass Row Level Security and approve users. Never expose this key on the frontend!
If a real `BOT_TOKEN` was ever committed or shared, rotate it in BotFather before deploying.

## Running the Bot

To start the bot locally:
```bash
npm start
```

The bot fails closed when any required production variable is missing. The
`public_request` deep-link flow intentionally skips platform profile creation,
stores the request when possible, and directly notifies `ADMIN_CHAT_ID` even if
database persistence fails.

Migration 0016 was historically applied to the dedicated Lumeya project. The
actual `0017_idempotent_public_discovery_requests.sql` file has been executed
only in a disposable local Supabase PostgreSQL database with a reconstructed
0016-compatible table and synthetic data. No hosted database was changed. The
disposable live contract writes test rows, so run it only against an already
existing isolated non-production target whose exact ref and relationship to
Production have been verified. A cloud branch is optional and must not be
created for this test. The script rejects the known Production ref and requires
the URL host to match the confirmed branch ref.

Add these test-only values to the environment when the branch-specific
credentials are available; do not reuse Production credentials or edit the
bot's regular `SUPABASE_URL`/service key to point at a test branch:

```env
LUMEYA_TEST_SUPABASE_URL=https://<existing-branch-ref>.supabase.co
LUMEYA_TEST_SUPABASE_PUBLISHABLE_KEY=<branch-publishable-key>
LUMEYA_TEST_SUPABASE_SERVICE_ROLE_KEY=<branch-service-role-key>
LUMEYA_TEST_SUPABASE_BRANCH_REF=<exact-existing-branch-ref>
LUMEYA_TEST_SUPABASE_BRANCH_CONFIRMATION="I verified <exact-existing-branch-ref> is an existing isolated non-production branch"
```

Then run from `bot/`:

```sh
npm run test:public-mvp
```

The test creates, retries, conflicts and removes isolated synthetic rows; it
checks that exact retries preserve one receipt, changed content does not
overwrite it, distinct keys create distinct rows, direct anonymous reads remain
denied, and invalid content is rejected. Assertions and cleanup logs redact
request content, keys and receipt IDs. Do not run it against Production or any
unconfirmed project. If no safe existing hosted target or its scoped credentials
are available, skip this live test; local SQL validation does not prove hosted
PostgREST behavior.

## Deployment

To keep the bot running 24/7, you should deploy it to a service like **Render**, **Railway**, or **Heroku**. 
Just link your GitHub repository to one of those services, set the Build Command to `npm install`, the Start Command to `npm start`, and add your Environment Variables in their dashboard.
