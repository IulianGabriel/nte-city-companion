# NTE City Companion

A responsive unofficial Neverness to Everness tracker using Buiuga's public spreadsheet. Includes reset countdowns, image guides, browser saves, profile photos and XP. Google sign-in connects private progress across devices using Cloudflare Workers and D1.

Live app: https://nte-city-companion.neverness-to-everness.workers.dev/
Google sign-in is published for external users. Sign-in, sign-out and retained account completion were verified on the live deployment on 7 October 2026.

## Updating activities

Keep the sheet publicly readable. Add rows beneath Daily, Weekly, Bi-Weekly, Monthly, Other Activities or Ways to get Annulith & Fons. Put guide URLs and notes in Notes. Fixed row numbers are not used. One-time labels override recurrence; recurring activities are excluded from the currency section. Spreadsheet Done cells never overwrite personal progress.

Keep guide URLs unchanged when renaming or moving activities. For activities without guides, retain the name or add a permanent [id:my-activity] tag in Notes. Activities sharing an album need different ID tags. The app refreshes after 24 hours and offers Refresh sheet. The hosted Worker checks daily at 04:00 UTC. Failed reads preserve the last catalog.

## Accounts and progress

Google OAuth requests only openid, email and profile. It uses PKCE, short-lived state, verified Google ID tokens, hashed session tokens and secure HttpOnly cookies with a 30-day expiry. Account-scoped records, same-origin writes and revisions protect progress. Incoming identity headers are not trusted.

Guests save in their browser. Sign in with the same Google account on each device to sync. Devices poll every 15 seconds and on focus or reconnection. Offline changes are queued for their account. Imports preserve existing completion records and retain higher XP totals instead of adding duplicate snapshots. Resized JPEG profile photos are stored privately in D1. See public/privacy.html.

Reset periods are stored with completion: expired recurring tasks become unchecked after missed resets; one-time completion remains. Browser timezone suggests a region, but users confirm their game server and schedule because location cannot identify an account's server.

## XP

Awards: daily 10, weekly 40, every two weeks 90, monthly 160, racing season 200, one-time 220. Level L starts at 100*(L-1)*L total XP. Unchecking never removes XP or grants a second award. Recurring tasks earn again after their stored reset; schedule changes cannot accelerate awards. One-time awards remain locked to stable task IDs. Existing checked tasks do not receive retroactive XP.

Guest clocks and imported backups are self-reported. This is a personal companion, not a competitive ranking system. Normal signed-in completion uses server time and the current catalog.

## Development

Use Node 24+. Run npm ci, npm test, npm run build and npm run dev. Preview: http://127.0.0.1:4174. Tests use in-memory SQLite. Local data and credentials are ignored by Git. Source is in public/ and server/, schema in db/schema.ts and append-only migrations in drizzle/.

## Cloudflare hosted deployment

Connect this repository using Workers Builds. Build command: npm run build && npm run db:migrate. Deploy command: npx wrangler deploy. Disable preview builds to prevent preview writes to production. Root wrangler.jsonc binds ASSETS and the dedicated D1 database and schedules daily refresh. Existing .openai metadata is legacy and is not used for Cloudflare publication.

Set Worker secret bindings GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Create a Google web OAuth client with the exact production callback https://<worker-host>/auth/google/callback and publish its external audience for community users. Never commit secrets or deployment tokens. Sign-in remains unavailable until both bindings exist. Build authorization needs permission to apply D1 migrations.

This configuration targets Cloudflare's free plan, subject to its normal request, database and build limits. No billing account or paid storage service is required.
