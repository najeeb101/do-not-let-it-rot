import { useCallback, useEffect, useState } from 'react';
import { evaluateRecord, gameOverTier } from './engine/session';
import type { ModeId } from './engine/types';
import type { FinishedGame } from './hooks/useRunner';
import { setSoundEnabled } from './lib/audio';
import { fxNewBest } from './lib/fx';
import { setVibrationEnabled } from './lib/haptics';
import { defaultSave, load, reset as resetStorage, save as persist } from './lib/storage';
import type { SaveV1 } from './lib/storage';
import { applyTheme } from './lib/theme';
import { Credits } from './screens/Credits';
import { GameOver } from './screens/GameOver';
import type { GameOverData } from './screens/GameOver';
import { Home } from './screens/Home';
import { PiScreen } from './screens/PiScreen';
import { Settings } from './screens/Settings';
import { SpeedMathScreen } from './screens/SpeedMathScreen';
import { VisualMemoryScreen } from './screens/VisualMemoryScreen';

type Screen =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'credits'; from: 'home' | 'settings' }
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

  const { sound, vibration, theme } = save.settings;
  useEffect(() => {
    setSoundEnabled(sound);
    setVibrationEnabled(vibration);
    applyTheme(theme);
  }, [sound, vibration, theme]);

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
      if (rec.newPersonalBest) fxNewBest();
      setScreen({
        name: 'over',
        data: {
          mode,
          score: game.score,
          bestStreak: game.bestStreak,
          previousBest: rec.previousBest,
          newBest: rec.newPersonalBest,
          tier: gameOverTier(mode, game.score),
          detail: game.detail,
        },
      });
    },
    [save],
  );

  const changeSettings = (patch: Partial<SaveV1['settings']>) => {
    const next = { ...save, settings: { ...save.settings, ...patch } };
    persist(next);
    setSave(next);
  };

  const resetData = () => {
    resetStorage();
    const next = { ...defaultSave(), settings: save.settings };
    persist(next);
    setSave(next);
  };

  switch (screen.name) {
    case 'play': {
      const { mode } = screen;
      const props = {
        onFinish: (g: FinishedGame) => onFinish(mode, g),
        onQuit: () => setScreen({ name: 'home' }),
      };
      if (mode === 'visualMemory') return <VisualMemoryScreen key={screen.run} {...props} />;
      if (mode === 'piChallenge') return <PiScreen key={screen.run} {...props} />;
      return <SpeedMathScreen key={screen.run} {...props} />;
    }
    case 'over': {
      const mode = screen.data.mode;
      return <GameOver data={screen.data} onRetry={() => play(mode)} onMenu={() => setScreen({ name: 'home' })} />;
    }
    case 'settings':
      return (
        <Settings
          settings={save.settings}
          onChange={changeSettings}
          onReset={resetData}
          onCredits={() => setScreen({ name: 'credits', from: 'settings' })}
          onBack={() => setScreen({ name: 'home' })}
        />
      );
    case 'credits': {
      const from = screen.from;
      return <Credits onBack={() => setScreen(from === 'home' ? { name: 'home' } : { name: 'settings' })} />;
    }
    default:
      return (
        <Home
          save={save}
          onPlay={play}
          onSettings={() => setScreen({ name: 'settings' })}
          onCredits={() => setScreen({ name: 'credits', from: 'home' })}
        />
      );
  }
}
