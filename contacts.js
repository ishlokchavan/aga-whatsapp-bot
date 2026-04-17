/**
 * Contact store
 * Uses Supabase when configured, otherwise falls back to local JSON files.
 */

const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseEnabled } = require('./supabase');

const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!isSupabaseEnabled) {
  console.log('🗂️  Contacts backend: local JSON files');
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Contact operations ───

async function getContact(phone) {
  if (isSupabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? _formatContact(data) : null;
    } catch (err) {
      console.error('❌ getContact error:', err.message);
      return null;
    }
  }

  const contacts = readJson(CONTACTS_FILE, []);
  return contacts.find(c => c.phone === phone) || null;
}

async function saveContact(contact) {
  if (isSupabaseEnabled && supabase) {
    try {
      const record = _prepareContact(contact);
      const { data, error } = await supabase
        .from('contacts')
        .upsert(record, { onConflict: 'phone' })
        .select()
        .single();

      if (error) throw error;
      return _formatContact(data);
    } catch (err) {
      console.error('❌ saveContact error for', contact.phone, ':', err.message);
      return null;
    }
  }

  const now = new Date().toISOString();
  const contacts = readJson(CONTACTS_FILE, []);
  const idx = contacts.findIndex(c => c.phone === contact.phone);
  const merged = {
    phone: contact.phone,
    name: contact.name,
    state: contact.state,
    data: contact.data || {},
    history: contact.history || [],
    callRequested: Boolean(contact.callRequested),
    optOut: Boolean(contact.optOut),
    createdAt: contact.createdAt || now,
    updatedAt: now
  };

  if (idx >= 0) contacts[idx] = { ...contacts[idx], ...merged, createdAt: contacts[idx].createdAt || merged.createdAt };
  else contacts.push(merged);

  writeJson(CONTACTS_FILE, contacts);
  return merged;
}

async function updateContact(contact) {
  return saveContact(contact);
}

async function getAllContacts() {
  if (isSupabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data.map(_formatContact);
    } catch (err) {
      console.error('❌ getAllContacts error:', err.message);
      return [];
    }
  }

  const contacts = readJson(CONTACTS_FILE, []);
  return contacts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function loadContacts() {
  return getAllContacts();
}

// ─── Message log ───

async function logMessage({ phone, direction, body, timestamp }) {
  if (isSupabaseEnabled && supabase) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          phone,
          direction,
          body,
          created_at: timestamp
        });

      if (error) throw error;
      return;
    } catch (err) {
      console.error('❌ logMessage error:', err.message);
      return;
    }
  }

  const messages = readJson(MESSAGES_FILE, []);
  messages.push({ phone, direction, body, timestamp });
  writeJson(MESSAGES_FILE, messages);
}

async function getMessages(phone) {
  if (isSupabaseEnabled && supabase) {
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);

      if (phone) {
        query = query.eq('phone', phone);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(m => ({
        phone: m.phone,
        direction: m.direction,
        body: m.body,
        timestamp: m.created_at
      }));
    } catch (err) {
      console.error('❌ getMessages error:', err.message);
      return [];
    }
  }

  const messages = readJson(MESSAGES_FILE, []);
  const filtered = phone ? messages.filter(m => m.phone === phone) : messages;
  return filtered.slice(-50).reverse();
}

// ─── Stats helpers ───

async function getStats() {
  try {
    const contacts = await getAllContacts();
    const total = contacts.length;
    const byState = {};
    const byIntent = {};
    let optOuts = 0;
    let callRequests = 0;
    let hotLeads = 0;

    contacts.forEach(c => {
      byState[c.state] = (byState[c.state] || 0) + 1;
      if (c.data && c.data.intent) {
        byIntent[c.data.intent] = (byIntent[c.data.intent] || 0) + 1;
      }
      if (c.optOut) optOuts++;
      if (c.callRequested) callRequests++;
      if (c.data && (c.data.priority === 'hot' || ['SELL_HOT_HANDOFF', 'BUY_HANDOFF', 'VALUATION_HANDOFF'].includes(c.state))) {
        hotLeads++;
      }
    });

    return { total, byState, byIntent, optOuts, callRequests, hotLeads };
  } catch (err) {
    console.error('❌ getStats error:', err.message);
    return { total: 0, byState: {}, byIntent: {}, optOuts: 0, callRequests: 0, hotLeads: 0 };
  }
}

// ─── Notification helpers ───

async function addNotification(event, contact) {
  if (isSupabaseEnabled && supabase) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          event,
          contact_phone: contact.phone,
          contact_name: contact.name,
          contact_state: contact.state,
          contact_data: contact.data
        });

      if (error) throw error;
      return;
    } catch (err) {
      console.error('❌ addNotification error:', err.message);
      return;
    }
  }

  const notifications = readJson(NOTIFICATIONS_FILE, []);
  notifications.push({
    event,
    contact: {
      name: contact.name,
      phone: contact.phone,
      state: contact.state,
      data: contact.data || {}
    },
    timestamp: new Date().toISOString()
  });
  writeJson(NOTIFICATIONS_FILE, notifications);
}

async function getNotifications(limit = 50) {
  if (isSupabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data.map(n => ({
        event: n.event,
        contact: {
          name: n.contact_name,
          phone: n.contact_phone,
          state: n.contact_state,
          data: n.contact_data
        },
        timestamp: n.created_at
      }));
    } catch (err) {
      console.error('❌ getNotifications error:', err.message);
      return [];
    }
  }

  const notifications = readJson(NOTIFICATIONS_FILE, []);
  return notifications.slice(-limit).reverse();
}

// ─── Helper functions ───

function _formatContact(dbRecord) {
  return {
    phone: dbRecord.phone,
    name: dbRecord.name,
    state: dbRecord.state,
    data: dbRecord.data || {},
    history: dbRecord.history || [],
    callRequested: Boolean(dbRecord.call_requested),
    optOut: Boolean(dbRecord.opt_out),
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

function _prepareContact(contact) {
  return {
    phone: contact.phone,
    name: contact.name,
    state: contact.state,
    data: contact.data || {},
    history: contact.history || [],
    call_requested: Boolean(contact.callRequested),
    opt_out: Boolean(contact.optOut),
    updated_at: new Date().toISOString()
  };
}

module.exports = {
  loadContacts,
  saveContact,
  getContact,
  updateContact,
  getAllContacts,
  logMessage,
  getMessages,
  getStats,
  addNotification,
  getNotifications
};
