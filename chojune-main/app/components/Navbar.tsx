// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image"; // Next.js 최적화 이미지 컴포넌트 추가
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // 현재 머물고 있는 페이지의 메뉴 글씨를 파랗게 하이라이트하는 헬퍼 함수
  const isActive = (path: string) => 
    pathname === path ? "text-primary font-bold" : "text-slate-600 hover:text-primary";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* 로고 영역: 이미지와 텍스트를 가로로 정렬 */}
        <Link href="/" className="flex items-center gap-1 text-xl font-black tracking-tight text-slate-950 group">
          <Image 
            src="/chojune_logo-removebg.png" 
            alt="CHOJUNE 로고 아이콘" 
            width={24}  // 텍스트 크기(text-xl = 20px)와 균형을 이루는 적절한 사이즈
            height={24} 
            style={{ height: "auto" }}
            className="object-contain"
          />
          <span>
            CHOJUNE
          </span>
        </Link>

        {/* 페이지 링크 메뉴 */}
        <div className="flex gap-6 md:gap-8 text-sm font-semibold transition-colors">
          <Link href="/about" className={isActive("/about")}>회사소개</Link>
          <Link href="/portfolio" className={isActive("/portfolio")}>포트폴리오</Link>
          <Link href="/sns" className={isActive("/sns")}>SNS</Link>
          <Link href="/reservation" className={isActive("/reservation")}>예약</Link>
        </div>
      </div>
    </nav>
  );
}