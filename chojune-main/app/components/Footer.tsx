// app/components/Footer.tsx
"use client";
import Image from "next/image";


export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* 왼쪽: 브랜드 및 카피라이트 */}
        <div>
          
          <div className="flex gap-1 text-xl font-black text-white tracking-tight mb-3">
            <Image 
                src="/chojune_logo-removebg.png" 
                alt="CHOJUNE 로고 아이콘" 
                width={24}  // 텍스트 크기(text-xl = 20px)와 균형을 이루는 적절한 사이즈
                height={24} 
                style={{ height: "auto" }}
                className="object-contain"
              />
              <span>
                CHOJUNE
              </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            © 2026 Project Chojune. All Rights Reserved.
          </p>
        </div>

        {/* 오른쪽: 기업 법적 정보 표기 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-xs font-medium text-slate-400 leading-relaxed">
          <div>
            <span className="text-slate-500 mr-2">상호명</span> 프로젝트조준
          </div>
          <div>
            <span className="text-slate-500 mr-2">공동대표</span> 강솔빈, 이하은
          </div>
          <div>
            <span className="text-slate-500 mr-2">연락처</span> 010-4159-8923
          </div>
          <div>
            <span className="text-slate-500 mr-2">이메일</span> project.chojune@gmail.com
          </div>
          <div>
            <span className="text-slate-500 mr-2">Instagram</span> @project_chojune
          </div>
          <div className="sm:col-span-2 mt-2">
            <span className="text-slate-500 mr-2">주소</span> 서울특별시 영등포구 양평로21길 20 (캠퍼스디 서울)
          </div>
        </div>

      </div>
    </footer>
  );
}