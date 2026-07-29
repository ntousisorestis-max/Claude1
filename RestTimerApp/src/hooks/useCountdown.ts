import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Wall-clock countdown to `endsAt` (ms epoch), or inactive when null.
 *
 * Reads Date.now() on every tick rather than counting ticks — JS timers get
 * throttled or suspended the moment the user leaves the app, which during rest
 * is exactly what we expect them to do.
 *
 * `onComplete` fires once per rest period, and also fires immediately on
 * foreground if the deadline passed while we were suspended.
 */
export function useCountdown(endsAt: number | null, onComplete: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(endsAt));
  const firedFor = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (endsAt == null) {
      setSecondsLeft(0);
      return;
    }

    const check = () => {
      const left = remaining(endsAt);
      setSecondsLeft(left);
      if (left <= 0 && firedFor.current !== endsAt) {
        firedFor.current = endsAt;
        onCompleteRef.current();
      }
    };

    check();
    const id = setInterval(check, 250);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        check();
      }
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [endsAt]);

  return secondsLeft;
}

function remaining(endsAt: number | null): number {
  if (endsAt == null) {
    return 0;
  }
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}
