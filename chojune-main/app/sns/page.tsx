// app/sns/page.tsx




"use client";

import { useEffect, useState } from "react";
import SnsFeedSection, { InstagramPost } from "@/app/components/SnsFeedSection";

export default function SnsPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstagramFeeds() {
      try {
        const res = await fetch("/api/instagram");
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("인스타 피드 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInstagramFeeds();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* 상단 히어로 헤더 */}
      <section className="max-w-7xl mx-auto pt-24 pb-12 px-6 text-center md:text-left">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block mb-4">
          LIVE FEEDS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight mb-4">
          조준의 순간들을 정조준 📸
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl break-keep">
          오프라인 과학문화 스페이스부터 백스테이지 비하인드 스토리까지, 프로젝트조준과 HERO*LAB의 생생한 실시간 소식을 만나보세요.
        </p>
      </section>

      {/* 메인 피드 영역 */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {loading ? (
          /* 💡 로딩 상태일 때 뜨는 네모난 스켈레톤 카드 4개 */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl p-0 overflow-hidden animate-pulse">
                <div className="aspect-square w-full bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-md w-full" />
                  <div className="h-4 bg-slate-100 rounded-md w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/3 pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          /* 💡 인스타 피드 연동 성공 시 컴포넌트 출력 */
          <SnsFeedSection posts={posts} />
        ) : (
          /* 💡 토큰 만료 혹은 피드가 없을 때 안전핀 안내 뷰 */
          <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto">
            <span className="text-3xl block mb-4">✨</span>
            <h3 className="text-lg font-bold text-slate-800 mb-2">소식을 불러오는 중입니다</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto break-keep">
              실시간 동기화 채널을 연결하고 있거나 계정이 비어있습니다. 아래 링크를 통해 공식 인스타그램으로 직접 방문하실 수 있습니다.
            </p>
            <a
              href="https://instagram.com" // 실제 인스타 주소 기입
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm"
            >
              공식 인스타그램 바로가기 ↗
            </a>
          </div>
        )}
      </section>
    </div>
  );
}