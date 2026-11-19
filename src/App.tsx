import { useCallback, useState } from 'react';
import { evaluateRecord, gameOverTier } from './engine/session';
import type { ModeId } from './engine/types';
import type { FinishedGame } from './hooks/useRunner';
import { load, save as persist } from './lib/storage';
import type { SaveV1 } from './lib/storage';
import { applyTheme, nextTheme } from './lib/theme';
import { GameOver } from './screens/GameOver';
import type { GameOverData } from './screens/GameOver';
import { Home } from './screens/Home';
import { SpeedMathScreen } from './screens/SpeedMathScreen';
import { VisualMemoryScreen } from './screens/VisualMemoryScreen';

type Screen =
  | { name: 'home' }
  | { name: 'play'; mode: ModeId; run: number }
  | { name: 'over'; data: GameOverData };

export function App() {
  const [save, setSave] = useState<SaveV1>(() => load());
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [runs, setRuns] = useState(0);
  const play = (mode: ModeId) => {
    setRuns((n) => n + 1);
    setScreen({ name: 'play', mode, run: runs + 1 });
  };

  const onFinish = useCallback(
    (mode: ModeId, game: FinishedGame) => {
      const streakKey = mode === 'piChallenge' ? null : mode;
      const rec = evaluateRecord(save.bests[mode], streakKey ? save.bestStreak[streakKey] : 0, game.score, game.bestStreak);
      const next: SaveV1 = {
        ...save,
        bests: { ...save.bests, [mode]: rec.best },
        bestStreak: streakKey ? { ...save.bestStreak, [streakKey]: rec.bestStreak } : save.bestStreak,
        gamesPlayed: { ...save.gamesPlayed, [mode]: save.gamesPlayed[mode] + 1 },
      };
      persist(next);
      setSave(next);
      setScreen({
        name: 'over',
        data: {
          mode,
          score: game.score,
          bestStreak: game.bestStreak,
          previousBest: rec.previousBest,
          newBest: rec.newPersonalBest,
          tier: gameOverTier(mode, game.score),
        },
      });
    },
    [save],
  );

  const cycleTheme = () => {
    const theme = nextTheme(save.settings.theme);
    const next = { ...save, settings: { ...save.settings, theme } };
    applyTheme(theme);
    persist(next);
    setSave(next);
  };

  if (screen.name === 'play') {
    const { mode } = screen;
    const props = {
      onFinish: (g: FinishedGame) => onFinish(mode, g),
      onQuit: () => setScreen({ name: 'home' }),
    };
    return mode === 'visualMemory' ? (
      <VisualMemoryScreen key={screen.run} {...props} />
    ) : (
      <SpeedMathScreen key={screen.run} {...props} />
    );
  }
  if (screen.name === 'over') {
    const mode = screen.data.mode;
    return <GameOver data={screen.data} onRetry={() => play(mode)} onMenu={() => setScreen({ name: 'home' })} />;
  }
  return <Home save={save} onPlay={play} onTheme={cycleTheme} />;
}
