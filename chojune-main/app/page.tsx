// app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* 히어로 인트로 */}
      <section className="max-w-3xl mx-auto py-24 md:py-32 px-6">
        {/* 💡 bg-blue-50 -> bg-primary-light / text-blue-600 -> text-primary */}
        <div className="inline-block bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6">
          WHERE SCIENCE MEETS STORY
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.15] tracking-tight text-slate-900">
          과학문화를 정조준!
          <br />
          우리는 <span className="text-primary">프로젝트조준</span>입니다.
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto break-keep leading-relaxed">
          이야기의 주인공이 되는 공간을 설계합니다.
          <br />
          지금 조준이 선보이는 현실 그 이상의 세계를 탐험해 보세요.
        </p>
      </section>

      {/* 현재 진행 중인 라이브 프로젝트 스포트라이트 */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden group">
          <div className="absolute top-8 right-8">
            {/* 💡 bg-blue-600 -> bg-primary */}
            <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest">
              NOW LIVE
            </span>
          </div>

          <div className="max-w-2xl">
            {/* 💡 text-blue-500 -> text-primary */}
            <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs block mb-3">
              Ongoing Project
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-6">
              별을 기억한다는 것은
            </h2>
            
            <p className="text-slate-500 font-medium text-base md:text-lg mb-8 leading-relaxed break-keep">
              우주비행사가 되는 여정, 그리고 시간을 초월한 항해.
              <br />
              많은 탐험가들에게 전율을 선사하고 있는 조준의 에피소드가 지금 진행 중입니다.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 text-xs font-bold text-slate-500">
              <span className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60">📅 2026.05.09 — 05.31</span>
              <span className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60">📍 Campus D 서울 (영등포구)</span>
            </div>

            <div className="flex gap-4">
              <Link 
                href="/portfolio" 
                className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-sm"
              >
                탐험가 후기 및 자세히 보기 →
              </Link>
              <Link 
                href="/reservation" 
                className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-sm"
              >
                지금 예약하기
              </Link>
            </div>
          </div>

          {/* 배경 데코 스타 아이콘 */}
          {/* 💡 group-hover:text-blue-100/50 -> group-hover:text-primary-point/50 */}
          <div className="absolute -bottom-10 -right-10 text-slate-200/40 scale-150 rotate-12 group-hover:text-primary-point/50 group-hover:rotate-45 transition-all duration-700 select-none pointer-events-none">
            <svg width="240" height="240" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}