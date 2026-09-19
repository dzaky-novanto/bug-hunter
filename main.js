// main.js - Entry Point and Canvas Scaling

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Game } from './game.js';
import { UIManager } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  
  // High DPI canvas setup
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const uiManager = new UIManager();
  const game = new Game(canvas, uiManager);
  uiManager.setGame(game);

  // Focus canvas on click
  canvas.addEventListener('click', () => {
    if (window.soundManager) {
      window.soundManager.ensureContext();
    }
  });

  // Responsive scaling inside wrapper
  function resizeCanvas() {
    const wrapper = document.getElementById('game-wrapper');
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    // Canvas CSS handles scaling while maintaining internal 1280x720 coordinates
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
});
