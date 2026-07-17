"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface UnderConstructionProps {
  title?: string;
  description?: string;
}

export default function UnderConstruction({ 
  title = "더 멋진 공간을 준비하고 있어요", 
  description = "현재 페이지는 완성도를 높이기 위해 열심히 다듬고 있는 중입니다. 조금만 기다려 주시면 더 프로페셔널한 모습으로 찾아뵙겠습니다."
}: UnderConstructionProps) {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-white to-slate-50/50 pt-20">
      
      {/* 1. 세련된 인디케이터 배지 */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-xs font-semibold text-blue-600 mb-8 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Currently In Progress
      </div>

      {/* 2. 추상적이고 모던한 모션 그래픽 데코 */}
      <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
        {/* 잔잔하게 돌아가는 아웃라인 원 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 animate-[spin_20s_linear_infinite]"></div>
        {/* 중앙에서 호흡하듯 커졌다 작아지는 서클 */}
        <div className="absolute w-24 h-24 rounded-full bg-blue-50/50 animate-ping opacity-75"></div>
        
        {/* 💡 [수정] 중앙 메인 아이콘 장식 (어색하고 복잡한 SVG 대신 심플하고 강력한 도구 결합 아이콘 적용) */}
        <div className="relative w-20 h-20 rounded-2xl bg-white shadow-xl shadow-slate-100 border border-slate-100/60 flex items-center justify-center">
          <svg 
            className="w-9 h-9 text-slate-800" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.8}
          >
            {/* 세련된 기어(톱니바퀴) 베이스 */}
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            {/* 기어 안에서 빌딩 혹은 구조물을 짓고 있는 듯한 사선 라인(안정감 부여) */}
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        </div>
      </div>

      {/* 3. 타이포그래피 */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
        {title}
      </h1>
      <p className="max-w-md text-base text-slate-500 leading-relaxed mb-10 whitespace-pre-line">
        {description}
      </p>

      {/* 4. 유저 이탈 방지 더블 CTA 버튼 */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={() => router.back()}
          className="w-full sm:w-auto px-6 h-12 rounded-xl bg-slate-950 text-white font-medium hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          이전 페이지로
        </button>

        <Link 
          href="/"
          className="w-full sm:w-auto px-6 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          메인 화면으로
        </Link>
      </div>

    </div>
  );
}