import { useCallback, useEffect, useRef } from "react";

const AUTO_ADVANCE_DELAY_MS = 300;

/**
 * Returns a `select` handler that lets the caller show the "selected" state
 * immediately, then waits ~300ms (long enough to be perceived, short enough
 * to feel responsive) before calling onAdvance. The delay is a fixed pause,
 * not an animation, so it applies the same way under prefers-reduced-motion.
 */
export function useAutoAdvance<T>(onAdvance: (value: T) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const select = useCallback(
    (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => onAdvance(value), AUTO_ADVANCE_DELAY_MS);
    },
    [onAdvance],
  );

  return select;
}
