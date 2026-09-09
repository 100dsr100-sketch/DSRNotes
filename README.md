# DSR Notes

A local-first, Google-Keep-style notepad for phone and PC. Single static page + PWA shell — no backend, no account. Nothing leaves the device unless you turn on optional sync.

## Note types

| Type | What it does |
|---|---|
| ✏️ Note | Free text with a title. |
| ☑️ Checklist | Add / tick / reorder items; option to sink ticked items to the bottom. |
| 🎙️ Voice memo | Records via `MediaRecorder`, inline playback, plus a live auto-transcript (Web Speech API where supported — Chrome/Edge/Android; editable). |
| 🎨 Drawing | White canvas, pen colour + size, eraser, undo, clear. Import a photo and draw on top. |

## Features

- **Pin** important notes — they show in a *Pinned* section above the rest (pin icon on each card, or the 📌 in the editor).
- **Labels** — tag a note (editor ⋮ → Labels…), filter the board with the label bar at the top.
- **Drag-reorder** checklist items by their ⠿ handle; or use "move ticked to the bottom".
- **Colour** — 8 pale pastel washes (Rose / Peach / Butter / Sage / Mint / Fog / Lavender + Default); a washed note shows dark ink on the card *and* in the open editor. Plus search, archive, duplicate, share/copy as text.
- **Undo delete** — a 6-second window to bring a deleted note back.
- **Export / Import** a full `.json` backup (notes + audio + images embedded).
- **Optional cross-device sync** — ⋮ → *Sync & settings…*; needs the Worker in [`worker/`](worker/). Off by default.
- Works offline once loaded (service worker caches the app shell).

## Storage

Data lives in the browser's **IndexedDB** on each device:

- Android Chrome / desktop: many GB available.
- **iOS Safari:** ~1 GB and can be evicted under storage pressure unless the app is added to the Home Screen.

The app itself is < 1 MB, so GitHub Pages' 1 GB site limit is irrelevant here.

## Hosting

Static files — drop `index.html`, `manifest.json`, `service-worker.js`, `icon.svg` at the repo root and enable Pages. (`worker/` is not part of the site — it deploys separately with `wrangler`.)

GitHub Pages is always public on free accounts. For a private deployment, host the same files on Cloudflare Pages behind Cloudflare Access, or add a client-side password gate.

## Sync (optional)

`worker/` holds a small Cloudflare Worker (KV-only, no R2 → no payment method needed) that syncs notes + blobs between devices, last-write-wins per note, deletes as 30-day tombstones. See [`worker/README.md`](worker/README.md) for the `wrangler` steps, then enter the URL + token in the app under ⋮ → *Sync & settings…* on each device.

## Roadmap

- FLIP animation on checklist drag
- Rich text / markdown in text notes
- Per-note reminders
- Trash view (currently tombstones are silent for 30 days)
