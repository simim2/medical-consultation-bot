import { AlertTriangle, Stethoscope, Activity, Tag } from "lucide-react";
import type { Classification } from "@/types";

const urgencyConfig = {
  low: { label: "낮음", color: "text-green-600 bg-green-50 border-green-200" },
  medium: { label: "보통", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  high: { label: "높음", color: "text-orange-600 bg-orange-50 border-orange-200" },
  emergency: { label: "응급", color: "text-red-600 bg-red-50 border-red-200" },
};

export default function ClassificationCard({ c }: { c: Classification }) {
  const urgency = urgencyConfig[c.urgency_level];

  return (
    <div className={`mt-3 rounded-xl border p-3 text-sm space-y-2 ${
      c.is_emergency ? "bg-red-50 border-red-300" : "bg-slate-50 border-slate-200"
    }`}>
      {c.is_emergency && (
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>응급 상황 — 즉시 119 신고 또는 응급실 방문</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs text-slate-400">추천 진료과</span>
        </div>
        <span className="font-semibold text-blue-700">{c.recommended_department}</span>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Activity className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs text-slate-400">긴급도</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${urgency.color}`}>
          {urgency.label}
        </span>
      </div>

      {c.symptoms.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Tag className="w-3 h-3" /> 인식된 증상
          </div>
          <div className="flex flex-wrap gap-1">
            {c.symptoms.map((s) => (
              <span key={s} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {c.suspected_conditions.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 mb-1">의심 질환 (참고용)</div>
          <div className="flex flex-wrap gap-1">
            {c.suspected_conditions.map((d) => (
              <span key={d} className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
