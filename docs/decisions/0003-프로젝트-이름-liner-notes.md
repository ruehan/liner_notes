# 0003. 프로젝트 이름 — liner notes (구 night lexicon / lexicon)

- 상태: 채택
- 날짜: 2026-08-19

## 배경

디자인을 Archive Room으로 전환하면서 프로젝트 이름도 컨셉에 맞게 다듬기로 했다.
"lexicon"(사전)은 음악 아카이브의 '기록·해설' 뉘앙스를 충분히 담지 못했다.

## 결정

프로젝트 이름을 **liner notes**로 정한다.

- 워드마크: `liner notes`, 부제 `a personal music archive`
- 카탈로그 번호 접두: `NLX-` → `LNR-`
- 패키지/문서/코드 전반에 반영

## 이유와 대안

- liner notes는 음반의 해설지라는 뜻으로, 곡마다 정의·해설을 붙이는
  이 서비스의 본질(개인 음악 사전/해설 아카이브)과 정확히 겹친다.
- 대안: canon, stacks, needle & groove, the b-side atlas.
  모두 아카이브 뉘앙스는 있으나, '곡에 대한 나의 기록'이라는 핵심을
  liner notes만큼 직접적으로 전달하지 못했다.

## 영향

- package.json / index.html / 로고 / 부팅 화면 / 카탈로그 번호 반영 완료.
- 기존 문서의 "night lexicon" 표기는 이력으로서 유지한다.
