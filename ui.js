// ui.js - User Interface, HUD, Modals, Menus, and Achievement Toasts

import { CHARACTERS, ACHIEVEMENTS, WEAPONS, PASSIVES } from './constants.js';

export class UIManager {
  constructor() {
    this.game = null;
    this.hud = document.getElementById('hud');
    this.timerEl = document.getElementById('hud-timer');
    this.killsEl = document.getElementById('hud-kills');
    this.levelEl = document.getElementById('hud-level');
    this.xpFillEl = document.getElementById('xp-bar-fill');
    this.hpFillEl = document.getElementById('hp-bar-fill');
    this.hpTextEl = document.getElementById('hp-bar-text');
    this.comboEl = document.getElementById('hud-combo');
    this.comboCountEl = document.getElementById('combo-count');
    this.inventoryEl = document.getElementById('hud-inventory');
    this.startMenu = document.getElementById('menu-start');
    this.charSelectContainer = document.getElementById('char-cards');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.levelUpModal = document.getElementById('modal-levelup');
    this.levelUpCards = document.getElementById('levelup-cards');
    this.pauseModal = document.getElementById('modal-pause');
    this.gameOverModal = document.getElementById('modal-gameover');
    this.achievementsModal = document.getElementById('modal-achievements');
    this.toastContainer = document.getElementById('toast-container');
    this.selectedChar = 'junior_dev';
    this.initMenus();
  }

  setGame(game) {
    this.game = game;
    this.renderCharacterSelection();
    this.updateAudioButtons();
  }

