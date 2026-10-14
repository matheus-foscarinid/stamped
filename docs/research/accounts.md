# Accounts

Goal: sync the map across devices, a public profile link (`/u/name`), and later a wishlist. Each user's data is a list of about 250 two-letter codes.

## Options

| Option | Page cost (gz) | Free tier | Lock-in and privacy |
|---|---|---|---|
| Supabase | supabase-js ~53 KB, or plain `fetch` to its REST API | 50k MAU, but free projects pause after 7 idle days | Medium, self-hostable |
| Firebase Auth | tens of KB | generous | High, Google in the sign-in path |
| Clerk | heavy script from their CDN | 50k retained users | High, closed SaaS |
| PocketBase | small SDK or `fetch` | you run a small server | None, open source |
| Cloudflare Worker + D1 + passkeys | ~1-2 KB of our own code | 100k requests a day, fails closed instead of billing | Low, data is plain SQLite |
| Vercel Functions + Upstash Redis | ~1 KB | 500k commands a month | Low |

## Recommendation

Passkeys, plus a sync code for people who don't want an account. Both run on a Cloudflare Worker with D1.

- No auth SDK in the page. The browser's WebAuthn JSON helpers (Chrome 129, Firefox 119, Safari 18.4) plus `fetch` are enough.
- No emails stored, no third-party sign-in. A sync code (only its hash stored) doubles as account recovery.
- Data: `users(id, handle)`, `credentials(id, user_id, public_key, sign_count)`, `sync_keys(key_hash, user_id)`, `maps(user_id, visited, wishlist, version, updated_at)`.
- Endpoints: passkey register and login, `POST /sync-key`, `GET /me`, `PUT /me/map` (with a version number, 409 on conflict), `GET /u/:handle` (public, cached).
- Merging: the link in the address bar stays a shareable snapshot. On the first sign-in on a device, join the server and local lists. After that, send the full list on each edit. Opening someone else's link never overwrites your map. It offers "Add to my map" instead.
- Weight: the account code loads only when someone opens sign-in. Visitors who never sign in pay nothing.

Note: the tagline "No account" in the README would need rewording, for example "No account needed".
