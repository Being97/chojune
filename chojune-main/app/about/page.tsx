// app/about/page.tsx
"use client";

import Image from "next/image";

export default function AboutPage() {
  const values = [
    { num: "01", title: "공간의 이야기화", desc: "단순한 인테리어를 넘어 벽면의 질감 하나, 조명의 각도 하나에도 세계관과 서사를 부여합니다." },
    { num: "02", title: "완벽한 주체성", desc: "관객은 방관자가 아닙니다. 공간 안에서 내리는 모든 선택이 이야기의 결말을 바꿉니다." },
    { num: "03", title: "지속 가능한 여운", desc: "체험이 끝나고 문을 열고 나서는 순간, 현실이 조금은 다르게 보이는 차원이 다른 여운을 설계합니다." }
  ];

  // 연혁
  const history = [
    {
      year: "2026",
      // title: "대형 성과 및 독자 에피소드 확장",
      desc: (
        <ul className="list-disc pl-4 space-y-1 text-slate-500 text-sm font-medium">
          <li>(주)디알비 인터네셔널 협업 진행</li>
          <li>대덕특구 과학기술 성과 특별전시 운영 / 대전과학산업진흥원</li>
          <li>과학 방탈출 [헌터학교 입학시험], [SSS급 비밀동아리] 운영 / 대한민국 과학축제</li>
          <li>주니어 과학 방탈출 [별을 기억한다는 것은] 운영 / 캠퍼스디 서울</li>
        </ul>
      )
    },
    {
      year: "2025",
      // title: "정부 지원 사업 선정 및 스튜디오 출범",
      desc: (
        <ul className="list-disc pl-4 space-y-1 text-slate-500 text-sm font-medium">
          <li>민간 과학문화 활동 지원사업 선정 / 대전관광공사</li>
          <li>과학 방탈출 [닥터 카카오의 실험실] 운영</li>
          <li>프로젝트조준(CHOJUNE) 설립</li>
        </ul>
      )
    },
  ];

  // 대표
  const team = [
    {
      name: "이하은",
      role: "공동 대표",
      image: "/profile_lee.jpg",
      education: [
        "홍익대학교 기계공학 학사",
        "KAIST 산업디자인 석사"
      ],
      experience: [
        "(현) 과학커뮤니케이터 2년차",
        "(전) 국립중앙과학관 연구원"
      ]
    },
    {
      name: "강솔빈",
      role: "공동 대표",
      image: "/profile_kang.png",
      education: [
        "POSTECH 화학공학 학사"
      ],
      experience: [
        "(현) 과학커뮤니케이터 6년차",
        "(현) 국립중앙과학관 MOU",
        "(전) KBS '과학으로 보는 세상 SEE' MC"
      ]
    }
  ];

  return (
    <div className="bg-white">
      {/* 1. 비전 */}
      <section className="max-w-3xl mx-auto text-center py-24 md:py-36 px-6">
        <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs block mb-4">Our Philosophy</span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight mb-8 break-keep">
          우리는 현실 위에 
          <br />
          더 단단한 <span className="text-primary">세계관</span>을 조준합니다.
        </h2>
        <p className="text-slate-500 text-lg leading-relaxed font-medium break-keep">
          스크린 안의 가상 현실은 우리를 완전히 몰입시키지 못합니다. 
          조준은 손으로 만질 수 있는 거친 벽면, 코끝을 스치는 흙내음, 귓가를 울리는 미세한 진동 등 
          실제 물리적 공간 안에서 작동하는 가장 완벽한 형태의 몰입형 경험을 만듭니다.
        </p>
      </section>

      {/* 2. 핵심 가치 그리드 */}
      <section className="bg-slate-50 py-24 px-6 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center md:text-left">
            <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Core Values</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">조준이 경험을 설계하는 방식</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                <span className="text-4xl font-black text-blue-100 block mb-6">{v.num}</span>
                <h4 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">{v.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium break-keep">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 연혁 (Timeline) 섹션 */}
      <section className="max-w-3xl mx-auto py-24 px-6 border-b border-slate-100">
        <div className="mb-16 text-center">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">History</span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900">우리가 걸어온 발자취</h3>
        </div>

        <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-12">
          {history.map((h, i) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-primary bg-white group-hover:bg-primary transition-colors" />
              <div>
                <span className="text-xl font-black text-primary block mb-1 tracking-tight">{h.year}</span>
                {/* <h4 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">{h.title}</h4> */}
                <div className="text-slate-500 text-sm font-medium leading-relaxed break-keep">
                  {typeof h.desc === "string" ? <p>{h.desc}</p> : h.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 대표 및 크루 소개 섹션 추가 */}
      <section className="max-w-5xl mx-auto py-24 px-6 pb-36">
        <div className="mb-16 text-center">
          <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">People</span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900">현실을 확장하는 크리에이터</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {team.map((member, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col sm:flex-row gap-8 items-center sm:items-start group hover:shadow-md transition-shadow">
              
              {/* 프로필 이미지 영역 */}
              <div className="w-32 h-32 relative rounded-2xl overflow-hidden bg-slate-200 shrink-0 shadow-sm">
                <Image
                  src={member.image}
                  alt={`${member.name} 프로필`}
                  fill
                  sizes="500px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // 이미지 로드 실패 시 그레이 회색 배경으로 유지되도록 처리
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* 프로필 상세 정보 */}
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 justify-center sm:justify-start">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{member.name}</h4>
                    <span className="text-xs font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-md">{member.role}</span>
                  </div>
                </div>

                {/* 학력 정보 */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Education</span>
                  {member.education.map((edu, i) => (
                    <p key={i} className="text-slate-600 text-sm font-semibold tracking-tight">{edu}</p>
                  ))}
                </div>

                {/* 경력 및 이력 */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                  {member.experience.map((exp, i) => (
                    <p key={i} className="text-slate-500 text-xs font-medium leading-relaxed">{exp}</p>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>
    </div>
  );
}