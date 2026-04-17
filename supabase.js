/**
 * Supabase client configuration
 * Connects to Supabase instance at https://vqhhnlunkyckrcgekwfu.supabase.co
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vqhhnlunkyckrcgekwfu.supabase.co';
// Accept multiple key names so deploy platforms (Railway/Vercel/etc.) are easier to configure.
const keyName = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? 'SUPABASE_SERVICE_ROLE_KEY'
  : process.env.SUPABASE_ANON_KEY
    ? 'SUPABASE_ANON_KEY'
    : process.env.SUPABASE_KEY
      ? 'SUPABASE_KEY'
      : null;
const SUPABASE_KEY = keyName ? process.env[keyName] : null;

function decodeJwtRole(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return 'unknown';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

const isSupabaseEnabled = Boolean(SUPABASE_KEY);
const supabase = isSupabaseEnabled ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

if (!isSupabaseEnabled) {
  console.warn('⚠️  Supabase key not configured. Running with local JSON storage backend.');
} else {
  const keyRole = decodeJwtRole(SUPABASE_KEY);
  console.log(`🗄️  Supabase enabled (${keyName}, role=${keyRole})`);
  if (keyRole === 'anon') {
    console.warn('⚠️  Using anon key. If RLS blocks inserts, switch to SUPABASE_SERVICE_ROLE_KEY.');
  }
}

/**
 * Initialize database schema (creates tables if they don't exist)
 * Run this once to set up the database
 */
async function initializeDatabase() {
  if (!isSupabaseEnabled || !supabase) {
    return;
  }

  try {
    console.log('🔧 Initializing Supabase schema...');

    // Create contacts table
    await supabase.rpc('create_contacts_table', {});

    // Create notifications table
    await supabase.rpc('create_notifications_table', {});

    // Create messages table
    await supabase.rpc('create_messages_table', {});

    // Create broadcast_queue table
    await supabase.rpc('create_queue_table', {});

    console.log('✅ Schema initialized');
  } catch (err) {
    // Table may already exist, which is fine
    if (!err.message.includes('already exists')) {
      console.warn('⚠️  Schema init warning:', err.message);
    }
  }
}

module.exports = { supabase, initializeDatabase, SUPABASE_URL, isSupabaseEnabled, keyName };
