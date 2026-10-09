/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { getText, getFiles, getMainDisplayOrder } from "@/lib/notion-utils";
import { buildReservationSchedule, isCalendarDate, isReservationTimePassed } from "@/lib/reservation-schedule";

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
function getProjectSchedule(props: any) {
  const date = getPropValue(props["날짜"]);
  const start = typeof date?.start === "string" ? date.start.slice(0, 10) : "";
  const end = typeof date?.end === "string" ? date.end.slice(0, 10) : start;
  return buildReservationSchedule(start, end, getText(props["휴무일"]));
}

export async function GET() {
  try {
    const programsDbId = process.env.NOTION_PROJECTS_DATASOURCE_ID;
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

    // --- Programs 파싱 (통합 Projects DB 스키마 반영) ---
    const programs = programsRaw
      .map((page: any) => {
        const props = page.properties;

        const title = getPropValue(props["프로젝트명"]) || getPropValue(props["프로젝트"]) || "제목 없음";
        const projectId = getPropValue(props["project_id"]) || getPropValue(props["프로젝트ID"]) || page.id;
        
        // 예약Open 체크박스
        const resOpenVal = getPropValue(props["예약Open"]) ?? getPropValue(props["예약 Open"]);
        const reservationOpen = Boolean(resOpenVal);

        const mainDisplayOrder = getMainDisplayOrder(props["메인노출순서"]);
        const isOngoing = mainDisplayOrder !== null;
        const reservationDescription = getPropValue(props["예약설명"]) || "";
        const description = getPropValue(props["안내문구"]) || getPropValue(props["설명"]) || "";
        const notice = getPropValue(props["예약주의사항"]) || getPropValue(props["주의사항"]) || "";
        
        const location = getPropValue(props["장소"]) || "";
        const organizer = getPropValue(props["주관기관"]) || "";

        let thumbnail = "";
        const filesVal = getFiles(props["메인사진"]) || getFiles(props["썸네일"]);
        if (Array.isArray(filesVal) && filesVal.length > 0) {
          thumbnail = filesVal[0];
        } else if (typeof filesVal === "string") {
          thumbnail = filesVal;
        }

        const schedule = getProjectSchedule(props);
        if (reservationOpen && (schedule.errors.length || schedule.warnings.length)) {
          console.warn("예약 일정 설정 확인:", page.id, schedule.errors, schedule.warnings);
        }

        return {
          id: page.id,
          projectId,
          title,
          reservationOpen,
          isOngoing,
          mainDisplayOrder,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          availableDates: schedule.availableDates,
          closedDateRanges: schedule.closedDateRanges,
          scheduleError: schedule.errors.length > 0,
          reservationDescription,
          description,
          notice,
          location,   
          organizer,  
          thumbnail,
        };
      })
      .filter((p) => p.reservationOpen);

    // --- Timeslots 파싱 ---
    const timeslots = timeslotsRaw.map((page: any) => {
      const props = page.properties;

      const title = getPropValue(props["회차"]) || getPropValue(props["프로젝트명"]) || "회차";
      const time = getPropValue(props["시간"]) || "";
      const rawCapacity = getPropValue(props["정원"]);
      const maxCapacity = Number(rawCapacity) || 10;
      const isTeamCapacity = Boolean(getPropValue(props["팀신청여부"]));
      const rawTeamCapacity = getPropValue(props["팀정원"]);
      const teamCapacity = rawTeamCapacity ? parseGuestCount(rawTeamCapacity) : 0;

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
        teamCapacity,
        projectIds: Array.from(projectIdsSet),
        isTeamCapacity,
      };
    });

    // --- 예약을 날짜 + 프로젝트 + 타임슬롯 ID 기준으로 한 번만 집계 ---
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
      const resProjectId = String(
        getPropValue(props["project_id"]) || getPropValue(props["프로젝트ID"]) || "",
      ).trim();
      const matchedSlots = timeslots.filter(
        (slot) => slot.id === timeslotProp || slot.name === timeslotProp,
      );
      const matchedSlot = matchedSlots.find((slot) =>
        resProjectId
          ? slot.projectIds.includes(resProjectId)
          : matchedSlots.length === 1,
      );

      // 새 예약은 슬롯의 Notion page ID를 기록한다. 회차명만 있는 기존 예약은 프로젝트까지
      // 연결되어 있고 후보 슬롯이 하나일 때에만 매칭하여 타 프로젝트의 동일 회차와 분리한다.
      const slot = matchedSlot || timeslots.find((item) => item.id === timeslotProp);
      const projectKey = resProjectId || (slot?.projectIds.length === 1 ? slot.projectIds[0] : "");
      if (!reservedDate || !slot || !projectKey) return;

      const key = `${reservedDate}_${projectKey}_${slot.id}`;
      if (!statsMap[key]) statsMap[key] = { reservationCount: 0, totalGuests: 0 };
      statsMap[key].reservationCount += 1;
      statsMap[key].totalGuests += guestCount;
    });

    // --- 클라이언트 조회 키도 프로젝트 ID와 슬롯 ID로만 생성 ---
    const reservedCountsMap: Record<string, number> = {};
    Object.entries(statsMap).forEach(([key, stats]) => {
      const slotId = key.slice(key.lastIndexOf("_") + 1);
      const slot = timeslots.find((item) => item.id === slotId);
      reservedCountsMap[key] = slot?.isTeamCapacity ? stats.reservationCount : stats.totalGuests;
    });

    // 슬롯 자체의 reservedCount는 전체 프로젝트 합산하지 않고 기본값으로 둔다.
    const processedTimeslots = timeslots.map((slot) => {
      return {
        ...slot,
        reservedCount: 0,
        remainingCapacity: slot.maxCapacity,
        isSoldOut: false,
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
// 2. POST: 예약 생성 및 서버 측 잔여 수량 검증 (관리자 알림 추가)
// ==========================================
export async function POST(req: Request) {
  try {
    const projectsDbId = process.env.NOTION_PROJECTS_DATASOURCE_ID;
    const timeslotsDbId = process.env.NOTION_RESERVATION_TIMESLOTS_DATASOURCE_ID;
    const reservationsDbId = process.env.NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID;
    const adminUserId = process.env.NOTION_ADMIN_USER_ID;

    if (!projectsDbId || !timeslotsDbId || !reservationsDbId) {
      return NextResponse.json({ error: "예약 데이터 설정이 누락되었습니다." }, { status: 500 });
    }

    const body = await req.json();
    const { name, phone, email, timeslotId, timeslotName, programId, count, message, selectedDate } = body;

    const requestCountText = count ? String(count).trim() : "1명";
    const requestCountNum = parseGuestCount(requestCountText);

    if (!name || !phone || !timeslotId || !programId || !isCalendarDate(selectedDate)) {
      return NextResponse.json({ error: "이름, 연락처, 프로젝트, 회차와 올바른 예약 날짜는 필수입니다." }, { status: 400 });
    }

    const projectsRaw = await fetchAllDataSources(projectsDbId);
    const project = projectsRaw.find((page: any) => page.id === programId);
    if (!project || !Boolean(getPropValue(project.properties["예약Open"]) ?? getPropValue(project.properties["예약 Open"]))) {
      return NextResponse.json({ error: "현재 예약을 받지 않는 프로젝트입니다." }, { status: 400 });
    }
    const schedule = getProjectSchedule(project.properties);
    if (schedule.errors.length) {
      console.warn("예약 일정 설정 오류:", project.id, schedule.errors);
      return NextResponse.json({ error: "예약 일정 확인 중입니다. 관리자에게 문의해 주세요." }, { status: 400 });
    }
    if (!schedule.availableDates.includes(selectedDate)) {
      return NextResponse.json({ error: "선택하신 날짜는 휴무일이거나 프로젝트 진행 기간 밖입니다." }, { status: 400 });
    }

    const resolvedCustomProjectId = getPropValue(project.properties["project_id"]) || getPropValue(project.properties["프로젝트ID"]) || project.id;
    const resolvedProgramTitle = getPropValue(project.properties["프로젝트명"]) || getPropValue(project.properties["프로젝트"]) || "제목 없음";
    let resolvedTimeslotName = timeslotName || "";
    let maxCapacity = 10;
    let teamCapacity = 0;
    let isTeamCapacity = false;

    const [timeslotsRaw, allReservations] = await Promise.all([
      timeslotsDbId ? fetchAllDataSources(timeslotsDbId) : Promise.resolve([]),
      fetchAllDataSources(reservationsDbId),
    ]);

    const matchedTimeslotPage = timeslotsRaw.find(
      (page: any) => page.id === timeslotId
    );

    if (!matchedTimeslotPage) {
      return NextResponse.json({ error: "유효하지 않은 회차입니다." }, { status: 400 });
    }
    const slotProps = matchedTimeslotPage.properties;
    const linkedIds = [
      ...(slotProps["project_id"]?.relation || []).map((r: any) => r.id),
      ...(slotProps["프로젝트"]?.relation || []).map((r: any) => r.id),
      getText(slotProps["project_id"]), getText(slotProps["프로젝트ID"]),
      getText(slotProps["프로젝트명"]), getText(slotProps["프로젝트"]),
    ].filter(Boolean);
    if (!linkedIds.some((id) => [project.id, resolvedCustomProjectId, resolvedProgramTitle].includes(id))) {
      return NextResponse.json({ error: "선택한 프로젝트에 속하지 않는 회차입니다." }, { status: 400 });
    }
    if (isReservationTimePassed(selectedDate, getText(slotProps["시간"]) || getText(slotProps["회차"]))) {
      return NextResponse.json({ error: "예약은 프로그램 시작 4시간 전까지만 가능합니다." }, { status: 400 });
    }

    if (matchedTimeslotPage) {
      const timeslotProps = matchedTimeslotPage.properties;
      resolvedTimeslotName =
        getPropValue(timeslotProps["회차"]) || getPropValue(timeslotProps["프로젝트명"]) || resolvedTimeslotName;
      const rawCapacity = getPropValue(timeslotProps["정원"]);
      maxCapacity = Number(rawCapacity) || 10;
      isTeamCapacity = Boolean(getPropValue(timeslotProps["팀신청여부"]));
      const rawTeamCapacity = getPropValue(timeslotProps["팀정원"]);
      if (rawTeamCapacity) {
        teamCapacity = parseGuestCount(rawTeamCapacity);
      }

    }

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
      if (teamCapacity > 0 && requestCountNum > teamCapacity) {
        return NextResponse.json(
          { error: `선택하신 회차의 한 팀당 최대 예약 가능 인원(${teamCapacity}명)을 초과했습니다.` },
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

    const newPageProperties: Record<string, any> = {
      프로젝트명: { title: [{ text: { content: resolvedProgramTitle || "프로젝트명 없음" } }] },
      project_id: { rich_text: [{ text: { content: resolvedCustomProjectId || "" } }] },
      회차: { rich_text: [{ text: { content: timeslotId } }] },
      created_at: { date: { start: nowIsoString } },
      예약자: { rich_text: [{ text: { content: name } }] },
      연락처: { rich_text: [{ text: { content: phone } }] },
      인원: { number: requestCountNum },
      예약상태: { select: { name: "예약신청" } },
    };

    if (email) newPageProperties["이메일"] = { email };
    if (selectedDate) newPageProperties["예약날짜"] = { date: { start: selectedDate } };
    if (message) {
      newPageProperties["요청사항"] = { rich_text: [{ text: { content: message } }] };
    }

    // --- 1. 페이지 생성 (본문 제외한 메타데이터 등록) ---
    const response = await notion.pages.create({
      parent: { data_source_id: reservationsDbId } as any,
      properties: newPageProperties,
    });

    // --- 2. 본문 블록(children) 구성 및 추가 (페이지 생성과 분리하여 SDK validation 이슈 방지) ---
    const childrenBlocks: any[] = [];
    const isValidAdminId =
      typeof adminUserId === "string" &&
      adminUserId.trim().length > 0 &&
      adminUserId !== "undefined";

    if (isValidAdminId) {
      childrenBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "mention",
              mention: {
                type: "user",
                user: {
                  object: "user",
                  id: adminUserId.trim(),
                },
              },
            },
            {
              type: "text",
              text: { content: " 새로운 예약이 접수되었습니다!" },
            },
          ],
        },
      });
    } else {
      childrenBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: "🔔 새로운 예약이 접수되었습니다!" },
            },
          ],
        },
      });
    }

    // 예약 요약 콜아웃 블록 추가
    childrenBlocks.push({
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "📌" },
        rich_text: [
          {
            type: "text",
            text: {
              content: `[${resolvedProgramTitle}] ${name}님 (${phone}) - ${selectedDate || ""} ${resolvedTimeslotName} (${requestCountText})`,
            },
          },
        ],
      },
    });

    // 노션 본문 블록 append 호출 (오류 발생 시에도 예약 데이터 저장은 유지)
    try {
      await notion.blocks.children.append({
        block_id: response.id,
        children: childrenBlocks,
      });
    } catch (appendError) {
      console.error("Notion block append error (reservation page was created):", appendError);
    }

    return NextResponse.json({ success: true, pageId: response.id });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "예약 제출 중 오류가 발생했습니다.";
    console.error("Notion reservation submit error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
