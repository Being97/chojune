// app/components/SnsFeedSection.tsx

"use client";

import Image from "next/image";

export interface InstagramPost {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
}

interface SnsFeedSectionProps {
  posts: InstagramPost[];
}

export default function SnsFeedSection({ posts }: SnsFeedSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {posts.map((post) => (
        <a
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          {/* 1. 정사각형 미디어 이미지 영역 */}
          <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
            <Image
              src={post.mediaUrl}
              alt={post.caption || "Instagram Post"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized // 인스타 CDN 보안 정책상 썸네일 주소가 수시로 바뀌므로 unoptimized를 주면 에러가 안 납니다.
            />
            
            {/* 비디오/멀티이미지 배지 */}
            {post.mediaType !== "IMAGE" && (
              <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white z-10">
                {post.mediaType === "VIDEO" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                )}
              </div>
            )}

            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-slate-900 shadow-sm">
                자세히 보기
              </span>
            </div>
          </div>

          {/* 2. 하단 텍스트 영역 */}
          <div className="p-4">
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[2.5rem] mb-3 whitespace-pre-line">
              {post.caption || "프로젝트조준의 새 소식이 등록되었습니다."}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
              <span>
                {new Date(post.timestamp).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-blue-500 font-semibold group-hover:underline">Instagram ↗</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}