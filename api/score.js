const { getUserFromRequest, checkAndConsumeUsage, DAILY_LIMIT } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in.' });
    return;
  }

  const allowed = await checkAndConsumeUsage(user.id);
  if (!allowed) {
    res.status(429).json({ error: `You've reached today's practice limit (${DAILY_LIMIT} exchanges). Come back tomorrow!` });
    return;
  }

  const { messages, system } = req.body || {};
  if (!messages || !system) {
    res.status(400).json({ error: 'Missing messages or system prompt' });
    return;
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system,
        messages,
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Upstream error contacting Claude' });
  }
};
