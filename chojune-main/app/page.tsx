"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface PortfolioItem {
  id: string;
  project: string;
  active: string | boolean;
  date: string;
  location: string;
  organizer: string;
  participants: number;
  rating: number;
  mainImage: string | string[];
  activityImages: string[];
  description?: string;
}

const getImageUrl = (imageProp: string | string[] | undefined | null): string => {
  if (!imageProp) return "";
  if (Array.isArray(imageProp)) {
    return imageProp.length > 0 ? imageProp[0] : "";
  }
  return typeof imageProp === "string" ? imageProp : "";
};

export default function HomePage() {
  const [liveProjects, setLiveProjects] = useState<PortfolioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    async function fetchLiveProjects() {
      try {
        const res = await fetch("/api/notion/portfolio", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          const ongoingList = data.filter((item: PortfolioItem) => {
            if (typeof item.active === "boolean") return item.active;
            const activeState = String(item.active || "").trim().toLowerCase();
            return (
              activeState === "진행 중" ||
              activeState === "진행중" ||
              activeState === "true"
            );
          });

          setLiveProjects(ongoingList);
        }
      } catch (err) {
        console.error("라이브 프로젝트 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProjects();
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? liveProjects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === liveProjects.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) handleNext();
    if (distance < -50) handlePrev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const currentProject = liveProjects[currentIndex];
  const currentImageUrl = currentProject ? getImageUrl(currentProject.mainImage) : "";

  return (
    <div className="bg-white">
      {/* 히어로 인트로 */}
      <section className="max-w-4xl mx-auto py-24 md:py-32 px-6 text-center md:text-left">
        <div className="inline-block bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-6">
          WHERE SCIENCE MEETS STORY
        </div>
        <h1 className="text-3xl md:text-6xl font-black mb-8 leading-[1.15] tracking-tight text-slate-900">
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

      {/* 라이브 프로젝트 스포트라이트 */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        {loading ? (
          <div className="h-[480px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
        ) : liveProjects.length > 0 && currentProject ? (
          <div className="relative group/section">
            {/* 상단 헤더: 라이브 상태 배지 & 카운터 */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
                  Ongoing Projects
                </span>
              </div>

              {/* 페이지네이션 숫자 뱃지 */}
              {liveProjects.length > 1 && (
                <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  <span className="text-slate-900">{String(currentIndex + 1).padStart(2, "0")}</span>
                  <span className="mx-1">/</span>
                  <span>{String(liveProjects.length).padStart(2, "0")}</span>
                </div>
              )}
            </div>

            {/* 메인 프로젝트 카드 컨테이너 */}
            <div className="relative">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-12 relative shadow-sm transition-all duration-300 h-auto md:h-[460px]"
              >
                {/* 좌측: 메인 이미지 영역 */}
                <div className="md:col-span-5 h-64 md:h-full relative overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                  {currentImageUrl ? (
                    <img
                      key={currentImageUrl}
                      src={currentImageUrl}
                      alt={currentProject.project}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-400 text-sm font-medium p-6 text-center">
                      🖼️ 대표 이미지 없음
                    </div>
                  )}
                </div>

                {/* 우측: 프로젝트 상세 내용 */}
                <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between h-full overflow-hidden">
                  <div className="overflow-hidden">
                    <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs block mb-2">
                      Spotlight #{currentIndex + 1}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-3 break-keep line-clamp-2">
                      {currentProject.project}
                    </h2>

                    <p className="text-slate-500 font-medium text-sm md:text-base mb-6 leading-relaxed break-keep line-clamp-3">
                      {currentProject.description ||
                        "많은 탐험가들에게 전율을 선사하고 있는 조준의 멋진 에피소드가 지금 오프라인 현장에서 진행 중입니다. 지금 조준과 함께 탐험을 시작해 보세요!"}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 text-xs font-bold text-slate-600">
                      <span className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                        📅 {currentProject.date || "진행 기간 확인 필요"}
                      </span>
                      <span className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                        📍 {currentProject.location || "장소 미정"}
                      </span>
                      {currentProject.organizer && (
                        <span className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                          🏛️ {currentProject.organizer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 하단 버튼 영역 */}
                  <div className="flex flex-wrap gap-3 pt-2 mt-auto">
                    <Link
                      href="/portfolio"
                      className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs md:text-sm transition-all shadow-sm active:scale-95"
                    >
                      자세히 보기 →
                    </Link>
                    <Link
                      href="/reservation"
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-3 rounded-xl text-xs md:text-sm transition-all shadow-sm active:scale-95"
                    >
                      지금 예약하기
                    </Link>
                  </div>
                </div>
              </div>

              {/* 🌟 [UI 개선] 좌/우 플로팅 네비게이션 버튼 (프로젝트 2개 이상일 때) */}
              {liveProjects.length > 1 && (
                <>
                  {/* 이전 버튼 */}
                  <button
                    onClick={handlePrev}
                    aria-label="이전 프로젝트"
                    className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 shadow-lg flex items-center justify-center hover:bg-white hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
                  >
                    <svg
                      className="w-5 h-5 transition-transform group-hover:-translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* 다음 버튼 */}
                  <button
                    onClick={handleNext}
                    aria-label="다음 프로젝트"
                    className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 shadow-lg flex items-center justify-center hover:bg-white hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
                  >
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* 하단 인디케이터 (Dot) */}
            {liveProjects.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {liveProjects.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`슬라이드 ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-14 text-center">
            <span className="text-2xl block mb-3">🚀</span>
            <h3 className="text-xl font-black text-slate-800 mb-2">새로운 프로젝트 준비 중!</h3>
            <p className="text-slate-400 text-sm mb-6 font-medium">
              현재 오픈된 프로젝트가 마감되었습니다. 다음 탐험을 열심히 기획하고 있으니 잠시만 기다려주세요.
            </p>
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