import "./about.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function About({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="about" role="dialog" aria-modal="true" aria-label="소개">
      <div className="about__scrim" onClick={onClose} />
      <section className="about__sheet">
        <button
          type="button"
          className="about__close"
          onClick={onClose}
          aria-label="닫기 (Escape)"
        >
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M8 8L32 32M32 8L8 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p className="about__head">about this archive</p>
        <h1 className="about__title">liner notes</h1>
        <p className="about__sub">a personal music archive</p>

        <div className="about__body">
          <p>
            이곳의 중심 칸(카탈로그 <b>LNR-001 ~ 012</b>)은 내가 직접 고른
            선곡이다. 곡마다 붙은 정의문은 왜 이 곡을 아카이브에 넣었는지에 대한
            짧은 해설이다.
          </p>
          <p>
            중심 칸 바깥으로 걸어가면 나오는 기록들은 아직 채워지지 않은 칸을
            위해 절차적으로 생성된 자리표다. 벽이 끝없는 것처럼, 이 사전도 아직
            쓰는 중이다.
          </p>
        </div>

        <ul className="about__keys">
          <li>
            <span>드래그</span> 벽 이동
          </li>
          <li>
            <span>R</span> 랜덤 항목으로 이동
          </li>
          <li>
            <span>I</span> 카탈로그 인덱스
          </li>
          <li>
            <span>♥</span> 수집함에 추가
          </li>
          <li>
            <span>Esc</span> 닫기
          </li>
        </ul>

        <div className="about__foot">
          <span>Gmarket Sans · Light / Medium / Bold</span>
          <button type="button" className="about__back" onClick={onClose}>
            ← 벽으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  );
}
