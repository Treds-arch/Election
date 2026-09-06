const { getConfig, checkDeviceBlocked } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const deviceKey = req.query.key;
    const cfg = await getConfig();
    if (!cfg || !cfg.deviceLock || !deviceKey) {
      res.status(200).json({ blocked: false });
      return;
    }
    const blocked = await checkDeviceBlocked(cfg.candidates, deviceKey);
    res.status(200).json({ blocked });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
};
