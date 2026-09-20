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

    this.loginMenu = document.getElementById('menu-login');
    this.startMenu = document.getElementById('menu-start');
    this.weaponMenu = document.getElementById('menu-weapon');
    this.charSelectContainer = document.getElementById('char-cards');
    this.charSelectContainerP2 = document.getElementById('char-cards-p2');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.levelUpModal = document.getElementById('modal-levelup');
    this.levelUpCards = document.getElementById('levelup-cards');
    this.pauseModal = document.getElementById('modal-pause');
    this.gameOverModal = document.getElementById('modal-gameover');
    this.achievementsModal = document.getElementById('modal-achievements');
    this.settingsModal = document.getElementById('modal-settings');
    this.toastContainer = document.getElementById('toast-container');

    this.selectedChar = 'junior_dev';
    this.selectedCharP2 = 'senior_architect';
    this.selectedWeapon = 'git_commit';
    this.selectedWeaponP2 = 'linter_shield';
    this.coopMode = false;
    this.aimMode = 'manual'; // 'manual' | 'auto'
    this.aimPriority = 'nearest'; // nearest | strongest | weakest | farthest
    this.nickname = '';

    this.loadNickname();
    this.initMenus();
  }

  // ---------- Nickname / Login ----------
  loadNickname() {
    try { this.nickname = localStorage.getItem('bhs_nickname') || ''; } catch(e) { this.nickname = ''; }
  }
  saveNickname(name) {
    this.nickname = name;
    try { localStorage.setItem('bhs_nickname', name); } catch(e) {}
  }

  showScreen(name) {
    // name: 'login' | 'start' | 'weapon' | 'none'
    this.loginMenu?.classList.toggle('hidden', name !== 'login');
    this.startMenu?.classList.toggle('hidden', name !== 'start');
    this.weaponMenu?.classList.toggle('hidden', name !== 'weapon');
  }

  setGame(game) {
    this.game = game;
    this.renderCharacterSelection();
    this.updateAudioButtons();

    // Selalu tampilkan login tiap masuk game (nickname lama jadi prefill)
    const nickInput = document.getElementById('input-nickname');
    if (nickInput && this.nickname) nickInput.value = this.nickname;
    const el = document.getElementById('welcome-back-text');
    if (el) el.textContent = this.nickname ? `SELAMAT DATANG KEMBALI, ${this.nickname.toUpperCase()}` : 'WELCOME BACK';
    this.showScreen('login');
  }

  initMenus() {
    // --- Login screen ---
    const nickInput = document.getElementById('input-nickname');
    const loginMeta = document.getElementById('login-meta');
    if (nickInput) {
      nickInput.value = this.nickname || '';
      nickInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLoginContinue(); });
    }
    const doLoginContinue = () => {
      const val = (nickInput?.value || '').trim();
      if (!val) {
        if (loginMeta) { loginMeta.textContent = 'Isi nickname dulu, minimal 2 karakter.'; loginMeta.style.color = '#f85149'; }
        return;
      }
      if (val.length < 2) {
        if (loginMeta) { loginMeta.textContent = 'Nickname terlalu pendek.'; loginMeta.style.color = '#f85149'; }
        return;
      }
      this.saveNickname(val);
      const el = document.getElementById('welcome-back-text');
      if (el) el.textContent = `SELAMAT DATANG, ${val.toUpperCase()}`;
      this.enterFullscreen();
      this.showScreen('start');
    };
    document.getElementById('btn-login-continue')?.addEventListener('click', doLoginContinue);
    document.getElementById('btn-change-nickname')?.addEventListener('click', () => {
      if (nickInput) nickInput.value = this.nickname || '';
      if (loginMeta) loginMeta.textContent = '';
      this.showScreen('login');
    });
    document.getElementById('btn-open-settings-login')?.addEventListener('click', () => this.showSettingsModal(true));

    // --- Mode toggle (Solo / Duo) — mode-card style ---
    document.querySelectorAll('#mode-toggle .mode-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mode-toggle .mode-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.coopMode = btn.dataset.mode === 'coop';
        document.getElementById('p2-char-block')?.classList.toggle('hidden', !this.coopMode);
        document.getElementById('p2-hint')?.classList.toggle('hidden', !this.coopMode);
        document.getElementById('p2-weapon-block')?.classList.toggle('hidden', !this.coopMode);
        if (this.coopMode) {
          this.renderCharacterSelectionP2();
        }
        // Solo: karakter tampil grid 2 kolom; Duo: 1 kolom biar muat berdampingan
        document.getElementById('char-cards')?.style.setProperty(
          'grid-template-columns',
          this.coopMode ? '1fr' : 'repeat(2, 1fr)'
        );
      });
    });

    // --- Start menu -> go to weapon select ---
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.renderWeaponSelection();
        this.showScreen('weapon');
      });
    }

    // --- Weapon select screen ---
    document.getElementById('btn-weapon-back')?.addEventListener('click', () => {
      this.showScreen('start');
    });
    document.getElementById('btn-weapon-confirm')?.addEventListener('click', () => {
      this.startMenu.classList.add('hidden');
      this.weaponMenu.classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.showTopbar(true);
      // Fullscreen saat run dimulai (desktop + HP, gagal = abaikan)
      this.enterFullscreen();
      if (this.game) {
        this.game.start({
          charId: this.selectedChar,
          weaponId: this.selectedWeapon,
          coop: this.coopMode,
          charIdP2: this.selectedCharP2,
          weaponIdP2: this.selectedWeaponP2,
          aimMode: this.aimMode,
          aimPriority: this.aimPriority
        });
      }
    });

    // --- Aim mode toggle ---
    document.querySelectorAll('#aim-toggle .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#aim-toggle .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.aimMode = btn.dataset.aim;
        document.getElementById('auto-priority-block')?.classList.toggle('hidden', this.aimMode !== 'auto');
        if (this.game && this.game.player) {
          this.game.setAimMode(this.aimMode, this.aimPriority);
        }
      });
    });
    document.querySelectorAll('#priority-toggle .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#priority-toggle .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.aimPriority = btn.dataset.priority;
        if (this.game) this.game.setAimMode(this.aimMode, this.aimPriority);
      });
    });

    // --- Settings modal (volume sliders) ---
    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.showSettingsModal(true));
    document.getElementById('btn-close-settings')?.addEventListener('click', () => this.showSettingsModal(false));
    this.initVolumeSliders();

    document.getElementById('btn-resume')?.addEventListener('click', () => this.game?.togglePause());
    document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
      this.showPauseModal(false);
      if (this.game) this.game.restartCurrentRun();
    });

    // Back to menu from pause
    document.getElementById('btn-menu-from-pause')?.addEventListener('click', () => {
      this.showPauseModal(false);
      this.game?.returnToMenu();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      if (this.game) this.game.restartCurrentRun();
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
    document.getElementById('btn-top-full')?.addEventListener('click', () => this.toggleFullscreen());
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
    const fullBtn = document.getElementById('btn-top-full');
    if (show) { menuBtn?.classList.remove('hidden'); pauseBtn?.classList.remove('hidden'); fullBtn?.classList.remove('hidden'); }
    else { menuBtn?.classList.add('hidden'); pauseBtn?.classList.add('hidden'); fullBtn?.classList.add('hidden'); }
  }

  // Fullscreen toggle (dipakai tombol FULL, tombol F, dan auto saat mulai)
  enterFullscreen() {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        const p = document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  }

  toggleFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        const p = document.exitFullscreen();
        if (p && p.catch) p.catch(() => {});
      } else {
        this.enterFullscreen();
      }
    } catch (e) {}
  }

  updateAudioButtons() {
    // Sync volume sliders with current soundManager state (called on load)
    if (!window.soundManager) return;
    const sm = window.soundManager;
    const mEl = document.getElementById('vol-master');
    const sEl = document.getElementById('vol-sfx');
    const bEl = document.getElementById('vol-bgm');
    if (mEl) mEl.value = Math.round((sm.muted ? 0 : sm.masterVolume) * 100);
    if (sEl) sEl.value = Math.round(sm.sfxVolume * 100);
    if (bEl) bEl.value = Math.round((sm.bgmMuted ? 0 : sm.bgmVolume) * 100);
    this.syncVolumeLabels();
  }

  syncVolumeLabels() {
    const mEl = document.getElementById('vol-master');
    const sEl = document.getElementById('vol-sfx');
    const bEl = document.getElementById('vol-bgm');
    const mVal = document.getElementById('vol-master-val');
    const sVal = document.getElementById('vol-sfx-val');
    const bVal = document.getElementById('vol-bgm-val');
    if (mEl && mVal) mVal.textContent = `${mEl.value}%`;
    if (sEl && sVal) sVal.textContent = `${sEl.value}%`;
    if (bEl && bVal) bVal.textContent = `${bEl.value}%`;
  }

  initVolumeSliders() {
    const mEl = document.getElementById('vol-master');
    const sEl = document.getElementById('vol-sfx');
    const bEl = document.getElementById('vol-bgm');

    mEl?.addEventListener('input', () => {
      this.syncVolumeLabels();
      window.soundManager?.setMasterVolume(mEl.value / 100);
    });
    sEl?.addEventListener('input', () => {
      this.syncVolumeLabels();
      window.soundManager?.setSfxVolume(sEl.value / 100);
    });
    bEl?.addEventListener('input', () => {
      this.syncVolumeLabels();
      window.soundManager?.setBgmVolume(bEl.value / 100);
    });

    document.getElementById('btn-vol-reset')?.addEventListener('click', () => {
      window.soundManager?.resetVolumes();
      this.updateAudioButtons();
    });

    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.showSettingsModal(false);
    });
  }

  showSettingsModal(show) {
    if (!this.settingsModal) return;
    if (show) {
      window.soundManager?.ensureContext();
      this.updateAudioButtons();
    }
    this.settingsModal.classList.toggle('hidden', !show);
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
    } else if (charId === 'devops_wizard') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DevOps Ninja">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="26" r="11" fill="#c9d1d9" stroke="#30363d" stroke-width="1.2"/>
        <rect x="24" y="22" width="24" height="10" rx="2" fill="#21262d"/>
        <rect x="24" y="26.5" width="24" height="1.5" fill="${color}"/>
        <rect x="27" y="24.5" width="6" height="2.5" rx="1" fill="#fff"/><rect x="39" y="24.5" width="6" height="2.5" rx="1" fill="#fff"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <circle cx="36" cy="50" r="6" fill="none" stroke="${color}" stroke-width="1.1" stroke-dasharray="2 2"/>
      </svg>`;
    } else if (charId === 'frontend_wizard') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frontend Wizard">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="26" r="12" fill="#f0d9c8" stroke="#30363d" stroke-width="1.2"/>
        <path d="M24 22 L16 30 L24 38 M48 22 L56 30 L48 38" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="32" y1="38" x2="40" y2="22" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="22" y="46" width="28" height="14" rx="5" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <rect x="26" y="49" width="20" height="3" rx="1.5" fill="${color}"/>
        <rect x="26" y="54" width="12" height="2" rx="1" fill="#30363d"/>
      </svg>`;
    } else if (charId === 'backend_beast') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Backend Beast">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <rect x="20" y="12" width="32" height="26" rx="4" fill="#21262d" stroke="#30363d" stroke-width="1.2"/>
        <circle cx="26" cy="19" r="1.6" fill="${color}"/><circle cx="26" cy="25" r="1.6" fill="${color}"/><circle cx="26" cy="31" r="1.6" fill="#3fb950"/>
        <rect x="32" y="17" width="14" height="2.4" rx="1" fill="#8b949e"/><rect x="32" y="23" width="10" height="2.4" rx="1" fill="#8b949e"/><rect x="32" y="29" width="14" height="2.4" rx="1" fill="#8b949e"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.6"/>
        <rect x="26" y="47" width="20" height="8" rx="1.5" fill="#21262d" stroke="#8b949e" stroke-width="0.8"/>
        <rect x="28" y="49" width="16" height="2" rx="1" fill="${color}"/>
      </svg>`;
    } else if (charId === 'qa_hunter') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QA Hunter">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="30" cy="26" r="11" fill="none" stroke="${color}" stroke-width="2.4"/>
        <line x1="38" y1="34" x2="48" y2="44" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="30" cy="26" r="4" fill="none" stroke="${color}" stroke-width="1.4"/>
        <path d="M27 26 L29.5 28.5 L33.5 24" fill="none" stroke="#3fb950" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="22" y="46" width="28" height="14" rx="5" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <rect x="26" y="49" width="20" height="2.5" rx="1" fill="${color}"/>
      </svg>`;
    } else if (charId === 'data_scientist') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data Scientist">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <rect x="16" y="14" width="8" height="24" rx="1.5" fill="#30363d"/><rect x="27" y="22" width="8" height="16" rx="1.5" fill="#8b949e"/><rect x="38" y="10" width="8" height="28" rx="1.5" fill="${color}"/><rect x="49" y="18" width="8" height="20" rx="1.5" fill="#8b949e"/>
        <path d="M14 12 L34 24 L46 16" fill="none" stroke="#ff7b72" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="22" y="44" width="28" height="16" rx="5" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <circle cx="30" cy="52" r="2" fill="${color}"/><circle cx="37" cy="52" r="2" fill="#8b949e"/><circle cx="44" cy="52" r="2" fill="#8b949e"/>
      </svg>`;
    } else if (charId === 'indie_hacker') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Indie Hacker">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="24" r="11" fill="#f0d9c8" stroke="#30363d" stroke-width="1.2"/>
        <path d="M25 20 Q36 12 47 20 L47 24 Q36 18 25 24 Z" fill="${color}"/>
        <rect x="29" y="23" width="5" height="3" rx="1" fill="#0d1117"/><rect x="38" y="23" width="5" height="3" rx="1" fill="#0d1117"/>
        <path d="M31 30 Q36 33 41 30" fill="none" stroke="#0d1117" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="20" y="40" width="12" height="20" rx="3" fill="#0f141b" stroke="${color}" stroke-width="1.2"/>
        <rect x="40" y="40" width="12" height="20" rx="3" fill="#0f141b" stroke="${color}" stroke-width="1.2"/>
        <rect x="23" y="44" width="6" height="2" fill="${color}"/><rect x="43" y="44" width="6" height="2" fill="${color}"/>
      </svg>`;
    } else {
      return `<svg width="${size}" height="${size}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prompt Engineer">
        <rect width="72" height="72" rx="16" fill="#0d1117" stroke="${color}" stroke-width="1.6"/>
        <circle cx="36" cy="27" r="1" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.4"/>
        <circle cx="36" cy="26" r="16" fill="none" stroke="${color}" stroke-width="0.9" stroke-dasharray="3 3" opacity="0.45"/>
        <circle cx="36" cy="26" r="12" fill="#f0d9c8" stroke="#30363d" stroke-width="1.2"/>
        <path d="M22 20 A16 16 0 0 1 50 20" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="22" cy="22" r="2.6" fill="${color}"/>
        <path d="M22 23 Q28 30 36 27" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="36" cy="27" r="1.6" fill="${color}"/>
        <rect x="30" y="24" width="4" height="1.6" fill="#0d1117"/><rect x="38" y="24" width="4" height="1.6" fill="#0d1117"/>
        <circle cx="47" cy="14" r="1.6" fill="${color}"/><circle cx="52" cy="19" r="1.1" fill="${color}"/>
        <rect x="22" y="42" width="28" height="18" rx="6" fill="#0f141b" stroke="${color}" stroke-width="1.4"/>
        <rect x="26" y="47" width="20" height="8" rx="1.5" fill="#21262d" stroke="#8b949e" stroke-width="0.8"/>
        <text x="36" y="53" font-family="ui-monospace, monospace" font-size="6" fill="${color}" text-anchor="middle">&gt;_</text>
      </svg>`;
    }
  }

  renderCharacterSelection() {
    if (this.charSelectContainer) this.buildCharGrid(this.charSelectContainer, false);
  }

  renderCharacterSelectionP2() {
    if (this.charSelectContainerP2) this.buildCharGrid(this.charSelectContainerP2, true);
  }

  buildCharGrid(container, isP2) {
    container.innerHTML = '';
    const selectedId = isP2 ? this.selectedCharP2 : this.selectedChar;

    // Normalize stats across all characters so bars are comparable
    const allChars = Object.values(CHARACTERS);
    const maxSpeed = Math.max(...allChars.map(c => c.speed));
    const maxHp = Math.max(...allChars.map(c => c.maxHp));

    for (const [id, char] of Object.entries(CHARACTERS)) {
      const card = document.createElement('div');
      card.className = `char-card ${id === selectedId ? 'selected' : ''}`;
      card.style.setProperty('--card-color', char.color);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', id === selectedId ? 'true' : 'false');

      const speedPct = Math.round((char.speed / maxSpeed) * 100);
      const hpPct = Math.round((char.maxHp / maxHp) * 100);

      card.innerHTML = `
        <div class="char-card-bar">
          <span></span><span></span><span></span>
          <span class="char-card-path">~/pilots/${id}.dev</span>
        </div>
        <div class="char-card-body">
          <div class="char-preview">${this.buildCharPreviewSVG(id, char.color)}</div>
          <div class="char-card-main">
            <div class="char-short">${char.shortLabel}</div>
            <div class="char-name">${char.name}</div>
            <div class="char-title">${char.title}</div>
          </div>
        </div>
        <div class="char-card-foot">
          <div class="char-desc">${char.description}</div>
          <div class="char-stats">
            <div class="char-stat-row">
              <span class="char-stat-label">HP</span>
              <div class="char-stat-track"><div class="char-stat-fill" style="width:${hpPct}%"></div></div>
            </div>
            <div class="char-stat-row">
              <span class="char-stat-label">SPD</span>
              <div class="char-stat-track"><div class="char-stat-fill" style="width:${speedPct}%"></div></div>
            </div>
          </div>
          <div class="char-badge">${char.passiveDescription}</div>
        </div>
      `;
      const select = () => {
        container.querySelectorAll('.char-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed','false'); });
        card.classList.add('selected');
        card.setAttribute('aria-pressed','true');
        if (isP2) this.selectedCharP2 = id; else this.selectedChar = id;
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
      container.appendChild(card);
    }
  }

  renderWeaponSelection() {
    const p1Container = document.getElementById('weapon-cards');
    const p2Container = document.getElementById('weapon-cards-p2');
    if (p1Container) this.buildWeaponGrid(p1Container, false);
    if (p2Container && this.coopMode) this.buildWeaponGrid(p2Container, true);

    const subtitle = document.getElementById('weapon-select-subtitle');
    if (subtitle) subtitle.textContent = this.coopMode
      ? 'Pilih senjata pembuka untuk masing-masing pemain.'
      : 'Pilih senjata pembuka untuk memulai run-mu.';

    // Counter senjata tersedia
    const countLabel = document.getElementById('weapon-count-label');
    if (countLabel) {
      const total = Object.keys(WEAPONS).length;
      countLabel.textContent = `${total} WEAPONS AVAILABLE`;
    }
  }

  buildWeaponGrid(container, isP2) {
    container.innerHTML = '';
    const selectedId = isP2 ? this.selectedWeaponP2 : this.selectedWeapon;
    for (const [id, w] of Object.entries(WEAPONS)) {
      const card = document.createElement('div');
      card.className = `weapon-card ${id === selectedId ? 'selected' : ''}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.innerHTML = `
        <div class="weapon-card-code">${w.code}</div>
        <div class="weapon-card-name">${w.name}</div>
        <div class="weapon-card-type">${w.type}</div>
        <div class="weapon-card-desc">${w.description}</div>
      `;
      const select = () => {
        container.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (isP2) this.selectedWeaponP2 = id; else this.selectedWeapon = id;
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
      container.appendChild(card);
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
    // Co-op P2 status panel
    const p2Panel = document.getElementById('hud-p2');
    if (p2Panel) {
      if (data.p2) {
        p2Panel.classList.remove('hidden');
        const fill = document.getElementById('hp-bar-fill-p2');
        const text = document.getElementById('hp-bar-text-p2');
        const lvl = document.getElementById('hud-level-p2');
        if (fill) fill.style.width = `${Math.max(0, Math.min(100, (data.p2.hp / data.p2.maxHp) * 100))}%`;
        if (text) text.textContent = data.p2.dead ? 'DOWN' : `${Math.ceil(data.p2.hp)} / ${data.p2.maxHp}`;
        if (lvl) lvl.textContent = `P2 Lv.${data.p2.level}`;
        p2Panel.classList.toggle('down', !!data.p2.dead);
      } else {
        p2Panel.classList.add('hidden');
      }
    }
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
    this.showScreen('start');
    this.hud.classList.add('hidden');
    this.showTopbar(false);
    this.levelUpModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.achievementsModal.classList.add('hidden');
    this.updateAudioButtons();
  }
}
