-- Idempotent schema — безопасно запускать многократно

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT DEFAULT '',
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'negotiation', 'development', 'completed', 'support')),
  source TEXT DEFAULT '',
  budget NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  next_action TEXT DEFAULT '',
  next_action_date TEXT DEFAULT '',
  assigned_to UUID REFERENCES auth.users(id),
  quiz_results JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица заметок
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'quiz' CHECK (type IN ('quiz', 'client', 'task')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политики (удаляем перед созданием, чтобы не было "already exists")
DROP POLICY IF EXISTS "Только авторизованные могут видеть клиентов" ON clients;
CREATE POLICY "Только авторизованные могут видеть клиентов"
  ON clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Сервер может добавлять клиентов" ON clients;
CREATE POLICY "Сервер может добавлять клиентов"
  ON clients FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Только авторизованные могут обновлять клиентов" ON clients;
CREATE POLICY "Только авторизованные могут обновлять клиентов"
  ON clients FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Только авторизованные могут удалять клиентов" ON clients;
CREATE POLICY "Только авторизованные могут удалять клиентов"
  ON clients FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Только авторизованные могут видеть заметки" ON notes;
CREATE POLICY "Только авторизованные могут видеть заметки"
  ON notes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Только авторизованные могут добавлять заметки" ON notes;
CREATE POLICY "Только авторизованные могут добавлять заметки"
  ON notes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Только авторизованные могут удалять заметки" ON notes;
CREATE POLICY "Только авторизованные могут удалять заметки"
  ON notes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Только авторизованные могут видеть уведомления" ON notifications;
CREATE POLICY "Только авторизованные могут видеть уведомления"
  ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Сервер может добавлять уведомления" ON notifications;
CREATE POLICY "Сервер может добавлять уведомления"
  ON notifications FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Только авторизованные могут обновлять уведомления" ON notifications;
CREATE POLICY "Только авторизованные могут обновлять уведомления"
  ON notifications FOR UPDATE TO authenticated USING (true);
