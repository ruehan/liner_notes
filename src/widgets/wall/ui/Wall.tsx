import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  WORLD,
  centerCameraOn,
  nearestCopy,
  tileOffsets,
  type Point,
  type Size,
} from "@/shared/lib";
import "./wall.css";

export interface WallHandle {
  jumpTo(target: Point): void;
}

interface Props {
  children: ReactNode;
  onInteract?: () => void;
}

const DRAG_CLICK_THRESHOLD = 8;
const HINT_THRESHOLD = 12;

function viewport(): Size {
  return { width: window.innerWidth, height: window.innerHeight };
}

function offsetsKey(offsets: Point[]): string {
  return offsets.map((o) => `${o.x}:${o.y}`).join("|");
}

export const Wall = forwardRef<WallHandle, Props>(function Wall(
  { children, onInteract },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Point>({ x: 0, y: 0 });
  const [offsets, setOffsets] = useState<Point[]>(() =>
    tileOffsets({ x: 0, y: 0 }, viewport(), WORLD),
  );
  const offsetsKeyRef = useRef("");
  const drag = useRef({
    active: false,
    dist: 0,
    hinted: false,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
  });

  const apply = (smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transition = smooth
      ? "transform .62s cubic-bezier(.16,1,.3,1)"
      : "none";
    el.style.transform = `translate3d(${cam.current.x}px,${cam.current.y}px,0)`;

    const next = tileOffsets(cam.current, viewport(), WORLD);
    const key = offsetsKey(next);
    if (key !== offsetsKeyRef.current) {
      offsetsKeyRef.current = key;
      setOffsets(next);
    }
  };

  useLayoutEffect(() => {
    cam.current = centerCameraOn(
      { x: WORLD.width / 2, y: WORLD.height / 2 },
      viewport(),
    );
    apply(false);
  }, []);

  useEffect(() => {
    const onResize = () => apply(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useImperativeHandle(ref, () => ({
    jumpTo(base: Point) {
      const vp = viewport();
      const centerX = -cam.current.x + vp.width / 2;
      const centerY = -cam.current.y + vp.height / 2;
      const target = {
        x: nearestCopy(base.x, centerX, WORLD.width),
        y: nearestCopy(base.y, centerY, WORLD.height),
      };
      cam.current = centerCameraOn(target, vp);
      apply(true);
    },
  }));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    d.active = true;
    d.dist = 0;
    d.hinted = false;
    d.sx = e.clientX;
    d.sy = e.clientY;
    d.ox = cam.current.x;
    d.oy = cam.current.y;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.classList.add("is-dragging");
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    d.dist = Math.max(d.dist, Math.hypot(dx, dy));
    cam.current = { x: d.ox + dx, y: d.oy + dy };
    apply(false);
    if (!d.hinted && d.dist > HINT_THRESHOLD) {
      d.hinted = true;
      onInteract?.();
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    e.currentTarget.classList.remove("is-dragging");
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (drag.current.dist >= DRAG_CLICK_THRESHOLD) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      className="wall"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      <div ref={containerRef} className="wall__world">
        {offsets.map((o) => (
          <div
            key={`${o.x}:${o.y}`}
            className="wall__tile"
            aria-hidden={!isPrimary(o) || undefined}
            style={{
              width: WORLD.width,
              height: WORLD.height,
              transform: `translate3d(${o.x}px,${o.y}px,0)`,
            }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );

  function isPrimary(o: Point): boolean {
    const cx = -cam.current.x + viewport().width / 2;
    const cy = -cam.current.y + viewport().height / 2;
    let best = offsets[0];
    let bestDist = Infinity;
    for (const t of offsets) {
      const d =
        Math.abs(cx - (t.x + WORLD.width / 2)) +
        Math.abs(cy - (t.y + WORLD.height / 2));
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    return o === best;
  }
});
