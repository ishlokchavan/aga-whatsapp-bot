-- AGA WhatsApp Bot Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/vqhhnlunkyckrcgekwfu/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  state VARCHAR(50) DEFAULT 'NEW',
  data JSONB DEFAULT '{}',
  history JSONB DEFAULT '[]',
  call_requested BOOLEAN DEFAULT FALSE,
  opt_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event VARCHAR(500),
  contact_phone VARCHAR(50),
  contact_name VARCHAR(255),
  contact_state VARCHAR(50),
  contact_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50),
  direction VARCHAR(10), -- 'in' or 'out'
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast queue table
CREATE TABLE IF NOT EXISTS broadcast_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50),
  name VARCHAR(255),
  segment VARCHAR(100),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  attempts INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts(phone);
CREATE INDEX IF NOT EXISTS contacts_state_idx ON contacts(state);
CREATE INDEX IF NOT EXISTS notifications_phone_idx ON notifications(contact_phone);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_phone_idx ON messages(phone);
CREATE INDEX IF NOT EXISTS queue_status_idx ON broadcast_queue(status);

-- Enable Row Level Security (optional - for public access)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON broadcast_queue FOR ALL USING (true) WITH CHECK (true);
