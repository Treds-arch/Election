const { getConfig } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { pin } = req.body || {};
    const cfg = await getConfig();
    if (!cfg) {
      res.status(404).json({ ok: false });
      return;
    }
    res.status(200).json({ ok: pin === cfg.pin });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
