export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { key } = req.query;

  if (!key || typeof key !== "string" || key.length > 128) {
    return res.status(200).json({ valid: false, message: "invalid key format" });
  }

  try {
    const { kv } = await import("@vercel/kv");

    const data = await kv.get("key:" + key);

    if (!data) {
      return res.status(200).json({ valid: false, message: "key not found" });
    }

    if (data.revoked) {
      return res.status(200).json({ valid: false, status: "banned", message: "key has been revoked" });
    }

    if (data.expires && Date.now() > data.expires) {
      return res.status(200).json({ valid: false, status: "expired", message: "key has expired" });
    }

    return res.status(200).json({
      valid: true,
      status: data.plan || "free",
      username: data.username || "unknown",
    });
  } catch (err) {
    return res.status(200).json({ valid: false, message: "server error" });
  }
}
