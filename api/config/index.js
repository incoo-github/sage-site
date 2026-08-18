export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { hwid } = req.query;

  if (!hwid || typeof hwid !== "string" || hwid.length > 128) {
    return res.status(400).json({ error: "invalid hwid" });
  }

  const key = "config:" + hwid;

  try {
    const { kv } = await import("@vercel/kv");

    if (req.method === "GET") {
      const config = await kv.get(key);
      return res.status(200).json(config || {});
    }

    if (req.method === "POST") {
      const config = req.body;
      if (!config || typeof config !== "object") {
        return res.status(400).json({ error: "invalid config body" });
      }
      config._updated = Date.now();
      await kv.set(key, config);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    return res.status(500).json({ error: "server error: " + (err.message || "unknown") });
  }

  return res.status(405).json({ error: "method not allowed" });
}
