export interface Client {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "lead" | "negotiation" | "development" | "completed" | "support";
  source: string;
  budget: number;
  description: string;
  notes: Note[];
  next_action: string;
  next_action_date: string;
  assigned_to: string;
  quiz_results?: QuizResult;
  updated_at: string;
}

export interface Note {
  id: string;
  client_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface QuizResult {
  business_type: string;
  needs: string[];
  budget: string;
  timeline: string;
  has_website: boolean;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface DashboardStats {
  total_clients: number;
  active_projects: number;
  monthly_leads: number;
  conversion_rate: number;
  revenue: number;
  clients_by_status: { status: string; count: number }[];
}

// Studio CRM Types
export interface Studio {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_phone: string;
  address: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  plan: "basic" | "pro" | "enterprise";
  settings: Record<string, unknown>;
  updated_at: string;
}

export interface UserStudio {
  id: string;
  user_id: string;
  studio_id: string;
  role: "owner" | "admin" | "employee";
  created_at: string;
}

export interface StudioClient {
  id: string;
  studio_id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  car_color: string;
  car_vin: string;
  license_plate: string;
  status: "new" | "regular" | "vip" | "inactive";
  notes: string;
  total_visits: number;
  total_spent: number;
  last_visit: string | null;
  next_visit: string | null;
  assigned_to: string | null;
  tags: string[];
  updated_at: string;
}

export interface StudioService {
  id: string;
  studio_id: string;
  created_at: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: "detailing" | "wash" | "protection" | "interior" | "exterior" | "other";
  is_active: boolean;
  sort_order: number;
  updated_at: string;
}

export interface StudioAppointment {
  id: string;
  studio_id: string;
  client_id: string;
  service_id: string | null;
  created_at: string;
  scheduled_at: string;
  completed_at: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  price: number;
  discount: number;
  final_price: number;
  notes: string;
  technician_name: string;
  assigned_to: string | null;
  updated_at: string;
  client?: StudioClient;
  service?: StudioService;
}

export interface StudioTransaction {
  id: string;
  studio_id: string;
  appointment_id: string | null;
  client_id: string | null;
  created_at: string;
  type: "income" | "expense" | "refund";
  amount: number;
  description: string;
  payment_method: "cash" | "card" | "transfer" | "other";
  category: "service" | "product" | "subscription" | "other";
  created_by: string | null;
}

export interface StudioMessage {
  id: string;
  studio_id: string;
  created_at: string;
  subject: string;
  message: string;
  type: "support" | "bug" | "feature" | "billing" | "other";
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  read_by_admin: boolean;
  read_by_studio: boolean;
  created_by: string | null;
  updated_at: string;
  studio?: Studio;
  replies?: MessageReply[];
}

export interface MessageReply {
  id: string;
  message_id: string;
  created_at: string;
  content: string;
  created_by: string | null;
  is_admin: boolean;
}

export interface Payment {
  id: string;
  studio_id: string;
  created_at: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  period_start: string | null;
  period_end: string | null;
  payment_method: "cash" | "card" | "transfer" | "other";
  notes: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  studio?: Studio;
}

export interface StudioDashboardStats {
  total_clients: number;
  new_clients: number;
  appointments_today: number;
  revenue_today: number;
  revenue_month: number;
  active_services: number;
  clients_by_status: { status: string; count: number }[];
  recent_appointments: StudioAppointment[];
}

export interface AdminDashboardStats {
  total_studios: number;
  active_studios: number;
  pending_requests: number;
  unread_messages: number;
  total_revenue: number;
  pending_payments: number;
  studios_by_plan: { plan: string; count: number }[];
  recent_messages: StudioMessage[];
}
