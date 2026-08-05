-- =============================================
-- QUVEX SCHEMA — multi-tenant CRM for auto detailing studios
-- Idempotent. Safe to run repeatedly.
--
-- Roles are stored in auth.users.app_metadata.role:
--   'admin'  — Quvex company staff (sees /dashboard, ALL tenants)
--   'studio' — studio CRM users (see ONLY their own studio's data)
-- =============================================

-- ------------------------------------------------------------
-- CLEANUP of the obsolete single-tenant prototype tables
-- (superseded by the multi-tenant design below)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.appointment_services CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.masters CASCADE;
DROP TABLE IF EXISTS public.workstations CASCADE;
DROP TABLE IF EXISTS public.studio_settings CASCADE;

-- =============================================
-- QUVEX ADMIN TABLES (Quvex company only)
-- =============================================

-- Лиды с сайта (квиз, заявки)
CREATE TABLE IF NOT EXISTS public.clients (
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

-- Заметки по лидам (Quvex admin)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Уведомления (Quvex admin)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'quiz' CHECK (type IN ('quiz', 'client', 'task')),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false
);

-- =============================================
-- MULTI-TENANT TABLES (Studio CRM)
-- =============================================

-- Студии (арендаторы / подписчики)
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Привязка пользователей к студиям
CREATE TABLE IF NOT EXISTS public.user_studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, studio_id)
);

-- Клиенты студий (база клиентов арендатора)
CREATE TABLE IF NOT EXISTS public.studio_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  car_year INTEGER,
  car_color TEXT DEFAULT '',
  car_vin TEXT DEFAULT '',
  license_plate TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'regular', 'vip', 'inactive')),
  notes TEXT DEFAULT '',
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_visit DATE,
  next_visit DATE,
  assigned_to UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Услуги студий
CREATE TABLE IF NOT EXISTS public.studio_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  category TEXT DEFAULT 'other' CHECK (category IN ('detailing', 'wash', 'protection', 'interior', 'exterior', 'other')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Записи (визиты клиентов)
CREATE TABLE IF NOT EXISTS public.studio_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.studio_clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.studio_services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  final_price NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  technician_name TEXT DEFAULT '',
  assigned_to UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Финансы студии (приход / расход / возврат)
CREATE TABLE IF NOT EXISTS public.studio_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.studio_appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.studio_clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'refund')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  category TEXT DEFAULT 'service' CHECK (category IN ('service', 'product', 'subscription', 'other')),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- COMMUNICATION TABLES
-- =============================================

