const { supabaseAdmin } = require('./_supabase');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userId, guardianEmail, username } = req.body || {};
  if (!userId || !guardianEmail) {
    res.status(400).json({ error: 'Missing userId or guardianEmail' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');

  const { error } = await supabaseAdmin.from('profiles').update({
    guardian_email: guardianEmail,
    guardian_consent_token: token,
    guardian_consent_at: null,
  }).eq('id', userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const appUrl = `https://${req.headers.host}`;
  const consentLink = `${appUrl}/?consent_token=${token}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SpeakUp ESL <noreply@speakup-esl.org>',
        to: guardianEmail,
        subject: `Permission needed: ${username || 'your child'} wants to join SpeakUp ESL`,
        html: `<p>Hi,</p>
<p><strong>${username || 'Your child'}</strong> is trying to create an account on SpeakUp ESL, an English-practice app for ESL learners. Because they're under 13, we need your permission before their account can be used.</p>
<p>SpeakUp ESL will store their name, email, age, English level, and practice conversations (which are sent to an AI provider, Anthropic, to generate replies and feedback).</p>
<p>If you're comfortable with this, click below to approve their account:</p>
<p><a href="${consentLink}">Approve ${username || "my child's"} account</a></p>
<p>If you did not expect this email, you can ignore it — the account will stay inactive.</p>`,
      }),
    });
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      res.status(500).json({ error: errData.message || 'Could not send consent email' });
      return;
    }
  } catch (e) {
    res.status(500).json({ error: 'Could not send consent email' });
    return;
  }

  res.status(200).json({ ok: true });
};
