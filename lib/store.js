const { kv } = require('@vercel/kv');

function normNim(v) {
  return (v || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function candidateSetHash(candidates) {
  const ids = (candidates || []).map(c => c.id).sort().join('|');
  let h = 2166136261;
  for (let i = 0; i < ids.length; i++) {
    h ^= ids.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

async function getConfig() {
  const cfg = await kv.get('config');
  return cfg || null;
}

function publicConfig(cfg) {
  if (!cfg) return null;
  const { pin, ...rest } = cfg;
  return rest;
}

async function saveConfig(newCfg) {
  await kv.set('config', newCfg);
  return newCfg;
}

async function listVotes() {
  const keys = await kv.keys('vote:*');
  if (!keys.length) return [];
  const values = await Promise.all(keys.map(k => kv.get(k)));
  return keys.map((k, i) => {
    const parts = k.split(':');
    const candidateId = parts[1];
    const nim = parts.slice(2).join(':');
    const v = values[i] || {};
    return { candidateId, nim, nama: v.nama || '', ts: v.ts || 0 };
  });
}

async function castVote({ candidateId, nim, nama, deviceKey }) {
  const cfg = await getConfig();
  if (!cfg) return { ok: false, reason: 'no-config' };
  if (!cfg.isOpen) return { ok: false, reason: 'closed' };
  if (!cfg.candidates.some(c => c.id === candidateId)) {
    return { ok: false, reason: 'invalid-candidate' };
  }

  const n = normNim(nim);
  if (!n || !nama) return { ok: false, reason: 'invalid-input' };

  const votedByKey = `votedby:${n}`;
  const claimed = await kv.set(votedByKey, { candidateId, ts: Date.now() }, { nx: true });
  if (!claimed) {
    const existing = await kv.get(votedByKey);
    return { ok: false, reason: 'duplicate', candidateId: existing ? existing.candidateId : null };
  }

  if (cfg.deviceLock && deviceKey) {
    const fullDeviceKey = `devicevote:${candidateSetHash(cfg.candidates)}:${deviceKey}`;
    const deviceClaimed = await kv.set(fullDeviceKey, { ts: Date.now() }, { nx: true });
    if (!deviceClaimed) {
      await kv.del(votedByKey);
      return { ok: false, reason: 'device' };
    }
  }

  await kv.set(`vote:${candidateId}:${n}`, { nama, ts: Date.now() });
  return { ok: true };
}

async function checkDeviceBlocked(candidates, deviceKey) {
  if (!deviceKey) return false;
  const fullDeviceKey = `devicevote:${candidateSetHash(candidates)}:${deviceKey}`;
  const v = await kv.get(fullDeviceKey);
  return !!v;
}

async function resetVotes() {
  const [voteKeys, votedByKeys, deviceKeys] = await Promise.all([
    kv.keys('vote:*'),
    kv.keys('votedby:*'),
    kv.keys('devicevote:*'),
  ]);
  const all = [...voteKeys, ...votedByKeys, ...deviceKeys];
  if (all.length) await Promise.all(all.map(k => kv.del(k)));
  return all.length;
}

module.exports = {
  normNim, candidateSetHash, getConfig, publicConfig, saveConfig,
  listVotes, castVote, checkDeviceBlocked, resetVotes,
};
