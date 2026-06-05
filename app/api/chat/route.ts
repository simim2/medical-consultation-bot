import { NextRequest, NextResponse } from "next/server";
import { saveConsultation } from "@/lib/supabase";
import { MEDICAL_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { ChatResponse, Message } from "@/types";

export async function POST(req: NextRequest) {
  // Step 1: parse body
  let message: string, session_id: string, history: Message[];
  try {
    const body = await req.json();
    message = (body.message ?? "").trim();
    session_id = body.session_id ?? "anonymous";
    history = Array.isArray(body.history) ? body.history : [];
  } catch (e) {
    console.error("[step1-parse]", e);
    return NextResponse.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
  }

  // Step 2: validate API key (strip BOM if PowerShell pipe added one)
  const apiKey = (process.env.OPENROUTER_API_KEY ?? "").replace(/^﻿/, "");
  if (!apiKey) {
    console.error("[step2] OPENROUTER_API_KEY missing");
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  // Step 3: call OpenRouter
  let rawContent = "{}";
  try {
    const conversationHistory = history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medical-consultation-bot-topaz.vercel.app",
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
      console.error("[step3] OpenRouter HTTP error:", response.status, err.slice(0, 300));
      return NextResponse.json({ error: "AI 응답 오류" }, { status: 502 });
    }

    const data = await response.json();
    rawContent = data?.choices?.[0]?.message?.content ?? "{}";
    console.log("[step3] rawContent slice:", String(rawContent).slice(0, 100));
  } catch (e) {
    console.error("[step3-fetch]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "AI 호출 실패" }, { status: 502 });
  }

  // Step 4: parse AI JSON (strip markdown fences if model wrapped output)
  const cleanContent = rawContent
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: ChatResponse;
  try {
    parsed = JSON.parse(cleanContent);
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

  // Step 5: save to Supabase
  try {
    await saveConsultation({
      session_id,
      patient_message: message,
      ai_response: parsed.message ?? rawContent,
      classification: parsed.classification ?? null,
    });
  } catch (e) {
    console.error("[step5-supabase]", e instanceof Error ? e.message : String(e));
    // non-fatal: still return the AI response
  }

  return NextResponse.json(parsed);
}
