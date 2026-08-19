export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const auth = req.headers["x-admin-key"] || req.query.admin;
  if (auth !== "sage-admin-2026") {
    return res.status(403).json({ error: "unauthorized" });
  }

  try {
    const { kv } = await import("@vercel/kv");

    if (req.method === "GET") {
      const keysList = await kv.get("keys:all") || [];
      const keysWithInfo = [];
      for (const k of keysList.slice(-50)) {
        const data = await kv.get("key:" + k);
        if (data) {
          keysWithInfo.push({
            key: k,
            username: data.username || "",
            plan: data.plan || "free",
            revoked: data.revoked || false,
            expires: data.expires || null,
            created: data.created || null,
          });
        }
      }
      return res.status(200).json({ keys: keysWithInfo });
    }

    if (req.method === "POST") {
      const { username, plan, duration_days } = req.body || {};

      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "";
      for (let i = 0; i < 16; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }

      const keyData = {
        username: username || "unknown",
        plan: plan || "free",
        created: Date.now(),
        revoked: false,
        expires: duration_days ? Date.now() + duration_days * 86400000 : null,
      };

      await kv.set("key:" + key, keyData);

      const allKeys = await kv.get("keys:all") || [];
      allKeys.push(key);
      await kv.set("keys:all", allKeys);

      return res.status(200).json({ ok: true, key, username: keyData.username, plan: keyData.plan });
    }

    if (req.method === "DELETE") {
      const { key } = req.body || {};
      if (!key) return res.status(400).json({ error: "key required" });

      const existing = await kv.get("key:" + key);
      if (!existing) return res.status(404).json({ error: "key not found" });

      existing.revoked = true;
      await kv.set("key:" + key, existing);

      return res.status(200).json({ ok: true, message: "key revoked" });
    }
  } catch (err) {
    return res.status(500).json({ error: "server error: " + (err.message || "unknown") });
  }

  return res.status(405).json({ error: "method not allowed" });
}
