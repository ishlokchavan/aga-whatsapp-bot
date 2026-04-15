/**
 * Contact store - Supabase backend
 * Reads/writes to Supabase database instead of local JSON files
 */

const { supabase } = require('./supabase');

// ─── Contact operations ───

async function getContact(phone) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    if (data) {
      const formatted = _formatContact(data);
      console.log(`✅ Loaded contact ${phone} with state: ${formatted.state}`);
      return formatted;
    }
    return null;
  } catch (err) {
    console.error('❌ getContact error:', err.message);
    return null;
  }
}

async function saveContact(contact) {
  try {
    const record = _prepareContact(contact);
    console.log(`💾 Saving contact ${contact.phone} with state: ${contact.state}`);
    const { data, error } = await supabase
      .from('contacts')
      .upsert(record, { onConflict: 'phone' })
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Contact ${contact.phone} saved successfully`);
    return _formatContact(data);
  } catch (err) {
    console.error('❌ saveContact error for', contact.phone, ':', err.message);
  }
}

async function updateContact(contact) {
  contact.updated_at = new Date().toISOString();
  return saveContact(contact);
}

async function getAllContacts() {
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

async function loadContacts() {
  return getAllContacts();
}

// ─── Message log ───

async function logMessage({ phone, direction, body, timestamp }) {
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
  } catch (err) {
    console.error('❌ logMessage error:', err.message);
  }
}

async function getMessages(phone) {
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
      if (c.opt_out) optOuts++;
      if (c.call_requested) callRequests++;
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
  } catch (err) {
    console.error('❌ addNotification error:', err.message);
  }
}

async function getNotifications(limit = 50) {
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

// ─── Helper functions ───

function _formatContact(dbRecord) {
  return {
    phone: dbRecord.phone,
    name: dbRecord.name,
    state: dbRecord.state,
    data: dbRecord.data || {},
    history: dbRecord.history || [],
    callRequested: dbRecord.call_requested,
    optOut: dbRecord.opt_out,
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
    call_requested: contact.callRequested || false,
    opt_out: contact.optOut || false,
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
