const { supabaseAdmin } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, email } = req.body || {};
  if (!username || !email) {
    res.status(400).json({ error: 'Missing username or email' });
    return;
  }

  const clean = String(username).trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    res.status(400).json({ error: 'Usernames must be 3-20 characters: letters, numbers, underscores only.' });
    return;
  }

  const { error } = await supabaseAdmin.from('usernames').insert({ username: clean, email });
  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'That username is already taken.' });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
};
