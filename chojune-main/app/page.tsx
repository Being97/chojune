"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface PortfolioItem {
  id: string;
  project: string;
  active?: string | boolean;
  isOngoing?: boolean;
  date?: string;
  location?: string;
  organizer?: string;
  description?: string;
  mainImage?: string | string[];
  reservationOpen?: boolean; // 예약 Open 여부
}

const getImageUrl = (imageProp?: string | string[] | null): string => {
  if (!imageProp) return "";
  if (Array.isArray(imageProp)) return imageProp[0] || "";
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
            if (typeof item.isOngoing === "boolean" && item.isOngoing) return true;
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
  const currentImageUrl = getImageUrl(currentProject?.mainImage);

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
          <div className="h-[520px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
        ) : liveProjects.length > 0 && currentProject ? (
          <div className="relative group/section">
            {/* 상단 라이브 헤더 & 페이지네이션 */}
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

              {liveProjects.length > 1 && (
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full flex items-center">
                    <span className="text-slate-900">{String(currentIndex + 1).padStart(2, "0")}</span>
                    <span className="mx-1">/</span>
                    <span>{String(liveProjects.length).padStart(2, "0")}</span>
                  </div>

                  {/* 모바일 전용 미니 이동 버튼 */}
                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      onClick={handlePrev}
                      aria-label="이전 프로젝트"
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center active:bg-primary active:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      aria-label="다음 프로젝트"
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center active:bg-primary active:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 카드 본체 */}
            <div className="relative">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-12 relative shadow-sm transition-all duration-300"
              >
                {/* 왼쪽: 메인 포스터 */}
                <div className="md:col-span-5 w-full bg-slate-950 flex items-center justify-center relative overflow-hidden shrink-0 min-h-[420px] md:min-h-[520px] p-2 md:p-4">
                  {currentImageUrl ? (
                    <>
                      <Image
                        key={`bg-${currentImageUrl}`}
                        src={currentImageUrl}
                        alt=""
                        fill
                        className="object-cover opacity-40 blur-3xl scale-150 select-none pointer-events-none"
                      />
                      <div className="relative w-full h-full max-h-[580px] aspect-[4/5] shadow-2xl rounded-2xl overflow-hidden">
                        <Image
                          key={currentImageUrl}
                          src={currentImageUrl}
                          alt={currentProject.project}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 45vw"
                          className="object-contain"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium p-6 text-center">
                      🖼️ 포스터 이미지 준비 중
                    </div>
                  )}
                </div>

                {/* 오른쪽: 상세 정보 */}
                <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between h-full">
                  <div>
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

                    {/* 세로 배치(flex-col)된 날짜, 장소, 주관기관 영역 */}
                    <div className="flex flex-col gap-2 mb-8 text-xs font-bold text-slate-600">
                      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2 shadow-2xs">
                        <span>📅 날짜:</span>
                        <span className="font-medium text-slate-800">{currentProject.date || "일정 확인 필요"}</span>
                      </div>
                      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2 shadow-2xs">
                        <span>📍 장소:</span>
                        <span className="font-medium text-slate-800">{currentProject.location || "장소 확인 필요"}</span>
                      </div>
                      {currentProject.organizer && (
                        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2 shadow-2xs">
                          <span>🏛️ 주관기관:</span>
                          <span className="font-medium text-slate-800">{currentProject.organizer}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 하단 CTA 버튼 (자세히 보기 + 조건부 지금 예약하기) */}
                  <div className="flex flex-wrap gap-3 pt-2 mt-auto">
                    <Link
                      href="/portfolio"
                      className="flex-1 text-center bg-slate-950 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs md:text-sm transition-all shadow-sm active:scale-95"
                    >
                      자세히 보기 →
                    </Link>

                    {/* 예약Open 상태 감지 시 노출 */}
                    {currentProject.reservationOpen && (
                      <Link
                        href="/reservation"
                        className="flex-1 text-center bg-primary hover:bg-primary-dark text-white font-bold px-5 py-3 rounded-xl text-xs md:text-sm transition-all shadow-sm active:scale-95"
                      >
                        지금 예약하기
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* 데스크톱 플로팅 컨트롤러 */}
              {liveProjects.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    aria-label="이전 프로젝트"
                    className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 shadow-lg items-center justify-center hover:bg-white hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleNext}
                    aria-label="다음 프로젝트"
                    className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 shadow-lg items-center justify-center hover:bg-white hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* 인디케이터 점 */}
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
              현재 진행 중인 프로젝트가 모두 마감되었습니다. 다음 탐험을 열심히 준비하고 있으니 기대해 주세요.
            </p>
            <Link
              href="/portfolio"
              className="inline-block bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-6 py-3 rounded-xl text-sm transition-all"
            >
              지난 프로젝트 보러가기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
