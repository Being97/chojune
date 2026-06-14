// app/sns/page.tsx
"use client";

export default function SnsPage() {
  const feeds = [
    { id: 1, title: "EP.01 '우주비행사 선발 시험' 비하인드 오브젝트 컷 대공개", date: "2026.06.12", tags: "#공간디자인 #세트제작" },
    { id: 2, title: "체험 만족도 4.9의 비밀: 몰입을 더하는 특수 음향 엔지니어링 인터뷰", date: "2026.06.08", tags: "#인사이드조준 #오디오디자인" },
    { id: 3, title: "[이벤트] 6월 한정 테마 시놉시스 공유하고 비밀 초대권 받기", date: "2026.06.01", tags: "#프로젝트오픈 #이벤트" },
    { id: 4, title: "조준 스튜디오가 양평동 Campus D 서울에 둥지를 틀기까지의 여정", date: "2026.05.20", tags: "#브랜드스토리" },
    { id: 5, title: "얼리버드 티켓 전석 매진 안내 및 2차 티켓팅 오픈 공지", date: "2026.05.15", tags: "#공지사항" },
    { id: 6, title: "현실의 경계를 허무는 사람들: 조준 크루 채용설명회 D-7", date: "2026.05.02", tags: "#크루채용" }
  ];

  return (
    <div className="bg-white py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* 헤더 */}
        <div className="text-center md:text-left mb-16">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Our Channels</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-4">소셜 미디어 피드</h2>
          <p className="text-slate-500 font-medium">인스타그램 공식 채널(@chojune_official)의 최신 소식과 제작 일지를 공유합니다.</p>
        </div>

        {/* 토스 갤러리 그리드 레이아웃 (6열) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {feeds.map((f) => (
            <div 
              key={f.id} 
              className="group relative aspect-square bg-slate-900 rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end p-8"
            >
              {/* 이미지 오버레이 (실제 연동 시 src 배경 배치) */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-20 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[10px] font-bold text-primary tracking-wider block mb-2">{f.tags}</span>
                <h4 className="text-base md:text-lg font-bold text-white mb-2 leading-snug tracking-tight break-keep">
                  {f.title}
                </h4>
                <p className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
                  {f.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}