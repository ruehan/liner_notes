# 작업 로그

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
