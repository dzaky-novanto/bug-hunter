// game.js - Core Engine, Wave Spawner, Combat Logic, and Loop

import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, WEAPONS, PASSIVES, ENEMY_TYPES, ACHIEVEMENTS, MERGE_RECIPES, SUPER_WEAPONS } from './constants.js';
import { Player, Enemy, Projectile, Gem, Particle, FloatingText } from './entities.js';
import { InputHandler } from './input.js';

export class Game {
  constructor(canvas, uiManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiManager;

    this.input = new InputHandler(this.canvas);
    this.input.onPauseToggle = () => this.togglePause();
    this.input.onFullscreenToggle = () => { if (this.ui) this.ui.toggleFullscreen(); };

    this.state = 'MENU'; // MENU, PLAYING, LEVEL_UP, PAUSED, GAME_OVER
    this.player = null;
    this.selectedCharId = 'junior_dev';

    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.beams = []; // Active laser beams
    this.shockwaves = []; // Duck / explosion rings
    this.zaps = []; // Chain lightning segments

    this.camera = {
      x: 0,
      y: 0,
      shake: 0
    };

    this.gameTime = 0; // seconds
    this.spawnTimer = 0;
    this.nextBossAt = 300; // boss pertama menit ke-5, lalu tiap 5 menit
    this.bossCycle = 0;
    this.enemyHpMult = 1;
    this.enemyDmgMult = 1;
    this.enemyXpMult = 1;
    this.spawnRateMult = 1;

    this.stats = {
      bugsSquashed: 0,
      damageDealt: 0,
      timeSurvived: 0,
      maxCombo: 0,
      currentCombo: 0,
      comboTimer: 0
    };

    this.highScore = {
      time: 0,
      kills: 0,
      level: 1
    };
    this.loadHighScore();

    this.unlockedAchievements = new Set();
    this.loadAchievements();

    this.lastTime = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('bhs_highscore');
      if (saved) this.highScore = JSON.parse(saved);
    } catch (e) {}
  }

  saveHighScore() {
    if (this.gameTime > this.highScore.time || this.stats.bugsSquashed > this.highScore.kills) {
      this.highScore.time = Math.max(this.highScore.time, this.gameTime);
      this.highScore.kills = Math.max(this.highScore.kills, this.stats.bugsSquashed);
      if (this.player) {
        this.highScore.level = Math.max(this.highScore.level, this.player.level);
      }
      try {
        localStorage.setItem('bhs_highscore', JSON.stringify(this.highScore));
      } catch (e) {}
    }
  }

  loadAchievements() {
    try {
      const saved = localStorage.getItem('bhs_achievements');
      if (saved) {
        const arr = JSON.parse(saved);
        this.unlockedAchievements = new Set(arr);
      }
    } catch (e) {}
  }

  unlockAchievement(id) {
    if (this.unlockedAchievements.has(id)) return;
    this.unlockedAchievements.add(id);
    try {
      localStorage.setItem('bhs_achievements', JSON.stringify(Array.from(this.unlockedAchievements)));
    } catch (e) {}

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach && this.ui) {
      this.ui.showAchievementToast(ach);
    }
  }

  checkAchievements() {
    this.unlockAchievement('first_commit');

    if (this.gameTime >= 60) this.unlockAchievement('survive_1m');
    if (this.gameTime >= 180) this.unlockAchievement('survive_3m');
    if (this.gameTime >= 300) this.unlockAchievement('survive_5m');

    if (this.player) {
      for (const p of this.getActivePlayers()) {
        if (p.level >= 10) this.unlockAchievement('level_10');
        if (p.level >= 20) this.unlockAchievement('level_20');
        for (const w of Object.values(p.weapons)) {
          if (w.level >= 5) this.unlockAchievement('max_weapon');
        }
      }
    }

    if (this.stats.bugsSquashed >= 500) this.unlockAchievement('squash_500');
  }

  start(configOrCharId = 'junior_dev') {
    // Backward compatible: accept either a plain charId string or a config object
    const config = (typeof configOrCharId === 'string')
      ? { charId: configOrCharId, weaponId: null, coop: false }
      : configOrCharId;

    this.lastRunConfig = config;
    this.coop = !!config.coop;
    this.aimMode = config.aimMode || 'manual';
    this.aimPriority = config.aimPriority || 'nearest';

    this.selectedCharId = config.charId;
    const charConfig = CHARACTERS[config.charId] || CHARACTERS.junior_dev;
    this.player = new Player(charConfig);
    this.player.dead = false;
    if (config.weaponId && WEAPONS[config.weaponId]) {
      this.player.weapons = {};
      this.player.addWeapon(config.weaponId);
    }
    this.player.aimMode = this.aimMode;
    this.player.aimPriority = this.aimPriority;
    this.player.manualAimAngle = 0;

    // Co-op: second player
    this.player2 = null;
    if (this.coop) {
      const charConfigP2 = CHARACTERS[config.charIdP2] || CHARACTERS.senior_architect;
      this.player2 = new Player(charConfigP2);
      this.player2.dead = false;
      if (config.weaponIdP2 && WEAPONS[config.weaponIdP2]) {
        this.player2.weapons = {};
        this.player2.addWeapon(config.weaponIdP2);
      }
      this.player2.aimMode = this.aimMode;
      this.player2.aimPriority = this.aimPriority;
      this.player2.manualAimAngle = Math.PI;
      // Offset P2 spawn a bit so they don't overlap P1
      this.player2.x = 60;
      this.player2.y = 0;
    }

    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.beams = [];
    this.shockwaves = [];
    this.zaps = [];

    this.gameTime = 0;
    this.spawnTimer = 0;
    this.nextBossAt = 300;
    this.bossCycle = 0;
    this.enemyHpMult = 1;
    this.enemyDmgMult = 1;
    this.enemyXpMult = 1;
    this.spawnRateMult = 1;
    this.pendingLevelUps = [];

    this.stats = {
      bugsSquashed: 0,
      damageDealt: 0,
      timeSurvived: 0,
      maxCombo: 0,
      currentCombo: 0,
      comboTimer: 0
    };

    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.shake = 0;

    this.state = 'PLAYING';
    if (window.soundManager) {
      window.soundManager.ensureContext();
      if (!window.soundManager.bgmMuted) {
        window.soundManager.startBgm();
      }
    }

    this.checkAchievements();
  }

  restartCurrentRun() {
    // Re-launch with the same config used last time (weapon/char/coop/aim all preserved)
    this.start(this.lastRunConfig || 'junior_dev');
  }

  setAimMode(mode, priority) {
    this.aimMode = mode;
    this.aimPriority = priority;
    if (this.player) { this.player.aimMode = mode; this.player.aimPriority = priority; }
    if (this.player2) { this.player2.aimMode = mode; this.player2.aimPriority = priority; }
  }

  // Returns array of active (alive) players for shared logic loops
  getActivePlayers() {
    const list = [];
    if (this.player) list.push(this.player);
    if (this.player2) list.push(this.player2);
    return list;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.ui.showPauseModal(true);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.ui.showPauseModal(false);
    }
  }

  returnToMenu() {
    this.state = 'MENU';
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.beams = [];
    this.shockwaves = [];
    this.zaps = [];
    this.pendingLevelUps = [];
    this.player2 = null;
    this.coop = false;
    this.nextBossAt = 300;
    this.bossCycle = 0;
    this.enemyHpMult = 1;
    this.enemyDmgMult = 1;
    this.enemyXpMult = 1;
    this.spawnRateMult = 1;
    // Keluar dari fullscreen saat kembali ke menu (desktop + HP)
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    if (window.soundManager) window.soundManager.stopBgm();
    if (this.ui) this.ui.showMainMenu();
  }

  // Cari 2 senjata max-level yang match dengan MERGE_RECIPES
  findAvailableMerge(player) {
    if (!MERGE_RECIPES) return null;
    for (const recipe of MERGE_RECIPES) {
      const [idA, idB] = recipe.inputs;
      const wA = player.weapons[idA];
      const wB = player.weapons[idB];
      if (!wA || !wB) continue;
      if (wA.config.isMerged || wB.config.isMerged) continue;
      if (wA.level < wA.config.maxLevel || wB.level < wB.config.maxLevel) continue;
      if (!SUPER_WEAPONS[recipe.resultId] || player.weapons[recipe.resultId]) continue;
      return { recipe, idA, idB };
    }
    return null;
  }

  // Generate 3 random upgrade choices for level-up screen (per player)
  getUpgradeChoices(player) {
    player = player || this.player;
    const choices = [];
    const availableWeapons = Object.keys(WEAPONS);
    const availablePassives = Object.keys(PASSIVES);

    // Filter available weapons (either not yet owned, or owned and < maxLevel)
    const weaponPool = [];
    for (const wid of availableWeapons) {
      const owned = player.weapons[wid];
      if (!owned) {
        // Can add new weapon if less than 4 weapons held
        if (Object.keys(player.weapons).length < 4) {
          weaponPool.push({ type: 'weapon_new', id: wid });
        }
      } else if (owned.level < owned.config.maxLevel) {
        weaponPool.push({ type: 'weapon_upgrade', id: wid, level: owned.level + 1 });
      }
    }

    // Filter available passives
    const passivePool = [];
    for (const pid of availablePassives) {
      const currentLevel = player.passives[pid] || 0;
      if (currentLevel < PASSIVES[pid].maxLevel) {
        passivePool.push({ type: 'passive', id: pid, level: currentLevel + 1 });
      }
    }

    const combinedPool = [...weaponPool, ...passivePool];
    // Shuffle
    for (let i = combinedPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedPool[i], combinedPool[j]] = [combinedPool[j], combinedPool[i]];
    }

    // Merge option has top priority when available
    let mergeChoice = null;
    const mergeInfo = this.findAvailableMerge(player);
    if (mergeInfo) {
      const superWeapon = SUPER_WEAPONS[mergeInfo.recipe.resultId];
      if (superWeapon) {
        mergeChoice = {
          type: 'merge',
          id: mergeInfo.recipe.resultId,
          title: `MERGE: ${superWeapon.name}`,
          code: superWeapon.code,
          badge: 'MERGE',
          desc: `${player.weapons[mergeInfo.idA].config.name} + ${player.weapons[mergeInfo.idB].config.name} menjadi ${superWeapon.description}`,
          mergeInputs: [mergeInfo.idA, mergeInfo.idB]
        };
      }
    }

    const selected = combinedPool.slice(0, mergeChoice ? 2 : 3);

    // Format for UI
    const formatted = selected.map(item => {
      if (item.type === 'weapon_new') {
        const w = WEAPONS[item.id];
        return {
          type: item.type,
          id: item.id,
          title: `New Skill: ${w.name}`,
          code: w.code,
          badge: 'NEW',
          desc: w.description
        };
      } else if (item.type === 'weapon_upgrade') {
        const w = player.weapons[item.id];
        const nextBonus = w.config.levelUps[w.level - 1];
        return {
          type: item.type,
          id: item.id,
          title: `${w.config.name} (Lv.${w.level + 1})`,
          code: w.config.code,
          badge: `LV ${w.level + 1}`,
          desc: nextBonus ? nextBonus.desc : 'Upgrade damage and efficiency.'
        };
      } else {
        const p = PASSIVES[item.id];
        return {
          type: item.type,
          id: item.id,
          title: `${p.name} (Lv.${item.level})`,
          code: p.code,
          badge: `PASSIVE`,
          desc: p.description
        };
      }
    });

    // Merge option always first when available
    if (mergeChoice) return [mergeChoice, ...formatted];
    return formatted;
  }

  applyUpgrade(choice) {
    const player = (this.pendingLevelUps && this.pendingLevelUps[0]) || this.player;
    if (choice.type === 'merge') {
      const [idA, idB] = choice.mergeInputs;
      delete player.weapons[idA];
      delete player.weapons[idB];

      const superConfig = JSON.parse(JSON.stringify(SUPER_WEAPONS[choice.id]));
      player.weapons[choice.id] = { id: choice.id, level: 5, timer: 0, config: superConfig };

      this.triggerScreenShake(14);
      if (window.soundManager) {
        if (window.soundManager.playMerge) window.soundManager.playMerge();
        else window.soundManager.playLevelUp();
        window.soundManager.playExplosion();
      }
      this.floatingTexts.push(new FloatingText({
        x: player.x, y: player.y - 60,
        text: `MERGED: ${superConfig.name}`,
        color: '#ffd700', life: 2.4, isCrit: true
      }));
      for (let k = 0; k < 24; k++) {
        this.particles.push(new Particle({
          x: player.x, y: player.y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: ['#ffd700', '#f85149', '#39d353', '#58a6ff'][k % 4],
          size: 3 + Math.random() * 3,
          life: 0.9
        }));
      }
      this.unlockAchievement('first_merge');
      const mergedCount = Object.values(player.weapons).filter(w => w.config.isMerged).length;
      if (mergedCount >= 2) this.unlockAchievement('mega_merge');
    } else if (choice.type === 'weapon_new') {
      player.addWeapon(choice.id);
    } else if (choice.type === 'weapon_upgrade') {
      player.upgradeWeapon(choice.id);
    } else if (choice.type === 'passive') {
      player.addPassive(choice.id);
    }

    this.checkAchievements();
    this.ui.hideLevelUpModal();
    if (this.pendingLevelUps) this.pendingLevelUps.shift();
    // Chain next queued level-up (co-op: other player may have leveled too)
    if (this.pendingLevelUps && this.pendingLevelUps.length > 0) {
      const next = this.pendingLevelUps[0];
      if (!next.dead) {
        this.ui.showLevelUpModal(this.getUpgradeChoices(next), (selected) => {
          this.applyUpgrade(selected);
        });
        return;
      } else {
        this.pendingLevelUps.shift();
      }
    }
    this.state = 'PLAYING';
  }

  triggerLevelUp(player) {
    player = player || this.player;
    if (!this.pendingLevelUps) this.pendingLevelUps = [];
    if (!this.pendingLevelUps.includes(player)) this.pendingLevelUps.push(player);

    // If a level-up modal is already open, just queue
    if (this.state === 'LEVEL_UP') return;

    this.state = 'LEVEL_UP';
    if (window.soundManager) window.soundManager.playLevelUp();
    this.triggerScreenShake(4);

    const choices = this.getUpgradeChoices(player);
    // If no upgrades left, heal player and grant bonus stats
    if (choices.length === 0) {
      player.heal(50);
      this.floatingTexts.push(new FloatingText({
        x: player.x,
        y: player.y - 40,
        text: 'FULL REFACTOR! +50 HP HEAL',
        color: '#39d353'
      }));
      this.pendingLevelUps.shift();
      this.state = 'PLAYING';
      return;
    }

    this.ui.showLevelUpModal(choices, (selected) => {
      this.applyUpgrade(selected);
    });
  }

  triggerScreenShake(intensity = 6) {
    this.camera.shake = Math.max(this.camera.shake, intensity);
  }

  // --- WEAPONS SYSTEM ---
  // Pick a target for a player honoring aim priority (auto mode)
  pickTarget(player, maxDist = 600) {
    if (this.enemies.length === 0) return null;
    const priority = player.aimPriority || this.aimPriority || 'nearest';
    let best = null, bestScore = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d > maxDist) continue;
      let score = d;
      if (priority === 'strongest') score = -e.hp;
      else if (priority === 'weakest') score = e.hp;
      else if (priority === 'farthest') score = -d;
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  // Resolve firing angle: manual mode uses movement heading, auto uses priority target
  resolveAimAngle(player, maxDist = 600) {
    if ((player.aimMode || this.aimMode || 'manual') === 'auto') {
      const t = this.pickTarget(player, maxDist);
      if (t) return Math.atan2(t.y - player.y, t.x - player.x);
      return player.manualAimAngle || 0;
    }
    return player.manualAimAngle ?? (player.facing === 1 ? 0 : Math.PI);
  }

  updateWeapons(dt) {
    if (!this.player) return;

    for (const player of this.getActivePlayers()) {
      if (player.dead) continue;
      for (const [weaponId, weapon] of Object.entries(player.weapons)) {
        const config = WEAPONS[weaponId] || weapon.config;
        if (!config) continue;

        // Orbit weapons are continuous auras handled once per frame
        if (config.type === 'orbit') {
          this.updateOrbitWeapon(weapon, config, player, dt);
          continue;
        }

        weapon.timer -= dt;
        if (weapon.timer > 0) continue;

        const baseCd = weapon.config.cooldown || 1.0;
        const effectiveCd = Math.max(0.12, baseCd * player.cooldownMultiplier);

        if (weaponId === 'git_commit') this.fireGitCommit(weapon, player);
        else if (weaponId === 'hotfix_laser') this.fireHotfixLaser(weapon, player);
        else if (weaponId === 'docker_container') this.fireDockerDeploy(weapon, player);
        else if (weaponId === 'copilot_drone') this.fireCopilotDrone(weapon, player);
        else if (weaponId === 'rubber_duck') this.fireRubberDuck(weapon, player);
        else if (config.fireType === 'spread' || config.fireType === 'rapid') this.fireGenericProjectile(weapon, config, player);
        else if (config.fireType === 'rocket') this.fireGenericRocket(weapon, config, player);
        else if (config.type === 'chain') this.fireChainLightning(weapon, config, player);
        else if (config.type === 'beam') this.fireGenericBeam(weapon, config, player);
        else if (config.type === 'mine') this.fireGenericMine(weapon, config, player);

        weapon.timer = effectiveCd;
      }
    }
  }

  updateOrbitWeapon(weapon, config, player, dt) {
    weapon.angle = (weapon.angle || 0) + (weapon.config.speed || 2.5) * dt;
    const count = weapon.config.count || 2;
    const radius = weapon.config.orbitRadius || 75;
    const dmg = (weapon.config.damage || 16) * player.damageMultiplier;
    const isChaos = !!weapon.config.chaosOrbit;

    for (let i = 0; i < count; i++) {
      const theta = weapon.angle + (i / count) * Math.PI * 2 + (isChaos ? Math.sin(weapon.angle * 2 + i) * 0.5 : 0);
      const r = radius + (isChaos ? Math.sin(weapon.angle * 3 + i) * 20 : 0);
      const orbX = player.x + Math.cos(theta) * r;
      const orbY = player.y + Math.sin(theta) * r;

      for (const enemy of this.enemies) {
        const d = Math.hypot(enemy.x - orbX, enemy.y - orbY);
        if (d < enemy.radius + 14) {
          enemy.takeDamage(dmg * dt * 3.5);
          this.stats.damageDealt += dmg * dt * 3.5;
          if (weapon.config.stun) enemy.stunTimer = 0.5;
          if (weapon.config.slow) enemy.freezeTimer = Math.max(enemy.freezeTimer, 0.3);
          if (weapon.config.mark) { enemy.markedTimer = 3.0; enemy.markAmp = weapon.config.markAmp || 0.25; }
          if (Math.random() < 0.4) {
            this.particles.push(new Particle({
              x: orbX, y: orbY,
              vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
              color: weapon.config.orbitColor || '#3fb950',
              size: 2 + Math.random() * 2, life: 0.3
            }));
          }
        }
      }
    }
  }

  fireGenericProjectile(weapon, config, player) {
    if (this.enemies.length === 0) return;
    const count = weapon.config.count || 1;
    const isChaos = !!weapon.config.chaos;
    const isRadial = !!weapon.config.radial;

    const sorted = [...this.enemies]
      .filter(e => !e.dead)
      .map(e => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y) }))
      .sort((a, b) => a.d - b.d);
    if (sorted.length === 0) return;
    const targets = sorted.slice(0, Math.min(count, sorted.length));

    const baseAngle = this.resolveAimAngle(player);
    for (let i = 0; i < count; i++) {
      let angle;
      if (isChaos || isRadial) {
        angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      } else if (targets.length > 0) {
        const t = targets[i % targets.length].e;
        angle = Math.atan2(t.y - player.y, t.x - player.x);
        angle += (i - (count - 1) / 2) * (weapon.config.spread ?? 0.15);
      } else {
        angle = baseAngle;
      }

      const speed = weapon.config.speed || 8;
      this.projectiles.push(new Projectile({
        type: 'commit',
        x: player.x, y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: (weapon.config.damage || 15) * player.damageMultiplier,
        pierce: weapon.config.pierce ?? 1,
        lifetime: 1.6,
        text: config.code || '#commit',
        color: config.projectileColor || '#58a6ff'
      }));
    }
    if (window.soundManager) window.soundManager.playShoot();
  }

  fireGenericRocket(weapon, config, player) {
    if (this.enemies.length === 0) return;
    const count = weapon.config.count || 1;
    const sorted = [...this.enemies]
      .filter(e => !e.dead)
      .map(e => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y) }))
      .sort((a, b) => a.d - b.d);
    if (sorted.length === 0) return;

    for (let i = 0; i < count; i++) {
      const target = sorted[i % sorted.length].e;
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      const speed = weapon.config.speed || 7;
      this.projectiles.push(new Projectile({
        type: 'rocket',
        x: player.x, y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: (weapon.config.damage || 30) * player.damageMultiplier,
        radius: 8,
        pierce: 1,
        splash: weapon.config.splash || 0,
        homing: true,
        homingStrength: weapon.config.homingStrength || 8,
        retarget: !!weapon.config.retarget,
        lifetime: 2.5,
        projectileColor: config.projectileColor || '#f85149'
      }));
    }
    if (window.soundManager) window.soundManager.playShoot();
  }

  fireGenericBeam(weapon, config, player) {
    const angle = this.resolveAimAngle(player, 500);
    const angles = [angle];
    if (weapon.config.dualBeam) angles.push(angle + Math.PI);
    if (weapon.config.crossBeam) angles.push(angle + Math.PI / 2, angle - Math.PI / 2);

    const beamLength = 700;
    const beamWidth = weapon.config.width || 24;
    const dmg = (weapon.config.damage || 30) * player.damageMultiplier;
    const freezeDuration = weapon.config.freezeDuration || 1.0;
    const beamColor = config.color || '#ff7b72';

    for (const ang of angles) {
      this.beams.push({
        x1: player.x, y1: player.y, angle: ang,
        length: beamLength, width: beamWidth,
        duration: weapon.config.duration || 0.3,
        maxDuration: weapon.config.duration || 0.3,
        color: beamColor
      });
      for (const e of this.enemies) {
        const ex = e.x - player.x, ey = e.y - player.y;
        const projLen = ex * Math.cos(ang) + ey * Math.sin(ang);
        if (projLen > 0 && projLen < beamLength) {
          const perpDist = Math.abs(-ex * Math.sin(ang) + ey * Math.cos(ang));
          if (perpDist < beamWidth / 2 + e.radius) {
            e.takeDamage(dmg);
            this.stats.damageDealt += dmg;
            if (weapon.config.freeze) e.freezeTimer = Math.max(e.freezeTimer, freezeDuration);
            this.floatingTexts.push(new FloatingText({
              x: e.x, y: e.y - 10, text: Math.round(dmg),
              color: beamColor, isCrit: true
            }));
          }
        }
      }
    }
    this.triggerScreenShake(3);
    if (window.soundManager) window.soundManager.playLaser();
  }

  fireChainLightning(weapon, config, player) {
    if (this.enemies.length === 0) return;
    const maxJumps = weapon.config.chainCount || 3;
    const range = weapon.config.chainRange || 200;
    const falloff = weapon.config.chainDamageFalloff ?? 0.85;
    const color = config.projectileColor || '#a371f7';
    let dmg = (weapon.config.damage || 25) * player.damageMultiplier;

    // First target: priority pick near player
    let current = this.pickTarget(player, range + 250);
    if (!current) return;
    const hitSet = new Set();
    let fromX = player.x, fromY = player.y;

    for (let j = 0; j < maxJumps && current; j++) {
      hitSet.add(current);
      current.takeDamage(dmg);
      this.stats.damageDealt += dmg;
      this.floatingTexts.push(new FloatingText({
        x: current.x, y: current.y - 12,
        text: `${Math.round(dmg)} CHAIN`,
        color, isCrit: j > 0
      }));
      this.particles.push(new Particle({
        x: current.x, y: current.y, vx: 0, vy: 0,
        color, size: 6, char: 'Z', life: 0.25
      }));
      // Zap visual segment from previous point to this enemy
      this.zaps.push({
        x1: fromX, y1: fromY, x2: current.x, y2: current.y,
        color, life: 0.22, maxLife: 0.22
      });

      // Next jump: nearest unhit enemy within range of current
      fromX = current.x; fromY = current.y;
      dmg *= falloff;
      let next = null, nextD = range;
      for (const e of this.enemies) {
        if (e.dead || hitSet.has(e)) continue;
        const d = Math.hypot(e.x - fromX, e.y - fromY);
        if (d < nextD) { nextD = d; next = e; }
      }
      current = next;
    }
    if (window.soundManager) window.soundManager.playLightning();
  }

  fireGenericMine(weapon, config, player) {
    const clusterCount = weapon.config.clusterCount || 1;
    for (let i = 0; i < clusterCount; i++) {
      const offsetAngle = (i / Math.max(1, clusterCount)) * Math.PI * 2;
      const offsetDist = clusterCount > 1 ? 60 : 0;
      this.projectiles.push(new Projectile({
        type: 'mine',
        x: player.x + Math.cos(offsetAngle) * offsetDist + (Math.random() - 0.5) * 30,
        y: player.y + Math.sin(offsetAngle) * offsetDist + (Math.random() - 0.5) * 30,
        damage: (weapon.config.damage || 60) * player.damageMultiplier,
        radius: weapon.config.radius || 100,
        lifetime: weapon.config.duration || 3.0,
        freeze: !!weapon.config.freeze,
        cluster: !!weapon.config.cluster,
        chainExplode: !!weapon.config.chainExplode,
        chainCount: weapon.config.chainCount || 0,
        pull: !!weapon.config.pull,
        mineLabel: config.code || 'MN',
        color: config.color || '#58a6ff'
      }));
    }
  }

  fireGitCommit(weapon, player) {
    player = player || this.player;
    if (this.enemies.length === 0) return;

    const sorted = [...this.enemies]
      .filter(e => !e.dead)
      .map(e => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y) }))
      .sort((a, b) => a.d - b.d);
    if (sorted.length === 0) return;

    const count = weapon.config.count || 1;
    const targets = sorted.slice(0, Math.min(count, sorted.length));
    const commitHashes = ['#fixBug', '#init', '#hotfix', '#deploy', '#merge', '#patch', '#push', '#main'];

    for (let i = 0; i < count; i++) {
      const targetObj = targets[i % targets.length];
      let angle = Math.atan2(targetObj.e.y - player.y, targetObj.e.x - player.x);
      angle += (i - (count - 1) / 2) * 0.15;

      const speed = weapon.config.speed || 7.5;
      this.projectiles.push(new Projectile({
        type: 'commit',
        x: player.x, y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: (weapon.config.damage || 20) * player.damageMultiplier,
        pierce: weapon.config.pierce || 1,
        splash: weapon.config.splash || 0,
        lifetime: 1.8,
        text: commitHashes[Math.floor(Math.random() * commitHashes.length)],
        color: '#58a6ff'
      }));
    }

    if (window.soundManager) window.soundManager.playShoot();
  }

  updateLinterShield(weapon, dt, player) {
    player = player || this.player;
    this.updateOrbitWeapon(weapon, WEAPONS['linter_shield'], player, dt);
  }

  fireHotfixLaser(weapon, player) {
    player = player || this.player;
    const angle = this.resolveAimAngle(player, 450);

    const angles = [angle];
    if (weapon.config.dualBeam) {
      angles.push(angle + Math.PI);
    }
    if (weapon.config.crossBeam) {
      angles.push(angle + Math.PI / 2, angle - Math.PI / 2);
    }

    const beamLength = 700;
    const beamWidth = weapon.config.width || 28;
    const dmg = (weapon.config.damage || 40) * player.damageMultiplier;

    for (const ang of angles) {
      this.beams.push({
        x1: player.x,
        y1: player.y,
        angle: ang,
        length: beamLength,
        width: beamWidth,
        duration: weapon.config.duration || 0.35,
        maxDuration: weapon.config.duration || 0.35,
        color: '#ff7b72'
      });

      // Damage all enemies along line
      for (const e of this.enemies) {
        // Distance from point to ray
        const ex = e.x - player.x;
        const ey = e.y - player.y;
        const projLen = ex * Math.cos(ang) + ey * Math.sin(ang);

        if (projLen > 0 && projLen < beamLength) {
          const perpDist = Math.abs(-ex * Math.sin(ang) + ey * Math.cos(ang));
          if (perpDist < beamWidth / 2 + e.radius) {
            e.takeDamage(dmg);
            this.stats.damageDealt += dmg;
            this.floatingTexts.push(new FloatingText({
              x: e.x,
              y: e.y - 10,
              text: Math.round(dmg),
              color: '#ff7b72',
              isCrit: true
            }));
            for (let s = 0; s < 4; s++) {
              this.particles.push(new Particle({
                x: e.x, y: e.y,
                vx: Math.cos(ang) * (2 + Math.random()*2) + (Math.random()-0.5)*2,
                vy: Math.sin(ang) * (2 + Math.random()*2) + (Math.random()-0.5)*2,
                color: Math.random() < 0.5 ? '#ff7b72' : '#ffa198',
                size: 2 + Math.random()*2,
                life: 0.25
              }));
            }
          }
        }
      }
    }

    this.triggerScreenShake(3);
    if (window.soundManager) window.soundManager.playLaser();
  }

  fireDockerDeploy(weapon, player) {
    player = player || this.player;
    const proj = new Projectile({
      type: 'mine',
      x: player.x + (Math.random() - 0.5) * 40,
      y: player.y + (Math.random() - 0.5) * 40,
      damage: (weapon.config.damage || 55) * player.damageMultiplier,
      radius: weapon.config.radius || 90,
      lifetime: weapon.config.duration || 3.0,
      freeze: !!weapon.config.freeze,
      cluster: !!weapon.config.cluster,
      mineLabel: 'DK'
    });

    this.projectiles.push(proj);
  }

  fireCopilotDrone(weapon, player) {
    player = player || this.player;
    if (this.enemies.length === 0) return;

    // Target random or closest enemy
    const enemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
    if (!enemy) return;

    const dmg = (weapon.config.damage || 18) * player.damageMultiplier;
    enemy.takeDamage(dmg);
    this.stats.damageDealt += dmg;

    // Visual lightning beam from player/drone
    this.particles.push(new Particle({
      x: (player.x + enemy.x) / 2,
      y: (player.y + enemy.y) / 2,
      vx: 0,
      vy: 0,
      color: '#a371f7',
      size: 6,
      char: 'Z',
      life: 0.25
    }));

    this.floatingTexts.push(new FloatingText({
      x: enemy.x,
      y: enemy.y - 12,
      text: `${Math.round(dmg)} [AI]`,
      color: '#d2a8ff'
    }));

    if (window.soundManager) window.soundManager.playLightning();
  }

  fireRubberDuck(weapon, player) {
    player = player || this.player;
    const angle = Math.random() * Math.PI * 2;
    const speed = 6;

    const proj = new Projectile({
      type: 'duck',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: (weapon.config.damage || 50) * player.damageMultiplier,
      radius: 18,
      lifetime: 4.5,
      bounces: weapon.config.bounces || 4,
      megaQuack: !!weapon.config.megaQuack
    });

    this.projectiles.push(proj);
    if (window.soundManager) window.soundManager.playDuckQuack();
  }

  // --- SPAWNER & WAVES ---
  updateSpawner(dt) {
    this.gameTime += dt;
    this.stats.timeSurvived = this.gameTime;
    this.spawnTimer += dt;

    // Spawn rate makin cepat seiring waktu + tiap boss yang mati
    const spawnInterval = Math.max(0.22, (1.4 - (this.gameTime / 300) * 0.9) * (this.spawnRateMult || 1));

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemyWave();
    }

    // Boss tiap 5 menit, bergantian tipe, makin kuat tiap siklus
    if (this.gameTime >= this.nextBossAt) {
      this.nextBossAt += 300;
      this.bossCycle++;
      const type = this.bossCycle % 2 === 1 ? 'boss_friday_prod' : 'boss_legacy_spaghetti';
      this.spawnBoss(type, this.bossCycle);
    }
  }

  spawnEnemyWave() {
    const anchor = this.getActivePlayers().find(p => !p.dead) || this.player;
    if (!anchor) return;

    // Maximum alive enemies to prevent lag
    if (this.enemies.length >= 180) return;

    // Determine enemy pool based on game time
    const pool = ['bug'];
    if (this.gameTime > 30) pool.push('error_404');
    if (this.gameTime > 60) pool.push('null_pointer');
    if (this.gameTime > 120) pool.push('merge_conflict', 'ddos_packet');
    if (this.gameTime > 180) pool.push('memory_leak');

    // Spawn 1 to 4 enemies in this tick (stats diskala difficulty)
    const count = 1 + Math.floor(this.gameTime / 90);
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 480 + Math.random() * 120; // Just outside screen view
      const x = anchor.x + Math.cos(angle) * dist;
      const y = anchor.y + Math.sin(angle) * dist;

      const e = new Enemy(type, x, y);
      e.maxHp *= this.enemyHpMult;
      e.hp = e.maxHp;
      e.damage *= this.enemyDmgMult;
      e.xpValue = Math.round(e.xpValue * this.enemyXpMult * 2) / 2;
      this.enemies.push(e);
    }
  }

  spawnBoss(bossTypeKey, cycle = 0) {
    const anchor = this.getActivePlayers().find(p => !p.dead) || this.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 400;
    const x = anchor.x + Math.cos(angle) * dist;
    const y = anchor.y + Math.sin(angle) * dist;

    const boss = new Enemy(bossTypeKey, x, y);
    // Scaling per siklus: HP +90%/siklus, damage +15%/siklus, XP +50%/siklus
    const hpScale = 1 + Math.max(0, cycle - 1) * 0.9;
    const dmgScale = 1 + Math.max(0, cycle - 1) * 0.15;
    boss.maxHp *= hpScale;
    boss.hp = boss.maxHp;
    boss.damage *= dmgScale;
    boss.xpValue = Math.round(boss.xpValue * (1 + Math.max(0, cycle - 1) * 0.5));
    this.enemies.push(boss);
    this.triggerScreenShake(12);
    if (window.soundManager) window.soundManager.playBossAlert();

    this.floatingTexts.push(new FloatingText({
      x: anchor.x,
      y: anchor.y - 60,
      text: cycle > 1 ? `!! BOSS SIKLUS ${cycle}: MAKIN KUAT !!` : '!! EMERGENCY: BOSS OUTAGE DETECTED !!',
      color: '#f85149',
      life: 2.0
    }));
  }

  // Hadiah bunuh boss: SEMUA exp langsung masuk pemain (vacuum) + senjata gratis + difficulty naik
  onBossKilled(boss) {
    const alivePlayers = this.getActivePlayers().filter(p => !p.dead);
    const anchor = alivePlayers[0] || this.player;

    // 1. Clear semua musuh normal: meledak + exp-nya langsung masuk (tanpa objek gem beterbangan)
    let cleared = 0;
    let vacuumXp = boss.xpValue;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e === boss || e.isBoss || e.dead) continue;
      cleared++;
      vacuumXp += e.xpValue;
      for (let k = 0; k < 4; k++) {
        this.particles.push(new Particle({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
          color: '#ffd700', size: 2 + Math.random() * 2, life: 0.5
        }));
      }
      this.enemies.splice(i, 1);
    }
    this.stats.bugsSquashed += cleared;

    // 2. Bonus shower LANGSUNG masuk juga (1 legendary + 2 rare + sisanya common)
    const showerBase = 6 + this.bossCycle * 4;
    const showerCount = 8 + this.bossCycle * 2;
    vacuumXp += showerBase * 13 + showerBase * 6 * 2 + showerBase * (showerCount - 3);

    // 3. Vacuum ke pemain terdekat: heal + multi-level sekaligus, 1x modal level-up
    if (anchor && !anchor.dead) {
      anchor.heal(Math.max(5, vacuumXp * 0.15));
      anchor.xp += vacuumXp;
      anchor.totalXpEarned += vacuumXp;
      let leveled = false, guard = 0;
      while (anchor.xp >= anchor.xpNext && guard++ < 25) {
        anchor.xp -= anchor.xpNext;
        anchor.level++;
        anchor.xpNext = Math.floor(anchor.xpNext * 1.38 + 15);
        leveled = true;
      }
      this.floatingTexts.push(new FloatingText({
        x: anchor.x, y: anchor.y - 80,
        text: `SECTOR CLEAR! +${Math.round(vacuumXp)} XP LANGSUNG MASUK`,
        color: '#ffd700', life: 2.6, isCrit: true
      }));
      if (leveled) this.triggerLevelUp(anchor);
    }

    // 3. Senjata gratis untuk tiap pemain yang hidup
    for (const p of alivePlayers) {
      this.grantFreeWeapon(p);
    }

    // 4. Difficulty naik: HP x1.35, damage x1.15, XP x1.25, spawn 10% lebih cepat
    this.enemyHpMult *= 1.35;
    this.enemyDmgMult *= 1.15;
    this.enemyXpMult *= 1.25;
    this.spawnRateMult = Math.max(0.5, (this.spawnRateMult || 1) * 0.9);

    this.triggerScreenShake(14);
    if (window.soundManager) {
      window.soundManager.playExplosion();
      if (window.soundManager.playMerge) window.soundManager.playMerge();
      else window.soundManager.playLevelUp();
    }
  }

  // Kasih 1 senjata/upgade gratis (hadiah boss)
  grantFreeWeapon(player) {
    const ownedIds = Object.keys(player.weapons);
    const unowned = Object.keys(WEAPONS).filter(id => !player.weapons[id]);
    if (unowned.length > 0 && ownedIds.length < 4) {
      const id = unowned[Math.floor(Math.random() * unowned.length)];
      player.addWeapon(id);
      this.floatingTexts.push(new FloatingText({
        x: player.x, y: player.y - 60,
        text: `BONUS WEAPON: ${WEAPONS[id].name}`,
        color: '#39d353', life: 2.0, isCrit: true
      }));
      return;
    }
    const upgradable = ownedIds.filter(id => {
      const w = player.weapons[id];
      return w.level < w.config.maxLevel;
    });
    if (upgradable.length > 0) {
      const id = upgradable[Math.floor(Math.random() * upgradable.length)];
      player.upgradeWeapon(id);
      this.floatingTexts.push(new FloatingText({
        x: player.x, y: player.y - 60,
        text: `BONUS UPGRADE: ${player.weapons[id].config.name} Lv.${player.weapons[id].level}`,
        color: '#39d353', life: 2.0, isCrit: true
      }));
      return;
    }
    player.heal(player.maxHp);
    this.floatingTexts.push(new FloatingText({
      x: player.x, y: player.y - 60,
      text: 'OVERCHARGE: FULL HP',
      color: '#39d353', life: 2.0, isCrit: true
    }));
  }

  // --- MAIN UPDATE LOOP ---
  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Combo decay
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.currentCombo = 0;
      }
    }

    // Camera follows P1, or midpoint between players in co-op
    const alivePlayers = this.getActivePlayers().filter(p => !p.dead);
    if (alivePlayers.length > 0) {
      const focusX = alivePlayers.reduce((s, p) => s + p.x, 0) / alivePlayers.length;
      const focusY = alivePlayers.reduce((s, p) => s + p.y, 0) / alivePlayers.length;
      this.camera.x += (focusX - CANVAS_WIDTH / 2 - this.camera.x) * 0.12;
      this.camera.y += (focusY - CANVAS_HEIGHT / 2 - this.camera.y) * 0.12;
    }

    // Screen shake decay
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 15);
    }

    // Update Players (P1 = WASD/touch, P2 = arrows in co-op)
    const players = this.getActivePlayers();
    players.forEach((p, idx) => {
      if (p.dead) return;
      const moveInput = this.input.getMovementVector(idx + 1, this.coop);
      p.update(dt, moveInput);
      // Manual aim follows movement heading; auto aim handled per-weapon
      if ((moveInput.x !== 0 || moveInput.y !== 0)) {
        p.manualAimAngle = Math.atan2(moveInput.y, moveInput.x);
      }
    });

    // Update Weapons
    this.updateWeapons(dt);

    // Update Spawner
    this.updateSpawner(dt);

    // Update Laser Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.duration -= dt;
      if (b.duration <= 0) {
        this.beams.splice(i, 1);
      }
    }

    // Update Chain lightning zaps
    for (let i = this.zaps.length - 1; i >= 0; i--) {
      const z = this.zaps[i];
      z.life -= dt;
      if (z.life <= 0) this.zaps.splice(i, 1);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.enemies);

      // Pull mines attract enemies before detonating
      if (p.type === 'mine' && p.pull && !p.dead) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = p.x - e.x, dy = p.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < p.radius * 2.5) {
            e.x += (dx / d) * 3.2 * 60 * dt;
            e.y += (dy / d) * 3.2 * 60 * dt;
          }
        }
      }

      // Handle mine detonation
      if (p.type === 'mine' && p.dead) {
        // Explode
        if (window.soundManager) window.soundManager.playExplosion();
        this.triggerScreenShake(4);

        const stages = p.chainExplode ? Math.max(1, p.chainCount || 1) : 1;
        for (let s = 0; s < stages; s++) {
          const stageRadius = p.radius * (1 + s * 0.35);
          const stageDmg = p.damage * (s === 0 ? 1 : 0.6);
          for (const e of this.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < stageRadius) {
              // Chain stages re-hit with falloff damage
              e.takeDamage(stageDmg);
              this.stats.damageDealt += stageDmg;
              if (p.freeze) e.freezeTimer = Math.max(e.freezeTimer, 2.0);
            }
          }
          // Blast ring visual per stage
          this.shockwaves.push({
            x: p.x + (s > 0 ? (Math.random() - 0.5) * 40 : 0),
            y: p.y + (s > 0 ? (Math.random() - 0.5) * 40 : 0),
            radius: 10,
            maxRadius: stageRadius,
            color: p.color || '#58a6ff',
            life: 0.35 + s * 0.12,
            maxLife: 0.35 + s * 0.12
          });
        }
      }

      // Handle duck bouncing around P1 (fallback anchor)
      if (p.type === 'duck') {
        const anchor = this.player;
        const dx = p.x - anchor.x;
        const dy = p.y - anchor.y;
        if (Math.abs(dx) > 550) {
          p.vx *= -1;
          p.bounces--;
          if (window.soundManager) window.soundManager.playDuckQuack();
        }
        if (Math.abs(dy) > 350) {
          p.vy *= -1;
          p.bounces--;
          if (window.soundManager) window.soundManager.playDuckQuack();
        }
        if (p.bounces <= 0) p.dead = true;
      }

      // Check collision with enemies
      if (p.type === 'commit' || p.type === 'duck' || p.type === 'rocket') {
        for (const e of this.enemies) {
          if (e.dead || p.hits.has(e)) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.radius) {
            p.hits.add(e);
            e.takeDamage(p.damage);
            this.stats.damageDealt += p.damage;

            this.floatingTexts.push(new FloatingText({
              x: e.x,
              y: e.y - 12,
              text: Math.round(p.damage),
              color: p.type === 'rocket' ? (p.projectileColor || '#f85149') : '#58a6ff'
            }));

            // Spawn commit impact particles
            this.particles.push(new Particle({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              char: '+',
              color: p.type === 'rocket' ? (p.projectileColor || '#f85149') : '#39d353',
              size: 5,
              life: 0.5
            }));

            if (p.splash > 0) {
              // Rocket splash + shockwave ring (commit splash = Git Push --force)
              const splashMult = p.type === 'rocket' ? 0.5 : 0.6;
              for (const nearby of this.enemies) {
                if (nearby.dead || nearby === e) continue;
                if (Math.hypot(nearby.x - p.x, nearby.y - p.y) < p.splash) {
                  nearby.takeDamage(p.damage * splashMult);
                  this.stats.damageDealt += p.damage * splashMult;
                }
              }
              if (p.type === 'rocket') {
                this.shockwaves.push({
                  x: p.x, y: p.y, radius: 5,
                  maxRadius: p.splash,
                  color: p.projectileColor || '#f85149',
                  life: 0.3, maxLife: 0.3
                });
                if (window.soundManager) window.soundManager.playExplosion();
                this.triggerScreenShake(3);
              }
            }

            // Load balancer rockets retarget instead of dying
            if (p.retarget) {
              p.hits.clear();
              p.pierce = 1;
            } else {
              p.pierce--;
              if (p.pierce <= 0) {
                p.dead = true;
                break;
              }
            }
          }
        }
      }

      if (p.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemies & handle death (target nearest living player)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      // Pick nearest living player as target
      let target = this.player;
      let bestD = Infinity;
      for (const p of this.getActivePlayers()) {
        if (p.dead) continue;
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < bestD) { bestD = d; target = p; }
      }
      e.update(dt, target);

      // Check collision against every living player
      for (const p of this.getActivePlayers()) {
        if (p.dead) continue;
        const distToPlayer = Math.hypot(e.x - p.x, e.y - p.y);
        if (distToPlayer < e.radius + p.radius) {
          const dmgTaken = p.takeDamage(e.damage);
          if (dmgTaken > 0) {
            this.triggerScreenShake(5);
            if (window.soundManager) window.soundManager.playHit();
            this.floatingTexts.push(new FloatingText({
              x: p.x,
              y: p.y - 20,
              text: `-${dmgTaken}`,
              color: '#f85149'
            }));

            if (p.hp <= 0) {
              p.dead = true;
              this.floatingTexts.push(new FloatingText({
                x: p.x, y: p.y - 44,
                text: `${(p.name || 'PLAYER').toUpperCase()} DOWN`,
                color: '#f85149', life: 2.0
              }));
              // Game over only when every player is down
              const anyoneAlive = this.getActivePlayers().some(pl => !pl.dead);
              if (!anyoneAlive) {
                this.handleGameOver();
                return;
              }
            }
          }
        }
      }

      if (e.dead) {
        this.stats.bugsSquashed++;
        this.stats.currentCombo++;
        this.stats.comboTimer = 2.5;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.currentCombo);

        if (e.isBoss) {
          this.unlockAchievement('defeat_boss');
          this.triggerScreenShake(10);
          this.onBossKilled(e);
        }

        // Drop XP gem (boss tidak drop fisik, xp-nya masuk vacuum onBossKilled)
        if (!e.isBoss) {
          this.gems.push(new Gem(e.x, e.y, e.xpValue));
        }

        // Squashed bug explosion particles
        for (let k = 0; k < 6; k++) {
          this.particles.push(new Particle({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: e.color,
            size: Math.random() * 3 + 2,
            life: 0.4
          }));
        }

        // Hapus by identity (onBossKilled mengubah isi array saat iterasi)
        const deadIdx = this.enemies.indexOf(e);
        if (deadIdx !== -1) this.enemies.splice(deadIdx, 1);
      }
    }

    // Update XP Gems (nearest living player attracts and collects)
    const livingPlayers = this.getActivePlayers().filter(p => !p.dead);
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      let nearest = null, nearestD = Infinity;
      for (const p of livingPlayers) {
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < nearestD) { nearestD = d; nearest = p; }
      }
      if (!nearest) continue;
      g.update(dt, nearest);
      const d = Math.hypot(g.x - nearest.x, g.y - nearest.y);
      if (d < nearest.radius + g.radius) {
        if (window.soundManager) window.soundManager.playGem();

        // Heal kecil dari setiap gem (bonus char dihandle di Player.heal)
        nearest.heal(Math.max(0.5, g.baseValue * 0.3));

        if (g.rarity === 'legendary') {
          this.floatingTexts.push(new FloatingText({
            x: g.x, y: g.y - 20,
            text: `x${g.multiplier} XP`,
            color: '#f85149', life: 1.0, isCrit: true
          }));
          this.triggerScreenShake(3);
        } else if (g.rarity === 'rare') {
          this.floatingTexts.push(new FloatingText({
            x: g.x, y: g.y - 16,
            text: `x${g.multiplier} XP`,
            color: '#d29922', life: 0.7
          }));
        }

        const leveledUp = nearest.addXp(g.xpValue);
        this.gems.splice(i, 1);
        if (leveledUp) {
          this.triggerLevelUp(nearest);
          return;
        }
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      sw.radius += (sw.maxRadius - sw.radius) * 12 * dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.update(dt);
      if (pt.dead) this.particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update(dt);
      if (ft.dead) this.floatingTexts.splice(i, 1);
    }

    this.checkAchievements();
  }

  handleGameOver() {
    this.state = 'GAME_OVER';
    if (window.soundManager) {
      window.soundManager.stopBgm();
      window.soundManager.playGameOver();
    }
    this.saveHighScore();
    const topLevel = Math.max(this.player.level, this.player2 ? this.player2.level : 1);
    this.ui.showGameOverModal({
      timeSurvived: this.gameTime,
      bugsSquashed: this.stats.bugsSquashed,
      levelReached: topLevel,
      damageDealt: Math.round(this.stats.damageDealt),
      maxCombo: this.stats.maxCombo
    });
  }

  // --- RENDER SYSTEM ---
  draw() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Screen Shake
    let camX = this.camera.x;
    let camY = this.camera.y;
    if (this.camera.shake > 0) {
      camX += (Math.random() - 0.5) * this.camera.shake * 4;
      camY += (Math.random() - 0.5) * this.camera.shake * 4;
    }
    const renderCamera = { x: camX, y: camY };

    // 1. Draw Cyber Grid / Commit Matrix Background
    this.drawBackground(renderCamera);

    if (this.state === 'PLAYING' || this.state === 'LEVEL_UP' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
      // 2. Draw Gems
      for (const gem of this.gems) {
        gem.draw(this.ctx, renderCamera);
      }

      // 3. Draw Laser Beams + Chain zaps
      this.drawBeams(renderCamera);
      this.drawZaps(renderCamera);

      // 4. Draw Shockwaves
      this.drawShockwaves(renderCamera);

      // 5. Draw Projectiles
      for (const proj of this.projectiles) {
        proj.draw(this.ctx, renderCamera);
      }

      // 6. Draw Enemies
      for (const enemy of this.enemies) {
        enemy.draw(this.ctx, renderCamera);
      }

      // 7. Draw Players & Orbiting weapons
      for (const p of this.getActivePlayers()) {
        if (p.dead) continue;
        p.draw(this.ctx, renderCamera);
      }
      this.drawOrbitWeapons(renderCamera);

      // 8. Draw Particles
      for (const pt of this.particles) {
        pt.draw(this.ctx, renderCamera);
      }

      // 9. Draw Floating Texts
      for (const ft of this.floatingTexts) {
        ft.draw(this.ctx, renderCamera);
      }

      // 10. Virtual Touch Joystick
      this.input.drawVirtualJoystick(this.ctx);
    }
  }

  drawBackground(camera) {
    const gridSize = 64;
    const startX = -(camera.x % gridSize);
    const startY = -(camera.y % gridSize);

    // Dark canvas background
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid lines
    this.ctx.strokeStyle = 'rgba(48, 54, 61, 0.35)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    for (let x = startX; x < CANVAS_WIDTH; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = startY; y < CANVAS_HEIGHT; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
    }
    this.ctx.stroke();

    // Subtle GitHub Commit dots at intersections
    this.ctx.fillStyle = 'rgba(57, 211, 83, 0.08)';
    for (let x = startX; x < CANVAS_WIDTH; x += gridSize * 2) {
      for (let y = startY; y < CANVAS_HEIGHT; y += gridSize * 2) {
        this.ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  }

  drawLinterShield(camera) {
    // Backward-compatible alias: all orbit weapons share one renderer now
    this.drawOrbitWeapons(camera);
  }

  drawOrbitWeapons(camera) {
    for (const player of this.getActivePlayers()) {
      if (player.dead) continue;
      for (const [wid, w] of Object.entries(player.weapons)) {
        const config = WEAPONS[wid] || w.config;
        if (!config || config.type !== 'orbit') continue;

        const count = w.config.count || 2;
        const radius = w.config.orbitRadius || 75;
        const symbols = w.config.symbols || config.symbols || ['{ }', ';', '===', '!==', '()', '=>'];
        const color = w.config.orbitColor || config.orbitColor || '#3fb950';
        const isChaos = !!w.config.chaosOrbit;

        const screenX = player.x - camera.x;
        const screenY = player.y - camera.y;

        this.ctx.save();
        this.ctx.translate(screenX, screenY);

        // Faint full orbit ring so the path reads clearly
        this.ctx.strokeStyle = color + '26';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        for (let i = 0; i < count; i++) {
          const theta = (w.angle || 0) + (i / count) * Math.PI * 2 + (isChaos ? Math.sin((w.angle || 0) * 2 + i) * 0.5 : 0);
          const r = radius + (isChaos ? Math.sin((w.angle || 0) * 3 + i) * 20 : 0);
          const ox = Math.cos(theta) * r;
          const oy = Math.sin(theta) * r;

          // Glow
          this.ctx.shadowColor = color;
          this.ctx.shadowBlur = 14;

          this.ctx.fillStyle = '#161b22';
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(ox, oy, 13, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = color;
          this.ctx.font = 'bold 9px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(symbols[i % symbols.length], ox, oy + 1);
        }

        this.ctx.restore();
      }
    }
  }

  drawBeams(camera) {
    for (const b of this.beams) {
      const sx = b.x1 - camera.x;
      const sy = b.y1 - camera.y;
      const ex = sx + Math.cos(b.angle) * b.length;
      const ey = sy + Math.sin(b.angle) * b.length;

      const alpha = Math.max(0, b.duration / b.maxDuration);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      const beamColor = b.color || '#ff7b72';
      // Outer glow beam
      this.ctx.strokeStyle = beamColor;
      this.ctx.lineWidth = b.width;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = beamColor;
      this.ctx.shadowBlur = 20;

      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();

      // Inner white core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = b.width * 0.35;
      this.ctx.shadowBlur = 0;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  drawZaps(camera) {
    for (const z of this.zaps) {
      const alpha = Math.max(0, z.life / z.maxLife);
      const sx = z.x1 - camera.x, sy = z.y1 - camera.y;
      const ex = z.x2 - camera.x, ey = z.y2 - camera.y;
      // Jagged midpoint for lightning feel
      const mx = (sx + ex) / 2 + (Math.random() - 0.5) * 14;
      const my = (sy + ey) / 2 + (Math.random() - 0.5) * 14;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = z.color || '#a371f7';
      this.ctx.shadowColor = z.color || '#a371f7';
      this.ctx.shadowBlur = 12;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(mx, my);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(mx, my);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawShockwaves(camera) {
    for (const sw of this.shockwaves) {
      const sx = sw.x - camera.x;
      const sy = sw.y - camera.y;
      const alpha = Math.max(0, sw.life / sw.maxLife);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = sw.color;
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = sw.color;
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.arc(sx, sy, sw.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  // --- ENGINE LOOP ---
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap delta time
    this.lastTime = timestamp;

    // Re-queue FIRST so one bad frame can never freeze the game permanently
    requestAnimationFrame(this.loop);

    try {
      this.update(dt);
      this.draw();
    } catch (err) {
      this.reportFrameError(err);
    }

    if (this.ui && this.state === 'PLAYING') {
      try {
        const hudData = {
          time: this.gameTime,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          level: this.player.level,
          xp: this.player.xp,
          xpNext: this.player.xpNext,
          kills: this.stats.bugsSquashed,
          combo: this.stats.currentCombo,
          weapons: this.player.weapons,
          passives: this.player.passives
        };
        if (this.coop && this.player2) {
          hudData.p2 = {
            hp: this.player2.hp,
            maxHp: this.player2.maxHp,
            level: this.player2.level,
            dead: !!this.player2.dead,
            name: this.player2.name
          };
        }
        this.ui.updateHUD(hudData);
      } catch (err) {
        this.reportFrameError(err);
      }
    }
  }

  // Show frame errors on screen (throttled) instead of silently freezing
  reportFrameError(err) {
    try { console.error('[BugHunter]', err); } catch (e) {}
    const now = Date.now();
    if (this.lastFrameErrorAt && now - this.lastFrameErrorAt < 2000) return;
    this.lastFrameErrorAt = now;
    try {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(248,81,73,0.92)';
      this.ctx.font = 'bold 13px ui-monospace, monospace';
      this.ctx.textAlign = 'center';
      const msg = 'FRAME ERROR: ' + String((err && err.message) || err).slice(0, 90);
      this.ctx.fillText(msg, CANVAS_WIDTH / 2, 60);
      this.ctx.restore();
    } catch (e) {}
  }
}
