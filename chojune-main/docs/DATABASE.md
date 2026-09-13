# DB 및 Notion 스키마 명세서 (Database Schema Documentation)

본 문서는 `chojune` 웹 애플리케이션에서 사용하는 통합 Notion Data Source / Database 컬럼 및 Supabase 테이블 스키마 명세서입니다.  
코드 작성 및 API 연동 시 exact 컬럼(프로퍼티)명과 데이터 타입을 참고하십시오.

---

## 1. Notion Data Sources / Databases

### 1.1 통합 프로젝트 DB (`Projects DB` / 포트폴리오 & 예약 통합)
- **환경 변수**: `NOTION_RESERVATION_PROJECTS_DATASOURCE_ID` (또는 `NOTION_PORTFOLIO_DATASOURCE_ID`)
- **관련 API**:
  - 포트폴리오/메인: [`chojune-main/app/api/notion/portfolio/route.ts`](chojune-main/app/api/notion/portfolio/route.ts:12)
  - 예약: [`chojune-main/app/api/notion/reservation/route.ts`](chojune-main/app/api/notion/reservation/route.ts:79)

| 프로퍼티명 (컬럼명) | Notion Type | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `프로젝트명` | `title` | 필수 | 프로젝트/프로그램 제목 |
| `project_id` | `rich_text` | 선택 | 커스텀 식별자 ID (프로젝트 번호/코드) |
| `Ongoing` | `checkbox` | 필수 | 현재 진행 중인 프로젝트 여부 (`true`: 진행 중, `false`: 완료) |
| `날짜` | `date` | 선택 | 프로젝트 진행 기간 (`start`, `end` 또는 단일 날짜) |
| `장소` | `rich_text` | 선택 | 진행 장소 |
| `주관기관` | `rich_text` | 선택 | 주관 기관명 |
| `안내문구` | `rich_text` | 선택 | 메인 페이지 및 포트폴리오 카드/모달 설명 문구 |
| `예약Open` | `checkbox` | 필수 | 예약 Open 여부 (`true`일 때 예약 페이지 노출 및 이동 버튼 표시) |
| `예약설명` | `rich_text` | 선택 | 예약 페이지 상세 안내 문구 |
| `예약주의사항` | `rich_text` | 선택 | 예약 시 유의사항 / 동의 체크 문구 |
| `메인사진` | `files` | 선택 | 대표 메인 썸네일/포스터 이미지 |
| `활동사진` | `files` | 선택 | 활동 갤러리 이미지 목록 |
| `참여인원` | `rich_text` | 선택 | 참여 인원 수 |
| `만족도` | `rich_text` | 선택 | 만족도 점수 |

---

### 1.2 예약 - 회차 DB (`Timeslots DB`)
- **환경 변수**: `NOTION_RESERVATION_TIMESLOTS_DATASOURCE_ID`
- **관련 API**: [`chojune-main/app/api/notion/reservation/route.ts`](chojune-main/app/api/notion/reservation/route.ts:80)

| 프로퍼티명 (컬럼명) | Notion Type | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `프로젝트명` | `title` | 필수 | 프로그램/프로젝트 제목 |
| `project_id` | `relation` / `rich_text` | 선택 | Projects DB 연동 Relation 또는 프로젝트 ID |
| `회차` | `rich_text` | 필수 | 회차 이름 (예: `10:00`) |
| `시간` | `rich_text` | 선택 | 회차 상세 시간 정보 |
| `정원` | `number` / `rich_text` | 필수 | 회차당 최대 신청 가능 정원 수 |
| `팀신청여부` | `checkbox` | 필수 | `true`일 경우 인원 합계가 아닌 예약 건수로 차감 |

---

### 1.3 예약 - 신청 목록 DB (`Reservations DB`)
- **환경 변수**: `NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID`
- **관련 API**: [`chojune-main/app/api/notion/reservation/route.ts`](chojune-main/app/api/notion/reservation/route.ts:81)

| 프로퍼티명 (컬럼명) | Notion Type | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `프로젝트명` | `title` | 필수 | 신청한 프로그램 제목 |
| `project_id` | `rich_text` | 필수 | 프로그램 ID |
| `예약자` | `rich_text` | 필수 | 신청자 이름 |
| `연락처` | `rich_text` | 필수 | 신청자 전화번호 |
| `예약날짜` | `date` | 선택 | 예약 날짜 |
| `회차` | `rich_text` | 필수 | 회차 이름 (예: `10:00`) |
| `created_at` | `date` | 필수 | 예약 생성 일시 (ISO 8601 문자열) |
| `인원` | `rich_text` | 필수 | 신청 인원 (예: `2명`) |
| `요청사항` | `rich_text` | 선택 | 추가 전달 메시지 |
| `예약상태` | `multi_select` | 필수 | 상태 (`예약신청`,`입금완료`,`예약취소`,`사용완료`) |

---

## 2. Supabase Client Configuration

- **클라이언트 파일**: [`chojune-main/app/lib/supabase.js`](chojune-main/app/lib/supabase.js:8)
- **환경 변수**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
