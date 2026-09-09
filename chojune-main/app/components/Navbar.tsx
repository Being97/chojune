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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* 로고 영역 */}
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
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 text-sm font-semibold transition-colors overflow-x-auto whitespace-nowrap scrollbar-none py-2 max-w-full">
          <Link href="/about" className={`${isActive("/about")} transition-colors`}>회사소개</Link>
          <Link href="/portfolio" className={`${isActive("/portfolio")} transition-colors`}>포트폴리오</Link>
          <Link href="/sns" className={`${isActive("/sns")} transition-colors`}>SNS</Link>
          {/* <Link href="/review" className={`${isActive("/review")} transition-colors`}>후기</Link> */}
          <Link href="/reservation" className={`${isActive("/reservation")} transition-colors`}>예약</Link>
        </div>
      </div>
    </nav>
  );
}