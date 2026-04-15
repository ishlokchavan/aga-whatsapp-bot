# Quick Reference Card

## One-Liner Setup
```bash
# 1. Set env vars
export SUPABASE_ANON_KEY="your-key"

# 2. Run SQL schema in Supabase (copy supabase-schema.sql)

# 3. Start bot
node bot.js

# 4. Open dashboard
open http://localhost:3001

# 5. (Optional) Remote access
ngrok http 3001
```

---

## Environment Variables
```
SUPABASE_URL=https://vqhhnlunkyckrcgekwfu.supabase.co
SUPABASE_ANON_KEY=eyJ... (your key from Supabase)
CHROME_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome (optional)
```

---

## Folder Structure
```
aga-whatsapp-bot/
├── bot.js                ← START THIS
├── contacts.js           (Supabase backend)
├── server.js             (API)
├── dashboard-remote.html (open in browser)
├── supabase.js           (config)
├── supabase-schema.sql   (run in Supabase)
└── .env                  (your secrets)
```

---

## Database Tables

### contacts
```
phone (unique) | name | state | data (json) | call_requested | opt_out
```

### notifications
```
event | contact_phone | contact_name | contact_state | contact_data | timestamp
```

### messages
```
phone | direction (in/out) | body | timestamp
```

### broadcast_queue
```
phone | name | segment | message | status (pending/sent/failed) | timestamp
```

---

## API Endpoints

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /` | Dashboard | HTML |
| `GET /stats` | Overview | {total, byState, byIntent, hotLeads, etc.} |
| `GET /contacts` | All contacts | [{phone, name, state, data, ...}] |
| `GET /notifications` | Event log | [{event, contact, timestamp}] |
| `GET /messages?phone=X` | Contact thread | [{phone, direction, body, timestamp}] |
| `GET /queue` | Broadcast status | {total, pending, sent, failed, next10} |

---

## JavaScript Functions

### Getting Data
```javascript
const contact = await getContact('971501234567');
const contacts = await getAllContacts();
const messages = await getMessages('971501234567');
const notifications = await getNotifications(50);
const stats = await getStats();
```

### Saving Data
```javascript
await saveContact(contactObject);
await updateContact(contactObject);
await logMessage({phone, direction, body, timestamp});
await addNotification(event, contactObject);
```

---

## Dashboard Features

### Navigation
- **Server URL**: Enter your bot server URL (local or ngrok)
- **Connect**: Fetch live data
- **Auto Refresh**: Poll every 30s
- **Export**: Download as CSV (coming soon)

### Views
1. **Overview** — Total contacts, hot leads, opt-outs
2. **State Distribution** — Pie chart by contact state
3. **Intent Analysis** — Bar chart of interests (rent/sell/buy/value)
4. **Broadcast Status** — Queue metrics
5. **Recent Notifications** — Event feed
6. **Hot Leads Table** — Contacts needing calls
7. **Pending Broadcasts** — Queue preview

---

## Remote Access (ngrok)

### Install
```bash
# Mac
brew install ngrok

# Windows/Linux
# Download from https://ngrok.com
```

### Use
```bash
# In project directory, start bot
node bot.js

# In another terminal
ngrok http 3001

# You'll see:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3001

# Open the HTTPS URL in any browser
# Share with team!
```

---

## Common Tasks

### Send a Test Message
1. WhatsApp → bot's number
2. Send: "Hello"
3. Check dashboard in 1-2 seconds

### Update Contact Data
```javascript
const contact = await getContact(phone);
contact.data.customField = 'value';
await updateContact(contact);
```

### Get Hot Leads
```javascript
const contacts = await getAllContacts();
const hotLeads = contacts.filter(c => c.callRequested);
```

### Check Message History
```javascript
const messages = await getMessages(phone);
console.log(messages.map(m => m.body).join('\n'));
```

---

## Debugging

### Check Connection
```bash
# In Node REPL
const {supabase} = require('./supabase.js');
supabase.from('contacts').select('count()');
// Should work without errors
```

### View Raw Data
```sql
-- In Supabase SQL Editor
SELECT * FROM contacts ORDER BY updated_at DESC LIMIT 10;
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
SELECT COUNT(*) FROM messages;
```

### Bot Logs
```bash
# Terminal shows:
# ✅ When contact is created
# 🔔 When notification is logged
# ❌ When there are errors
```

---

## Performance Tips

1. **Limit notifications query** to last 50 (default)
2. **Paginate contacts** if >1000 (add limit clause)
3. **Archive old messages** beyond 10,000 (auto-cleanup)
4. **Use indexes** (already created in schema)
5. **Enable query caching** in Supabase (optional)

---

## Security Best Practices

1. ✅ Keep `.env` file secret (add to `.gitignore`)
2. ✅ Use `SUPABASE_ANON_KEY` (not service role key)
3. ✅ Enable RLS policies (in Supabase Dashboard)
4. ✅ Rotate ngrok auth token if sharing publicly
5. ✅ Don't commit `.env` to git
6. ✅ Use HTTPS only (ngrok provides this)

---

## Useful Commands

```bash
# Start everything
node bot.js

# Test database connection
node -e "const {supabase} = require('./supabase.js'); supabase.from('contacts').select('count()').then(r => console.log(r))"

# Check environment
echo $SUPABASE_ANON_KEY
cat .env

# Port conflicts?
lsof -i :3001  # Kill the process if needed

# Clear terminal
clear

# Stop bot
Ctrl+C
```

---

## File Sizes

```
bot.js                 ~12 KB
contacts.js            ~9 KB
server.js              ~5 KB
dashboard-remote.html  ~18 KB
supabase.js            ~1 KB
────────────────────────────
Total app code         ~45 KB
(+ node_modules        ~180 MB)
```

---

## Support Articles

| Topic | File |
|-------|------|
| 5-min setup | QUICKSTART.md |
| Full setup | SUPABASE_SETUP.md |
| What changed | MIGRATION_GUIDE.md |
| Overview | IMPLEMENTATION_SUMMARY.md |
| Main docs | README.md |

---

## Key Dates

- **Implementation**: 2026-04-15
- **Database Schema**: v1.0
- **Dashboard**: v1.0
- **Status**: ✅ Production Ready

---

## Emergency Contacts

- Supabase Status: https://status.supabase.com
- Supabase Docs: https://supabase.com/docs
- ngrok Support: https://ngrok.com/docs

---

**Last Updated**: 2026-04-15  
**Version**: 1.0  
**Status**: Ready to use ✅
