/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { getText, getFiles } from "@/lib/notion-utils";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 프로퍼티 값 안전 추출 유틸리티
const getPropValue = (prop: any): any => {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
    case "rich_text":
      return getText(prop);
    case "number":
      return prop.number ?? 0;
    case "select":
      return prop.select?.name ?? "";
    case "multi_select":
      return prop.multi_select?.map((s: any) => s.name) ?? [];
    case "status":
      return prop.status?.name ?? "";
    case "checkbox":
      return prop.checkbox ?? false;
    case "date":
      return prop.date ?? null;
    case "files":
      return getFiles(prop);
    case "relation":
      return prop.relation?.map((r: any) => r.id) || [];
    default:
      return getText(prop);
  }
};

// Notion Data Source / Database 전체 페이징 조회 헬퍼
async function fetchAllDataSources(dataSourceId: string) {
  let results: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  while (hasMore) {
    const response: {
      results: any[];
      has_more: boolean;
      next_cursor: string | null;
    } = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: startCursor,
      page_size: 100,
    });

    results = results.concat(response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor ?? undefined;
  }

  return results;
}

// GET: Projects 전체 데이터 조회
export async function GET() {
  try {
    const projectsDbId = process.env.NOTION_RESERVATION_PROJECTS_DATASOURCE_ID;

    if (!projectsDbId) {
      return NextResponse.json(
        { error: "Missing NOTION_RESERVATION_PROJECTS_DATASOURCE_ID environment variable" },
        { status: 500 }
      );
    }

    const projectsRaw = await fetchAllDataSources(projectsDbId);

    const projects = projectsRaw.map((page: any) => {
      const props = page.properties;

      // 썸네일/메인사진 파싱
      let thumbnail = "";
      const filesVal = getFiles(props["메인사진"]) || getFiles(props["썸네일"]);
      if (Array.isArray(filesVal) && filesVal.length > 0) {
        thumbnail = filesVal[0];
      } else if (typeof filesVal === "string") {
        thumbnail = filesVal;
      }

      // 날짜 범위 파싱
      const dateObj = getPropValue(props["날짜"]);
      let startDate = "";
      let endDate = "";

      if (dateObj && typeof dateObj === "object") {
        startDate = dateObj.start || "";
        endDate = dateObj.end || startDate;
      } else if (typeof dateObj === "string") {
        startDate = dateObj;
        endDate = dateObj;
      }

      return {
        id: page.id,
        projectId: getPropValue(props["project_id"]) || getPropValue(props["프로젝트ID"]) || page.id,
        title: getPropValue(props["프로젝트명"]) || getPropValue(props["프로젝트"]) || "제목 없음",
        reservationOpen: Boolean(getPropValue(props["예약Open"]) ?? getPropValue(props["예약 Open"])),
        isOngoing: Boolean(getPropValue(props["Ongoing"])),
        startDate,
        endDate,
        reservationDescription: getPropValue(props["예약설명"]) || "",
        description: getPropValue(props["안내문구"]) || getPropValue(props["설명"]) || "",
        notice: getPropValue(props["예약주의사항"]) || getPropValue(props["주의사항"]) || "",
        location: getPropValue(props["장소"]) || "",
        organizer: getPropValue(props["주관기관"]) || "",
        thumbnail,
        // 필요시 raw properties 전체를 그대로 넘겨서 활용 가능합니다.
        // rawProperties: props,
      };
    });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch projects data";
    console.error("Notion projects fetch error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}