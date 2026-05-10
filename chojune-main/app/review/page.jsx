//app/review/page.jsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import Link from "next/link";

function ReviewForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    rating: 5,
    review: "",
    project: "",
  });

  useEffect(() => {
    const projectFromUrl = searchParams.get("project") || "일반 참여";
    setForm((prev) => ({ ...prev, project: projectFromUrl }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.review || !form.phone_number) {
      return alert("모든 항목을 입력해주세요!");
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert([
        {
          name: form.name,
          phone_number: form.phone_number,
          rating: Number(form.rating),
          review: form.review,
          project: form.project,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      alert("소중한 후기가 등록되었습니다. 감사합니다!");
      setForm({ ...form, name: "", phone_number: "", review: "", rating: 5 });
    } catch (error) {
      console.error("Error:", error);
      alert("전송에 실패했습니다. 데이터를 다시 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-900/5">
        <div className="text-center mb-8">
          <span className="text-blue-600 text-[10px] font-bold tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-full mb-4 inline-block">
            {form.project}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
            참여 후기 남기기
          </h1>
          <p className="text-slate-500 text-sm">
            탐험가님의 소중한 기록을 들려주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 입력 */}
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

          {/* 연락처 입력 */}
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

          {/* 평점 선택 (Rating) */}
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

          {/* 리뷰 내용 */}
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
            className={`w-full py-4.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98] mt-4 text-sm ${
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
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-blue-600 font-black tracking-widest">
          LOADING...
        </div>
      }
    >
      <ReviewForm />
    </Suspense>
  );
}
