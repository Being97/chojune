// app/api/notion/portfolio/route.ts

import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { getText, getFiles } from "@/lib/notion-utils";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    const dataSourceId =
      process.env.NOTION_PORTFOLIO_DATASOURCE_ID ||
      process.env.NOTION_RESERVATION_PROJECTS_DATASOURCE_ID;

    if (!dataSourceId) {
      return NextResponse.json({ error: "Missing Notion Data Source ID" }, { status: 500 });
    }

    const res = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
    });

    if (!res.results || res.results.length === 0) return NextResponse.json([]);

    const projects = res.results.map((page: any) => {
      const props = page.properties;

      const mainImages = getFiles(props["메인사진"]) || getFiles(props["썸네일"]) || [];
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

      // 🔄 Ongoing 체크박위 파싱 ("진행 중" / "완료")
      const ongoingProp = props["Ongoing"];
      let isOngoing = false;
      if (ongoingProp && ongoingProp.type === "checkbox") {
        isOngoing = Boolean(ongoingProp.checkbox);
      }
      const currentStatus = isOngoing ? "진행 중" : "완료";

      // 🎟️ 예약Open 체크박스 파싱
      const reservationOpenProp = props["예약Open"] || props["예약 Open"];
      const reservationOpen =
        reservationOpenProp && reservationOpenProp.type === "checkbox"
          ? Boolean(reservationOpenProp.checkbox)
          : false;

      // 안내문구 (메인/포트폴리오 설명)
      const descriptionText = getText(props["안내문구"]) || getText(props["설명"]);

      // 예약설명 & 예약주의사항
      const reservationDescription = getText(props["예약설명"]);
      const noticeText = getText(props["예약주의사항"]) || getText(props["주의사항"]);

      return {
        id: page.id,
        projectId: getText(props["project_id"]) || getText(props["프로젝트ID"]) || page.id,
        project: getText(props["프로젝트명"]) || getText(props["프로젝트"]),
        active: currentStatus,
        isOngoing: isOngoing,
        reservationOpen: reservationOpen,
        date: parsedDate,
        location: getText(props["장소"]),
        organizer: getText(props["주관기관"]),
        participants: Number(getText(props["참여인원"])) || 0,
        rating: Number(getText(props["만족도"])) || 0,
        mainImage: mainImages.length > 0 ? mainImages : "",
        activityImages: Array.isArray(activityImages) ? activityImages : activityImages ? [activityImages] : [],
        description: descriptionText || "",
        reservationDescription: reservationDescription || "",
        notice: noticeText || "",
      };
    });

    return NextResponse.json(projects);
  } catch (e) {
    console.error("노션 포트폴리오/프로젝트 연동 에러:", e);
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 });
  }
}
