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
      return prop.multi_select?.map((s: any) => s.name).join(", ") ?? "";
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

// dataSources 쿼리 헬퍼 (100개 데이터 제한 페이징 처리)
async function fetchAllDataSources(dataSourceId: string) {
  let results: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  while (hasMore) {
    const response = await (notion as any).dataSources.query({
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

// ==========================================
// 1. GET: 프로그램, 타임슬롯, 잔여 수량 조회
// ==========================================
export async function GET() {
  try {
    const programsDbId = process.env.NOTION_RESERVATION_PROGRAMS_DATASOURCE_ID;
    const timeslotsDbId = process.env.NOTION_RESERVATION_TIMESLOTS_DATASOURCE_ID;
    const reservationsDbId = process.env.NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID;

    if (!programsDbId || !timeslotsDbId || !reservationsDbId) {
      return NextResponse.json({ error: "Missing Notion Data Source IDs" }, { status: 500 });
    }

    // 데이터 전체 페이징 조회
    const [programsRaw, timeslotsRaw, reservationsRaw] = await Promise.all([
      fetchAllDataSources(programsDbId),
      fetchAllDataSources(timeslotsDbId),
      fetchAllDataSources(reservationsDbId),
    ]);

    // --- Programs 파싱 ---
    const programs = programsRaw
      .map((page: any) => {
        const props = page.properties;

        const title = getPropValue(props["프로젝트명"]) || "제목 없음";
        const isOpen = getPropValue(props["Open"]) ?? true;
        const description = getPropValue(props["설명"]) || "";
        const notice = getPropValue(props["주의사항"]) || "";

        let thumbnail = "";
        const filesVal = getFiles(props["썸네일"]);
        if (Array.isArray(filesVal) && filesVal.length > 0) {
          thumbnail = filesVal[0];
        } else if (typeof filesVal === "string") {
          thumbnail = filesVal;
        }

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
          title,
          isOpen,
          startDate,
          endDate,
          description,
          notice,
          thumbnail,
        };
      })
      .filter((p) => p.isOpen);

    // --- Timeslots 파싱 ---
    const timeslots = timeslotsRaw.map((page: any) => {
      const props = page.properties;

      const title = getPropValue(props["회차"]) || getPropValue(props["프로젝트명"]) || "회차";
      const maxCapacity = Number(getPropValue(props["정원"])) || 10;
      const projectIds = props["project_id"]?.relation?.map((r: any) => r.id) || [];
      const isTeamCapacity = Boolean(getPropValue(props["팀신청여부"]));

      return {
        id: page.id,
        name: title,
        maxCapacity,
        projectIds,
        isTeamCapacity,
      };
    });

    // --- Reservations 파싱 및 [날짜_회차] 기준 집계 ---
    // Key 구조: "2026-03-10_1회차(10:00)"
    const reservedCountsMap: Record<string, { totalGuests: number; teamCount: number }> = {};

    reservationsRaw.forEach((page: any) => {
      const props = page.properties;

      const status = getPropValue(props["예약상태"]) || "확정";
      // '취소' 상태 포함 시 계산에서 제외
      if (status.includes("취소")) return;

      const timeslotName = getPropValue(props["회차"]) || "";
      const dateObj = getPropValue(props["예약날짜"]);
      const reservedDate = typeof dateObj === "object" ? dateObj?.start || "" : String(dateObj || "");
      const count = Number(getPropValue(props["인원"])) || 1;
      const isTeamReservation = status.includes("팀");

      if (!timeslotName) return;

      // 날짜 정보가 있는 경우 "날짜_회차명", 없는 경우 "회차명"을 키로 사용
      const key = reservedDate ? `${reservedDate}_${timeslotName}` : timeslotName;

      if (!reservedCountsMap[key]) {
        reservedCountsMap[key] = { totalGuests: 0, teamCount: 0 };
      }

      reservedCountsMap[key].totalGuests += count;
      if (isTeamReservation) {
        reservedCountsMap[key].teamCount += 1;
      }
    });

    // --- 회차별 잔여 정원 계산 ---
    const processedTimeslots = timeslots.map((slot) => {
      // 1. 단일 키 조회 또는 모든 날짜 통산 누적 값 계산
      let totalGuests = 0;
      let teamCount = 0;

      // slot.name과 매칭되는 모든 reservedCountsMap 항목 누적
      Object.keys(reservedCountsMap).forEach((key) => {
        if (key.endsWith(`_${slot.name}`) || key === slot.name) {
          totalGuests += reservedCountsMap[key].totalGuests;
          teamCount += reservedCountsMap[key].teamCount;
        }
      });

      const reservedCount = slot.isTeamCapacity ? teamCount : totalGuests;
      const remainingCapacity = Math.max(0, slot.maxCapacity - reservedCount);
      const isSoldOut = remainingCapacity <= 0;

      return {
        ...slot,
        reservedCount,
        remainingCapacity,
        isSoldOut,
      };
    });

    return NextResponse.json({
      programs,
      timeslots: processedTimeslots,
      reservedCountsMap, // 프론트엔드에서 날짜별 잔여 석 세부 파싱이 필요할 경우 활용
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch reservation data";
    console.error("Notion reservation fetch error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ==========================================
// 2. POST: 예약 생성 및 서버 측 잔여 수량 검증
// ==========================================
export async function POST(req: Request) {
  try {
    const reservationsDbId = process.env.NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID;

    if (!reservationsDbId) {
      return NextResponse.json({ error: "Missing NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID" }, { status: 500 });
    }

    const body = await req.json();
    const { name, phone, email, timeslotId, programTitle, programId, count, message, selectedDate } = body;

    const requestCount = Number(count) || 1;

    if (!name || !phone || !timeslotId) {
      return NextResponse.json({ error: "이름, 연락처, 회차 정보는 필수입니다." }, { status: 400 });
    }

    let programNotionPageId = programId || "";
    let resolvedCustomProjectId = "";
    let resolvedProgramTitle = programTitle || "";
    let resolvedTimeslotName = "";
    let maxCapacity = 10;
    let isTeamCapacity = false;

    // 1. 회차(Timeslot) 노션 페이지 조회 및 정원 정보 추출
    try {
      const timeslotPage: any = await notion.pages.retrieve({ page_id: timeslotId });
      const timeslotProps = timeslotPage.properties;

      resolvedTimeslotName = getPropValue(timeslotProps["회차"]) || getPropValue(timeslotProps["프로젝트명"]) || "";
      maxCapacity = Number(getPropValue(timeslotProps["정원"])) || 10;
      isTeamCapacity = Boolean(getPropValue(timeslotProps["팀신청여부"]));

      if (!programNotionPageId) {
        const projectRelation = timeslotProps["project_id"]?.relation;
        if (Array.isArray(projectRelation) && projectRelation.length > 0) {
          programNotionPageId = projectRelation[0].id;
        }
      }

      // 2. 프로그램(Program) 노션 페이지 조회
      if (programNotionPageId) {
        try {
          const programPage: any = await notion.pages.retrieve({ page_id: programNotionPageId });
          const programProps = programPage.properties;

          resolvedCustomProjectId =
            getPropValue(programProps["project_id"]) ||
            getPropValue(programProps["프로젝트ID"]) ||
            programNotionPageId;

          if (!resolvedProgramTitle) {
            resolvedProgramTitle = getPropValue(programProps["프로젝트명"]) || "";
          }
        } catch {
          resolvedCustomProjectId = programNotionPageId;
        }
      }
    } catch (e) {
      console.warn("Timeslot fetch warning:", e);
    }

    // 3. 서버 측 잔여 수량 이중 검증 (동시성 및 초과 예약 방지)
    const allReservations = await fetchAllDataSources(reservationsDbId);

    let currentReservedCount = 0;
    allReservations.forEach((page: any) => {
      const props = page.properties;
      const status = getPropValue(props["예약상태"]) || "";
      if (status.includes("취소")) return;

      const tName = getPropValue(props["회차"]) || "";
      const dateObj = getPropValue(props["예약날짜"]);
      const resDate = typeof dateObj === "object" ? dateObj?.start || "" : String(dateObj || "");

      // 선택한 회차명 및 선택한 날짜(입력된 경우) 일치 여부 확인
      const isTimeslotMatch = tName === resolvedTimeslotName || tName === timeslotId;
      const isDateMatch = !selectedDate || resDate === selectedDate;

      if (isTimeslotMatch && isDateMatch) {
        if (isTeamCapacity) {
          currentReservedCount += 1;
        } else {
          currentReservedCount += Number(getPropValue(props["인원"])) || 1;
        }
      }
    });

    const remainingCapacity = maxCapacity - currentReservedCount;

    if (requestCount > remainingCapacity) {
      return NextResponse.json(
        { error: `선택하신 회차의 잔여 석(${Math.max(0, remainingCapacity)}석)이 부족합니다.` },
        { status: 400 }
      );
    }

    const nowIsoString = new Date().toISOString();

    // 4. Notion DB 프로퍼티 구성
    const newPageProperties: Record<string, any> = {
      프로젝트명: { title: [{ text: { content: resolvedProgramTitle || "프로젝트명 없음" } }] },
      project_id: { rich_text: [{ text: { content: resolvedCustomProjectId || "" } }] },
      회차: { rich_text: [{ text: { content: resolvedTimeslotName || String(timeslotId) } }] },
      created_at: { date: { start: nowIsoString } },
      예약자: { rich_text: [{ text: { content: name } }] },
      연락처: { rich_text: [{ text: { content: phone } }] },
      인원: { rich_text: [{ text: { content: String(requestCount) } }] },
      예약상태: { multi_select: [{ name: "예약신청" }] },
    };

    if (email) newPageProperties["이메일"] = { email };
    if (selectedDate) newPageProperties["예약날짜"] = { date: { start: selectedDate } };
    if (message) {
      newPageProperties["요청사항"] = { rich_text: [{ text: { content: message } }] };
    }

    // 5. 노션 페이지 생성
    const response = await notion.pages.create({
      parent: { data_source_id: reservationsDbId } as any,
      properties: newPageProperties,
    });

    return NextResponse.json({ success: true, pageId: response.id });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "예약 제출 중 오류가 발생했습니다.";
    console.error("Notion reservation submit error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}