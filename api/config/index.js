import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { hwid } = req.query;

  if (!hwid || typeof hwid !== "string" || hwid.length > 128) {
    return res.status(400).json({ error: "invalid hwid" });
  }

  const key = config: + hwid;

  if (req.method === "GET") {
    try {
      const config = await kv.get(key);
      return res.status(200).json(config || {});
    } catch {
      return res.status(500).json({ error: "kv read failed" });
    }
  }

  if (req.method === "POST") {
    try {
      const config = req.body;
      if (!config || typeof config !== "object") {
        return res.status(400).json({ error: "invalid config body" });
      }
      config._updated = Date.now();
      await kv.set(key, config);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: "kv write failed" });
    }
  }

  return res.status(405).json({ error: "method not allowed" });
}