// app/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Link from "next/link";

// 리뷰 데이터의 타입을 정의합니다.
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
  const [bestReview, setBestReview] = useState<Review | null>(null);

  useEffect(() => {
    async function fetchPageData() {
      const projectName = "별을 기억한다는 것은";

      // 1. 전체 평점 및 리뷰 수 가져오기
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

      // 2. 가장 최근의 별점 5점 리뷰 1개 가져오기
      const { data: topReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("project", projectName)
        .eq("rating", 5)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (topReview) setBestReview(topReview);
    }
    fetchPageData();
  }, []);

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (!name) return "";
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <main className="max-w-5xl mx-auto p-8 py-20 min-h-screen">
      {/* 회사 및 브랜드 소개 섹션 */}
      <section className="mb-24">
        <h2 className="text-5xl font-black mb-6 leading-tight tracking-tighter">
          경험을 넘어선 몰입,
          <br />
          우리는 <span className="text-red-600">조준</span>합니다.
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed font-medium">
          '조준(CHOJUNE)'은 단순한 게임을 넘어, 참여자가 이야기의 주인공이 되는
          몰입형 공간 콘텐츠를 만듭니다. 현실과 가상의 경계를 허무는 우리만의
          세계관 속에서 잊지 못할 순간을 경험하세요.
        </p>
      </section>

      {/* 현재 진행 중인 프로젝트 카드 */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-2xl">
        {/* 상태 태그 */}
        <div className="absolute top-0 right-0 p-8">
          <span className="bg-red-600 text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse tracking-widest">
            NOW OPEN
          </span>
        </div>

        <div className="max-w-full relative z-10">
          <h3 className="text-zinc-500 font-bold mb-3 uppercase tracking-[0.2em] text-xs">
            Ongoing Project
          </h3>
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">
            별을 기억한다는 것은
          </h2>

          <div className="flex flex-wrap gap-3 mb-10 text-sm">
            <div className="bg-zinc-800/50 border border-zinc-700/50 px-5 py-2.5 rounded-2xl text-zinc-300 font-medium">
              📅 2026.05.09 — 06.06
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 px-5 py-2.5 rounded-2xl text-zinc-300 font-medium">
              📍 몰입형 방탈출
            </div>
          </div>

          <p className="text-zinc-400 mb-12 text-lg leading-relaxed italic border-l-2 border-red-600 pl-6">
            "기억은 사라져도 빛은 남는다."
            <br />
            <span className="not-italic text-base inline-block mt-2">
              밤하늘의 별들이 하나둘 사라지기 시작한 도시. 당신은 마지막 별의
              기억을 찾아 떠나는 여정에 초대되었습니다. 60분간 펼쳐지는 감성
              미스터리 스릴러.
            </span>
          </p>

          {/* 평점 및 리뷰 가로 나란히 배치 섹션 */}
          <div className="flex flex-col md:flex-row items-stretch gap-6 mt-12 w-full">
            {/* 좌측: 평균 별점 카드 */}
            <div className="bg-black/40 border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center min-w-[240px] md:w-1/3 shadow-inner">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                Average Rating
              </span>
              <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                {stats.avg}
              </div>
              <div className="flex gap-1 mb-4 text-red-600 text-xl">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.floor(Number(stats.avg))
                        ? "text-red-600"
                        : "text-zinc-800"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-tighter">
                {stats.count.toLocaleString()} Players
              </span>
            </div>

            {/* 우측: 최신 베스트 후기 박스 */}
            {bestReview ? (
              <div className="flex-1 bg-red-600/5 border border-red-600/10 p-8 md:p-10 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                {/* 배경 장식용 따옴표 아이콘 */}
                <div className="absolute top-6 right-8 opacity-10 text-red-600 transition-transform group-hover:scale-110 duration-500">
                  <svg
                    width="60"
                    height="60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V5C14.017 4.44772 14.4647 4 15.017 4H19.017C20.6739 4 22.017 5.34315 22.017 7V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.01695 21L2.01695 18C2.01695 16.8954 2.91238 16 4.01695 16H7.01695C7.56923 16 8.01695 15.5523 8.01695 15V9C8.01695 8.44772 7.56923 8 7.01695 8H3.01695C2.46467 8 2.01695 7.55228 2.01695 7V5C2.01695 4.44772 2.46467 4 3.01695 4H7.01695C8.6738 4 10.017 5.34315 10.017 7V15C10.017 18.3137 7.33025 21 4.01695 21H2.01695Z" />
                  </svg>
                </div>

                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  Latest Field Report
                </span>

                <p className="text-zinc-200 text-lg md:text-2xl font-bold leading-relaxed italic mb-6 relative z-10">
                  "{bestReview.review}"
                </p>

                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-1 h-4 bg-red-600"></div>
                  <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                    Explorer {maskName(bestReview.name)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-zinc-800/20 border border-zinc-800/50 p-8 rounded-[2rem] flex items-center justify-center text-zinc-600 italic">
                데이터를 불러오고 있거나, 첫 번째 탐험가의 기록을 기다리고
                있습니다.
              </div>
            )}
          </div>

          <p className="mt-8 text-zinc-600 text-[10px] font-medium tracking-tight">
            * 실제 플레이를 완료한 탐험가들의 실시간 피드백 데이터입니다.
          </p>
        </div>

        {/* 배경 장식 요소 */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
      </section>
    </main>
  );
}
