// app/reservation/page.tsx
"use client";

import { useState } from "react";

export default function ReservationPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "reservation", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 임시 전송 프로세스 시뮬레이션
    setTimeout(() => {
      alert(`정상적으로 접수되었습니다.\n확인 메일이 ${form.email}로 발송됩니다.`);
      setForm({ name: "", email: "", phone: "", type: "reservation", message: "" });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* 상단 텍스트 */}
        <div className="text-center mb-12">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Connect with Us</span>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 mb-4">티켓 예약 및 제휴 문의</h2>
          <p className="text-slate-500 font-medium break-keep">
            에피소드 관람을 위한 사전 예약 신청이나, 브랜드 팝업 및 공간 활성화를 위한 B2B 협업 제안을 남겨주세요.
          </p>
        </div>

        {/* 폼 메인 */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">문의 구분</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "reservation", label: "프로젝트 관람 예약" },
                { id: "b2b", label: "공간 제휴 / B2B" },
                { id: "etc", label: "기타 일반 문의" }
              ].map((item) => (
                <button
                  key={item.id} type="button"
                  onClick={() => setForm({ ...form, type: item.id })}
                  className={`py-3.5 px-4 text-sm font-bold rounded-xl border text-center transition-all ${
                    form.type === item.id 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10" 
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">성함 또는 기업명</label>
              <input 
                type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-800 transition-colors"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">연락처</label>
              <input 
                type="tel" required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-800 transition-colors"
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">이메일 주소</label>
            <input 
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-800 transition-colors"
              placeholder="example@chojune.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">상세 접수 내용</label>
            <textarea 
              rows={5} required value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-800 transition-colors"
              placeholder={
                form.type === "reservation" 
                  ? "희망하는 관람 인원 수와 대략적인 일정을 함께 입력해 주세요." 
                  : "협업 제안 배경 및 핵심 내용을 간략히 기술해 주세요."
              }
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-xl transition-colors text-sm tracking-wide shadow-sm"
          >
            {loading ? "보안 세션 전송 중..." : "신청서 안전하게 제출하기"}
          </button>
        </form>
      </div>
    </div>
  );
}