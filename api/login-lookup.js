const { supabaseAdmin } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username } = req.body || {};
  if (!username) {
    res.status(400).json({ error: 'Missing username' });
    return;
  }

  const clean = String(username).trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from('usernames')
    .select('email')
    .eq('username', clean)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Incorrect username or password.' });
    return;
  }

  res.status(200).json({ email: data.email });
};
