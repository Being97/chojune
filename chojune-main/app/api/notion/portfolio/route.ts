// app/api/notion/portfolio/route.ts

import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { getText, getFiles } from "@/lib/notion-utils";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
      const res = await notion.dataSources.query({
      data_source_id: process.env.NOTION_PORTFOLIO_DATASOURCE_ID!
    });
    
    if (res.results.length === 0) return NextResponse.json([]);

    const projects = res.results.map((page: any) => {
      const props = page.properties;
      
      const mainImages = getFiles(props["메인사진"]) || [];
      const activityImages = getFiles(props["활동사진"]) || [];

      // 📅 날짜 파싱 로직
      const dateProp = props["날짜"];
      let parsedDate = "";
      
      if (dateProp && dateProp.type === "date" && dateProp.date) {
        const start = dateProp.date.start;
        const end = dateProp.date.end;
        parsedDate = end ? `${start} ~ ${end}` : start;
      } else {
        parsedDate = getText(dateProp) || "날짜 미정";
      }

      // Ongoing 체크박스 안전하게 파싱하기
      const activeProp = props["Ongoing"];
      let currentStatus = "완료"; // 기본값 (체크가 안 되어 있으면 완료)

      if (activeProp && activeProp.type === "checkbox") {
        // 체크박스가 true(V체크) 상태면 "진행 중", false면 "완료"
        currentStatus = activeProp.checkbox ? "진행 중" : "완료";
      } else {
        currentStatus = getText(activeProp) || "완료";
      }

      return {
        id: page.id,
        project: getText(props["프로젝트"]),
        active: currentStatus,
        date: parsedDate,
        location: getText(props["장소"]),
        organizer: getText(props["주관기관"]),
        participants: Number(getText(props["참여인원"])) || 0,
        rating: Number(getText(props["만족도"])) || 0,
        mainImage: mainImages.length > 0 ? mainImages : "",
        activityImages: activityImages,
      };
    });

    return NextResponse.json(projects);
  } catch (e) {
    console.error("노션 포트폴리오 연동 에러:", e);
    return NextResponse.json(e, { status: 500 });
  }
}