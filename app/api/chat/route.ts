import { NextRequest, NextResponse } from "next/server";
import { saveConsultation } from "@/lib/supabase";
import { MEDICAL_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { ChatResponse, Message } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, session_id, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const conversationHistory = (history as Message[])
      .slice(-6)
      .map((msg) => ({
        role: msg.role,
        content: msg.role === "assistant"
          ? msg.content
          : msg.content,
      }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://medical-consultation-bot.vercel.app",
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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI 응답 생성 중 오류가 발생했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "{}";

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
      ai_response: parsed.message,
      classification: parsed.classification ?? null,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
