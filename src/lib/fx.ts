import type { GameEvent } from '../engine/types';
import { playSound } from './audio';
import type { SoundName } from './audio';
import { vibrate } from './haptics';
import type { HapticName } from './haptics';

/** Play the sound and haptic twin for a named effect. */
export function fx(name: SoundName & HapticName): void {
  playSound(name);
  vibrate(name);
}

export function fxNewBest(): void {
  playSound('newBest');
  vibrate('newBest');
}

/** Map engine events to effects. One effect per event, streak-up replaces the plain correct sound. */
export function fxForEvents(events: GameEvent[]): void {
  const up = events.some((e) => e.type === 'multiplierUp');
  for (const e of events) {
    switch (e.type) {
      case 'tap':
      case 'wrong':
      case 'gameover':
        fx(e.type);
        break;
      case 'correct':
        fx(up ? 'streak' : 'correct');
        break;
      case 'timeout':
        fx('wrong');
        break;
      default:
        break;
    }
  }
}
