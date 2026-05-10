// app/layout.jsx

import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-zinc-950 text-white">
        <nav className="flex justify-between items-center p-6 max-w-5xl mx-auto border-b border-zinc-800">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter text-red-500"
          >
            조준 CHOJUNE
          </Link>
          <div className="space-x-6 text-sm font-medium">
            <Link href="/" className="hover:text-red-500 transition">
              프로젝트 소개
            </Link>
            <Link
              href="/review"
              className="bg-red-600 px-4 py-2 rounded-full hover:bg-red-700 transition"
            >
              후기 남기기
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
