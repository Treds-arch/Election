const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function rowToConfig(row) {
  if (!row) return null;
  return {
    title: row.title,
    pin: row.pin,
    candidates: row.candidates || [],
    target: row.target,
    usePair: row.use_pair,
    isOpen: row.is_open,
    published: row.published,
    deviceLock: row.device_lock,
    finalized: row.finalized,
    rev: row.rev,
    createdAt: row.created_at != null ? Number(row.created_at) : null,
  };
}

async function getConfig() {
  const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  return rowToConfig(data);
}

function publicConfig(cfg) {
  if (!cfg) return null;
  const { pin, ...rest } = cfg;
  return rest;
}

async function saveConfig(newCfg) {
  const row = {
    id: 1,
    title: newCfg.title,
    pin: newCfg.pin,
    candidates: newCfg.candidates || [],
    target: newCfg.target != null ? newCfg.target : null,
    use_pair: !!newCfg.usePair,
    is_open: !!newCfg.isOpen,
    published: !!newCfg.published,
    device_lock: !!newCfg.deviceLock,
    finalized: !!newCfg.finalized,
    rev: newCfg.rev || 0,
    created_at: newCfg.createdAt || Date.now(),
  };
  const { data, error } = await supabase.from('app_config').upsert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToConfig(data);
}

async function listVotes() {
  const { data, error } = await supabase.from('votes').select('candidate_id, nim, nama, ts');
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({ candidateId: r.candidate_id, nim: r.nim, nama: r.nama, ts: Number(r.ts) }));
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

  const { error: insErr } = await supabase
    .from('votes')
    .insert({ nim: n, candidate_id: candidateId, nama, ts: Date.now() });

  if (insErr) {
    if (insErr.code === '23505') {
      const { data: existing } = await supabase.from('votes').select('candidate_id').eq('nim', n).maybeSingle();
      return { ok: false, reason: 'duplicate', candidateId: existing ? existing.candidate_id : null };
    }
    throw new Error(insErr.message);
  }

  if (cfg.deviceLock && deviceKey) {
    const hash = candidateSetHash(cfg.candidates);
    const { error: devErr } = await supabase
      .from('device_votes')
      .insert({ candidate_set_hash: hash, device_key: deviceKey, ts: Date.now() });
    if (devErr) {
      if (devErr.code === '23505') {
        await supabase.from('votes').delete().eq('nim', n);
        return { ok: false, reason: 'device' };
      }
      throw new Error(devErr.message);
    }
  }

  return { ok: true };
}

async function checkDeviceBlocked(candidates, deviceKey) {
  if (!deviceKey) return false;
  const hash = candidateSetHash(candidates);
  const { data } = await supabase
    .from('device_votes')
    .select('device_key')
    .eq('candidate_set_hash', hash)
    .eq('device_key', deviceKey)
    .maybeSingle();
  return !!data;
}

async function resetVotes() {
  const { data: votes } = await supabase.from('votes').select('nim');
  const count = votes ? votes.length : 0;
  await supabase.from('votes').delete().neq('nim', '');
  await supabase.from('device_votes').delete().neq('device_key', '');
  return count;
}

module.exports = {
  normNim, candidateSetHash, getConfig, publicConfig, saveConfig,
  listVotes, castVote, checkDeviceBlocked, resetVotes,
};
