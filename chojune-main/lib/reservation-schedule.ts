export interface ClosedDateRange {
  start: string;
  end: string;
}

export interface ReservationSchedule {
  startDate: string;
  endDate: string;
  closedDateRanges: ClosedDateRange[];
  availableDates: string[];
  errors: string[];
  warnings: string[];
}

// 날짜를 UTC 달력값으로 검증한다. 시간대에 따른 날짜 이동과 자동 날짜 보정을 막는다.
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getKoreaToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isClosedDate(date: string, ranges: ClosedDateRange[]): boolean {
  return ranges.some(({ start, end }) => start <= date && date <= end);
}

export function buildReservationSchedule(
  startDate: string,
  endDate: string,
  closedDatesText: string,
): ReservationSchedule {
  const schedule: ReservationSchedule = {
    startDate, endDate, closedDateRanges: [], availableDates: [], errors: [], warnings: [],
  };
  if (!isCalendarDate(startDate) || !isCalendarDate(endDate) || startDate > endDate) {
    schedule.errors.push("프로젝트 진행 기간이 올바르지 않습니다.");
    return schedule;
  }

  closedDatesText.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim();
    if (!value) return;
    const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:\s*~\s*(\d{4}-\d{2}-\d{2}))?$/);
    const start = match?.[1] || "";
    const end = match?.[2] || start;
    if (!isCalendarDate(start) || !isCalendarDate(end) || start > end) {
      schedule.errors.push(`휴무일 ${index + 1}번째 줄의 날짜 또는 범위가 올바르지 않습니다.`);
      return;
    }
    if (start < startDate || end > endDate) {
      schedule.warnings.push(`휴무일 ${index + 1}번째 줄에 진행 기간 밖 날짜가 있습니다.`);
    }
    // 프로젝트 기간과 겹치는 부분만 저장한다. 거대한 휴무 범위를 펼치지 않는다.
    if (end >= startDate && start <= endDate) {
      schedule.closedDateRanges.push({
        start: start < startDate ? startDate : start,
        end: end > endDate ? endDate : end,
      });
    }
  });

  if (schedule.errors.length) return schedule;
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  // 잘못 설정된 매우 긴 기간으로 API 응답이 커지는 것을 방지한다.
  if ((end.getTime() - current.getTime()) / 86400000 > 3660) {
    schedule.errors.push("예약 진행 기간은 최대 3660일 간격까지 지원합니다.");
    return schedule;
  }
  while (current <= end) {
    const date = current.toISOString().slice(0, 10);
    if (!isClosedDate(date, schedule.closedDateRanges)) schedule.availableDates.push(date);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return schedule;
}

export function isReservationTimePassed(date: string, time: string, now = new Date()): boolean {
  if (!isCalendarDate(date) || date < getKoreaToday(now)) return true;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return true;
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:${match[2]}:00+09:00`);
  return now.getTime() >= start.getTime() - 4 * 60 * 60 * 1000;
}
