# DB 및 Notion 스키마 명세서 (Database Schema Documentation)

본 문서는 `chojune` 웹 애플리케이션에서 사용하는 통합 Notion Data Source / Database 컬럼 및 Supabase 테이블 스키마 명세서입니다.  
코드 작성 및 API 연동 시 exact 컬럼(프로퍼티)명과 데이터 타입을 참고하십시오.

---

## 1. Notion Data Sources / Databases

### 1.1 통합 프로젝트 DB (`Projects DB` / 포트폴리오 & 예약 통합)
- **환경 변수**: `NOTION_PROJECTS_DATASOURCE_ID`
- **관련 API**:
  - 포트폴리오/메인: [`chojune-main/app/api/notion/portfolio/route.ts`](chojune-main/app/api/notion/portfolio/route.ts:12)
  - 예약: [`chojune-main/app/api/notion/reservation/route.ts`](chojune-main/app/api/notion/reservation/route.ts:79)

| 프로퍼티명 (컬럼명) | Notion Type | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `프로젝트명` | `title` | 필수 | 프로젝트/프로그램 제목 |
| `project_id` | `rich_text` | 선택 | 커스텀 식별자 ID (프로젝트 번호/코드) |
| `메인노출순서` | `number` | 선택 | 숫자가 있으면 진행 중이며 메인에 숫자 오름차순으로 노출. 비어 있으면 완료이며 메인 미노출. 0도 입력된 값으로 취급하며 음수/소수도 숫자순으로 정렬. 순서가 같으면 프로젝트명 오름차순. 운영 시 1, 2, 3 등의 양의 정수 사용 권장 |
| `날짜` | `date` | 선택 | 프로젝트 진행 기간 (`start`, `end` 또는 단일 날짜) |
| `휴무일` | `rich_text` | 선택 | 예약에서 제외할 날짜. 한 줄에 `YYYY-MM-DD` 또는 `YYYY-MM-DD~YYYY-MM-DD` 입력. 범위는 양 끝 날짜 포함 |
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

진행 상태와 메인 노출은 `메인노출순서`로 통합 관리합니다. 기존 `Ongoing` 컬럼은 사용하지 않습니다.
API 응답의 `isOngoing`은 이 숫자의 존재 여부에서 계산하며, 포트폴리오의 `active`는 진행 중/완료 표시용 값입니다.
예약 페이지의 프로젝트 노출 여부는 진행 상태와 별개로 `예약Open` 체크박스를 사용합니다.

#### 휴무일 입력과 예약 검증

- 예약 가능 날짜는 프로젝트 진행 기간에서 휴무일을 제외한 날짜입니다. 휴무일이 비어 있으면 기존처럼 기간 전체를 운영합니다.
- 단일 날짜와 연속 범위를 섞어 한 줄에 하나씩 입력합니다. 예: `2026-10-01~2026-10-05`, 다음 줄 `2026-10-12`.
- 줄 앞뒤와 `~` 주변 공백, 빈 줄을 허용합니다. 중복 및 겹치는 범위는 같은 날짜를 한 번만 제외합니다.
- 프로젝트 기간 밖 휴무는 기간과 겹치는 부분만 적용하며 서버 로그에 경고합니다.
- 형식 오류, 존재하지 않는 날짜, 역순 범위가 있으면 해당 프로젝트의 신규 예약을 막고 서버 로그에 오류 줄 번호를 남깁니다.
- 프로젝트 기간도 유효해야 하며, 응답 크기 보호를 위해 시작일과 종료일 간격을 최대 3660일로 제한합니다.
- 서버가 계산한 예약 가능 날짜로 달력을 표시하며, 제출 시 최신 프로젝트의 예약Open, 진행 기간, 휴무일, 회차 연결 및 마감을 다시 검증합니다.
- 예약 날짜는 시간 없는 달력 날짜로 취급합니다. 오늘 및 프로그램 시작 4시간 전 마감은 한국 시간 기준입니다.
- 휴무일 변경은 기존 예약을 자동 취소하지 않습니다. 기존 예약의 변경·취소 안내는 운영자가 별도로 처리해야 합니다.

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
| `팀정원` | `number` / `rich_text` | 필수 | 회차 내 팀당 최대 신청 가능 정원 수 |
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
| `회차` | `rich_text` | 필수 | 고객이 선택한 회차 시간대(예: `10:00`). 서버에서 회차 DB의 `회차` 값을 확인해 저장하며 예약날짜는 포함하지 않음. |
| `created_at` | `date` | 필수 | 예약 생성 일시 (ISO 8601 문자열) |
| `인원` | `number` | 필수 | 신청 인원 (예: `2`) |
| `요청사항` | `rich_text` | 선택 | 추가 전달 메시지 |
| `예약상태` | `multi_select` | 필수 | 상태 (`예약신청`,`입금완료`,`예약취소`,`사용완료`) |

---

## 2. Supabase Client Configuration

- **클라이언트 파일**: [`chojune-main/app/lib/supabase.js`](chojune-main/app/lib/supabase.js:8)
- **환경 변수**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
