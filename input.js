// input.js - Keyboard, Touch Joystick, and Mobile Controls

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.touchActive = false;
    this.touchStart = { x: 0, y: 0 };
    this.touchCurrent = { x: 0, y: 0 };
    this.joystickVector = { x: 0, y: 0 };
    this.maxJoystickDistance = 50;

    this.onPauseToggle = null;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.onPauseToggle) this.onPauseToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.touchActive = false;
      this.joystickVector = { x: 0, y: 0 };
    });
  }

  initTouch() {
    // Only intercept touch on canvas or designated touch area
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchActive = true;
        this.touchStart = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
        this.touchCurrent = { ...this.touchStart };
        this.joystickVector = { x: 0, y: 0 };
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.touchActive) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.touchCurrent = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };

      const dx = this.touchCurrent.x - this.touchStart.x;
      const dy = this.touchCurrent.y - this.touchStart.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        const clampedDist = Math.min(dist, this.maxJoystickDistance);
        this.joystickVector = {
          x: (dx / dist) * (clampedDist / this.maxJoystickDistance),
          y: (dy / dist) * (clampedDist / this.maxJoystickDistance)
        };
      } else {
        this.joystickVector = { x: 0, y: 0 };
      }
    }, { passive: false });

    const endTouch = () => {
      this.touchActive = false;
      this.joystickVector = { x: 0, y: 0 };
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  getMovementVector() {
    // Touch takes priority if active
    if (this.touchActive && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      return this.joystickVector;
    }

    let x = 0;
    let y = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  drawVirtualJoystick(ctx) {
    if (!this.touchActive) return;

    ctx.save();
    // Outer base
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.touchStart.x, this.touchStart.y, this.maxJoystickDistance, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner stick knob
    const knobX = this.touchStart.x + this.joystickVector.x * this.maxJoystickDistance;
    const knobY = this.touchStart.y + this.joystickVector.y * this.maxJoystickDistance;

    ctx.fillStyle = '#39d353';
    ctx.shadowColor = '#39d353';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(knobX, knobY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
