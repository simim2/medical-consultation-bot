"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import type { Message } from "@/types";

const QUICK_QUESTIONS = [
  "목이 아프고 열이 나요",
  "오른쪽 아래 배가 찌르듯이 아파요",
  "두통이 심하고 어지러워요",
  "가슴이 두근거리고 숨이 차요",
  "무릎 관절이 쑤시고 부었어요",
  "피부에 발진이 생겼어요",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕하세요! 저는 병원 AI 상담 어시스턴트입니다. 😊\n\n증상이나 궁금한 점을 자연어로 말씀해 주시면, 의심 질환과 적합한 진료과를 안내해 드리겠습니다.\n\n⚠️ 본 서비스는 참고용 안내이며, 정확한 진단은 반드시 의사의 직접 진료가 필요합니다.",
  created_at: new Date().toISOString(),
};

function getSessionId() {
  if (typeof window === "undefined") return uuidv4();
  const key = "medical_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            session_id: sessionId,
            history: messages.slice(-6),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "응답 오류");
        }

        const aiMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.message,
          classification: data.classification,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `죄송합니다. 오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [isLoading, messages, sessionId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    sessionStorage.removeItem("medical_session_id");
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">🏥</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">병원 AI 상담봇</h1>
            <p className="text-xs text-slate-500">증상·진료과 안내 서비스</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          새 상담
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-400 mb-2">빠른 질문 예시</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="증상을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
            rows={1}
            className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          본 서비스는 참고용이며 의사의 진료를 대체하지 않습니다.
        </p>
      </div>
    </div>
  );
}
