# Migration to Supabase — Complete Guide

Your WhatsApp bot has been fully migrated from local JSON files to **Supabase cloud database**. This means you can now access and manage your data from anywhere in the world.

## What Changed

### Before (Local Files)
```
bot.js → contacts.json (local file)
       → notifications.json (local file)
       → messages.json (local file)
```

### After (Supabase Cloud)
```
bot.js → Supabase Database (cloud)
       ↓
       → server.js → dashboard-remote.html (accessible anywhere)
```

## Files Modified

| File | Change |
|------|--------|
| `contacts.js` | Now uses Supabase instead of local JSON files |
| `bot.js` | Added `await` for async database calls |
| `server.js` | Now async, serves dashboard HTML on `/` endpoint |
| `README.md` | Updated with Supabase setup section |

## Files Created

| File | Purpose |
|------|---------|
| `supabase.js` | Supabase client configuration |
| `dashboard-remote.html` | Web dashboard (accessible from anywhere) |
| `supabase-schema.sql` | Database schema to run in Supabase |
| `.env.example` | Environment variables template |
| `SUPABASE_SETUP.md` | Detailed setup instructions |
| `MIGRATION_GUIDE.md` | This file |

## Step-by-Step Setup

### 1. Prepare Your Supabase Project
```bash
# You already have a project at:
# https://app.supabase.com/project/vqhhnlunkyckrcgekwfu
```

### 2. Get API Key
1. Go to: https://app.supabase.com/projects
2. Select: `vqhhnlunkyckrcgekwfu`
3. Go to: **Settings** → **API**
4. Copy: **"anon public"** key
5. Save to `.env`:
   ```
   SUPABASE_URL=https://vqhhnlunkyckrcgekwfu.supabase.co
   SUPABASE_ANON_KEY=your-copied-key
   ```

### 3. Create Database Tables
1. In Supabase: Go to **SQL Editor** → **New Query**
2. Open `supabase-schema.sql` in your editor
3. Copy entire contents
4. Paste in Supabase SQL Editor
5. Click **Run**
6. Wait for ✅ success

### 4. Start the Bot
```bash
node bot.js
```

You'll see:
```
🤖 AGA TAG Bot running on your WhatsApp
📊 Open dashboard.html in your browser
```

### 5. Open Dashboard
**Local (on same computer):**
```
http://localhost:3001
```

**Remote (from anywhere):**
```bash
# In another terminal, run:
ngrok http 3001

# Copy the URL it gives you (e.g., https://abc123.ngrok.io)
# Share with team or open from any device
```

## What Works Now

✅ **Live Data** - All contacts, messages, notifications sync to cloud in real-time  
✅ **Remote Access** - View dashboard from phone, laptop, anywhere with internet  
✅ **Team Sharing** - Give ngrok URL to team members to monitor together  
✅ **No Local Files** - All data backed up in Supabase (no accidental deletions)  
✅ **Charts & Stats** - Beautiful analytics on the dashboard  
✅ **Search & Filter** - Find contacts by name, phone, state, intent  

## Database Schema

### `contacts` table
```sql
├── phone (text, unique) — WhatsApp number
├── name (text)
├── state (text) — NEW, RENT_HANDOFF, etc.
├── data (json) — Custom fields (intent, budget, etc.)
├── history (json) — Array of state changes
├── call_requested (boolean)
├── opt_out (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### `notifications` table
```sql
├── event (text) — "📞 CALL REQUESTED", etc.
├── contact_phone (text)
├── contact_name (text)
├── contact_state (text)
├── contact_data (json)
└── created_at (timestamp)
```

### `messages` table
```sql
├── phone (text)
├── direction (text) — "in" or "out"
├── body (text)
└── created_at (timestamp)
```

### `broadcast_queue` table
```sql
├── phone (text)
├── name (text)
├── segment (text)
├── message (text)
├── status (text) — pending, sent, failed
├── attempts (int)
├── error_message (text)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## API Endpoints (All Read-Only)

Available at `http://localhost:3001` or via ngrok URL:

```
GET /              → Remote dashboard HTML
GET /stats         → { total, byState, byIntent, hotLeads, callRequests, optOuts }
GET /contacts      → Array of all contacts with details
GET /notifications → Array of last 50 notifications
GET /messages?phone=XXX  → Messages for a contact
GET /queue         → Broadcast queue status
```

## Differences in Code

### Before (Synchronous)
```javascript
const contact = getContact(phone);
contact.state = 'CALL_REQUESTED';
updateContact(contact);
```

### After (Asynchronous)
```javascript
const contact = await getContact(phone);
contact.state = 'CALL_REQUESTED';
await updateContact(contact);
```

All functions in `contacts.js` are now `async` and must be awaited.

## Backward Compatibility

The API and behavior are identical — only the storage backend changed:
- Same function names: `getContact()`, `saveContact()`, etc.
- Same data structure (just from database now)
- Same dashboards work
- Same conversation flow in bot

## Troubleshooting

### "Missing SUPABASE_ANON_KEY"
```bash
# Option 1: Set environment variable
export SUPABASE_ANON_KEY="your-key"

# Option 2: Create .env file
echo "SUPABASE_ANON_KEY=your-key" > .env
```

### "Connection refused" (can't reach Supabase)
- Check internet connection
- Verify SUPABASE_ANON_KEY is correct
- Verify SUPABASE_URL is correct

### "Table doesn't exist"
- Make sure you ran `supabase-schema.sql`
- Check in Supabase → Table Editor to confirm tables exist
- Refresh browser after creating tables

### "Can't access from other computer"
- Use ngrok: `ngrok http 3001`
- Or give static IP of your computer + port 3001
- Share the URL with team

## Next Steps

1. ✅ Set up `.env` with Supabase key
2. ✅ Run SQL schema in Supabase
3. ✅ Start bot: `node bot.js`
4. ✅ Open dashboard: `http://localhost:3001`
5. Send test message to bot
6. Check dashboard for live updates
7. (Optional) Set up ngrok for remote access

## Rollback (If Needed)

If you want to go back to local JSON files:
1. Restore old `contacts.js` from git history
2. Restore `bot.js` (remove `await` keywords)
3. All data will still be in Supabase (not deleted)

But we recommend staying with Supabase — it's more reliable!

## Questions?

See full setup: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)  
Supabase docs: https://supabase.com/docs
