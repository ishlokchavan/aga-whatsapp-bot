# ✅ Setup Checklist — Live Supabase Dashboard

Complete these steps to get your WhatsApp bot data live on the cloud.

## Phase 1: Preparation (1 min)

- [ ] Open Supabase: https://app.supabase.com/projects
- [ ] Find your project: `vqhhnlunkyckrcgekwfu`
- [ ] Open project and go to Settings → API
- [ ] Copy the **"anon public"** API key (starts with `eyJ...`)

## Phase 2: Configuration (1 min)

- [ ] In your terminal, navigate to the bot folder
- [ ] Run: `cp .env.example .env`
- [ ] Open `.env` in your editor
- [ ] Paste your API key here: `SUPABASE_ANON_KEY=your-key`
- [ ] Save `.env` file
- [ ] (Optional) Add `CHROME_PATH` if on Linux

## Phase 3: Database Setup (1 min)

- [ ] Go back to Supabase → SQL Editor
- [ ] Click "New Query"
- [ ] Open the file `supabase-schema.sql` from your bot folder
- [ ] Copy the entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" button
- [ ] Wait for ✅ "Query successful"
- [ ] In Supabase, go to **Table Editor** and verify you see 4 tables:
  - [ ] `contacts`
  - [ ] `notifications`
  - [ ] `messages`
  - [ ] `broadcast_queue`

## Phase 4: Start Bot (30 seconds)

- [ ] In terminal: `node bot.js`
- [ ] You should see:
  - [ ] `🤖 AGA TAG Bot running on your WhatsApp`
  - [ ] `📊 Dashboard API: http://localhost:3001`
- [ ] Keep this terminal open (bot keeps running)

## Phase 5: Test Local Access (1 min)

- [ ] Open browser: http://localhost:3001
- [ ] You should see the dashboard with graphs
- [ ] Send a test WhatsApp message to the bot
- [ ] Refresh the dashboard page
- [ ] Verify the contact appears on the dashboard

## Phase 6: Remote Access Setup (2 min, OPTIONAL)

If you want to access from other devices/computers:

### Option A: ngrok (Easiest, Temporary)
```bash
# Install ngrok (one time)
brew install ngrok  # Mac
# Or download from https://ngrok.com

# In a new terminal, run:
ngrok http 3001

# You'll see:
# Forwarding    https://abc123d.ngrok.io -> http://localhost:3001

# That HTTPS URL is your public link!
```

- [ ] Install ngrok (if not already done)
- [ ] Run: `ngrok http 3001`
- [ ] Copy the `https://` URL
- [ ] Test opening it in a browser
- [ ] Share with your team!

### Option B: Static IP (Permanent)
- [ ] Get your public IP: `curl ipinfo.io`
- [ ] Give team members: `http://your-ip:3001`
- [ ] Make sure firewall allows port 3001

## Phase 7: Verification (2 min)

Send test messages and verify:

- [ ] Open dashboard at http://localhost:3001 (or ngrok URL)
- [ ] Send WhatsApp message to the bot
- [ ] Check dashboard updates within 1-2 seconds
- [ ] Click on "Auto Refresh (30s)" button
- [ ] Charts show at least 1 contact
- [ ] Check "Recent Notifications" section
- [ ] Verify it shows your test message event

## Phase 8: Production Checks

- [ ] `.env` file exists and has correct SUPABASE_ANON_KEY
- [ ] Database tables are created in Supabase
- [ ] Bot is running: `node bot.js`
- [ ] Dashboard loads at http://localhost:3001
- [ ] Can send and receive WhatsApp messages
- [ ] Dashboard updates automatically every 30 seconds
- [ ] All 4 tables appear in Supabase Table Editor

## Phase 9: Team Sharing (OPTIONAL)

- [ ] Run ngrok: `ngrok http 3001`
- [ ] Get the public HTTPS URL
- [ ] Send to team members
- [ ] Have them open the link in browser
- [ ] Multiple people can view simultaneously!

## All Done! 🎉

Your WhatsApp bot is now **live with a cloud database**!

### Next Steps

1. ✅ **Monitor**: Watch the dashboard for real-time updates
2. ✅ **Test**: Send messages and verify data syncs
3. ✅ **Share**: Invite team to view via ngrok
4. ✅ **Learn**: Read SUPABASE_SETUP.md for more features
5. ✅ **Backup**: Supabase automatically backs up your data

---

## Troubleshooting Checklist

### Bot won't start
- [ ] Is `.env` file in the bot folder?
- [ ] Does `.env` have SUPABASE_ANON_KEY=your-key?
- [ ] Is the key correct (copied from Supabase)?
- [ ] Try: `cat .env` to verify contents
- [ ] Try: `rm .env && cp .env.example .env` and re-add key

### Dashboard blank or shows error
- [ ] Is `node bot.js` still running? (check terminal)
- [ ] Is database schema created? (check Supabase Table Editor)
- [ ] Try: Open http://localhost:3001/stats to see raw data
- [ ] Try: Refresh browser page
- [ ] Check browser console for errors (F12)

### Can't access from other device
- [ ] Try ngrok: `ngrok http 3001` (easier than static IP)
- [ ] Verify the HTTPS URL from ngrok is correct
- [ ] Make sure bot is still running on your computer
- [ ] Try opening URL from your phone browser

### No data showing on dashboard
- [ ] Send a WhatsApp test message to the bot
- [ ] Refresh dashboard page
- [ ] Wait 1-2 seconds for data to appear
- [ ] Check Supabase Table Editor → contacts table for records

### Tables don't exist in Supabase
- [ ] Go to SQL Editor and run schema again
- [ ] Make sure you clicked "Run" button
- [ ] Check for ✅ "Query successful" message
- [ ] Refresh page and go to Table Editor to verify

---

## When You're Done

Save this checklist for next time!

**Quick Start**: Next time, just:
1. Make sure `.env` exists with your key
2. Run: `node bot.js`
3. Open: `http://localhost:3001`
4. Start monitoring!

---

## Important Files

Keep these safe:
- `.env` — Your Supabase API key (keep secret!)
- `supabase-schema.sql` — Your database schema

Reference these:
- `QUICKSTART.md` — 5 minute setup summary
- `SUPABASE_SETUP.md` — Detailed setup guide
- `README.md` — Main documentation

---

**Status**: Ready to complete! ✅

**Questions?** Check the docs files or contact Supabase support.

**Enjoy your live cloud dashboard!** 🚀
