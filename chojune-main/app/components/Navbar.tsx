"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => 
    pathname === path ? "text-primary font-bold" : "text-slate-600 hover:text-primary";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80">
      {/* 💡 px-4로 모바일 여백을 살짝 줄여 공간을 더 확보합니다. */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* 로고 영역 (모바일에서 찌그러지지 않도록 shrink-0 추가) */}
        <Link href="/" className="flex items-center gap-1 text-xl font-black tracking-tight text-slate-950 group shrink-0">
          <Image 
            src="/chojune_logo-removebg.png" 
            alt="CHOJUNE 로고 아이콘" 
            width={24}  
            height={24} 
            style={{ height: "auto" }}
            className="object-contain"
          />
          <span>
            CHOJUNE
          </span>
        </Link>

        {/* 페이지 링크 메뉴 */}
        {/* 💡 핵심 프로 스킬 수정 영역 */}
        {/* 1. whitespace-nowrap : 글씨가 아래로 절대 줄바꿈되지 않게 강제 차단 */}
        {/* 2. overflow-x-auto : 화면이 좁아지면 터치로 부드럽게 가로 스크롤 가능하게 처리 */}
        {/* 3. scrollbar-hide : 가로 스크롤 바가 생겨 지저분해 보이지 않도록 모바일 스크롤바 숨김 */}
        {/* 4. gap-4 sm:gap-6 md:gap-8 : 모바일 화면(gap-4)부터 PC 화면까지 화면 크기에 맞게 간격 유연 자동 조절 */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 text-sm font-semibold transition-colors overflow-x-auto whitespace-nowrap scrollbar-none py-2 max-w-full">
          <Link href="/about" className={`${isActive("/about")} transition-colors`}>회사소개</Link>
          <Link href="/portfolio" className={`${isActive("/portfolio")} transition-colors`}>포트폴리오</Link>
          <Link href="/sns" className={`${isActive("/sns")} transition-colors`}>SNS</Link>
          <Link href="/reservation" className={`${isActive("/reservation")} transition-colors`}>예약</Link>
        </div>
      </div>
    </nav>
  );
}