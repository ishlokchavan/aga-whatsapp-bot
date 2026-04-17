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

const PORT = process.env.PORT || 3001;

// ─── QR code state (set by bot.js when WhatsApp needs re-auth) ───
let _latestQR = null;
let _qrGeneratedAt = null;

function setQR(qrString) {
  _latestQR = qrString;
  _qrGeneratedAt = new Date();
}

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

    if (url === '/qr') {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      if (!_latestQR) {
        res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>WhatsApp Bot — QR Code</h2>
          <p>✅ Already authenticated, or waiting for QR to generate...</p>
          <p style="color:#888">If bot just started, refresh in 10 seconds.</p>
          <script>setTimeout(()=>location.reload(),5000)</script>
        </body></html>`);
        return;
      }
      const QRCode = require('qrcode');
      const dataUrl = await QRCode.toDataURL(_latestQR, { width: 300, margin: 2 });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2>📱 Scan with WhatsApp</h2>
        <p>WhatsApp → Linked Devices → Link a Device</p>
        <img src="${dataUrl}" style="border:2px solid #eee;padding:10px;border-radius:8px" />
        <p style="color:#999;font-size:13px">Generated: ${_qrGeneratedAt.toISOString()}</p>
        <p style="color:#999;font-size:13px">This page auto-refreshes every 30s</p>
        <script>setTimeout(()=>location.reload(),30000)</script>
      </body></html>`);
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

module.exports = { server, PORT, setQR };
