"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

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

  // ⭐ 시각적 별점 컴포넌트 렌더러 (소수점 채우기 지원)
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
        
        {/* 헤더 */}
        <div className="text-center md:text-left mb-16">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Project Archive</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-4">프로젝트 아카이브</h2>
        </div>

        {/* 로딩 스켈레톤 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-200 animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : items.length > 0 ? (
          /* 카드 그리드 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const hasMainImage = item.mainImage && item.mainImage.startsWith("http");
              const isActive = item.active === "진행 중" || item.active === "진행중";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col"
                >
                  {/* 메인사진 커버 */}
                  {/* 💡 축소된contain 이미지가 돋보이도록 배경색을 부여하고 여백(p-4)을 적용했습니다. */}
                  <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 p-4">
                    {hasMainImage ? (
                      <Image
                        src={item.mainImage}
                        alt={item.project || "Project Image"}
                        fill
                        sizes="(max-w-768px) 100vw, 33vw"
                        priority={true} // 💡 LCP 성능 경고 해결을 위한 사전 로딩 추가
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" // 💡 object-contain으로 이미지 잘림 방지
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 text-center">
                        <span className="text-2xl">🖼️</span>
                        <span className="text-xs font-black tracking-wider text-slate-400">HERO*LAB ARCHIVE</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  {/* 카드 텍스트 메타 정보 */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* 상단 정렬 영역 */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-black tracking-tight ${
                            isActive ? "text-blue-600" : "text-slate-400"
                          }`}>
                            {isActive ? "진행 중" : "완료"}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {item.date || "기록 대기"}
                          </span>
                        </div>
                        
                        {/* 별점 이미지 + 숫자 표기 형태 유지 */}
                        {item.rating > 0 && (
                          <div className="flex items-center gap-1.5">
                            {renderStars(item.rating)}
                            <span className="text-xs font-black text-slate-700 mt-0.5">{item.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 break-keep">
                        {item.project}
                      </h3>
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
          <div className="text-center py-24 text-slate-400 font-semibold">
            등록된 포트폴리오가 없습니다.
          </div>
        )}

      </div>

      {/* 🔍 상세 보기 모달 (Modal) */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 transition-colors"
            >
              ✕
            </button>

            {/* 모달 상단 */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`text-xs font-black ${
                selectedItem.active === "진행 중" || selectedItem.active === "진행중" ? "text-blue-600" : "text-slate-400"
              }`}>
                {selectedItem.active || "완료"}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {selectedItem.date || "진행중"}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 break-keep">
              {selectedItem.project}
            </h2>

            {/* 주요 정보 메타 태그 */}
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

            {/* 대표 메인사진 */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-8 bg-slate-950 flex items-center justify-center">
              {selectedItem.mainImage && selectedItem.mainImage.startsWith("http") ? (
                <Image
                  src={selectedItem.mainImage}
                  alt={selectedItem.project || "Project Image"}
                  fill
                  sizes="(max-w-768px) 100vw, 33vw"
                  priority={true} // 💡 LCP 성능 경고 해결을 위한 사전 로딩 추가
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" // 💡 object-contain으로 이미지 잘림 방지
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-semibold text-slate-400">등록된 메인 이미지가 없습니다.</span>
                </div>
              )}
            </div>

            {/* 활동사진 갤러리 */}
            {selectedItem.activityImages && selectedItem.activityImages.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  📸 활동 기록 갤러리
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.activityImages.map((img, idx) => {
                    const isUrlValid = img && img.startsWith("http");
                    if (!isUrlValid) return null;

                    return (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50">
                        <Image
                          src={img}
                          alt={`${selectedItem.project} 활동사진 ${idx + 1}`}
                          fill
                          // 💡 활동사진 레이아웃 구조에 맞는 최적화된 sizes 명시 (경고 방지)
                          sizes="(max-w-768px) 50vw, 384px"
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}