// Netlify Function: simple key-value storage API backed by Netlify Blobs.
// Mirrors the shape of window.storage from the Claude artifacts environment
// (get/set by key, value stored as a plain string) so the app's front-end
// code (getData/setData) can talk to either one without extra logic.
//
// Endpoints (mounted at /api/data via the `config.path` export below):
//   GET    /api/data?key=xxx        -> { key, value } (value is a string or null)
//   POST   /api/data  {key, value}  -> { ok: true }
//   DELETE /api/data?key=xxx        -> { ok: true }

import { getStore } from "@netlify/blobs";

const STORE_NAME = "presensi-sdn-reksosari01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(req.url);

  try {
    if (req.method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) return json({ error: "Parameter 'key' wajib diisi." }, 400);
      const value = await store.get(key, { type: "text" });
      return json({ key, value: value ?? null });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || !body.key) return json({ error: "Field 'key' wajib diisi." }, 400);
      await store.set(body.key, body.value ?? "");
      return json({ ok: true });
    }

    if (req.method === "DELETE") {
      const key = url.searchParams.get("key");
      if (!key) return json({ error: "Parameter 'key' wajib diisi." }, 400);
      await store.delete(key);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("data function error", err);
    return json({ error: err.message || "Terjadi kesalahan pada server." }, 500);
  }
};

export const config = { path: "/api/data" };
