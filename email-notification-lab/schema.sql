DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS vms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vms (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  user_id INT NOT NULL
);

CREATE TABLE email_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_email_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  resend_email_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
