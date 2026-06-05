import ClassificationCard from "./ClassificationCard";
import type { Message } from "@/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
          <p className="text-xs text-slate-400 text-right mt-1">{formatTime(msg.created_at)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow">
        AI
      </div>
      <div className="max-w-[80%]">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{msg.content}</p>
          {msg.classification && <ClassificationCard c={msg.classification} />}
        </div>
        <p className="text-xs text-slate-400 mt-1">{formatTime(msg.created_at)}</p>
      </div>
    </div>
  );
}
