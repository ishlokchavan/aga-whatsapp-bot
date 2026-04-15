/**
 * Broadcast engine
 * Sends personalised outbound messages with safe delays
 * 
 * Usage: node broadcast.js --segment=A --limit=200
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const QUEUE_FILE = path.join(__dirname, 'data', 'broadcast_queue.json');
const SENT_FILE  = path.join(__dirname, 'data', 'broadcast_sent.json');

// ─── Load / save queue ───

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function loadSent() {
  if (!fs.existsSync(SENT_FILE)) return {};
  return JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
}

function markSent(phone) {
  const sent = loadSent();
  sent[phone] = new Date().toISOString();
  fs.writeFileSync(SENT_FILE, JSON.stringify(sent, null, 2));
}

// ─── Add contacts to queue ───

function addToQueue(contacts, template, segment) {
  const sent = loadSent();
  const queue = loadQueue();
  const existingPhones = new Set(queue.map(q => q.phone));
  let added = 0;

  contacts.forEach(contact => {
    // Skip already sent or already in queue
    if (sent[contact.phone] || existingPhones.has(contact.phone)) return;

    const message = renderTemplate(template, contact);
    queue.push({
      phone: contact.phone,
      name: contact.name,
      message,
      segment,
      addedAt: new Date().toISOString(),
      status: 'pending'
    });
    added++;
  });

  saveQueue(queue);
  console.log(`✅ Added ${added} contacts to broadcast queue`);
  return added;
}

// ─── Process queue (called by bot.js on ready) ───

function processBroadcastQueue(client) {
  const intervalMs = config.broadcast.checkIntervalSeconds * 1000;

  setInterval(async () => {
    const queue = loadQueue();
    const pending = queue.filter(q => q.status === 'pending');

    if (pending.length === 0) return;

    // Check daily limit
    const sent = loadSent();
    const today = new Date().toISOString().split('T')[0];
    const todayCount = Object.values(sent).filter(ts => ts.startsWith(today)).length;

    if (todayCount >= config.broadcast.dailyLimit) {
      console.log(`📊 Daily limit reached (${config.broadcast.dailyLimit}). Resuming tomorrow.`);
      return;
    }

    // Pick next contact
    const next = pending[0];
    const chatId = `${next.phone}@c.us`;

    try {
      // Simulate typing
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

      await client.sendMessage(chatId, next.message);

      // Mark as sent
      next.status = 'sent';
      next.sentAt = new Date().toISOString();
      markSent(next.phone);

      // Update queue
      const idx = queue.findIndex(q => q.phone === next.phone);
      if (idx !== -1) queue[idx] = next;
      saveQueue(queue);

      console.log(`📤 Sent to ${next.name} (${next.phone}) — ${todayCount + 1}/${config.broadcast.dailyLimit} today`);

      // Log to contacts store
      const { logMessage } = require('./contacts');
      logMessage({ phone: next.phone, direction: 'out', body: next.message, timestamp: new Date().toISOString() });

    } catch (err) {
      console.error(`❌ Failed to send to ${next.phone}:`, err.message);
      next.status = 'failed';
      next.error = err.message;
      const idx = queue.findIndex(q => q.phone === next.phone);
      if (idx !== -1) queue[idx] = next;
      saveQueue(queue);
    }

  }, intervalMs);
}

// ─── Template renderer ───

function renderTemplate(template, contact) {
  let msg = template;
  msg = msg.replace(/{name}/g, contact.name || 'there');
  msg = msg.replace(/{phone}/g, contact.phone || '');
  msg = msg.replace(/{sub_community}/g, contact.sub_community || 'Tilal Al Ghaf');
  msg = msg.replace(/{community}/g, contact.community || 'Tilal Al Ghaf');
  return msg.trim();
}

// ─── CLI: load CSV and queue broadcast ───

if (require.main === module) {
  const args = process.argv.slice(2);
  const segment = args.find(a => a.startsWith('--segment='))?.split('=')[1] || 'A';
  const limit    = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '200');
  const csvFile  = args.find(a => a.startsWith('--csv='))?.split('=')[1];
  const template = args.find(a => a.startsWith('--template='))?.split('=')[1] || segment;

  if (!csvFile) {
    console.log(`
Usage: node broadcast.js --csv=data/tag_leads.csv --segment=A --limit=200

Segment templates are defined in config.js under broadcast.templates.

Options:
  --csv=<file>       Path to CSV file (columns: name,phone,sub_community)
  --segment=<A|B|C>  Which message template to use
  --limit=<n>        Max to queue (default: 200)
    `);
    process.exit(0);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  // Parse CSV
  const rows = fs.readFileSync(csvFile, 'utf8').split('\n');
  const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const contacts = rows.slice(1)
    .filter(r => r.trim())
    .map(row => {
      const vals = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    })
    .filter(c => c.phone)
    .slice(0, limit);

  const messageTemplate = config.broadcast.templates[template] || config.broadcast.templates['A'];

  // Ensure data dir
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }

  const added = addToQueue(contacts, messageTemplate, segment);
  console.log(`\n✅ ${added} contacts queued for broadcast (segment ${segment})`);
  console.log(`📊 Daily limit: ${config.broadcast.dailyLimit}/day`);
  console.log(`⏱  Delay between sends: ${config.broadcast.minDelaySeconds}–${config.broadcast.maxDelaySeconds} seconds`);
  console.log(`\nNow run: node bot.js — the bot will process the queue automatically.\n`);
}

// ─── Queue status ───

function getBroadcastStats() {
  const queue = loadQueue();
  return {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    sent: queue.filter(q => q.status === 'sent').length,
    failed: queue.filter(q => q.status === 'failed').length
  };
}

module.exports = { addToQueue, processBroadcastQueue, getBroadcastStats, loadQueue };
