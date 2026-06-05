import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveConsultation({
  session_id,
  patient_message,
  ai_response,
  classification,
}: {
  session_id: string;
  patient_message: string;
  ai_response: string;
  classification: object | null;
}) {
  const { error } = await supabase.from("consultations").insert({
    session_id,
    patient_message,
    ai_response,
    classification,
  });
  if (error) console.error("Supabase insert error:", error);
}
