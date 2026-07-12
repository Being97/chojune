"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PortfolioItem {
  id: string;
  project: string;
  active: string;
  date: string;
  location: string;
  organizer: string;
  participants: number;
  rating: number;
  mainImage: string;
  activityImages: string[];
}

export default function HomePage() {
  const [liveProject, setLiveProject] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveProject() {
      try {
        const res = await fetch("/api/notion/portfolio", { cache: "no-store" });
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // 💡 노션 데이터 중 active가 "진행 중" 또는 "진행중"인 첫 번째 최신 프로젝트 찾기
          const ongoing = data.find(
            (item: PortfolioItem) => item.active === "진행 중" || item.active === "진행중"
          );
          if (ongoing) {
            setLiveProject(ongoing);
          }
        }
      } catch (err) {
        console.error("라이브 프로젝트 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProject();
  }, []);

  return (
    <div className="bg-white">
      {/* 히어로 인트로 */}
      <section className="max-w-3xl mx-auto py-24 md:py-32 px-6 text-center md:text-left">
        <div className="inline-block bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6">
          WHERE SCIENCE MEETS STORY
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.15] tracking-tight text-slate-900">
          과학문화를 정조준!
          <br />
          우리는 <span className="text-primary">프로젝트조준</span>입니다.
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto md:mx-0 break-keep leading-relaxed">
          이야기의 주인공이 되는 공간을 설계합니다.
          <br />
          지금 조준이 선보이는 현실 그 이상의 세계를 탐험해 보세요.
        </p>
      </section>

      {/* 현재 진행 중인 라이브 프로젝트 스포트라이트 */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        {loading ? (
          /* 스켈레톤 로딩 */
          <div className="h-80 bg-slate-100 animate-pulse rounded-[2.5rem]" />
        ) : liveProject ? (
          /* 노션 연동 완료된 진행 중 프로젝트 카드 */
          <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden group">
            <div className="absolute top-8 right-8">
              <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest">
                NOW LIVE
              </span>
            </div>

            <div className="max-w-2xl">
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs block mb-3">
                Ongoing Project
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-6 break-keep">
                {liveProject.project}
              </h2>
              
              <p className="text-slate-500 font-medium text-base md:text-lg mb-8 leading-relaxed break-keep">
                많은 탐험가들에게 전율을 선사하고 있는 조준의 멋진 에피소드가 지금 오프라인 현장에서 진행 중입니다. 지금 조준과 함께 탐험을 시작해 보세요!
              </p>

              <div className="flex flex-wrap gap-3 mb-10 text-xs font-bold text-slate-500">
                <span className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 flex items-center gap-1">
                  📅 {liveProject.date || "진행 기간 확인 필요"}
                </span>
                <span className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 flex items-center gap-1">
                  📍 {liveProject.location || "장소 미정"}
                </span>
                {liveProject.organizer && (
                  <span className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 flex items-center gap-1">
                    🏛️ {liveProject.organizer}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
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
            <div className="absolute -bottom-10 -right-10 text-slate-200/40 scale-150 rotate-12 group-hover:text-primary-point/50 group-hover:rotate-45 transition-all duration-700 select-none pointer-events-none">
              <svg width="240" height="240" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        ) : (
          /* 💡 진행 중인 프로젝트가 없을 때 띄워줄 Fallback 안내 섹션 */
          <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-14 text-center">
            <span className="text-2xl block mb-3">🚀</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">새로운 프로젝트 준비 중!</h3>
            <p className="text-slate-400 text-sm mb-6 font-medium">현재 오픈된 프로젝트가 마감되었습니다. 다음 탐험을 열심히 기획하고 있으니 잠시만 기다려주세요.</p>
            <Link 
              href="/portfolio" 
              className="inline-block bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-6 py-3 rounded-xl text-sm transition-all"
            >
              지난 프로젝트 아카이브 보러가기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}