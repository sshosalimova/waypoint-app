const { createClient } = require('@supabase/supabase-js');

// This client uses the SERVICE ROLE key - it bypasses row-level security.
// It must only ever run on the server (inside /api functions), never in the browser.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAILY_LIMIT = 40; // AI calls per user per day - adjust to control cost

// Reads the "Authorization: Bearer <token>" header sent by the frontend
// and asks Supabase who that token belongs to.
async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Returns true if this user still has calls left today, and records the call.
async function checkAndConsumeUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('calls_today,last_call_date')
    .eq('id', userId)
    .single();

  let callsToday = profile?.calls_today || 0;
  const lastDate = profile?.last_call_date;
  if (lastDate !== today) callsToday = 0;

  if (callsToday >= DAILY_LIMIT) return false;

  await supabaseAdmin
    .from('profiles')
    .update({ calls_today: callsToday + 1, last_call_date: today })
    .eq('id', userId);

  return true;
}

module.exports = { supabaseAdmin, getUserFromRequest, checkAndConsumeUsage, DAILY_LIMIT };
