// game.js - Core Engine, Wave Spawner, Combat Logic, and Loop

import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, WEAPONS, PASSIVES, ENEMY_TYPES, ACHIEVEMENTS } from './constants.js';
import { Player, Enemy, Projectile, Gem, Particle, FloatingText } from './entities.js';
import { InputHandler } from './input.js';

export class Game {
  constructor(canvas, uiManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiManager;

    this.input = new InputHandler(this.canvas);
    this.input.onPauseToggle = () => this.togglePause();

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

    this.camera = {
      x: 0,
      y: 0,
      shake: 0
    };

    this.gameTime = 0; // seconds
    this.spawnTimer = 0;
    this.bossSpawned5m = false;
    this.bossSpawned8m = false;

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
      if (this.player.level >= 10) this.unlockAchievement('level_10');
      if (this.player.level >= 20) this.unlockAchievement('level_20');

      for (const w of Object.values(this.player.weapons)) {
        if (w.level >= 5) this.unlockAchievement('max_weapon');
      }
    }

    if (this.stats.bugsSquashed >= 500) this.unlockAchievement('squash_500');
  }

  start(charId = 'junior_dev') {
    this.selectedCharId = charId;
    const charConfig = CHARACTERS[charId] || CHARACTERS.junior_dev;
    this.player = new Player(charConfig);

    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.beams = [];
    this.shockwaves = [];

    this.gameTime = 0;
    this.spawnTimer = 0;
    this.bossSpawned5m = false;
    this.bossSpawned8m = false;

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
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.bossSpawned5m = false;
    this.bossSpawned8m = false;
    if (window.soundManager) window.soundManager.stopBgm();
    if (this.ui) this.ui.showMainMenu();
  }

  // Generate 3 random upgrade choices for level-up screen
  getUpgradeChoices() {
    const choices = [];
    const availableWeapons = Object.keys(WEAPONS);
    const availablePassives = Object.keys(PASSIVES);

    // Filter available weapons (either not yet owned, or owned and < maxLevel)
    const weaponPool = [];
    for (const wid of availableWeapons) {
      const owned = this.player.weapons[wid];
      if (!owned) {
        // Can add new weapon if less than 4 weapons held
        if (Object.keys(this.player.weapons).length < 4) {
          weaponPool.push({ type: 'weapon_new', id: wid });
        }
      } else if (owned.level < owned.config.maxLevel) {
        weaponPool.push({ type: 'weapon_upgrade', id: wid, level: owned.level + 1 });
      }
    }

    // Filter available passives
    const passivePool = [];
    for (const pid of availablePassives) {
      const currentLevel = this.player.passives[pid] || 0;
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

    const selected = combinedPool.slice(0, 3);

    // Format for UI
    return selected.map(item => {
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
        const w = this.player.weapons[item.id];
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
  }

  applyUpgrade(choice) {
    if (choice.type === 'weapon_new') {
      this.player.addWeapon(choice.id);
    } else if (choice.type === 'weapon_upgrade') {
      this.player.upgradeWeapon(choice.id);
    } else if (choice.type === 'passive') {
      this.player.addPassive(choice.id);
    }

    this.checkAchievements();
    this.state = 'PLAYING';
    this.ui.hideLevelUpModal();
  }

  triggerLevelUp() {
    this.state = 'LEVEL_UP';
    if (window.soundManager) window.soundManager.playLevelUp();
    this.triggerScreenShake(4);

    const choices = this.getUpgradeChoices();
    // If no upgrades left, heal player and grant bonus stats
    if (choices.length === 0) {
      this.player.heal(50);
      this.floatingTexts.push(new FloatingText({
        x: this.player.x,
        y: this.player.y - 40,
        text: 'FULL REFACTOR! +50 HP HEAL',
        color: '#39d353'
      }));
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
  updateWeapons(dt) {
    if (!this.player) return;

    for (const [weaponId, weapon] of Object.entries(this.player.weapons)) {
      weapon.timer -= dt;
      if (weapon.timer > 0) continue;

      // Calculate effective cooldown
      const baseCd = weapon.config.cooldown || 1.0;
      const effectiveCd = Math.max(0.15, baseCd * this.player.cooldownMultiplier);

      if (weaponId === 'git_commit') {
        this.fireGitCommit(weapon);
        weapon.timer = effectiveCd;
      } else if (weaponId === 'linter_shield') {
        // Linter shield is a continuous aura - handled once per frame below, skip timer logic
        continue;
      } else if (weaponId === 'hotfix_laser') {
        this.fireHotfixLaser(weapon);
        weapon.timer = effectiveCd;
      } else if (weaponId === 'docker_container') {
        this.fireDockerDeploy(weapon);
        weapon.timer = effectiveCd;
      } else if (weaponId === 'copilot_drone') {
        this.fireCopilotDrone(weapon);
        weapon.timer = effectiveCd;
      } else if (weaponId === 'rubber_duck') {
        this.fireRubberDuck(weapon);
        weapon.timer = effectiveCd;
      }
    }

    // Always update Linter damage tick if player owns it
    if (this.player.weapons['linter_shield']) {
      this.updateLinterShield(this.player.weapons['linter_shield'], dt);
    }
  }

  fireGitCommit(weapon) {
    if (this.enemies.length === 0) return;

    // Pick closest enemies
    const sorted = [...this.enemies]
      .map(e => ({ e, d: Math.hypot(e.x - this.player.x, e.y - this.player.y) }))
      .sort((a, b) => a.d - b.d);

    const count = weapon.config.count || 1;
    const targets = sorted.slice(0, count);

    const commitHashes = ['#fixBug', '#init', '#hotfix', '#deploy', '#merge', '#patch', '#push', '#main'];

    for (let i = 0; i < count; i++) {
      const targetObj = targets[i % targets.length];
      let angle = 0;
      if (targetObj) {
        angle = Math.atan2(targetObj.e.y - this.player.y, targetObj.e.x - this.player.x);
        // Slight spread if multiple
        angle += (i - (count - 1) / 2) * 0.15;
      } else {
        angle = Math.random() * Math.PI * 2;
      }

      const speed = weapon.config.speed || 7.5;
      const proj = new Projectile({
        type: 'commit',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: (weapon.config.damage || 20) * this.player.damageMultiplier,
        pierce: weapon.config.pierce || 1,
        splash: weapon.config.splash || 0,
        lifetime: 1.8,
        text: commitHashes[Math.floor(Math.random() * commitHashes.length)],
        color: '#58a6ff'
      });

      this.projectiles.push(proj);
    }

    if (window.soundManager) window.soundManager.playShoot();
  }

  updateLinterShield(weapon, dt) {
    weapon.angle = (weapon.angle || 0) + (weapon.config.speed || 2.5) * dt;
    const count = weapon.config.count || 2;
    const radius = weapon.config.orbitRadius || 75;
    const dmg = (weapon.config.damage || 16) * this.player.damageMultiplier;

    for (let i = 0; i < count; i++) {
      const theta = weapon.angle + (i / count) * Math.PI * 2;
      const orbX = this.player.x + Math.cos(theta) * radius;
      const orbY = this.player.y + Math.sin(theta) * radius;

      // Check collision with enemies
      for (const enemy of this.enemies) {
        const d = Math.hypot(enemy.x - orbX, enemy.y - orbY);
        if (d < enemy.radius + 14) {
          enemy.takeDamage(dmg * dt * 3.5); // Damage tick
          this.stats.damageDealt += dmg * dt * 3.5;
          if (weapon.config.stun) {
            enemy.stunTimer = 0.5;
          }
          // Spawn tiny linter spark
          if (Math.random() < 0.25) {
            this.particles.push(new Particle({
              x: orbX,
              y: orbY,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: '#3fb950',
              size: 3,
              life: 0.3
            }));
          }
        }
      }
    }
  }

  fireHotfixLaser(weapon) {
    let angle = this.player.facing === 1 ? 0 : Math.PI;

    // Find nearest target if available
    let nearest = null;
    let minDist = 450;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
    }

    const angles = [angle];
    if (weapon.config.dualBeam) {
      angles.push(angle + Math.PI);
    }
    if (weapon.config.crossBeam) {
      angles.push(angle + Math.PI / 2, angle - Math.PI / 2);
    }

    const beamLength = 700;
    const beamWidth = weapon.config.width || 28;
    const dmg = (weapon.config.damage || 40) * this.player.damageMultiplier;

    for (const ang of angles) {
      this.beams.push({
        x1: this.player.x,
        y1: this.player.y,
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
        const ex = e.x - this.player.x;
        const ey = e.y - this.player.y;
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
          }
        }
      }
    }

    this.triggerScreenShake(3);
    if (window.soundManager) window.soundManager.playLaser();
  }

  fireDockerDeploy(weapon) {
    const proj = new Projectile({
      type: 'mine',
      x: this.player.x + (Math.random() - 0.5) * 40,
      y: this.player.y + (Math.random() - 0.5) * 40,
      damage: (weapon.config.damage || 55) * this.player.damageMultiplier,
      radius: weapon.config.radius || 90,
      lifetime: weapon.config.duration || 3.0,
      freeze: !!weapon.config.freeze,
      cluster: !!weapon.config.cluster
    });

    this.projectiles.push(proj);
  }

  fireCopilotDrone(weapon) {
    if (this.enemies.length === 0) return;

    // Target random or closest enemy
    const enemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
    if (!enemy) return;

    const dmg = (weapon.config.damage || 18) * this.player.damageMultiplier;
    enemy.takeDamage(dmg);
    this.stats.damageDealt += dmg;

    // Visual lightning beam from player/drone
    this.particles.push(new Particle({
      x: (this.player.x + enemy.x) / 2,
      y: (this.player.y + enemy.y) / 2,
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

  fireRubberDuck(weapon) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6;

    const proj = new Projectile({
      type: 'duck',
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: (weapon.config.damage || 50) * this.player.damageMultiplier,
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

    // Spawn rate speeds up as time passes
    const spawnInterval = Math.max(0.35, 1.4 - (this.gameTime / 300) * 0.9);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemyWave();
    }

    // Boss at 5 minutes (300s)
    if (this.gameTime >= 300 && !this.bossSpawned5m) {
      this.bossSpawned5m = true;
      this.spawnBoss('boss_friday_prod');
    }

    // Boss at 8 minutes (480s)
    if (this.gameTime >= 480 && !this.bossSpawned8m) {
      this.bossSpawned8m = true;
      this.spawnBoss('boss_legacy_spaghetti');
    }
  }

  spawnEnemyWave() {
    if (!this.player) return;

    // Maximum alive enemies to prevent lag
    if (this.enemies.length >= 180) return;

    // Determine enemy pool based on game time
    const pool = ['bug'];
    if (this.gameTime > 30) pool.push('error_404');
    if (this.gameTime > 60) pool.push('null_pointer');
    if (this.gameTime > 120) pool.push('merge_conflict', 'ddos_packet');
    if (this.gameTime > 180) pool.push('memory_leak');

    // Spawn 1 to 4 enemies in this tick
    const count = 1 + Math.floor(this.gameTime / 90);
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 480 + Math.random() * 120; // Just outside screen view
      const x = this.player.x + Math.cos(angle) * dist;
      const y = this.player.y + Math.sin(angle) * dist;

      this.enemies.push(new Enemy(type, x, y));
    }
  }

  spawnBoss(bossTypeKey) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 400;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    this.enemies.push(new Enemy(bossTypeKey, x, y));
    this.triggerScreenShake(12);
    if (window.soundManager) window.soundManager.playBossAlert();

    this.floatingTexts.push(new FloatingText({
      x: this.player.x,
      y: this.player.y - 60,
      text: '!! EMERGENCY: BOSS OUTAGE DETECTED !!',
      color: '#f85149',
      life: 2.0
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

    // Camera follow player with slight smoothing
    this.camera.x += (this.player.x - CANVAS_WIDTH / 2 - this.camera.x) * 0.12;
    this.camera.y += (this.player.y - CANVAS_HEIGHT / 2 - this.camera.y) * 0.12;

    // Screen shake decay
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 15);
    }

    // Update Player
    const moveInput = this.input.getMovementVector();
    this.player.update(dt, moveInput);

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

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // Handle mine detonation
      if (p.type === 'mine' && p.dead) {
        // Explode
        if (window.soundManager) window.soundManager.playExplosion();
        this.triggerScreenShake(4);

        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < p.radius) {
            e.takeDamage(p.damage);
            this.stats.damageDealt += p.damage;
            if (p.freeze) e.freezeTimer = 2.0;
          }
        }

        // Blast ring visual
        this.shockwaves.push({
          x: p.x,
          y: p.y,
          radius: 10,
          maxRadius: p.radius,
          color: '#58a6ff',
          life: 0.35,
          maxLife: 0.35
        });
      }

      // Handle duck bouncing on bounds
      if (p.type === 'duck') {
        const dx = p.x - this.player.x;
        const dy = p.y - this.player.y;
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
      if (p.type === 'commit' || p.type === 'duck') {
        for (const e of this.enemies) {
          if (p.hits.has(e)) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.radius) {
            p.hits.add(e);
            e.takeDamage(p.damage);
            this.stats.damageDealt += p.damage;

            this.floatingTexts.push(new FloatingText({
              x: e.x,
              y: e.y - 12,
              text: Math.round(p.damage),
              color: '#58a6ff'
            }));

            // Spawn commit impact particles
            this.particles.push(new Particle({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              char: '+',
              color: '#39d353',
              size: 5,
              life: 0.5
            }));

            if (p.splash > 0) {
              // Git Push --force splash
              for (const nearby of this.enemies) {
                if (nearby !== e && Math.hypot(nearby.x - p.x, nearby.y - p.y) < p.splash) {
                  nearby.takeDamage(p.damage * 0.6);
                }
              }
            }

            p.pierce--;
            if (p.pierce <= 0) {
              p.dead = true;
              break;
            }
          }
        }
      }

      if (p.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemies & handle death
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player);

      // Check player collision
      const distToPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (distToPlayer < e.radius + this.player.radius) {
        const dmgTaken = this.player.takeDamage(e.damage);
        if (dmgTaken > 0) {
          this.triggerScreenShake(5);
          if (window.soundManager) window.soundManager.playHit();
          this.floatingTexts.push(new FloatingText({
            x: this.player.x,
            y: this.player.y - 20,
            text: `-${dmgTaken}`,
            color: '#f85149'
          }));

          if (this.player.hp <= 0) {
            this.handleGameOver();
            return;
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
        }

        // Drop GitHub Contribution Green XP Gem
        this.gems.push(new Gem(e.x, e.y, e.xpValue));

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

        this.enemies.splice(i, 1);
      }
    }

    // Update XP Gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.update(dt, this.player);

      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (d < this.player.radius + g.radius) {
        if (window.soundManager) window.soundManager.playGem();
        const leveledUp = this.player.addXp(g.xpValue);
        this.gems.splice(i, 1);

        if (leveledUp) {
          this.triggerLevelUp();
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
    this.ui.showGameOverModal({
      timeSurvived: this.gameTime,
      bugsSquashed: this.stats.bugsSquashed,
      levelReached: this.player.level,
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

      // 3. Draw Laser Beams
      this.drawBeams(renderCamera);

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

      // 7. Draw Player & Orbiting Linter
      if (this.player) {
        this.player.draw(this.ctx, renderCamera);
        this.drawLinterShield(renderCamera);
      }

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
    const w = this.player.weapons['linter_shield'];
    if (!w) return;

    const count = w.config.count || 2;
    const radius = w.config.orbitRadius || 75;
    const symbols = ['{ }', ';', '===', '!==', '()', '=>'];

    const screenX = this.player.x - camera.x;
    const screenY = this.player.y - camera.y;

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    for (let i = 0; i < count; i++) {
      const theta = (w.angle || 0) + (i / count) * Math.PI * 2;
      const ox = Math.cos(theta) * radius;
      const oy = Math.sin(theta) * radius;

      // Glow
      this.ctx.shadowColor = '#3fb950';
      this.ctx.shadowBlur = 10;

      this.ctx.fillStyle = '#161b22';
      this.ctx.strokeStyle = '#3fb950';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(ox, oy, 14, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#39d353';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(symbols[i % symbols.length], ox, oy + 1);
    }

    this.ctx.restore();
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

      // Outer glow beam
      this.ctx.strokeStyle = '#ff7b72';
      this.ctx.lineWidth = b.width;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = '#ff7b72';
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

    this.update(dt);
    this.draw();

    if (this.ui && this.state === 'PLAYING') {
      this.ui.updateHUD({
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
      });
    }

    requestAnimationFrame(this.loop);
  }
}
