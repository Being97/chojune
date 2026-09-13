"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase"; // 프로젝트 경로에 맞게 '@/lib/supabase'로 수정 가능

interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  thumbnail?: string;
  description?: string;
  reservationDescription?: string;
  [key: string]: unknown;
}

function ReviewFormContent() {
  const searchParams = useSearchParams();
  // URLQuery: ?projectId=2602
  const projectId = searchParams.get("projectId");

  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    rating: 5,
    review: "",
  });

  // 프로젝트 정보 조회 (제시해주신 Notion API 연동)
  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/notion/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");

        const data = await res.json();
        // API에서 반환하는 { projects: [...] } 처리
        const projectsList: ProjectData[] = data.projects || [];

        // URL의 projectId와 일치하는 프로젝트 찾기 (projectId 또는 id 비교)
        const found = Array.isArray(projectsList)
          ? projectsList.find(
              (p) =>
                String(p.projectId) === String(projectId) ||
                String(p.id) === String(projectId)
            )
          : null;

        if (found) {
          setProjectData(found);
        } else {
          setProjectData({
            id: String(projectId),
            projectId: String(projectId),
            title: `프로젝트 #${projectId}`,
            description: "소중한 참여 후기를 남겨주세요.",
          });
        }
      } catch (err) {
        console.error("Project fetch error:", err);
        setProjectData({
          id: String(projectId),
          projectId: String(projectId),
          title: `프로젝트 #${projectId}`,
          description: "소중한 참여 후기를 남겨주세요.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.review.trim() || !form.phone_number.trim()) {
      return alert("모든 항목을 입력해주세요!");
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert([
        {
          name: form.name.trim(),
          phone_number: form.phone_number.trim(),
          rating: Number(form.rating),
          review: form.review.trim(),
          project: projectData?.title || `프로젝트 #${projectId}`,
          projectId: String(projectId),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      alert("소중한 후기가 등록되었습니다. 감사합니다!");
      setForm({ name: "", phone_number: "", review: "", rating: 5 });
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("전송에 실패했습니다. 데이터를 다시 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600 font-black tracking-widest text-sm">
        프로젝트 정보를 불러오는 중...
      </div>
    );
  }

  // URL 파라미터에 projectId가 없는 경우 Access Restricted 안내
  if (!projectId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-900/5 text-center">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase bg-red-50 px-4 py-1.5 rounded-full mb-4 inline-block">
            Access Restricted
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-3">
            참여자 전용 페이지입니다
          </h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            해당 프로젝트 참여자에게 전달된 전용 링크를 통해 접속해 주세요.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all"
          >
            메인 페이지로 이동
          </Link>
        </div>
      </main>
    );
  }

  const displayDescription =
    projectData?.description ||
    projectData?.reservationDescription ||
    "탐험가님의 소중한 기록을 들려주세요.";

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden">
        
        {/* 대표 메인사진이 존재하는 경우 카드 상단에 노출 */}
        {projectData?.thumbnail && (
          <div className="relative w-full h-48 bg-slate-100">
            <Image
              src={projectData.thumbnail}
              alt={projectData.title || "프로젝트 이미지"}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-blue-600 px-3 py-1 rounded-full inline-block mb-1">
                PROJECT #{projectId}
              </span>
              <h2 className="text-lg font-bold line-clamp-1">{projectData.title}</h2>
            </div>
          </div>
        )}

        <div className="p-8 md:p-10">
          {!projectData?.thumbnail ? (
            <div className="text-center mb-8">
              <span className="text-blue-600 text-[10px] font-bold tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-full mb-4 inline-block">
                PROJECT #{projectId}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                {projectData?.title || "참여 후기 남기기"}
              </h1>
              <p className="text-slate-500 text-sm">{displayDescription}</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <p className="text-slate-500 text-sm">{displayDescription}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                Player Name
              </label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                placeholder="성함을 입력해주세요"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                Contact (Phone)
              </label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                placeholder="010-0000-0000"
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                Rating
              </label>
              <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setForm({ ...form, rating: num })}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                      form.rating === num
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                Feedback
              </label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all text-sm placeholder:text-slate-300"
                placeholder="경험하신 소중한 피드백을 남겨주세요."
                value={form.review}
                onChange={(e) => setForm({ ...form, review: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] mt-4 text-sm ${
                isSubmitting
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              }`}
            >
              {isSubmitting ? "전송 중..." : "후기 등록하기"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-slate-400 text-[11px] font-medium hover:text-blue-600 transition underline underline-offset-4"
            >
              메인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProjectReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600 font-black tracking-widest text-sm">
          로딩 중...
        </div>
      }
    >
      <ReviewFormContent />
    </Suspense>
  );
}