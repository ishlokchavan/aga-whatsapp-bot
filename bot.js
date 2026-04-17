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
client.on('auth_failure', (m) => console.error('❌ Auth failed:', m));
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
client.on('message', async (msg) => {
  if (msg.isGroupMsg || msg.from === 'status@broadcast' || msg.fromMe) return;

  const phone = msg.from.replace('@c.us', '');
  const body  = msg.body.trim();

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
  if (contact.state === 'NEW') {
    const hasKeyword = /TAG|Tilal Al Ghaf/i.test(body);
    if (!hasKeyword) {
      console.log(`⏭️  Skipping NEW contact ${contact.name} (${phone}) — no keyword match. Message: "${body}"`);
      return;
    }
    console.log(`✅ NEW contact ${contact.name} (${phone}) mentioned keyword — activating flow`);
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
