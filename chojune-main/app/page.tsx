// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

interface Review {
  id: number;
  created_at: string;
  project: string;
  name: string;
  phone_number: string;
  review: string;
  rating: number;
}

export default function HomePage() {
  const [stats, setStats] = useState({ avg: "0.0", count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function fetchPageData() {
      const projectName = "별을 기억한다는 것은";

      // 1. 전체 별점 및 통계 가져오기
      const { data: allData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("project", projectName);

      if (allData && allData.length > 0) {
        const avg = (
          allData.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          allData.length
        ).toFixed(1);
        setStats({ avg, count: allData.length });
      }

      // 2. 해당 프로젝트의 전체 리뷰 가져오기 (최신순)
      const { data: reviewList } = await supabase
        .from("reviews")
        .select("*")
        .eq("project", projectName)
        .order("created_at", { ascending: false });

      if (reviewList) setReviews(reviewList);
    }
    fetchPageData();
  }, []);

  const maskName = (name: string) => {
    if (!name) return "";
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  // 🔒 스포일러 단어 마스킹 필터 함수
  const filterSpoiler = (text: string) => {
    if (!text) return "";
    const spoilerWords = ["사진", "편지", "이미지", "미래", "모습", "노후", "노인"];
    
    // 정규식을 활용해 배열 내의 단어들을 한 번에 감지하여 ■■ 로 치환합니다.
    const regex = new RegExp(spoilerWords.join("|"), "g");
    return text.replace(regex, "■■");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto p-8 py-20">
        {/* 상단 브랜드 섹션 */}
        <section className="mb-20">
          <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-6">
            IMMERSIVE EXPERIENCE STUDIO
          </div>
          <h2 className="text-4xl md:text-4xl font-black mb-8 leading-[1.1] tracking-tight">
            경험을 넘어선 몰입,
            <br />
            우리는{" "}
            <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">
              조준
            </span>{" "}
            합니다.
          </h2>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
            '조준(CHOJUNE)'은 당신이 이야기의 주인공이 되는 몰입형 공간 콘텐츠를
            설계합니다. 현실보다 더 리얼한 세계관 속에서 특별한 순간을
            소유하세요.
          </p>
        </section>

        {/* 메인 프로젝트 카드 */}
        <section className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-14 relative overflow-hidden shadow-xl shadow-blue-900/5 mb-12">
          {/* 상태 태그 */}
          <div className="absolute top-10 right-10">
            <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest">
              LIVE PROJECT
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-[0.25em] text-xs">
              Ongoing Project
            </h3>
            
            {/* 프로젝트 제목만 깔끔하게 노출 */}
            <div className="mb-8">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">
                별을 기억한다는 것은
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-12">
              <div className="bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl text-slate-600 font-bold text-sm shadow-sm">
                📅 2026.05.09 — 05.31
              </div>
              <div className="bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl text-slate-600 font-bold text-sm shadow-sm">
                📍 Campus D 서울 , 서울시 영등포구 양평로 21길 20 (07207)
              </div>
            </div>

            <div className="mb-12">
              <p className="text-slate-500 text-lg leading-relaxed font-medium pl-6 border-l-4 border-blue-100 italic">
                "ep1(오픈형). 우주비행사 선발 시험"
                <br />
                "ep2(몰입형). 시간을 초월한 항해"
                <br />
                <span className="not-italic text-base text-slate-400 block mt-3">
                  우주비행사가 되는 여정, 그리고 시간을 초월한 항해.
                </span>
              </p>
            </div>

            {/* 대시보드 구조: 좌측 평점 / 우측 리뷰 리스트 피드 */}
            <div id="reviews-section" className="flex flex-col lg:flex-row items-stretch gap-6 w-full pt-4">
              
              {/* 좌측: 평균 별점 고정 대시보드 */}
              <div className="bg-blue-600 p-10 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[260px] lg:max-h-[320px] text-white shadow-lg shadow-blue-600/20 lg:sticky lg:top-8">
                <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  Average Rating
                </span>
                <div className="text-5xl font-black mb-2 tracking-tighter">
                  {stats.avg}
                </div>
                <div className="flex gap-1 mb-4 text-blue-200 text-xl">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.floor(Number(stats.avg))
                          ? "text-white"
                          : "text-blue-400/50"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="bg-white/10 px-4 py-1 rounded-full text-blue-50 text-[11px] font-bold">
                  {stats.count.toLocaleString()} EXPLORERS
                </span>
              </div>

              {/* 우측: 스크롤 가능한 탐험가 리뷰 피드 */}
              <div className="flex-1 flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.length > 0 ? (
                  reviews.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[2rem] flex flex-col justify-center relative hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-0.5 text-amber-400 text-sm">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>{i < item.rating ? "★" : "☆"}</span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400 tracking-wider">
                          {maskName(item.name)} 탐험가
                        </span>
                      </div>
                      {/* 🔒 filterSpoiler 함수로 감싸 후기 원문 마스킹 */}
                      <p className="text-slate-700 text-base md:text-lg font-bold leading-relaxed break-keep">
                        "{filterSpoiler(item.review)}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full bg-slate-50 border border-slate-100 border-dashed p-8 rounded-[2.5rem] flex items-center justify-center text-slate-400 font-medium italic">
                    새로운 탐험 기록을 기다리고 있습니다.
                  </div>
                )}
              </div>

            </div>

            <p className="mt-10 text-slate-400 text-[10px] font-bold text-center lg:text-left">
              * 조준은 실제 플레이어의 소중한 의견을 실시간으로 반영하며, 스포일러 방지를 위해 일부 단어가 블라인드 처리될 수 있습니다.
            </p>
          </div>

          {/* 배경 데코 아이콘 */}
          <div className="absolute -bottom-10 -right-10 text-blue-50/50 scale-150 rotate-12 select-none pointer-events-none">
            <svg
              width="200"
              height="200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}