  initMenus() {
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.startMenu.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.showTopbar(true);
        if (this.game) this.game.start(this.selectedChar);
      });
    }

    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (window.soundManager) {
          const isMuted = window.soundManager.toggleMute();
          btnSound.textContent = isMuted ? 'SFX Off' : 'SFX On';
          btnSound.classList.toggle('muted', isMuted);
        }
      });
    }
    const btnBgm = document.getElementById('btn-toggle-bgm');
    if (btnBgm) {
      btnBgm.addEventListener('click', () => {
        if (window.soundManager) {
          const isMuted = window.soundManager.toggleBgm();
          btnBgm.textContent = isMuted ? 'BGM Off' : 'BGM On';
          btnBgm.classList.toggle('muted', isMuted);
        }
      });
    }

    document.getElementById('btn-resume')?.addEventListener('click', () => this.game?.togglePause());
    document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
      this.showPauseModal(false);
      if (this.game) this.game.start(this.selectedChar);
    });

    // Back to menu from pause
    document.getElementById('btn-menu-from-pause')?.addEventListener('click', () => {
      this.showPauseModal(false);
      this.game?.returnToMenu();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      if (this.game) this.game.start(this.selectedChar);
    });
    document.getElementById('btn-menu-from-gameover')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.game?.returnToMenu();
    });

    // Topbar buttons
    document.getElementById('btn-top-menu')?.addEventListener('click', () => {
      if (this.game && (this.game.state === 'PLAYING' || this.game.state === 'PAUSED')) {
        this.game.returnToMenu();
      }
    });
    document.getElementById('btn-top-pause')?.addEventListener('click', () => this.game?.togglePause());
    document.getElementById('footer-menu-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.game?.returnToMenu();
    });

    document.getElementById('btn-share-score')?.addEventListener('click', () => {
      const timeStr = this.formatTime(this.game.stats.timeSurvived);
      const text = `Saya bertahan ${timeStr} dan membasmi ${this.game.stats.bugsSquashed} bugs di Bug Hunter: Dev Survivor! Coba kalahkan rekorku!`;
      const url = window.location.href;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank');
    });

    document.getElementById('btn-view-achievements')?.addEventListener('click', () => this.showAchievementsModal());
    document.getElementById('btn-close-achievements')?.addEventListener('click', () => this.achievementsModal.classList.add('hidden'));

    // Close achievement modal on backdrop click
    this.achievementsModal?.addEventListener('click', (e) => {
      if (e.target === this.achievementsModal) this.achievementsModal.classList.add('hidden');
    });
    this.pauseModal?.addEventListener('click', (e) => {
      if (e.target === this.pauseModal) this.game?.togglePause();
    });
  }

  showTopbar(show) {
    const menuBtn = document.getElementById('btn-top-menu');
    const pauseBtn = document.getElementById('btn-top-pause');
    if (show) { menuBtn?.classList.remove('hidden'); pauseBtn?.classList.remove('hidden'); }
    else { menuBtn?.classList.add('hidden'); pauseBtn?.classList.add('hidden'); }
  }

  updateAudioButtons() {
    const btnSound = document.getElementById('btn-toggle-sound');
    const btnBgm = document.getElementById('btn-toggle-bgm');
    if (window.soundManager) {
      if (btnSound) { btnSound.textContent = window.soundManager.muted ? 'SFX Off' : 'SFX On'; btnSound.classList.toggle('muted', window.soundManager.muted); }
      if (btnBgm) { btnBgm.textContent = window.soundManager.bgmMuted ? 'BGM Off' : 'BGM On'; btnBgm.classList.toggle('muted', window.soundManager.bgmMuted); }
    }
  }

  // Build a tiny inline SVG preview for character card (pure vector, no emoji)
  buildCharPreviewSVG(charId, color) {
    const size = 72;
    if (charId === 'junior_dev') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Junior Dev">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="26" r="12" fill="#c9d1d9" stroke="#30363d" stroke-width="1.2"/>
        <path d="M24 18 Q36 6 48 18" fill="${color}" stroke="#0d1117" stroke-width="1"/>
        <rect x="26" y="24" width="10" height="6" rx="1" fill="none" stroke="#0d1117" stroke-width="1.1"/>
        <rect x="36" y="24" width="10" height="6" rx="1" fill="none" stroke="#0d1117" stroke-width="1.1"/>
        <line x1="36" y1="27" x2="36" y2="27" stroke="#0d1117" stroke-width="1.2"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <rect x="26" y="47" width="20" height="8" rx="1.5" fill="#21262d" stroke="#8b949e" stroke-width="0.8"/>
        <rect x="28" y="49" width="16" height="2" rx="1" fill="${color}"/>
      </svg>`;
    } else if (charId === 'senior_architect') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Senior Architect">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="26" r="12" fill="#d2a8ff" stroke="#30363d" stroke-width="1.2"/>
        <path d="M28 32 Q36 42 44 32" fill="#e6edf3" stroke="#0d1117" stroke-width="0.8"/>
        <circle cx="32" cy="26" r="2" fill="#0d1117"/><circle cx="40" cy="26" r="2" fill="#0d1117"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <line x1="48" y1="38" x2="48" y2="54" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="48" cy="36" r="4" fill="${color}"/>
      </svg>`;
    } else {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DevOps Ninja">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="26" r="11" fill="#c9d1d9" stroke="#30363d" stroke-width="1.2"/>
        <rect x="24" y="22" width="24" height="10" rx="2" fill="#21262d"/>
        <rect x="24" y="26.5" width="24" height="1.5" fill="${color}"/>
        <rect x="27" y="24.5" width="6" height="2.5" rx="1" fill="#fff"/><rect x="39" y="24.5" width="6" height="2.5" rx="1" fill="#fff"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <circle cx="36" cy="50" r="6" fill="none" stroke="${color}" stroke-width="1.1" stroke-dasharray="2 2"/>
      </svg>`;
    }
  }

  renderCharacterSelection() {
    if (!this.charSelectContainer) return;
    this.charSelectContainer.innerHTML = '';
    for (const [id, char] of Object.entries(CHARACTERS)) {
      const card = document.createElement('div');
      card.className = `char-card ${id === this.selectedChar ? 'selected' : ''}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', id === this.selectedChar ? 'true' : 'false');
      card.innerHTML = `
        <div class="char-preview">${this.buildCharPreviewSVG(id, char.color)}</div>
        <div class="char-short">${char.shortLabel}</div>
        <div class="char-name">${char.name}</div>
        <div class="char-title">${char.title}</div>
        <div class="char-desc">${char.description}</div>
        <div class="char-badge">${char.passiveDescription}</div>
      `;
      const select = () => {
        document.querySelectorAll('.char-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed','false'); });
        card.classList.add('selected');
        card.setAttribute('aria-pressed','true');
        this.selectedChar = id;
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
      this.charSelectContainer.appendChild(card);
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateHUD(data) {
    if (this.timerEl) this.timerEl.textContent = this.formatTime(data.time);
    if (this.killsEl) this.killsEl.textContent = data.kills;
    if (this.levelEl) this.levelEl.textContent = `Lv.${data.level}`;
    if (this.xpFillEl) {
      const xpPct = Math.min(100, (data.xp / data.xpNext) * 100);
      this.xpFillEl.style.width = `${xpPct}%`;
    }
    if (this.hpFillEl) {
      const hpPct = Math.max(0, Math.min(100, (data.hp / data.maxHp) * 100));
      this.hpFillEl.style.width = `${hpPct}%`;
    }
    if (this.hpTextEl) this.hpTextEl.textContent = `${Math.ceil(data.hp)} / ${data.maxHp}`;
    if (this.comboEl && this.comboCountEl) {
      if (data.combo >= 5) {
        this.comboEl.classList.remove('hidden');
        this.comboCountEl.textContent = `${data.combo}x COMBO`;
      } else this.comboEl.classList.add('hidden');
    }
    if (this.inventoryEl) {
      let html = '';
      for (const w of Object.values(data.weapons)) {
        const code = w.config.code || w.config.name.slice(0,2).toUpperCase();
        html += `<span class="inv-slot" title="${w.config.name} Lv.${w.level}"><span class="inv-code">${code}</span><sub>${w.level}</sub></span>`;
      }
      for (const [pid, lvl] of Object.entries(data.passives)) {
        const p = PASSIVES[pid];
        const code = p ? p.code : pid.slice(0,2).toUpperCase();
        html += `<span class="inv-slot passive" title="${p ? p.name : pid} Lv.${lvl}"><span class="inv-code">${code}</span><sub>${lvl}</sub></span>`;
      }
      this.inventoryEl.innerHTML = html;
    }
  }

  showLevelUpModal(choices, onSelect) {
    if (!this.levelUpModal || !this.levelUpCards) return;
    this.levelUpCards.innerHTML = '';
    choices.forEach((choice, index) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      const code = choice.code || choice.id.slice(0,2).toUpperCase();
      card.innerHTML = `
        <div class="card-top">
          <span class="card-code">${code}</span>
          <span class="card-badge ${choice.type}">${choice.badge}</span>
        </div>
        <h3 class="card-title">${choice.title}</h3>
        <p class="card-desc">${choice.desc}</p>
        <span class="card-key-hint">Tekan ${index + 1}</span>
      `;
      card.addEventListener('click', () => onSelect(choice));
      this.levelUpCards.appendChild(card);
    });
    this.levelUpModal.classList.remove('hidden');
    this.levelKeyHandler = (e) => {
      if (e.key === '1' && choices[0]) { cleanup(); onSelect(choices[0]); }
      else if (e.key === '2' && choices[1]) { cleanup(); onSelect(choices[1]); }
      else if (e.key === '3' && choices[2]) { cleanup(); onSelect(choices[2]); }
    };
    const cleanup = () => window.removeEventListener('keydown', this.levelKeyHandler);
    window.addEventListener('keydown', this.levelKeyHandler);
  }

  hideLevelUpModal() {
    if (this.levelUpModal) this.levelUpModal.classList.add('hidden');
    if (this.levelKeyHandler) { window.removeEventListener('keydown', this.levelKeyHandler); this.levelKeyHandler = null; }
  }

  showPauseModal(show) {
    if (this.pauseModal) {
      if (show) this.pauseModal.classList.remove('hidden');
      else this.pauseModal.classList.add('hidden');
    }
  }

  showGameOverModal(stats) {
    if (!this.gameOverModal) return;
    document.getElementById('stat-time').textContent = this.formatTime(stats.timeSurvived);
    document.getElementById('stat-kills').textContent = stats.bugsSquashed;
    document.getElementById('stat-level').textContent = stats.levelReached;
    document.getElementById('stat-damage').textContent = stats.damageDealt.toLocaleString();
    document.getElementById('stat-combo').textContent = `${stats.maxCombo}x`;
    const hsTime = this.game ? this.game.highScore.time : 0;
    const hsKills = this.game ? this.game.highScore.kills : 0;
    document.getElementById('stat-highscore').textContent = `${this.formatTime(hsTime)} (${hsKills} bugs)`;
    this.gameOverModal.classList.remove('hidden');
  }

  showAchievementsModal() {
    if (!this.achievementsModal) return;
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    const unlocked = this.game ? this.game.unlockedAchievements : new Set();
    ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = unlocked.has(ach.id);
      const item = document.createElement('div');
      item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <span class="ach-tag">${ach.tag}</span>
        <div class="ach-info">
          <div class="ach-title">${ach.title} ${isUnlocked ? '<span class=\"ach-check\">-- OK</span>' : ''}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <span class="ach-state">${isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
      `;
      list.appendChild(item);
    });
    this.achievementsModal.classList.remove('hidden');
  }

  showAchievementToast(ach) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <span class="toast-tag">${ach.tag}</span>
      <div>
        <div class="toast-title">Achievement Unlocked</div>
        <div class="toast-desc">${ach.title}</div>
      </div>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3800);
  }

  // Called by Game.returnToMenu()
  showMainMenu() {
    this.startMenu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.showTopbar(false);
    this.levelUpModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.achievementsModal.classList.add('hidden');
    this.updateAudioButtons();
  }
}
