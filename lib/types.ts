export type QuestionType = "text" | "email" | "single" | "multi";

export interface Option {
  label: string;
  value: string;
  riskWeight?: number;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: Option[];
  required?: boolean;
  placeholder?: string;
}

export interface Page {
  step: number;
  title: string;
  subtitle: string;
  questions: Question[];
}

export type Answers = Record<string, string | string[]>;

export interface ScoreResult {
  score: number;
  level: "Low" | "Moderate" | "High" | "Critical";
  colour: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  priority: "Critical" | "High" | "Medium" | "Low";
  title: string;
  body: string;
}

export interface QuestionnaireResponse {
  id?: string;
  created_at?: string;
  name: string;
  email: string;
  machine_type: string;
  mac_year: string;
  macos_version: string;
  filevault_enabled: string;
  backup_status: string;
  last_backup: string;
  security_software: string;
  data_types: string[];
  public_wifi: string;
  sharing: string;
  priority_areas: string[];
  it_management: string;
  past_issues: string[];
  security_warnings: string;
  repair_history: string;
  business_use: string;
  client_data: string;
  popia_awareness: string;
  audit_required: string;
  risk_score: number;
  risk_level: string;
}
