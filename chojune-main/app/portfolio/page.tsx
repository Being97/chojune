// app/portfolio/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface PortfolioItem {
  id: string;
  projectId?: string;
  project: string;
  active: string;
  isOngoing?: boolean;
  reservationOpen?: boolean;
  date: string;
  location: string;
  organizer: string;
  participants: number;
  rating: number;
  mainImage: string;
  activityImages: string[];
  description?: string;
  reservationDescription?: string;
  notice?: string;
}

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  review: string;
  project: string;
  created_at: string;
}

// 💬 모달 내 프로젝트별 후기 조회 및 페이지네이션 컴포넌트 (읽기 전용)
function ProjectReviews({ projectName }: { projectName: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 3; // 페이지당 표시할 후기 개수

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("project", projectName)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase reviews fetch error:", error);
        } else {
          setReviews(data || []);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [projectName]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return reviews.slice(start, start + ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

  const maskName = (name: string) => {
    if (!name) return "탐험가";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const numRating = Number(rating) || 5;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= numRating ? "text-amber-500" : "text-slate-200"}>
          ★
        </span>
      );
    }
    return <span className="flex gap-0.5 text-xs">{stars}</span>;
  };

  return (
    <div className="mt-10 pt-8 border-t border-slate-100">
      <div className="mb-6">
        <h4 className="text-base font-black text-slate-900">💬 탐험가 후기 ({reviews.length})</h4>
        <p className="text-xs text-slate-400 mt-0.5">프로젝트 참여자들이 직접 작성한 후기입니다.</p>
      </div>

      {/* 후기 리스트 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400">
          <p className="text-xs font-bold">등록된 후기가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedReviews.map((item) => (
            <div key={item.id || item.created_at} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderStars(item.rating)}
                  <span className="text-xs font-bold text-slate-700">{maskName(item.name)}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                {item.review}
              </p>
            </div>
          ))}

          {/* 📄 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                이전
              </button>

              <span className="text-xs font-bold text-slate-500 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotionPortfolio() {
      try {
        const res = await fetch("/api/notion/portfolio", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch (err) {
        console.error("포트폴리오 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotionPortfolio();
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fillPercentage = Math.min(Math.max(rating - (i - 1), 0), 1) * 100;

      stars.push(
        <div key={i} className="relative text-slate-200 text-lg sm:text-base selection:bg-transparent select-none">
          <span>★</span>
          <div
            className="absolute top-0 left-0 text-amber-500 overflow-hidden whitespace-nowrap"
            style={{ width: `${fillPercentage}%` }}
          >
            ★
          </div>
        </div>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center md:text-left mb-16">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Project Archive</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-4">프로젝트 아카이브</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-slate-200 animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {items.map((item) => {
              const hasMainImage = item.mainImage && typeof item.mainImage === "string" && item.mainImage.startsWith("http");
              const isActive = item.active === "진행 중" || item.active === "진행중" || Boolean(item.isOngoing);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  <div className="relative w-full min-h-[340px] sm:min-h-[380px] md:min-h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
                    {hasMainImage ? (
                      <Image
                        src={item.mainImage}
                        alt={item.project || "Project Image"}
                        fill
                        sizes="(max-w-768px) 100vw, 33vw"
                        priority={true}
                        className="object-contain p-2 group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 text-center">
                        <span className="text-3xl">🖼️</span>
                        <span className="text-xs font-black tracking-wider text-slate-400">HERO*LAB ARCHIVE</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-white border-t border-slate-50">
                    <div>
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black tracking-tight ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                              {isActive ? "진행 중" : "완료"}
                            </span>
                            {item.reservationOpen && (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-600 text-white animate-pulse">
                                예약 가능
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 break-keep">{item.date || "기록 대기"}</span>
                        </div>
                        {item.rating > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {renderStars(item.rating)}
                            <span className="text-xs font-black text-slate-700 mt-0.5">{item.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 break-keep">
                        {item.project}
                      </h3>
                      {item.description && (
                        <p className="text-slate-500 text-xs font-medium mt-2 line-clamp-2 break-keep">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-400">
                      <span>📍 {item.location || "공간 한정"}</span>
                      <span className="text-right max-w-[50%] truncate">{item.organizer || "자체 기획"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400 font-semibold">등록된 포트폴리오가 없습니다.</div>
        )}
      </div>

      {/* 🔍 상세 보기 모달 */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 transition-colors"
            >
              ✕
            </button>

            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${selectedItem.active === "진행 중" || selectedItem.active === "진행중" || selectedItem.isOngoing ? "text-blue-600" : "text-slate-400"}`}>
                  {selectedItem.active || "완료"}
                </span>
                {selectedItem.reservationOpen && (
                  <span className="px-2.5 py-0.5 text-[11px] font-black rounded-full bg-blue-600 text-white">
                    🎟️ 예약 Open
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-400 break-keep">{selectedItem.date || "진행중"}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 break-keep">{selectedItem.project}</h2>

            {selectedItem.description && (
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedItem.description}
              </p>
            )}

            {/* 예약 Open 버튼 */}
            {selectedItem.reservationOpen && (
              <div className="mb-6">
                <Link
                  href="/reservation"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-6 rounded-2xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-98"
                >
                  <span>🎟️ 지금 예약 신청하기</span>
                  <span>→</span>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl mb-8 text-xs font-medium">
              <div>
                <span className="block text-slate-400 mb-1">📍 장소</span>
                <span className="font-bold text-slate-800">{selectedItem.location || "-"}</span>
              </div>
              <div>
                <span className="block text-slate-400 mb-1">🏛️ 주관기관</span>
                <span className="font-bold text-slate-800">{selectedItem.organizer || "자체 기획"}</span>
              </div>
              <div>
                <span className="block text-slate-400 mb-1">👥 참여인원</span>
                <span className="font-bold text-slate-800">{selectedItem.participants ? `${selectedItem.participants.toLocaleString()}명` : "0명"}</span>
              </div>
              <div>
                <span className="block text-slate-400 mb-1">⭐ 만족도</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {renderStars(selectedItem.rating)}
                  <span className="font-black text-slate-800 text-[11px]">{selectedItem.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden mb-8 bg-slate-950 flex items-center justify-center border border-slate-200">
              {selectedItem.mainImage && typeof selectedItem.mainImage === "string" && selectedItem.mainImage.startsWith("http") ? (
                <img src={selectedItem.mainImage} alt={selectedItem.project || "Project Poster"} className="w-full h-auto object-contain max-h-none block" />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2 py-20 bg-slate-950 w-full">
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-semibold text-slate-400">등록된 메인 이미지가 없습니다.</span>
                </div>
              )}
            </div>

            {selectedItem.activityImages && selectedItem.activityImages.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">📸 활동 기록 갤러리</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.activityImages.map((img, idx) => {
                    if (!img || !img.startsWith("http")) return null;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveZoomImage(img)}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 cursor-zoom-in group/img"
                      >
                        <Image src={img} alt={`${selectedItem.project} 활동사진 ${idx + 1}`} fill sizes="(max-w-768px) 50vw, 384px" className="object-cover group-hover/img:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">🔍</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 💬 선택된 프로젝트 후기 조회 컴포넌트 */}
            <ProjectReviews projectName={selectedItem.project} />
          </div>
        </div>
      )}

      {/* 🖼️ 활동사진 확대 서브 모달 */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-zoom-out" onClick={() => setActiveZoomImage(null)}>
          <button onClick={() => setActiveZoomImage(null)} className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl font-bold transition-colors">
            ✕
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={activeZoomImage} alt="확대된 활동 사진" fill sizes="100vw" className="object-contain select-none rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
