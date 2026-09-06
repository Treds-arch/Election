const { listVotes } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const votes = await listVotes();
    res.status(200).json(votes);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
};
