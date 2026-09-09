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

// 주관식 또는 다양한 형태의 인원 값에서 숫자만 추출하는 유틸리티
function parseGuestCount(value: any): number {
  if (typeof value === "number") return isNaN(value) || value <= 0 ? 1 : value;
  if (!value) return 1;
  const str = String(value).trim();
  const matched = str.match(/\d+/);
  if (matched) {
    const num = parseInt(matched[0], 10);
    return isNaN(num) || num <= 0 ? 1 : num;
  }
  return 1;
}

// dataSources 쿼리 헬퍼 (100개 데이터 제한 페이징 처리)
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

// ==========================================
// 1. GET: 프로그램, 타임슬롯, 잔여 수량 조회
// ==========================================
export async function GET() {
  try {
    const programsDbId =
      process.env.NOTION_RESERVATION_PROGRAMS_DATASOURCE_ID ||
      process.env.NOTION_RESERVATION_PROJECTS_DATASOURCE_ID;
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
        const projectId =
          getPropValue(props["project_id"]) || getPropValue(props["프로젝트ID"]) || page.id;
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
          projectId,
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
      const time = getPropValue(props["시간"]) || "";
      const rawCapacity = getPropValue(props["정원"]);
      const maxCapacity = Number(rawCapacity) || 10;
      const isTeamCapacity = Boolean(getPropValue(props["팀신청여부"]));

      // projectIds: relation page ID, rich_text, 또는 프로젝트명에서 모든 식별자 수집
      const projectIdsSet = new Set<string>();

      if (props["project_id"]?.relation && Array.isArray(props["project_id"].relation)) {
        props["project_id"].relation.forEach((r: any) => r.id && projectIdsSet.add(r.id));
      }
      if (props["프로젝트"]?.relation && Array.isArray(props["프로젝트"].relation)) {
        props["프로젝트"].relation.forEach((r: any) => r.id && projectIdsSet.add(r.id));
      }

      const strProjId = getPropValue(props["project_id"]) || getPropValue(props["프로젝트ID"]);
      if (strProjId && typeof strProjId === "string") {
        projectIdsSet.add(strProjId);
      }

      const projName = getPropValue(props["프로젝트명"]) || getPropValue(props["프로젝트"]);
      if (projName && typeof projName === "string" && projName !== title) {
        projectIdsSet.add(projName);
      }

      return {
        id: page.id,
        name: title,
        time,
        maxCapacity,
        projectIds: Array.from(projectIdsSet),
        isTeamCapacity,
      };
    });

    // --- Reservations 파싱 및 [날짜_식별자] 기준 집계 ---
    const statsMap: Record<string, { reservationCount: number; totalGuests: number }> = {};

    reservationsRaw.forEach((page: any) => {
      const props = page.properties;

      const status = getPropValue(props["예약상태"]) || "확정";
      if (status.includes("취소")) return;

      const timeslotProp = getPropValue(props["회차"]) || "";
      const dateObj = getPropValue(props["예약날짜"]);
      const reservedDate = typeof dateObj === "object" ? dateObj?.start || "" : String(dateObj || "");
      if (!timeslotProp) return;

      const guestCount = parseGuestCount(getPropValue(props["인원"]));
      const resProjectId = getPropValue(props["project_id"]) || getPropValue(props["프로젝트명"]) || "";

      const matchedSlot = timeslots.find((t) => t.id === timeslotProp || t.name === timeslotProp);

      const identifiers = new Set<string>();
      identifiers.add(timeslotProp);
      if (matchedSlot) {
        identifiers.add(matchedSlot.id);
        identifiers.add(matchedSlot.name);
      }

      identifiers.forEach((id) => {
        const keys = [reservedDate ? `${reservedDate}_${id}` : id];
        if (resProjectId) {
          keys.push(reservedDate ? `${reservedDate}_${resProjectId}_${id}` : `${resProjectId}_${id}`);
        }

        keys.forEach((key) => {
          if (!statsMap[key]) {
            statsMap[key] = { reservationCount: 0, totalGuests: 0 };
          }
          statsMap[key].reservationCount += 1;
          statsMap[key].totalGuests += guestCount;
        });
      });
    });

    // --- reservedCountsMap 생성 ---
    const reservedCountsMap: Record<string, number> = {};

    Object.keys(statsMap).forEach((key) => {
      const lastUnderscoreIdx = key.lastIndexOf("_");
      const identifier = lastUnderscoreIdx !== -1 ? key.substring(lastUnderscoreIdx + 1) : key;
      const matchedSlot = timeslots.find((t) => t.id === identifier || t.name === identifier);

      if (matchedSlot && matchedSlot.isTeamCapacity) {
        reservedCountsMap[key] = statsMap[key].reservationCount;
      } else {
        reservedCountsMap[key] = statsMap[key].totalGuests;
      }
    });

    // --- 회차별 잔여 정원 계산 ---
    const processedTimeslots = timeslots.map((slot) => {
      let reservationCount = 0;
      let totalGuests = 0;

      Object.keys(statsMap).forEach((key) => {
        if (key.endsWith(`_${slot.id}`) || key.endsWith(`_${slot.name}`) || key === slot.id || key === slot.name) {
          reservationCount += statsMap[key].reservationCount;
          totalGuests += statsMap[key].totalGuests;
        }
      });

      const reservedCount = slot.isTeamCapacity ? reservationCount : totalGuests;
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
      reservedCountsMap,
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
    const timeslotsDbId = process.env.NOTION_RESERVATION_TIMESLOTS_DATASOURCE_ID;
    const reservationsDbId = process.env.NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID;

    if (!reservationsDbId) {
      return NextResponse.json({ error: "Missing NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID" }, { status: 500 });
    }

    const body = await req.json();
    const { name, phone, email, timeslotId, timeslotName, programTitle, programId, count, message, selectedDate } = body;

    const requestCountText = count ? String(count).trim() : "1명";
    const requestCountNum = parseGuestCount(requestCountText);

    if (!name || !phone || !timeslotId) {
      return NextResponse.json({ error: "이름, 연락처, 회차 정보는 필수입니다." }, { status: 400 });
    }

    let resolvedCustomProjectId = programId || "";
    let resolvedProgramTitle = programTitle || "";
    let resolvedTimeslotName = timeslotName || "";
    let maxCapacity = 10;
    let isTeamCapacity = false;

    // 회차 DB와 예약 DB를 병렬로 조회하여 개별 retrieve 요청(타임아웃 유발 원인)을 제거
    const [timeslotsRaw, allReservations] = await Promise.all([
      timeslotsDbId ? fetchAllDataSources(timeslotsDbId) : Promise.resolve([]),
      fetchAllDataSources(reservationsDbId),
    ]);

    // 1. 요청된 타임슬롯 매칭 및 정원 정보 추출
    const matchedTimeslotPage = timeslotsRaw.find(
      (page: any) => page.id === timeslotId || getPropValue(page.properties["회차"]) === timeslotName
    );

    if (matchedTimeslotPage) {
      const timeslotProps = matchedTimeslotPage.properties;
      resolvedTimeslotName =
        getPropValue(timeslotProps["회차"]) || getPropValue(timeslotProps["프로젝트명"]) || resolvedTimeslotName;
      const rawCapacity = getPropValue(timeslotProps["정원"]);
      maxCapacity = Number(rawCapacity) || 10;
      isTeamCapacity = Boolean(getPropValue(timeslotProps["팀신청여부"]));

      const strProjId = getPropValue(timeslotProps["project_id"]) || getPropValue(timeslotProps["프로젝트ID"]);
      if (strProjId) {
        resolvedCustomProjectId = strProjId;
      }
    }

    // 2. 서버 측 잔여 수량 검증
    let currentReservedCount = 0;
    allReservations.forEach((page: any) => {
      const props = page.properties;
      const status = getPropValue(props["예약상태"]) || "";
      if (status.includes("취소")) return;

      const tProp = getPropValue(props["회차"]) || "";
      const pProp = getPropValue(props["project_id"]) || getPropValue(props["프로젝트명"]) || "";
      const dateObj = getPropValue(props["예약날짜"]);
      const resDate = typeof dateObj === "object" ? dateObj?.start || "" : String(dateObj || "");

      const isTimeslotMatch = tProp === resolvedTimeslotName || tProp === timeslotId;
      const isDateMatch = !selectedDate || resDate === selectedDate;
      const isProjectMatch =
        !pProp ||
        !resolvedCustomProjectId ||
        pProp === resolvedCustomProjectId ||
        pProp === resolvedProgramTitle ||
        pProp === programId;

      if (isTimeslotMatch && isDateMatch && isProjectMatch) {
        if (isTeamCapacity) {
          currentReservedCount += 1;
        } else {
          currentReservedCount += parseGuestCount(getPropValue(props["인원"]));
        }
      }
    });

    const remainingCapacity = maxCapacity - currentReservedCount;

    if (isTeamCapacity) {
      if (remainingCapacity < 1) {
        return NextResponse.json(
          { error: "선택하신 회차는 이미 팀 예약이 마감되었습니다." },
          { status: 400 }
        );
      }
    } else {
      if (requestCountNum > remainingCapacity) {
        return NextResponse.json(
          { error: `선택하신 회차의 잔여 석(${Math.max(0, remainingCapacity)}석)이 부족합니다.` },
          { status: 400 }
        );
      }
    }

    const nowIsoString = new Date().toISOString();

    // 3. Notion DB 프로퍼티 구성
    const newPageProperties: Record<string, any> = {
      프로젝트명: { title: [{ text: { content: resolvedProgramTitle || "프로젝트명 없음" } }] },
      project_id: { rich_text: [{ text: { content: resolvedCustomProjectId || "" } }] },
      회차: { rich_text: [{ text: { content: resolvedTimeslotName || String(timeslotId) } }] },
      created_at: { date: { start: nowIsoString } },
      예약자: { rich_text: [{ text: { content: name } }] },
      연락처: { rich_text: [{ text: { content: phone } }] },
      인원: { rich_text: [{ text: { content: requestCountText } }] },
      예약상태: { multi_select: [{ name: "예약신청" }] },
    };

    if (email) newPageProperties["이메일"] = { email };
    if (selectedDate) newPageProperties["예약날짜"] = { date: { start: selectedDate } };
    if (message) {
      newPageProperties["요청사항"] = { rich_text: [{ text: { content: message } }] };
    }

    // 4. 노션 페이지 생성
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
