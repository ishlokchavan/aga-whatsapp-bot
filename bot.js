/**
 * AGA Real Estate – TAG WhatsApp Bot
 * Runs on your personal WhatsApp number via WhatsApp Web
 *
 * Usage: node bot.js
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const { getNextState, renderMessage } = require('./flow');
const { saveContact, getContact, updateContact, logMessage, addNotification } = require('./contacts');
const { processBroadcastQueue } = require('./broadcast');
const { server, PORT, setQR } = require('./server');
const config = require('./config');

// Optional one-time reset for stale WhatsApp auth sessions in cloud deploys.
if (process.env.WA_RESET_AUTH === 'true') {
  const authPath = path.join(__dirname, '.wwebjs_auth');
  try {
    fs.rmSync(authPath, { recursive: true, force: true });
    console.log('🧹 WA_RESET_AUTH=true -> cleared .wwebjs_auth');
  } catch (err) {
    console.warn('⚠️  Failed to clear .wwebjs_auth:', err.message);
  }
}

// ─── Start dashboard API ───
server.listen(PORT, () => {
  console.log(`📊 Dashboard API: http://localhost:${PORT}`);
});

// ─── WhatsApp client ───
const clientOptions = {
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
};
if (config.chromePath) clientOptions.puppeteer.executablePath = config.chromePath;

const client = new Client(clientOptions);

client.on('qr', (qr) => {
  setQR(qr);
  const host = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  console.log(`\n📱 Scan QR at: ${host}/qr\n`);
  qrcode.generate(qr, { small: true });
  console.log('\nWhatsApp → Linked Devices → Link a Device\n');
});

client.on('authenticated', () => console.log('✅ Authenticated — session saved.'));
client.on('auth_failure', (m) => {
  console.error('❌ Auth failed:', m);
  console.error('Tip: set WA_RESET_AUTH=true for one deploy, scan again, then set it back to false.');
});
client.on('disconnected', (r) => console.warn('⚠️  Disconnected:', r, '— restart bot.js'));

client.on('ready', () => {
  console.log('\n' + '─'.repeat(48));
  console.log('🤖  AGA TAG Bot running on your WhatsApp');
  console.log('📊  Open dashboard.html in your browser');
  console.log('📤  Queue sends: node broadcast.js --help');
  console.log('─'.repeat(48) + '\n');
  processBroadcastQueue(client);
});

// ─── Incoming messages ───
const processedMessageIds = new Set();
// Track recently-activated phones in-memory so a quick follow-up reply
// (e.g. "3") is accepted even if the DB hasn't finished persisting
// `contact.data.hasEngaged`. Entries expire after 10 minutes.
const activeEngagedPhones = new Set();
function markPhoneEngaged(phone, ttlMs = 10 * 60 * 1000) {
  activeEngagedPhones.add(phone);
  setTimeout(() => activeEngagedPhones.delete(phone), ttlMs);
}

function markProcessed(msg) {
  const id = msg?.id?._serialized;
  if (!id) return false;
  if (processedMessageIds.has(id)) return true;
  processedMessageIds.add(id);
  // Prevent unbounded memory growth in long-running sessions.
  if (processedMessageIds.size > 5000) {
    const first = processedMessageIds.values().next().value;
    processedMessageIds.delete(first);
  }
  return false;
}

async function handleIncomingMessage(msg) {
  if (markProcessed(msg)) return;
  if (msg.isGroupMsg || msg.from === 'status@broadcast' || msg.fromMe) return;

  const phone = msg.from.replace('@c.us', '');
  const body  = msg.body.trim();

  console.log(`📩 Incoming message from ${phone}: "${body}"`);
  await logMessage({ phone, direction: 'in', body, timestamp: new Date().toISOString() });

  // Load or create contact
  let contact = await getContact(phone);
  if (!contact) {
    const wac = await msg.getContact();
    contact = {
      phone,
      name: wac.pushname || wac.name || phone,
      state: 'NEW',
      data: {},
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveContact(contact);
  }

  // Global STOP
  if (/^(stop|unsubscribe|opt.?out|remove)$/i.test(body)) {
    contact.state = 'STOPPED';
    contact.optOut = true;
    await updateContact(contact);
    await reply(msg, config.messages.optOut.replace('{name}', contact.name));
    return;
  }

  // Global CALL
  if (/^(call|call me|book call|yes call)$/i.test(body)) {
    contact.state = 'CALL_REQUESTED';
    contact.callRequested = true;
    await updateContact(contact);
    await reply(msg, config.messages.callRequested.replace('{name}', contact.name));
    notify('📞 CALL REQUESTED', contact);
    return;
  }

  // ─── Activation check: Only respond to NEW contacts if they mention "TAG" or "Tilal Al Ghaf" ───
  // Existing contacts (already in flow) always get responses
  if (contact.state === 'NEW' && !contact.data?.hasEngaged && !activeEngagedPhones.has(phone)) {
    const hasKeyword = /TAG|Tilal Al Ghaf/i.test(body);

    // Allow numeric replies (1-5) if there is a recent TAG in the contact history
    const isNumericReply = /^[\s\D]*([1-9][0-9]*)[\s\D]*$/.test(body);
    let recentTagFound = false;
    try {
      if (contact.history && Array.isArray(contact.history)) {
        const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
        recentTagFound = contact.history.some(h => {
          const ts = new Date(h.ts).getTime();
          return ts >= cutoff && /TAG|Tilal Al Ghaf/i.test(h.input);
        });
      }
    } catch (e) { recentTagFound = false; }

    if (!hasKeyword && !(isNumericReply && recentTagFound)) {
      console.log(`⏭️  Skipping NEW contact ${contact.name} (${phone}) — no keyword match. Message: "${body}"`);
      return;
    }

    console.log(`✅ NEW contact ${contact.name} (${phone}) mentioned keyword or recent TAG — activating flow`);
    if (!contact.data) contact.data = {};
    contact.data.hasEngaged = true; // Persist in data object so it survives database round-trip
    markPhoneEngaged(phone);
  }

  // Run through flow
  console.log(`📍 Processing: ${contact.name} (${phone}) — Current state: ${contact.state}, Input: "${body}"`);
  const result = getNextState(contact.state || 'NEW', body, contact);
  console.log(`   → Next state: ${result.nextState}${result.reply ? ' (will reply)' : ' (no reply)'}`);

  if (result.reply) {
    const text = renderMessage(result.reply, { ...contact, data: { ...contact.data, ...result.data } });
    await reply(msg, text);
    await logMessage({ phone, direction: 'out', body: text, timestamp: new Date().toISOString() });
  }

  // Persist
  contact.state   = result.nextState;
  contact.data    = { ...contact.data, ...result.data };
  contact.updatedAt = new Date().toISOString();
  if (!contact.history) contact.history = [];
  contact.history.push({ state: result.nextState, input: body, ts: new Date().toISOString() });
  await updateContact(contact);

  if (result.notify) notify(result.notify, contact);
}

client.on('message', (msg) => {
  handleIncomingMessage(msg).catch(err => console.error('Incoming message error:', err.message));
});

client.on('message_create', (msg) => {
  handleIncomingMessage(msg).catch(err => console.error('Incoming message_create error:', err.message));
});

// ─── Reply with typing simulation ───
async function reply(msg, text) {
  if (!text) return;
  await sleep(1500 + Math.random() * 2000);
  try {
    const chat = await msg.getChat();
    await chat.sendStateTyping();
    await sleep(800 + Math.random() * 1200);
    await msg.reply(text);
  } catch (e) { console.error('Reply error:', e.message); }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Notification logger (Supabase-backed) ───
function notify(event, contact) {
  // Save to Supabase asynchronously
  addNotification(event, contact).catch(err => {
    console.error('❌ Failed to save notification:', err.message);
  });

  // Log to console
  console.log(`\n🔔 ${event} — ${contact.name} (${contact.phone})`);
  const d = contact.data || {};
  ['subCommunity','unitType','beds','budget','sellTimeline'].forEach(k => { if (d[k]) console.log(`   ${k}: ${d[k]}`); });
  console.log('');
}

// ─── Init ───
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

client.initialize();
module.exports = { client };
