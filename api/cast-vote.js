const { castVote } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { candidateId, nim, nama, deviceKey } = req.body || {};
    if (!candidateId || !nim || !nama) {
      res.status(400).json({ ok: false, reason: 'invalid-input' });
      return;
    }
    const result = await castVote({ candidateId, nim, nama, deviceKey });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, reason: 'server-error', detail: String(err && err.message || err) });
  }
};
