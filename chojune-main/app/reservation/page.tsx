"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";

interface Program {
  id: string;
  projectId?: string;
  title: string;
  isOpen: boolean;
  startDate: string;
  endDate: string;
  description: string;
  notice?: string;
  thumbnail?: string;
}

interface Timeslot {
  id: string;
  name: string;
  time?: string;
  maxCapacity: number;
  projectIds: string[];
  isTeamCapacity?: boolean;
}

export default function ReservationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

  // 날짜_타임슬롯ID/Name 기준 예약 수량 Map ({ "2026-03-10_timeslotId": 3 })
  const [reservedCountsMap, setReservedCountsMap] = useState<Record<string, number>>({});

  // 선택 상태
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);

  // 예약 폼 및 주의사항 동의 상태
  const [form, setForm] = useState({
    name: "",
    phone: "",
    count: "1명", // 주관식 자유 입력
    message: "",
  });
  const [noticeAgreed, setNoticeAgreed] = useState(false);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // 데이터 로드 함수
  const fetchData = async (isRefetch = false) => {
    try {
      if (isRefetch) setLoading(true);
      const res = await fetch("/api/notion/reservation");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      setPrograms(data.programs || []);
      setTimeslots(data.timeslots || []);
      setReservedCountsMap(data.reservedCountsMap || {});

      if (data.programs && data.programs.length > 0 && !selectedProgram) {
        const firstProg = data.programs[0];
        setSelectedProgram(firstProg);

        if (firstProg.startDate) {
          const parsed = new Date(firstProg.startDate);
          if (!isNaN(parsed.getTime())) {
            setCurrentMonth(parsed);
          }
        }
      }
    } catch (err) {
      console.error("Reservation page fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  // 선택된 프로그램 변경 시 상태 초기화
  const handleProgramSelect = (prog: Program) => {
    setSelectedProgram(prog);
    setSelectedDate("");
    setSelectedTimeslot(null);
    setNoticeAgreed(false);
    if (prog.startDate) {
      const parsed = new Date(prog.startDate);
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(parsed);
      }
    }
  };

  // 선택된 프로그램에 해당하는 타임슬롯만 필터링
  const programTimeslots = useMemo(() => {
    if (!selectedProgram) return [];
    return timeslots.filter((slot) => {
      // 프로젝트 식별자가 없는 회차는 모든 프로그램에 공통 적용
      if (!slot.projectIds || slot.projectIds.length === 0) return true;
      // 특정 프로젝트에 귀속된 회차는 해당 프로젝트의 ID/projectId/title과 매칭될 때만 노출
      return slot.projectIds.some(
        (id) =>
          id === selectedProgram.id ||
          (selectedProgram.projectId && id === selectedProgram.projectId) ||
          (selectedProgram.title && id === selectedProgram.title)
      );
    });
  }, [selectedProgram, timeslots]);

  // 선택된 프로그램의 운영 가능 날짜 목록
  const availableDatesSet = useMemo(() => {
    const dates = new Set<string>();

    if (selectedProgram && selectedProgram.startDate) {
      const start = new Date(selectedProgram.startDate);
      const end = selectedProgram.endDate ? new Date(selectedProgram.endDate) : start;

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const curr = new Date(start);
        while (curr <= end) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, "0");
          const dd = String(curr.getDate()).padStart(2, "0");
          dates.add(`${yyyy}-${mm}-${dd}`);
          curr.setDate(curr.getDate() + 1);
        }
      }
    }

    return dates;
  }, [selectedProgram]);

  // 선택된 날짜의 타임슬롯 목록 및 '날짜별 실시간 잔여 정원/팀' 계산
  const selectedDateTimeslots = useMemo(() => {
    if (!selectedDate || !selectedProgram) return [];

    return programTimeslots
      .map((slot) => {
        const keyById = `${selectedDate}_${slot.id}`;
        const keyByName = `${selectedDate}_${slot.name}`;
        const keyWithProgId = selectedProgram.projectId ? `${selectedDate}_${selectedProgram.projectId}_${slot.id}` : "";
        const keyWithProgTitle = selectedProgram.title ? `${selectedDate}_${selectedProgram.title}_${slot.id}` : "";

        const reservedCount =
          (keyWithProgId ? reservedCountsMap[keyWithProgId] : undefined) ??
          (keyWithProgTitle ? reservedCountsMap[keyWithProgTitle] : undefined) ??
          reservedCountsMap[keyById] ??
          reservedCountsMap[keyByName] ??
          0;

        const remainingCapacity = Math.max(0, slot.maxCapacity - reservedCount);
        const isSoldOut = remainingCapacity <= 0;

        return {
          ...slot,
          reservedCount,
          remainingCapacity,
          isSoldOut,
        };
      })
      .sort((a, b) => {
        const valA = a.time || a.name || "";
        const valB = b.time || b.name || "";
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      });
  }, [selectedDate, selectedProgram, programTimeslots, reservedCountsMap]);

  // 현재 선택한 타임슬롯의 남은 정원 정보
  const activeSelectedSlot = useMemo(() => {
    if (!selectedTimeslot || !selectedDate) return null;
    return selectedDateTimeslots.find((s) => s.id === selectedTimeslot.id) || null;
  }, [selectedTimeslot, selectedDateTimeslots, selectedDate]);

  // 달력 Grid 생성
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean } | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 예약 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedDate || !activeSelectedSlot) {
      alert("프로그램, 날짜, 회차를 모두 선택해 주세요.");
      return;
    }

    if (!form.count || !form.count.trim()) {
      alert("예약 인원을 입력해 주세요.");
      return;
    }

    if (selectedProgram.notice && !noticeAgreed) {
      alert("주의사항을 확인하시고 동의 체크박스에 체크해 주세요.");
      return;
    }

    const matchedCount = form.count.match(/\d+/);
    const parsedCountNum = matchedCount ? parseInt(matchedCount[0], 10) : 1;

    if (activeSelectedSlot.isTeamCapacity) {
      if (activeSelectedSlot.remainingCapacity < 1) {
        alert("선택하신 회차는 이미 팀 예약이 마감되었습니다.");
        return;
      }
    } else {
      if (parsedCountNum > activeSelectedSlot.remainingCapacity) {
        alert(
          `신청 인원(${parsedCountNum}명)이 남은 잔여 수량(${activeSelectedSlot.remainingCapacity}석)을 초과했습니다.`
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/notion/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram.id,
          programTitle: selectedProgram.title,
          name: form.name,
          phone: form.phone,
          timeslotId: activeSelectedSlot.id,
          timeslotName: activeSelectedSlot.name,
          count: form.count,
          message: form.message,
          selectedDate: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "제출 중 오류가 발생했습니다.");
      }

      alert("예약 신청이 완료되었습니다! 확인 후 안내 연락을 드리겠습니다.");

      setForm({ name: "", phone: "", count: "1명", message: "" });
      setNoticeAgreed(false);
      setSelectedTimeslot(null);

      await fetchData(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "예약 제출에 실패했습니다. 다시 시도해 주세요.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="font-semibold text-sm">예약 가능 프로그램을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-blue-600 font-bold uppercase tracking-widest text-xs">
            CHOJUNE Reservation
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">프로그램 예약 신청</h1>
        </div>

        {/* 1. Open 프로그램 선택 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-800">예약 Open 프로그램</h2>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium text-sm">
              현재 진행 중인 예약 오픈 프로그램이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog) => {
                const isSelected = selectedProgram?.id === prog.id;
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleProgramSelect(prog)}
                    className={`text-left rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-300"
                    }`}
                  >
                    {prog.thumbnail && (
                      <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                        {prog.thumbnail.startsWith("http") ? (
                          <img
                            src={prog.thumbnail}
                            alt={prog.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <Image
                            src={prog.thumbnail}
                            alt={prog.title}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700">
                            OPEN
                          </span>
                          {prog.startDate && (
                            <span className="text-xs text-slate-400 font-medium">
                              {prog.startDate}{" "}
                              {prog.endDate && prog.endDate !== prog.startDate
                                ? `~ ${prog.endDate}`
                                : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mb-1">{prog.title}</h3>
                        {prog.description && (
                          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-2">
                            {prog.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 날짜 선택 달력 */}
        {selectedProgram && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs">
                  2
                </span>
                <h2 className="text-lg font-bold text-slate-800">날짜 선택</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors text-xs font-bold"
                >
                  {"< 이전달"}
                </button>
                <span className="font-black text-sm text-slate-800">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors text-xs font-bold"
                >
                  {"다음달 >"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
              <span className="text-red-500">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-blue-500">토</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-12 md:h-14"></div>;
                }

                const hasSlot = availableDatesSet.has(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    disabled={!hasSlot}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      setSelectedTimeslot(null);
                    }}
                    className={`h-12 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/20"
                        : hasSlot
                        ? "bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-800 font-bold border border-slate-200/60 cursor-pointer"
                        : "bg-slate-50/50 text-slate-300 font-normal cursor-not-allowed"
                    }`}
                  >
                    <span className="text-sm">{cell.dayNum}</span>
                    {hasSlot && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute bottom-1.5"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. 회차 선택 */}
        {selectedDate && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs">
                3
              </span>
              <h2 className="text-lg font-bold text-slate-800">회차(시간) 선택</h2>
              <span className="text-xs text-slate-400 font-medium ml-2">({selectedDate})</span>
            </div>

            {selectedDateTimeslots.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-medium text-sm">
                선택하신 날짜에는 운영 회차가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {selectedDateTimeslots.map((slot) => {
                  const isSelected = selectedTimeslot?.id === slot.id;
                  const isSoldOut = slot.isSoldOut;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => setSelectedTimeslot(slot)}
                      className={`p-3 md:p-4 rounded-2xl border text-left transition-all ${
                        isSoldOut
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                          : isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-bold text-xs md:text-sm truncate ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {slot.name}
                        </span>
                        {isSoldOut ? (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-600 self-start sm:self-auto">
                            마감
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] md:text-[11px] font-bold ${
                              isSelected ? "text-blue-100" : "text-blue-600"
                            }`}
                          >
                            {slot.isTeamCapacity
                              ? `잔여 ${slot.remainingCapacity}팀`
                              : `잔여 ${slot.remainingCapacity}석`}
                          </span>
                        )}
                      </div>
                      {slot.time ? (
                        <p
                          className={`text-[11px] md:text-xs ${
                            isSelected ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {slot.time}
                        </p>
                      ) : (
                        slot.isTeamCapacity && (
                          <span
                            className={`text-[10px] ${
                              isSelected ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            팀 단위 신청
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. 예약 정보 입력 및 주의사항 확인 */}
        {selectedTimeslot && activeSelectedSlot && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs">
                4
              </span>
              <h2 className="text-lg font-bold text-slate-800">예약자 정보 입력</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs md:text-sm text-slate-700 space-y-1">
              <p>
                <span className="font-bold text-slate-900">선택 프로그램:</span>{" "}
                {selectedProgram?.title}
              </p>
              <p>
                <span className="font-bold text-slate-900">선택 일시:</span> {selectedDate} /{" "}
                {activeSelectedSlot.name}
              </p>
              <p>
                <span className="font-bold text-slate-900">현재 잔여 수량:</span>{" "}
                <span className="text-blue-600 font-bold">
                  {activeSelectedSlot.isTeamCapacity
                    ? `${activeSelectedSlot.remainingCapacity}팀`
                    : `${activeSelectedSlot.remainingCapacity}석`}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  성함 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 홍길동"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  예약 인원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  placeholder="예: 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                요청사항
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="추가 전달사항이나 요청사항이 있으시다면 입력해 주세요."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* 주의사항 확인 영역 */}
            {selectedProgram?.notice && (
              <div className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-600 font-bold text-sm">⚠️ 예약 전 주의사항</span>
                </div>
                <div className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white/70 p-4 rounded-xl border border-amber-100">
                  {selectedProgram.notice}
                </div>
                <label className="flex items-center space-x-3 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={noticeAgreed}
                    onChange={(e) => setNoticeAgreed(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm font-bold text-slate-800">
                    주의사항을 모두 확인하였으며 이에 동의합니다.{" "}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (!!selectedProgram?.notice && !noticeAgreed)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-colors text-sm shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {submitting ? "예약 신청 처리 중..." : "예약 신청 완료하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
