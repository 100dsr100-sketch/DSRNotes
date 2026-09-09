# DSR Notes

A local-first, Google-Keep-style notepad for phone and PC. Single static page + PWA shell — no backend, no account, nothing leaves the device.

## Note types

| Type | What it does |
|---|---|
| ✏️ Note | Free text with a title. |
| ☑️ Checklist | Add / tick / reorder items; option to sink ticked items to the bottom. |
| 🎙️ Voice memo | Records via `MediaRecorder`, inline playback, plus a live auto-transcript (Web Speech API where supported — Chrome/Edge/Android; editable). |
| 🎨 Drawing | White canvas, pen colour + size, eraser, undo, clear. Import a photo and draw on top. |

## Features

- **Pin** important notes — they show in a *Pinned* section above the rest (pin icon on each card, or the 📌 in the editor).
- Colour tags, search, archive, duplicate, share/copy as text.
- **Export / Import** a full `.json` backup (notes + audio + images embedded) — the only way data moves between devices in v1a.
- Works offline once loaded (service worker caches the app shell).

## Storage

Data lives in the browser's **IndexedDB** on each device:

- Android Chrome / desktop: many GB available.
- **iOS Safari:** ~1 GB and can be evicted under storage pressure unless the app is added to the Home Screen.

The app itself is < 1 MB, so GitHub Pages' 1 GB site limit is irrelevant here.

## Hosting

Static files — drop `index.html`, `manifest.json`, `service-worker.js`, `icon.svg` at the repo root and enable Pages.

GitHub Pages is always public on free accounts. For a private deployment, host the same files on Cloudflare Pages behind Cloudflare Access, or add a client-side password gate.

## Roadmap

- Nicer drag-to-reorder for checklists
- Label / folder filtering
- Optional cloud sync (private Cloudflare Worker + KV/R2)
