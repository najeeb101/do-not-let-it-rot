import { useCallback, useState } from 'react';
import { evaluateRecord, gameOverTier } from './engine/session';
import { load, save as persist } from './lib/storage';
import type { SaveV1 } from './lib/storage';
import { applyTheme, nextTheme } from './lib/theme';
import { GameOver } from './screens/GameOver';
import type { GameOverData } from './screens/GameOver';
import { Home } from './screens/Home';
import { SpeedMathScreen } from './screens/SpeedMathScreen';
import type { FinishedGame } from './screens/SpeedMathScreen';

type Screen = { name: 'home' } | { name: 'play'; run: number } | { name: 'over'; data: GameOverData };

export function App() {
  const [save, setSave] = useState<SaveV1>(() => load());
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [runs, setRuns] = useState(0);
  const play = () => {
    setRuns((n) => n + 1);
    setScreen({ name: 'play', run: runs + 1 });
  };

  const onFinish = useCallback(
    (game: FinishedGame) => {
      const rec = evaluateRecord(save.bests.speedMath, save.bestStreak.speedMath, game.score, game.bestStreak);
      const next: SaveV1 = {
        ...save,
        bests: { ...save.bests, speedMath: rec.best },
        bestStreak: { ...save.bestStreak, speedMath: rec.bestStreak },
        gamesPlayed: { ...save.gamesPlayed, speedMath: save.gamesPlayed.speedMath + 1 },
      };
      persist(next);
      setSave(next);
      setScreen({
        name: 'over',
        data: {
          score: game.score,
          bestStreak: game.bestStreak,
          previousBest: rec.previousBest,
          newBest: rec.newPersonalBest,
          tier: gameOverTier('speedMath', game.score),
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
    return <SpeedMathScreen key={screen.run} onFinish={onFinish} onQuit={() => setScreen({ name: 'home' })} />;
  }
  if (screen.name === 'over') {
    return (
      <GameOver
        data={screen.data}
        onRetry={play}
        onMenu={() => setScreen({ name: 'home' })}
      />
    );
  }
  return <Home save={save} onPlay={play} onTheme={cycleTheme} />;
}