-- Сообщения студий к Quvex (поддержка)
CREATE TABLE IF NOT EXISTS public.studio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'support' CHECK (type IN ('support', 'bug', 'feature', 'billing', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_by_admin BOOLEAN DEFAULT false,
  read_by_studio BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ответы на сообщения
CREATE TABLE IF NOT EXISTS public.message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.studio_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_admin BOOLEAN DEFAULT false
);

-- =============================================
-- PAYMENT TRACKING (Quvex billing)
-- =============================================

-- Платежи за подписку студий
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  period_start DATE,
  period_end DATE,
  payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  notes TEXT DEFAULT '',
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON public.notes(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_studios_slug ON public.studios(slug);
CREATE INDEX IF NOT EXISTS idx_user_studios_user_id ON public.user_studios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_studios_studio_id ON public.user_studios(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_clients_studio_id ON public.studio_clients(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_clients_status ON public.studio_clients(status);
CREATE INDEX IF NOT EXISTS idx_studio_services_studio_id ON public.studio_services(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_appointments_studio_id ON public.studio_appointments(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_appointments_client_id ON public.studio_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_studio_appointments_scheduled_at ON public.studio_appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_studio_transactions_studio_id ON public.studio_transactions(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_messages_studio_id ON public.studio_messages(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_messages_status ON public.studio_messages(status);
CREATE INDEX IF NOT EXISTS idx_payments_studio_id ON public.payments(studio_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES
--
-- Rules:
--   * "Admin"  = auth.users.app_metadata.role = 'admin'  (Quvex company)
--   * "Member" = user has a row in user_studios for the studio_id
--   * Quvex admin data (clients/notes/notifications) is ADMIN-ONLY
--   * Studio data is scoped strictly to the studio's members
-- =============================================

-- ---------- QUVEX ADMIN TABLES (admin only) ----------

DROP POLICY IF EXISTS "Quvex admin can read clients" ON public.clients;
CREATE POLICY "Quvex admin can read clients"
  ON public.clients FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Service can insert clients" ON public.clients;
CREATE POLICY "Service can insert clients"
  ON public.clients FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Quvex admin can update clients" ON public.clients;
CREATE POLICY "Quvex admin can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Quvex admin can delete clients" ON public.clients;
CREATE POLICY "Quvex admin can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Quvex admin can read notes" ON public.notes;
CREATE POLICY "Quvex admin can read notes"
  ON public.notes FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Quvex admin can write notes" ON public.notes;
CREATE POLICY "Quvex admin can write notes"
  ON public.notes FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Quvex admin can read notifications" ON public.notifications;
CREATE POLICY "Quvex admin can read notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Quvex admin can update notifications" ON public.notifications;
CREATE POLICY "Quvex admin can update notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------- STUDIOS ----------

DROP POLICY IF EXISTS "Admin or member can read studios" ON public.studios;
CREATE POLICY "Admin or member can read studios"
  ON public.studios FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service can create studios" ON public.studios;
CREATE POLICY "Service can create studios"
  ON public.studios FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Admin or owner can update studios" ON public.studios;
CREATE POLICY "Admin or owner can update studios"
  ON public.studios FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR id IN (
      SELECT studio_id FROM public.user_studios
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete studios" ON public.studios;
CREATE POLICY "Admin can delete studios"
  ON public.studios FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------- USER STUDIOS ----------

DROP POLICY IF EXISTS "Users can read own studio assignments" ON public.user_studios;
CREATE POLICY "Users can read own studio assignments"
  ON public.user_studios FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Service can create user studios" ON public.user_studios;
CREATE POLICY "Service can create user studios"
  ON public.user_studios FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage user studios" ON public.user_studios;
CREATE POLICY "Admin can manage user studios"
  ON public.user_studios FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------- STUDIO CLIENTS (tenant isolation) ----------

DROP POLICY IF EXISTS "Admin or member can read studio clients" ON public.studio_clients;
CREATE POLICY "Admin or member can read studio clients"
  ON public.studio_clients FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can manage studio clients" ON public.studio_clients;
CREATE POLICY "Members can manage studio clients"
  ON public.studio_clients FOR ALL TO authenticated
  USING (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()));

-- ---------- STUDIO SERVICES ----------

DROP POLICY IF EXISTS "Admin or member can read studio services" ON public.studio_services;
CREATE POLICY "Admin or member can read studio services"
  ON public.studio_services FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can manage studio services" ON public.studio_services;
CREATE POLICY "Members can manage studio services"
  ON public.studio_services FOR ALL TO authenticated
  USING (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()));

-- ---------- STUDIO APPOINTMENTS ----------

DROP POLICY IF EXISTS "Admin or member can read studio appointments" ON public.studio_appointments;
CREATE POLICY "Admin or member can read studio appointments"
  ON public.studio_appointments FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can manage studio appointments" ON public.studio_appointments;
CREATE POLICY "Members can manage studio appointments"
  ON public.studio_appointments FOR ALL TO authenticated
  USING (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()));

-- ---------- STUDIO TRANSACTIONS ----------

DROP POLICY IF EXISTS "Admin or member can read studio transactions" ON public.studio_transactions;
CREATE POLICY "Admin or member can read studio transactions"
  ON public.studio_transactions FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can manage studio transactions" ON public.studio_transactions;
CREATE POLICY "Members can manage studio transactions"
  ON public.studio_transactions FOR ALL TO authenticated
  USING (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()));

-- ---------- STUDIO MESSAGES (support) ----------

DROP POLICY IF EXISTS "Admin or member can read studio messages" ON public.studio_messages;
CREATE POLICY "Admin or member can read studio messages"
  ON public.studio_messages FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can create studio messages" ON public.studio_messages;
CREATE POLICY "Members can create studio messages"
  ON public.studio_messages FOR INSERT TO authenticated
  WITH CHECK (studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin or member can update studio messages" ON public.studio_messages;
CREATE POLICY "Admin or member can update studio messages"
  ON public.studio_messages FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can delete studio messages" ON public.studio_messages;
CREATE POLICY "Admin can delete studio messages"
  ON public.studio_messages FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------- MESSAGE REPLIES ----------

DROP POLICY IF EXISTS "Admin or participants can read replies" ON public.message_replies;
CREATE POLICY "Admin or participants can read replies"
  ON public.message_replies FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR message_id IN (
      SELECT id FROM public.studio_messages
      WHERE studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin or participants can create replies" ON public.message_replies;
CREATE POLICY "Admin or participants can create replies"
  ON public.message_replies FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR message_id IN (
      SELECT id FROM public.studio_messages
      WHERE studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin can manage replies" ON public.message_replies;
CREATE POLICY "Admin can manage replies"
  ON public.message_replies FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------- PAYMENTS (billing; members see only their own studio) ----------

DROP POLICY IF EXISTS "Admin or member can read payments" ON public.payments;
CREATE POLICY "Admin or member can read payments"
  ON public.payments FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR studio_id IN (SELECT studio_id FROM public.user_studios WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can manage payments" ON public.payments;
CREATE POLICY "Admin can manage payments"
  ON public.payments FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
