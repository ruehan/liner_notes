import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  WORLD,
  centerCameraOn,
  clampCamera,
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

export const Wall = forwardRef<WallHandle, Props>(function Wall(
  { children, onInteract },
  ref,
) {
  const worldRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Point>({ x: 0, y: 0 });
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
    const el = worldRef.current;
    if (!el) return;
    el.style.transition = smooth
      ? "transform .62s cubic-bezier(.16,1,.3,1)"
      : "none";
    el.style.transform = `translate3d(${cam.current.x}px,${cam.current.y}px,0)`;
  };

  useLayoutEffect(() => {
    cam.current = centerCameraOn(
      { x: WORLD.width / 2, y: WORLD.height / 2 },
      viewport(),
      WORLD,
    );
    apply(false);
  }, []);

  useEffect(() => {
    const onResize = () => {
      cam.current = clampCamera(cam.current, viewport(), WORLD);
      apply(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useImperativeHandle(ref, () => ({
    jumpTo(target: Point) {
      cam.current = centerCameraOn(target, viewport(), WORLD);
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
    cam.current = clampCamera({ x: d.ox + dx, y: d.oy + dy }, viewport(), WORLD);
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
      <div
        ref={worldRef}
        className="wall__world"
        style={{ width: WORLD.width, height: WORLD.height }}
      >
        {children}
      </div>
    </div>
  );
});
