// app/portfolio/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Review {
  id: number;
  created_at: string;
  project: string;
  name: string;
  phone_number: string;
  review: string;
  rating: number;
}

export default function PortfolioPage() {
  const [stats, setStats] = useState({ avg: "0.0", count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function fetchPageData() {
      const projectName = "별을 기억한다는 것은";

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

  const filterSpoiler = (text: string) => {
    if (!text) return "";
    const spoilerWords = ["사진", "편지", "이미지", "미래", "모습", "노후", "노인"];
    const regex = new RegExp(spoilerWords.join("|"), "g");
    return text.replace(regex, "■■");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* 상단 타이틀 안내 */}
        <div className="text-center md:text-left mb-16">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Portfolio & Records</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-4">제작 프로젝트 및 탐험 기록</h2>
          <p className="text-slate-500 font-medium text-base break-keep">
            공간이 전하는 서사 위에 남겨진 탐험가들의 생생한 발자국입니다. 실제 피드백을 실시간으로 투명하게 반영합니다.
          </p>
        </div>

        {/* 메인 프로젝트 요약 및 후기 대시보드 */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-12 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <div>
              <span className="text-primary text-xs font-black uppercase tracking-widest block mb-1">Epic 01. Live</span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">별을 기억한다는 것은</h3>
            </div>
            <span className="bg-blue-50 text-primary text-xs font-bold px-4 py-2 rounded-xl">진행중</span>
          </div>

          {/* 대시보드 정렬: 좌 통계 / 우 스크롤 피드 */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* 좌측 박스 */}
            <div className="bg-slate-950 text-white p-8 rounded-3xl flex flex-col items-center justify-center min-w-[260px] text-center lg:sticky lg:top-24 h-fit">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Average Score</span>
              <div className="text-5xl font-black mb-1 text-white">{stats.avg}</div>
              <div className="flex gap-0.5 mb-4 text-amber-400 text-lg">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(Number(stats.avg)) ? "text-amber-400" : "text-slate-800"}>★</span>
                ))}
              </div>
              <span className="bg-white/10 text-slate-300 text-xs font-bold px-4 py-1 rounded-full">
                {stats.count.toLocaleString()} 명의 기록 보관됨
              </span>
            </div>

            {/* 우측 피드 */}
            <div className="flex-1 flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.length > 0 ? (
                reviews.map((item) => (
                  <div key={item.id} className="bg-slate-50/60 border border-slate-100 p-6 rounded-2xl hover:border-blue-100 hover:bg-slate-50/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-0.5 text-amber-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < item.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{maskName(item.name)} 탐험가</span>
                    </div>
                    <p className="text-slate-800 text-sm md:text-base font-bold leading-relaxed break-keep">
                      {filterSpoiler(item.review)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-48 border border-slate-200 border-dashed rounded-2xl flex items-center justify-center text-slate-400 font-medium italic">
                  새로운 탐험 기록을 기다리고 있습니다.
                </div>
              )}
            </div>
          </div>
          
          <p className="mt-8 text-slate-400 text-[10px] font-medium text-center md:text-left">
            * 스포일러 방지 필터가 작동 중입니다. 공간 내 주요 오브젝트나 반전 요소 관련 단어는 안전하게 블라이드 처리(■■)됩니다.
          </p>
        </div>

      </div>
    </div>
  );
}