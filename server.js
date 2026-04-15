/**
 * Mini HTTP server — serves data to dashboard.html
 * Runs on http://localhost:3001
 * Now uses Supabase backend for all data
 *
 * Usage: started automatically by bot.js, or run standalone: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { getAllContacts, getStats, getMessages, getNotifications } = require('./contacts');
const { getBroadcastStats, loadQueue } = require('./broadcast');

const PORT = 3001;

async function handleRequest(req, res) {
  // CORS for dashboard.html opened as a local file
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];

  try {
    if (url === '/stats') {
      const stats = await getStats();
      const broadcast = getBroadcastStats();
      res.writeHead(200);
      res.end(JSON.stringify({ stats, broadcast, timestamp: new Date().toISOString() }));
      return;
    }

    if (url === '/contacts') {
      const allContacts = await getAllContacts();
      const contacts = allContacts.map(c => ({
        phone: c.phone,
        name: c.name,
        state: c.state,
        intent: c.data?.intent || '-',
        subCommunity: c.data?.subCommunity || '-',
        unitType: c.data?.unitType || '-',
        beds: c.data?.beds || '-',
        budget: c.data?.budget || '-',
        priority: c.data?.priority || '-',
        callRequested: c.callRequested || false,
        optOut: c.optOut || false,
        updatedAt: c.updatedAt
      }));
      // Sort: hot leads first, then by updatedAt
      contacts.sort((a, b) => {
        if (a.callRequested && !b.callRequested) return -1;
        if (!a.callRequested && b.callRequested) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      res.writeHead(200);
      res.end(JSON.stringify(contacts));
      return;
    }

    if (url === '/notifications') {
      const notifications = await getNotifications(50);
      res.writeHead(200);
      res.end(JSON.stringify(notifications));
      return;
    }

    if (url === '/messages') {
      const params = new URLSearchParams(req.url.split('?')[1] || '');
      const phone = params.get('phone');
      const messages = await getMessages(phone);
      res.writeHead(200);
      res.end(JSON.stringify(messages.slice(-50)));
      return;
    }

    if (url === '/queue') {
      const queue = loadQueue();
      res.writeHead(200);
      res.end(JSON.stringify({
        total: queue.length,
        pending: queue.filter(q => q.status === 'pending').length,
        sent: queue.filter(q => q.status === 'sent').length,
        failed: queue.filter(q => q.status === 'failed').length,
        next10: queue.filter(q => q.status === 'pending').slice(0, 10).map(q => ({ name: q.name, phone: q.phone, segment: q.segment }))
      }));
      return;
    }

    if (url === '/' || url === '/dashboard') {
      const dashboardPath = path.join(__dirname, 'dashboard-remote.html');
      if (fs.existsSync(dashboardPath)) {
        const html = fs.readFileSync(dashboardPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Dashboard not found' }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('❌ Request error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`📊 Dashboard API running at http://localhost:${PORT}`);
  });
}

module.exports = { server, PORT };
