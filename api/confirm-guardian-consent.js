const { supabaseAdmin } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { token } = req.body || {};
  if (!token) {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name')
    .eq('guardian_consent_token', token)
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'This link is invalid or has already been used.' });
    return;
  }

  const { error: updateError } = await supabaseAdmin.from('profiles').update({
    guardian_consent_at: new Date().toISOString(),
    guardian_consent_token: null,
  }).eq('id', data.id);
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.status(200).json({ ok: true, name: data.name });
};
