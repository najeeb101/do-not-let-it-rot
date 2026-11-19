import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App';
import { initAnalytics } from './lib/analytics';
import { unlockAudioOnFirstGesture } from './lib/audio';

initAnalytics();
unlockAudioOnFirstGesture();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
