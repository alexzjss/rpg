
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PlayerMirror from './components/PlayerMirror';
import { injectThemeVars } from './utils/theme';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

injectThemeVars();

const isPlayerView = new URLSearchParams(window.location.search).get('view') === 'player';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isPlayerView ? <PlayerMirror /> : <App />}
  </React.StrictMode>
);
