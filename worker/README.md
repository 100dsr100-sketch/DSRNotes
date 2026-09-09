# DSR Notes — sync Worker

Optional. The app works fully offline without it; this only adds
**cross-device sync** (PC ⇄ phone), same shape as the DSR Dashboard's
`dsr-dash-data` Worker.

Notes and their blobs live in **one KV namespace**. No R2, so no payment
method needed on the Cloudflare account. Sync is last-write-wins per note.

## One-time setup

```bash
npm install -g wrangler
wrangler login

cd "worker"

# 1. create the KV namespace, copy the printed id into wrangler.toml
wrangler kv namespace create NOTES_KV

# 2. set the shared secret (make up a long random string — you'll paste
#    the same value into the app's Sync settings)
wrangler secret put SYNC_TOKEN

# 3. deploy
wrangler deploy
```

`wrangler deploy` prints the URL, e.g.
`https://dsr-notes-sync.<your-subdomain>.workers.dev`

## In the app

⋮ menu → **Sync & settings…**
- **Sync URL** — the Worker URL above
- **Token** — the same string you gave `wrangler secret put SYNC_TOKEN`
- **Auto-sync** — on load, after edits, and when the network returns
- **Sync now** — manual pull + push

Do this on each device with the same URL + token.

## Keeping it private

The Worker is guarded by the bearer token — without it every request is
`401`. For a second layer, put it behind **Cloudflare Zero Trust → Access**
(free) and add a service-token / email policy.

## Limits (Workers free plan)

- KV value ≤ 25 MB (a note or a single blob) — fine for voice memos and drawings
- KV: 100k reads/day, 1k writes/day, 1 GB storage
- `GET /notes` pages through all keys, so it scales to thousands of notes

## Endpoints

| Method | Path | |
|---|---|---|
| GET | `/notes` | index: `{notes:[{id,updated,deleted}]}` |
| GET | `/note/:id` | full note JSON |
| PUT | `/note/:id` | store note JSON (metadata: updated, deleted) |
| GET | `/blob/:key` | blob bytes |
| PUT | `/blob/:key` | store blob bytes |

All require `Authorization: Bearer <SYNC_TOKEN>`.
