# 작업 로그

## 2026-08-19 — 카탈로그 인덱스 · 수집(큐레이션) · About

- 브랜치: feat/archive-redesign
- 한 일:
  - 카탈로그 인덱스 위젯: 한 화면 한 항목 scroll-snap, 검색(제목·아티스트·
    카탈로그 번호), "순서대로 듣기", 항목 클릭 → 상세 모달
  - 수집 기능(features/curation): ♥ 토글, localStorage 영속, 타일 좌표 키
  - 상세 시트 prev/next 내비게이션 (타일/카탈로그 컨텍스트)
  - About 시트 (소개 + 조작 안내), HUD에 index/about 필 버튼
  - 키보드: I=인덱스, Esc는 인덱스→About→상세 순으로 닫기, 입력창에서는 무시
- 검증: verify.sh 통과 — 테스트 63개, typecheck/lint/build 클린
- 가정: "순서대로 듣기"는 아직 재생 없이 상세 항목 순회(미리듣기는 다음 단계)

## 2026-08-19 — 무한 항목: 절차 생성 트랙으로 벽 채우기

- 브랜치: feat/archive-redesign
- 한 일: 벽의 무한 패닝 위에 항목도 끝없이 나오도록 절차 생성 트랙 도입.
  홈 타일 (0,0)=실제 선곡, 그 외 타일=시드 기반 생성(곡·아티스트·앨범·정의문).
  카탈로그 번호에 타일 좌표 인코딩. TrackCard를 catalog/ordinal 받는 presentational로
  전환, Wall은 renderTile(k,m) 콜백으로 타일별 콘텐츠 렌더.
  tileOffsets 부호 버그(카메라 방향 반전) 수정.
- 검증: verify.sh 통과 — 테스트 42개, typecheck/lint/build 클린
- 관련 결정: docs/decisions/0004-무한-아카이브-절차-생성-트랙.md

## 2026-08-19 — 무한 패닝 벽 (토러스 랩)

- 브랜치: feat/archive-redesign
- 한 일: 카메라 클램프 제거, 월드를 타일(`tileOffsets`)로 반복 렌더링해
  어느 방향으로든 끝없이 이동하는 벽 구현. 셔플 점프는 최근접 복사본으로.
  중복 타일 복제본은 aria-hidden 처리.
- 검증: verify.sh 통과 — 테스트 34개, typecheck/lint/build 클린

## 2026-08-19 — 프로젝트 이름 변경: liner notes

- 브랜치: feat/archive-redesign
- 한 일: night lexicon → **liner notes** 개명. 워드마크·부팅·타이틀·package 반영,
  카탈로그 번호 접두 NLX- → LNR-
- 검증: verify.sh 통과 — 테스트 32개, typecheck/lint/build 클린
- 관련 결정: docs/decisions/0003-프로젝트-이름-liner-notes.md

## 2026-08-19 — 디자인 전환: Archive Room (음악 아카이브 컨셉)

- 브랜치: feat/archive-redesign
- 한 일:
  - 팔레트를 밤 인디고 → 오래된 종이/잉크/도장 레드로 전환, 서체 3역할 분리
    (Fraunces / Space Grotesk / Space Mono, @fontsource 셀프호스트)
  - 트랙 데이터에 album·label 추가, 카탈로그 번호(NLX-###) 도입
  - 절차적 SVG 커버아트(트랙 id 시드, 4패턴) + 목록 카드 스타일 TrackCard
  - DetailSheet를 기록 카드 스타일로 재설계(도장·종이 액자·메타 테이블)
  - Hud 스탬프 로고, Readout 카탈로그 번호, Wall 점 그리드, Boot 스탬프 연출
- 검증: verify.sh 통과 — 테스트 32개 통과, typecheck/lint/build 클린
- 리뷰: 미실시
- 관련 결정: docs/decisions/0002-디자인-방향-전환-아카이브-룸.md

## 2026-08-19 — night lexicon 실제 구현 (프로토타입 → React 앱)

- 브랜치: feat/night-lexicon
- 한 일:
  - Vite + React 19 + TypeScript + Vitest + ESLint 9 스캐폴드, FSD 구조 적용
  - shared lib: 시드 rng, 카메라 클램프/중앙화, 벽 레이아웃 스폿 생성 (TDD)
  - entities/track: 트랙·장르 타입과 12곡 데이터, TrackCard UI
  - features: 장르 필터(슬라이딩 바 탭)·셔플(랜덤 점프) 모델+UI
  - widgets: Wall(드래그 패닝)·Hud·Readout·DetailSheet(사전 항목 레이아웃)·Boot
  - pages/main: 전체 조립 — 벽, 필터, 상세, 셔플, 부팅, 키보드(Esc/R)
- 검증: verify.sh 통과 — 테스트 31개(8 파일) 통과, typecheck/lint/build 클린
- 리뷰: 미실시 (구현 직후 — 별도 리뷰 라운드 예정)
- 가정: 곡 데이터는 검증용 플레이스홀더(임의 선곡), 미리듣기 버튼은 스텁
- 관련 결정: docs/decisions/0001-기술-스택과-구조.md

## 2026-08-19 — 디자인 분석과 HTML 프로토타입

- 브랜치: main
- 한 일: omrimalka.art 분석 → docs/design/design-system.md 작성.
  아이디어만 상속하고 고유 아이덴티티(night lexicon 색상·모티프) 정의.
  단일 파일 HTML 프로토타입(prototype/index.html)으로 연출 검증.
- 검증: 프로토타입 브라우저 수동 확인
- 관련 결정: 디자인 토큰은 docs/design/design-system.md §2.5
