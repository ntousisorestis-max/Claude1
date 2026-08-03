import { useEffect, useRef } from 'react';
import { useWorkout } from '../state/WorkoutContext';
import { useAccount } from './AccountContext';
import { dayKey } from './days';

/**
 * The one seam between the workout and the cloud.
 *
 * Renders nothing. It watches the workout for the moment it reaches 'complete'
 * and hands that workout to the account layer, which queues it for Firestore.
 *
 * Why a component and not a call inside the reducer or an action creator:
 * WorkoutContext knows nothing about accounts and AccountContext knows nothing
 * about workouts, and both stay testable in isolation because of it. Putting
 * the dependency in one mounted component means there is exactly one place to
 * look when a workout doesn't show up in the cloud.
 *
 * Deriving it from the phase — rather than firing inside `finishSet` and
 * `endWorkout` — is the same trick the haptics use, and buys the same thing: a
 * workout that ends by running out of sets and one the user bailed out of are
 * both just a transition into 'complete', so neither can be missed and neither
 * can fire twice on the way there.
 */
export function WorkoutSync() {
  const { state } = useWorkout();
  const { recordWorkout, status } = useAccount();

  const previousPhase = useRef(state.phase);

  useEffect(() => {
    const from = previousPhase.current;
    const to = state.phase;
    previousPhase.current = to;

    if (from === to || to !== 'complete') {
      return;
    }
    // Nothing to send to. The workout still shows its summary — the local
    // "time reclaimed" number has never depended on an account.
    if (status !== 'signed-in') {
      return;
    }

    const endedAt = Date.now();

    recordWorkout({
      // Minted here, once, and reused by every retry of this workout. See
      // firebaseBackend.recordWorkout for why that matters.
      id: `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      exerciseName: state.config.exerciseName,
      focusSeconds: state.totalLockedSeconds,
      setsCompleted: state.setsCompleted,
      restSeconds: state.totalRestSeconds,
      endedAt,
      // Stamped here, on the device, from the moment the workout ended — not
      // when it finally reaches the server. A session finished at 23:58 and
      // synced after midnight belongs to the day it was done on, or the streak
      // it earned goes to the wrong day.
      day: dayKey(endedAt),
    });
    // Only the phase should re-run this. The rest is read at the instant of the
    // transition, and re-firing because a total ticked would file the same
    // workout twice under two different ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  return null;
}
