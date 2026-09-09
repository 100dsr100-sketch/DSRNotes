/* ============================================================
   DSR Notes — sync Worker  (Cloudflare Workers, KV-only)
   ------------------------------------------------------------
   One private endpoint that syncs notes + their audio/image
   blobs between your devices. Last-write-wins per note, by the
   note's own `updated` timestamp. Deletes travel as tombstones.

   Bindings (see wrangler.toml):
     NOTES_KV   — KV namespace, holds  note:<id>  and  blob:<key>
   Secret:
     SYNC_TOKEN — shared bearer token; the app sends it too
   ============================================================ */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if ((req.headers.get('Authorization') || '') !== 'Bearer ' + env.SYNC_TOKEN)
      return json({ error: 'unauthorized' }, 401);

    const p = new URL(req.url).pathname.replace(/\/+$/, '');

    try {
      /* ---- GET /notes → lightweight index --------------------------------- */
      if (req.method === 'GET' && (p === '' || p === '/notes')) {
        const out = [];
        let cursor;
        do {
          const page = await env.NOTES_KV.list({ prefix: 'note:', cursor });
          for (const k of page.keys) {
            const m = k.metadata || {};
            out.push({ id: k.name.slice(5), updated: m.updated || 0, deleted: !!m.deleted });
          }
          cursor = page.list_complete ? null : page.cursor;
        } while (cursor);
        return json({ notes: out });
      }

      /* ---- /note/:id ----------------------------------------------------- */
      let m = p.match(/^\/note\/(.+)$/);
      if (m && req.method === 'GET') {
        const v = await env.NOTES_KV.get('note:' + m[1]);
        return v
          ? new Response(v, { headers: { ...CORS, 'Content-Type': 'application/json' } })
          : json({ error: 'not found' }, 404);
      }
      if (m && req.method === 'PUT') {
        const body = await req.text();
        let obj;
        try { obj = JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
        await env.NOTES_KV.put('note:' + m[1], body, {
          metadata: { updated: obj.updated || Date.now(), deleted: !!obj.deleted },
        });
        return json({ ok: true });
      }

      /* ---- /blob/:key --------------------------------------------------- */
      m = p.match(/^\/blob\/(.+)$/);
      if (m && req.method === 'GET') {
        const v = await env.NOTES_KV.getWithMetadata('blob:' + m[1], { type: 'arrayBuffer' });
        if (!v || !v.value) return json({ error: 'not found' }, 404);
        return new Response(v.value, {
          headers: { ...CORS, 'Content-Type': (v.metadata && v.metadata.ct) || 'application/octet-stream' },
        });
      }
      if (m && req.method === 'PUT') {
        const buf = await req.arrayBuffer();               // blobs are small (< a few MB)
        await env.NOTES_KV.put('blob:' + m[1], buf, {
          metadata: { ct: req.headers.get('Content-Type') || 'application/octet-stream' },
        });
        return json({ ok: true });
      }

      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
