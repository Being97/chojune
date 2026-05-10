// app/admin/page.jsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("전체");

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      alert("데이터를 불러오지 못했습니다.");
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 1. 프로젝트 목록 추출 (중복 제거)
  const projects = [
    "전체",
    ...new Set(reviews.map((r) => r.project || "미지정")),
  ];

  // 2. 필터링된 리뷰 (이 데이터가 테이블과 평점 계산의 기준이 됩니다)
  const filteredReviews =
    selectedProject === "전체"
      ? reviews
      : reviews.filter((r) => (r.project || "미지정") === selectedProject);

  // 3. 필터링된 프로젝트의 평균 평점 계산
  const averageRating =
    filteredReviews.length > 0
      ? (
          filteredReviews.reduce(
            (acc, curr) => acc + (Number(curr.rating) || 0),
            0,
          ) / filteredReviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-zinc-900 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* 상단 타이틀 섹션 */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900">
              CHOJUNE{" "}
              <span className="text-red-600 underline decoration-4 underline-offset-8">
                ADMIN
              </span>
            </h1>
            <p className="text-zinc-500 mt-3 font-medium">
              실시간 프로젝트 운영 및 플레이어 피드백 관리
            </p>
          </div>
          <button
            onClick={fetchReviews}
            className="bg-white border border-zinc-200 text-zinc-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <span>🔄</span> 데이터 새로고침
          </button>
        </header>

        {/* 필터 및 평점 요약 섹션 */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* 프로젝트 선택 드롭다운 */}
            <div className="flex-1">
              <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">
                Project
              </label>
              <select
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d1d5db'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='current' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1.25rem center",
                  backgroundSize: "1.5rem",
                }}
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 실시간 레이팅 정보 (필터 아래/옆 배치) */}
            <div className="flex flex-col items-center md:items-end justify-center min-w-[180px] border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 text-center md:text-right">
                {selectedProject} 평점
              </span>
              <div className="flex items-center gap-2">
                <span className="text-5xl font-black text-red-600 tracking-tighter">
                  {averageRating}
                </span>
                <div className="flex flex-col">
                  <span className="text-zinc-300 font-bold text-sm leading-none">
                    / 5.0
                  </span>
                  <span className="text-red-400 text-[10px] font-bold mt-1">
                    ★ Avg.
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-[11px] mt-2 font-semibold">
                총 {filteredReviews.length}건의 리뷰
              </p>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 섹션 */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-100">
                  <th className="p-5 pl-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center w-36">
                    Date
                  </th>
                  <th className="p-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center w-24">
                    Rating
                  </th>
                  <th className="p-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest w-40">
                    Player Info
                  </th>
                  <th className="p-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest w-44 text-center">
                    Contact
                  </th>
                  <th className="p-5 pr-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-32 text-center text-zinc-300 font-bold italic animate-pulse text-lg"
                    >
                      Loading secure data...
                    </td>
                  </tr>
                ) : filteredReviews.length > 0 ? (
                  filteredReviews.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      <td className="p-5 pl-10 text-xs text-zinc-400 font-mono text-center">
                        {new Date(r.created_at)
                          .toLocaleDateString("ko-KR", {
                            year: "2-digit",
                            month: "2-digit",
                            day: "2-digit",
                          })
                          .replace(/\s/g, "")}
                      </td>
                      <td className="p-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-zinc-900 text-white font-black text-[10px] px-2.5 py-1 rounded-md mb-1">
                            {r.rating}.0
                          </span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-[8px] ${i < (r.rating || 0) ? "text-red-500" : "text-zinc-200"}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-black text-zinc-800 text-sm tracking-tight">
                            {r.name}
                          </span>
                          <span className="text-[10px] text-red-500 font-bold tracking-tighter uppercase">
                            {r.project || "General"}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-zinc-500 text-xs text-center font-mono tracking-tighter bg-zinc-50/30">
                        {r.phone_number || "---"}
                      </td>
                      <td className="p-5 pr-10">
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 group-hover:bg-white group-hover:border-zinc-200 transition-all">
                          <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap italic">
                            "{r.review}"
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-32 text-center text-zinc-300 font-bold text-lg"
                    >
                      No reviews found for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
