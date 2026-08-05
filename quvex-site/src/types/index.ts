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
