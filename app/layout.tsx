import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "병원 AI 상담봇",
  description: "증상을 입력하면 진료과와 의심 질환을 안내해 드립니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
