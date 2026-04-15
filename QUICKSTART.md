# 🚀 Quick Start — 5 Minutes to Live Cloud Dashboard

Get your WhatsApp bot data live on Supabase in 5 minutes.

## Pre-flight Checklist

- [ ] You have Node.js installed (`node --version`)
- [ ] You have the bot running locally before (`npm install` done)
- [ ] You have a Supabase account (free tier at https://supabase.com)

---

## 1️⃣ Get Supabase API Key (2 min)

1. Go to: https://app.supabase.com/projects
2. Click on project: `vqhhnlunkyckrcgekwfu`
3. Left sidebar → **Settings** → **API**
4. Copy the **"anon public"** key (long string starting with `eyJ...`)
5. Paste it somewhere safe temporarily

---

## 2️⃣ Create `.env` File (1 min)

```bash
# In your aga-whatsapp-bot directory:
cp .env.example .env
```

Edit `.env` and replace:
```
SUPABASE_ANON_KEY=your-copied-key-here
```

Save and close.

---

## 3️⃣ Create Database Tables (1 min)

1. Go to: https://app.supabase.com/project/vqhhnlunkyckrcgekwfu
2. Left sidebar → **SQL Editor**
3. Click **New Query**
4. Open `supabase-schema.sql` file (in your bot folder)
5. Copy **entire** contents
6. Paste into Supabase SQL Editor
7. Click **Run** (top right)
8. Wait for ✅ "Query successful"

---

## 4️⃣ Start the Bot (30 sec)

```bash
node bot.js
```

You should see:
```
✅ Authenticated — session saved.
🤖 AGA TAG Bot running on your WhatsApp
📊 Dashboard: http://localhost:3001
```

---

## 5️⃣ Open Dashboard (30 sec)

**Local machine:**
```
http://localhost:3001
```

**From another device (requires ngrok):**
```bash
# Install ngrok if you don't have it
brew install ngrok  # Mac
# or download from https://ngrok.com

# In a new terminal, run:
ngrok http 3001

# Copy the "Forwarding" URL (e.g., https://abc123.ngrok.io)
# Open that in any browser, any device, anywhere!
```

---

## ✅ Done!

Your dashboard is now **live and accessible from anywhere in the world**.

## Next Steps

- 📱 Send a test message to the bot
- 👀 Watch it appear on the dashboard in real-time
- 📊 Check the charts and statistics
- 🌍 Share ngrok URL with your team

---

## Troubleshooting

### Bot won't start
```bash
# Make sure .env file exists and has your key
cat .env

# If missing, run:
cp .env.example .env
# Then edit with your Supabase key
```

### Can't see data on dashboard
1. Make sure `node bot.js` is running
2. Check `.env` has correct SUPABASE_ANON_KEY
3. Send a test message to the bot WhatsApp
4. Refresh dashboard browser page

### ngrok URL changes when I restart
That's normal! Each time you run `ngrok http 3001`, you get a new temporary URL.
Buy a static domain: `ngrok config add-authtoken <your-auth-token>`

---

## For More Details

- Full setup guide: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- What changed: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- Main README: [README.md](README.md)

---

**Questions?** Check the troubleshooting section or see full docs above. Enjoy your live dashboard! 🎉
