// main.js - Entry Point and Canvas Scaling

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Game } from './game.js';
import { UIManager } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const uiManager = new UIManager();
  const game = new Game(canvas, uiManager);
  uiManager.setGame(game);

  // Audio unlock
  canvas.addEventListener('click', () => {
    if (window.soundManager) window.soundManager.ensureContext();
  });
  document.body.addEventListener('touchstart', () => {
    if (window.soundManager) window.soundManager.ensureContext();
  }, { once: true, passive: true });

  // ============ ORIENTATION DETECTION ============
  const orientationLock = document.getElementById('orientation-lock');

  function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 820;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Tampilkan overlay HANYA di HP portrait
    const showLock = isPortrait && isSmallScreen && isTouch;
    if (orientationLock) {
      orientationLock.classList.toggle('active', showLock);
    }
  }

  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', () => {
    setTimeout(checkOrientation, 120);
  });
});
