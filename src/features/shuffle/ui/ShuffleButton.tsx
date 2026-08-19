import "./shuffle-button.css";

interface Props {
  onShuffle: () => void;
}

export function ShuffleButton({ onShuffle }: Props) {
  return (
    <button
      type="button"
      className="shuffle-btn"
      title="랜덤 곡으로 (R)"
      aria-label="랜덤 곡으로 이동"
      onClick={onShuffle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 7h5l6 10h5M4 17h5l1.5-2.5M14.5 9.5 16 7h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <i>shuffle</i>
    </button>
  );
}
