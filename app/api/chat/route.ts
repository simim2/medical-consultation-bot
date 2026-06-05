import { NextRequest, NextResponse } from "next/server";
import { saveConsultation } from "@/lib/supabase";
import { MEDICAL_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { ChatResponse, Message } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message ?? "";
    const session_id: string = body.session_id ?? "anonymous";
    const history: Message[] = Array.isArray(body.history) ? body.history : [];

    if (!message.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const conversationHistory = history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://medical-consultation-bot-topaz.vercel.app",
        "X-Title": "Medical Consultation Bot",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          { role: "system", content: MEDICAL_SYSTEM_PROMPT },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", response.status, err);
      return NextResponse.json({ error: "AI 응답 생성 중 오류가 발생했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: ChatResponse;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        message: rawContent,
        classification: {
          intent: "general_inquiry",
          symptoms: [],
          suspected_conditions: [],
          recommended_department: "내과",
          is_emergency: false,
          urgency_level: "low",
        },
      };
    }

    await saveConsultation({
      session_id,
      patient_message: message,
      ai_response: parsed.message ?? rawContent,
      classification: parsed.classification ?? null,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error("Chat API error:", msg);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
