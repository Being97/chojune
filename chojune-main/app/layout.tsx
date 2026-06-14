// app/layout.tsx
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css"; // 글로벌 CSS 링크 확인

export const metadata: Metadata = {
  title: "CHOJUNE - 몰입형 공간 콘텐츠 스튜디오",
  description: "경험을 넘어선 몰입, 우리는 조준합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
        <Navbar />
        {/* 상단바 고정 높이(pt-16)만큼 띄우고, 콘텐츠가 적어도 푸터가 바닥에 붙도록 flex-1 설정 */}
        <div className="pt-16 flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}