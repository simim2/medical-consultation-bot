export type UrgencyLevel = "low" | "medium" | "high" | "emergency";

export type IntentType =
  | "symptom_inquiry"
  | "department_inquiry"
  | "appointment"
  | "general_inquiry"
  | "emergency";

export interface Classification {
  intent: IntentType;
  symptoms: string[];
  suspected_conditions: string[];
  recommended_department: string;
  is_emergency: boolean;
  urgency_level: UrgencyLevel;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  classification?: Classification;
  created_at: string;
}

export interface Consultation {
  id: string;
  session_id: string;
  patient_message: string;
  ai_response: string;
  classification: Classification | null;
  created_at: string;
}

export interface ChatResponse {
  message: string;
  classification: Classification;
}
