const { getUserFromRequest, supabaseAdmin } = require('./_supabase');

module.exports = async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in.' });
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    // "no rows" isn't an error for a brand new user - just means no profile yet
    if (error && error.code !== 'PGRST116') {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ profile: data || null });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    body.id = user.id;
    const { error } = await supabaseAdmin.from('profiles').upsert(body);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
