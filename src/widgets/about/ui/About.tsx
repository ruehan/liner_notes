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
        <p className="about__sub">a living archive for albums worth returning to</p>

        <div className="about__body">
          <p>
            <b>liner notes</b>는 오래 머물고 싶은 앨범을 모아두는 개인 음악
            아카이브다. 여기의 글은 정답이나 리뷰가 아니라, 한 장의 앨범과 한 곡을
            다시 만날 때마다 남기는 작은 여백이다.
          </p>
          <p>
            카드는 새로고침할 때마다 다른 순서로 나타난다. 마음에 머무는 앨범을
            열어 수록곡과 메모를 읽고, 재생 가능한 곡은 이곳에서 바로 들어볼 수
            있다. 앨범마다 서로 다른 표정의 페이지는 그 앨범이 남긴 분위기에서
            시작한다.
          </p>
        </div>

        <ol className="about__flow" aria-label="아카이브를 읽는 순서">
          <li>
            <span className="about__flow-no">01</span>
            <div>
              <strong>발견</strong>
              <p>벽 위의 앨범을 천천히 훑거나, 셔플로 낯선 한 장을 만난다.</p>
            </div>
          </li>
          <li>
            <span className="about__flow-no">02</span>
            <div>
              <strong>듣기</strong>
              <p>앨범 안에서 수록곡과 개인적인 곡 메모를 함께 읽는다.</p>
            </div>
          </li>
          <li>
            <span className="about__flow-no">03</span>
            <div>
              <strong>돌아오기</strong>
              <p>마음에 남은 앨범은 수집해 두고, 다른 날 다시 꺼내 본다.</p>
            </div>
          </li>
        </ol>

        <ul className="about__keys">
          <li>
            <span>클릭</span> 앨범과 곡 메모 열기
          </li>
          <li>
            <span>드래그</span> 벽 이동
          </li>
          <li>
            <span>R</span> 랜덤 앨범으로 이동
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
          <span>Keep listening. Keep leaving a margin.</span>
          <button type="button" className="about__back" onClick={onClose}>
            ← 벽으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  );
}
