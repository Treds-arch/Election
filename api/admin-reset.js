const { getConfig, resetVotes } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { pin } = req.body || {};
    const cfg = await getConfig();
    if (!cfg || pin !== cfg.pin) {
      res.status(401).json({ error: 'PIN tidak cocok' });
      return;
    }
    const deleted = await resetVotes();
    res.status(200).json({ ok: true, deleted });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
};
