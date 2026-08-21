CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vms (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  user_id INT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_notifications (
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

INSERT INTO users (id, name, email) VALUES (1, 'Lab User', 'lab@example.com')
ON CONFLICT (id) DO NOTHING;
