const { getConfig, publicConfig, saveConfig } = require('../lib/store');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const cfg = await getConfig();
      res.status(200).json(publicConfig(cfg));
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const existing = await getConfig();

      if (!existing) {
        const fresh = body.config;
        if (!fresh || !fresh.pin || !fresh.title || !Array.isArray(fresh.candidates)) {
          res.status(400).json({ error: 'Data setup tidak lengkap' });
          return;
        }
        fresh.rev = 0;
        fresh.createdAt = Date.now();
        await saveConfig(fresh);
        res.status(200).json(publicConfig(fresh));
        return;
      }

      if (body.pin !== existing.pin) {
        res.status(401).json({ error: 'PIN tidak cocok' });
        return;
      }
      const merged = {
        ...existing,
        ...body.config,
        pin: existing.pin,
        rev: (existing.rev || 0) + 1,
      };
      await saveConfig(merged);
      res.status(200).json(publicConfig(merged));
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
};
