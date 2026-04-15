# Supabase Integration Setup Guide

This bot now uses **Supabase** for live, remote data storage instead of local JSON files. Access your WhatsApp bot data from anywhere in the world.

## Quick Start (5 minutes)

### 1. Get Your Supabase API Key

1. Go to [app.supabase.com](https://app.supabase.com)
2. Open your project: `vqhhnlunkyckrcgekwfu`
3. Click **Settings** → **API**
4. Copy the **anon public** key (under "Project API keys")

### 2. Create Local Environment File

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase key:

```
SUPABASE_URL=https://vqhhnlunkyckrcgekwfu.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Initialize Database Schema

1. Go to Supabase → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor and click **Run**

This creates:
- `contacts` table
- `notifications` table
- `messages` table
- `broadcast_queue` table

### 4. Start the Bot

```bash
# Make sure .env file is set
node bot.js
```

You should see:
```
✅ Authenticated — session saved.
🤖 AGA TAG Bot running on your WhatsApp
📊 Open dashboard.html in your browser
📤 Queue sends: node broadcast.js --help
```

### 5. Access the Dashboard

**Local Access:**
- Open http://localhost:3001 in your browser

**Remote Access (from anywhere):**
- Use ngrok to expose your local server:
  ```bash
  brew install ngrok  # or download from ngrok.com
  ngrok http 3001
  ```
- Copy the public URL (e.g., `https://abc123.ngrok.io`)
- Open that URL in any browser from anywhere in the world

## Architecture Overview

```
WhatsApp Web.js (bot.js)
    ↓
contacts.js (Supabase client)
    ↓
Supabase Database (cloud)
    ↓
server.js (API endpoints)
    ↓
dashboard-remote.html (web interface)
```

## Data Flow

1. **WhatsApp messages** → bot.js receives them
2. **Contact updates** → saved to Supabase via `contacts.js`
3. **Notifications** → logged to Supabase `notifications` table
4. **API endpoints** → server.js reads from Supabase and serves JSON
5. **Dashboard** → fetches from API and displays live data

## API Endpoints

Available at http://localhost:3001:

| Endpoint | Returns |
|----------|---------|
| `GET /` | Remote dashboard HTML |
| `GET /stats` | Contact statistics and hot leads |
| `GET /contacts` | All contacts with details |
| `GET /notifications` | Last 50 notifications |
| `GET /messages?phone=...` | Messages for a contact |
| `GET /queue` | Broadcast queue status |

## Key Features

✅ **Live Updates** - All data synced to cloud in real-time  
✅ **Remote Access** - Manage from anywhere in the world  
✅ **No Local Files** - No more JSON files, everything in Supabase  
✅ **Multi-user** - Share dashboard with team members  
✅ **Analytics** - Charts and stats at a glance  

## Troubleshooting

### "Missing SUPABASE_ANON_KEY"
```bash
export SUPABASE_ANON_KEY="your-key-here"
node bot.js
```

### "Connection refused"
- Make sure bot is running: `node bot.js`
- Check port 3001 is not in use: `lsof -i :3001`

### "Tables don't exist"
- Run the SQL schema in Supabase SQL Editor
- Refresh the page after running

### "Can't access from other computer"
- Use ngrok: `ngrok http 3001`
- Share the ngrok URL with team

## Advanced: Remote Notifications

To get notifications outside the dashboard, you can:

```bash
# Poll notifications from anywhere
curl http://your-server:3001/notifications | jq

# With ngrok
curl https://abc123.ngrok.io/notifications | jq
```

## Backup & Export

All data is automatically backed up in Supabase. To export:

1. Go to Supabase → SQL Editor
2. Query and download data:
   ```sql
   SELECT * FROM contacts ORDER BY updated_at DESC;
   ```

## Next Steps

- Set up ngrok for remote access
- Share dashboard URL with team
- Configure Supabase Row Level Security for multiple users
- Set up Supabase backups

For more Supabase docs: https://supabase.com/docs
