/**
 * Supabase client configuration
 * Connects to Supabase instance at https://vqhhnlunkyckrcgekwfu.supabase.co
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vqhhnlunkyckrcgekwfu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_ANON_KEY environment variable');
  console.error('Set it in .env or export it: export SUPABASE_ANON_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Initialize database schema (creates tables if they don't exist)
 * Run this once to set up the database
 */
async function initializeDatabase() {
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

module.exports = { supabase, initializeDatabase, SUPABASE_URL };
