# AGA Real Estate — TAG WhatsApp Bot

Personal WhatsApp chatbot for Tilal Al Ghaf owner outreach.
Runs on **your own phone number** via WhatsApp Web.

---

## What this does

- Sends personalised bulk messages to TAG owners from your CSV
- Auto-handles all replies through a qualification flow (valuation / sell / rent / buy)
- Notifies you in the terminal when a hot lead or call request comes in
- Shows a live dashboard at `dashboard.html`
- Stores all contact data locally in `data/`

---

## Setup (one time)

### 1. Install Node.js
Download from https://nodejs.org (version 18 or higher)

### 2. Install dependencies

```bash
cd aga-whatsapp-bot
npm install
```

### 3. Install Chrome (required for WhatsApp Web automation)

**Mac:**
```bash
brew install --cask google-chrome
```

**Windows:** Download from https://www.google.com/chrome

**Ubuntu/Linux:**
```bash
sudo apt-get install google-chrome-stable
```

On Linux, set your Chrome path in `config.js`:
```js
chromePath: '/usr/bin/google-chrome'
```

---

## Running the bot

### Step 1: Start the bot
```bash
node bot.js
```

A QR code will appear in your terminal.

### Step 2: Scan with WhatsApp
Open WhatsApp on your phone → **Linked Devices** → **Link a Device** → scan the QR code.

The bot is now live on your personal number. Session is saved — you won't need to scan again unless you log out.

### Step 3: Open the dashboard
Open `dashboard.html` in Chrome. It shows live stats, notifications, and contact details.

---

## Sending a broadcast

### Prepare your CSV
Your CSV needs these columns (from your TAG dataset):
```
name,phone,sub_community
Rahul Mehta,971501234567,Serenity Lakes
James Cooper,971509876543,Alaya South
```

Phone format: international, no +, no spaces (UAE: 971XXXXXXXXX)

### Queue the broadcast
```bash
# Segment A: potential sellers (200/day default)
node broadcast.js --csv=data/tag_leads.csv --segment=A --limit=200

# Segment B: potential landlords
node broadcast.js --csv=data/tag_landlords.csv --segment=B --limit=200
```

The bot processes the queue automatically while running. It sends with 18–45 second random delays.

---

## Conversation flow

When a contact replies to your outbound message, the bot takes over:

```
Contact replies → Welcome + menu (1–5)
  1 → Valuation flow (sub-community → unit type → beds → handoff)
  2 → Sell flow (timeline → hot or warm handoff)
  3 → Rent flow (availability → sub-community → handoff)
  4 → Buy flow (type → budget → handoff)
  5 → Open question (you reply manually)
```

**Global keywords** (work at any point):
- `CALL` → Books a call, notifies you immediately
- `STOP` → Opts them out, removes from future broadcasts

---

## When to take over manually

The bot notifies you (in terminal + dashboard) when:
- 🏠 Valuation requested
- 🔥 Hot seller (within 6 months)
- 📋 Warm seller (exploring)
- 🏡 Rental enquiry
- 💰 Buyer lead
- 📞 Call requested
- ❓ Open question

At that point, reply to them directly on WhatsApp. The bot steps aside once you reply from your phone.

---

## File structure

```
aga-whatsapp-bot/
├── bot.js                  ← Main bot (start this)
├── flow.js                 ← All conversation states and messages
├── broadcast.js            ← Bulk send engine
├── contacts.js             ← Contact store (Supabase backend)
├── supabase.js             ← Supabase client config
├── server.js               ← Dashboard API (http://localhost:3001)
├── config.js               ← Settings and message templates
├── dashboard-remote.html   ← Remote dashboard (accessible anywhere)
├── SUPABASE_SETUP.md       ← Supabase integration guide
├── supabase-schema.sql     ← Database schema (run in Supabase)
├── .env.example            ← Environment variables template
├── data/                   ← Local fallback (broadcast queue only)
│   └── broadcast_queue.json
└── .wwebjs_auth/           ← WhatsApp session (auto-created)
```

**Data Storage:**
- **Supabase** (cloud): contacts, notifications, messages
- **Local** (data/): broadcast queue (for queue persistence)

---

## Editing messages

All messages are in `flow.js`. Each state has a `message:` field.
Variables: `{name}`, `{subCommunity}`, `{unitType}`, `{beds}`, `{budget}`

Broadcast templates are in `config.js` under `broadcast.templates`.

---

## Daily limits

Default: **200 sends/day** with 18–45 second delays between each.

To change: edit `config.js`:
```js
broadcast: {
  dailyLimit: 200,
  minDelaySeconds: 18,
  maxDelaySeconds: 45,
}
```

Do not go above 300/day or below 15 seconds delay.

---

## Live Cloud Database with Supabase ✨ NEW

All data now syncs to **Supabase** for remote access from anywhere.

### Quick Setup
1. Get your Supabase API key from https://app.supabase.com
2. Create `.env` with your key (see `.env.example`)
3. Run the SQL schema in Supabase SQL Editor
4. Start the bot: `node bot.js`

**Access from anywhere:**
- Local: http://localhost:3001
- Remote (ngrok): `ngrok http 3001`

**See full setup guide:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

Benefits:
- ☁️ All data in cloud, not local files
- 🌍 Access dashboard from any device, anywhere
- 👥 Share with team members
- 📊 Real-time analytics and charts
- 🔄 Automatic backups

---

## Troubleshooting

**QR code expired:** It refreshes every 20 seconds. Scan quickly or run `node bot.js` again.

**Session lost:** Delete `.wwebjs_auth/` folder and restart to re-scan.

**Messages not sending:** Make sure WhatsApp Web is connected (check web.whatsapp.com in a browser).

**Chrome not found:** Set the path in `config.js`:
```js
chromePath: '/usr/bin/google-chrome'  // Linux
chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'  // Mac
```
