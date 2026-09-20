// entities.js - Player, Enemy, Projectile, XP Gem, Particle, FloatingText

import { WEAPONS, PASSIVES, ENEMY_TYPES } from './constants.js';

export class Player {
  constructor(charConfig) {
    this.charId = charConfig.id;
    this.name = charConfig.name;
    this.title = charConfig.title;
    this.shortLabel = charConfig.shortLabel || 'DEV';
    this.color = charConfig.color;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.facing = 1;

    this.baseSpeed = charConfig.speed;
    this.speed = this.baseSpeed;
    this.baseMaxHp = charConfig.maxHp;
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;

    this.level = 1;
    this.xp = 0;
    this.xpNext = 25;
    this.totalXpEarned = 0;

    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.pickupRadius = 90;
    this.damageReduction = 0;

    // Character-specific passives (9 total)
    if (this.charId === 'junior_dev') {
      this.pickupRadius *= 1.35;
    } else if (this.charId === 'senior_architect') {
      this.damageMultiplier *= 1.15;
      this.damageReduction = 0.15;
    } else if (this.charId === 'devops_wizard') {
      this.speed *= 1.15;
      this.cooldownMultiplier *= 0.85;
    } else if (this.charId === 'prompt_engineer') {
      this.xpMultiplier = 1.25;
    } else if (this.charId === 'frontend_wizard') {
      this.cooldownMultiplier *= 0.75;
    } else if (this.charId === 'backend_beast') {
      this.damageMultiplier *= 1.30;
    } else if (this.charId === 'qa_hunter') {
      this.pickupRadius *= 1.40;
      this.xpMultiplier = 1.15;
    } else if (this.charId === 'data_scientist') {
      this.damageMultiplier *= 1.10;
      this.damageReduction = 0.15;
    } else if (this.charId === 'indie_hacker') {
      this.xpMultiplier = 1.10;
      this.healBonus = 0.15;
    }
    if (this.xpMultiplier === undefined) this.xpMultiplier = 1;
    if (this.healBonus === undefined) this.healBonus = 0;
    this.cursorAngle = -Math.PI / 2;
    this.cursorPulse = 0;

    this.weapons = {};
    this.addWeapon(charConfig.startingWeapon);
    this.passives = {};
    this.invulnerableTimer = 0;
    this.walkCycle = 0;
    this.isMoving = false;
  }

  addWeapon(weaponId) {
    if (!this.weapons[weaponId]) {
      this.weapons[weaponId] = {
        id: weaponId,
        level: 1,
        timer: 0,
        config: JSON.parse(JSON.stringify(WEAPONS[weaponId]))
      };
      return true;
    }
    return false;
  }

  upgradeWeapon(weaponId) {
    const w = this.weapons[weaponId];
    if (!w) return this.addWeapon(weaponId);
    if (w.level < w.config.maxLevel) {
      const upgradeInfo = w.config.levelUps[w.level - 1];
      if (upgradeInfo && upgradeInfo.bonus) {
        for (const [key, val] of Object.entries(upgradeInfo.bonus)) {
          if (typeof val === 'number') w.config[key] = (w.config[key] || 0) + val;
          else w.config[key] = val;
        }
      }
      w.level++;
      return true;
    }
    return false;
  }

  addPassive(passiveId) {
    if (!this.passives[passiveId]) this.passives[passiveId] = 0;
    if (this.passives[passiveId] < PASSIVES[passiveId].maxLevel) {
      this.passives[passiveId]++;
      this.recalculateStats();
      return true;
    }
    return false;
  }

  recalculateStats() {
    let speedBonus = 0, dmgBonus = 0, cdBonus = 0, hpBonus = 0;
    // Base multipliers per character (kept across recalculations)
    const baseDmg = { senior_architect: 1.15, backend_beast: 1.30, data_scientist: 1.10 }[this.charId] || 1.0;
    const baseCd = { devops_wizard: 0.85, frontend_wizard: 0.75 }[this.charId] || 1.0;
    const baseDmgRed = (this.charId === 'senior_architect' || this.charId === 'data_scientist') ? 0.15 : 0;
    const basePickup = this.charId === 'junior_dev' ? 0.35 : this.charId === 'qa_hunter' ? 0.40 : 0;
    let dmgRed = baseDmgRed;
    let pickupBonus = basePickup;
    for (const [id, lvl] of Object.entries(this.passives)) {
      const p = PASSIVES[id];
      if (p.bonusPerLevel.speedPct) speedBonus += p.bonusPerLevel.speedPct * lvl;
      if (p.bonusPerLevel.damagePct) dmgBonus += p.bonusPerLevel.damagePct * lvl;
      if (p.bonusPerLevel.cooldownPct) cdBonus += p.bonusPerLevel.cooldownPct * lvl;
      if (p.bonusPerLevel.maxHp) hpBonus += p.bonusPerLevel.maxHp * lvl;
      if (p.bonusPerLevel.damageReduction) dmgRed += p.bonusPerLevel.damageReduction * lvl;
      if (p.bonusPerLevel.pickupRadiusPct) pickupBonus += p.bonusPerLevel.pickupRadiusPct * lvl;
    }
    const oldMax = this.maxHp;
    this.maxHp = this.baseMaxHp + hpBonus;
    if (this.maxHp > oldMax) this.hp += (this.maxHp - oldMax);
    this.speed = this.baseSpeed * (1 + speedBonus);
    this.damageMultiplier = baseDmg * (1 + dmgBonus);
    this.cooldownMultiplier = Math.max(0.3, baseCd * (1 + cdBonus));
    this.pickupRadius = 90 * (1 + pickupBonus);
    this.damageReduction = Math.min(0.6, dmgRed);
  }

  addXp(amount) {
    const boosted = amount * (this.xpMultiplier || 1);
    this.xp += boosted;
    this.totalXpEarned += boosted;
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.38 + 15);
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return 0;
    const actualDamage = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
    this.hp -= actualDamage;
    this.invulnerableTimer = 0.45;
    if (this.hp <= 0) this.hp = 0;
    return actualDamage;
  }

  heal(amount) {
    const bonus = 1 + (this.healBonus || 0);
    this.hp = Math.min(this.maxHp, this.hp + amount * bonus);
  }

  update(dt, inputVector) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (inputVector.x !== 0 || inputVector.y !== 0) {
      this.isMoving = true;
      this.vx = inputVector.x * this.speed;
      this.vy = inputVector.y * this.speed;
      if (inputVector.x > 0) this.facing = 1;
      else if (inputVector.x < 0) this.facing = -1;
      // Cursor rotates to follow movement direction
      this.cursorAngle = Math.atan2(inputVector.y, inputVector.x);
      this.walkCycle += dt * 10;
    } else {
      this.isMoving = false;
      this.vx *= 0.8;
      this.vy *= 0.8;
    }
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
  }

  // --- CURSOR PLAYER (arrow follows movement, no emoji) ---
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Pickup radius indicator
    ctx.strokeStyle = 'rgba(57, 211, 83, 0.10)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.pickupRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ========= CURSOR ARROW (rotates to movement) =========
    ctx.save();
    ctx.rotate(this.cursorAngle + Math.PI / 2);

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-4, 6);
    ctx.lineTo(0, 14);
    ctx.lineTo(4, 6);
    ctx.lineTo(14, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Inner white core
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    // ========= END CURSOR =========

    // Cursor halo ring (pulse)
    this.cursorPulse += 0.15;
    const haloR = 22 + Math.sin(this.cursorPulse) * 2;
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // HP bar (above cursor)
    const barWidth = 46, barHeight = 5;
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-barWidth / 2, -36, barWidth, barHeight);
    ctx.fillStyle = hpPct > 0.5 ? '#3fb950' : hpPct > 0.25 ? '#d29922' : '#f85149';
    ctx.fillRect(-barWidth / 2, -36, barWidth * hpPct, barHeight);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, -36, barWidth, barHeight);

    // Level label
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv.${this.level}`, 0, -42);

    // Short label (under cursor)
    ctx.fillStyle = 'rgba(201,209,217,0.95)';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText(this.shortLabel, 0, 24);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

export class Enemy {
  constructor(typeKey, x, y) {
    const config = ENEMY_TYPES[typeKey];
    this.typeKey = typeKey;
    this.name = config.name;
    this.code = config.code;
    this.x = x; this.y = y;
    this.maxHp = config.hp;
    this.hp = this.maxHp;
    this.baseSpeed = config.speed;
    this.speed = this.baseSpeed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.color = config.color;
    this.radius = config.radius;
    this.isBoss = !!config.isBoss;
    this.isPhantom = !!config.isPhantom;
    this.spiky = !!config.spiky;
    this.grows = !!config.grows;
    this.hitFlashTimer = 0;
    this.animTime = Math.random() * 10;
    this.freezeTimer = 0;
    this.stunTimer = 0;
    this.markedTimer = 0;
    this.markAmp = 0.25;
    this.dead = false;
  }
  takeDamage(amount) {
    if (this.markedTimer > 0) amount *= (1 + (this.markAmp || 0.25));
    this.hp -= amount; this.hitFlashTimer = 0.12; if (this.hp <= 0) this.dead = true;
  }
  update(dt, player) {
    this.animTime += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.markedTimer > 0) this.markedTimer -= dt;
    if (this.stunTimer > 0) { this.stunTimer -= dt; return; }
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.grows && this.radius < 45) { this.radius += dt * 1.5; this.maxHp += dt * 6; this.hp += dt * 6; }
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const currentSpeed = this.freezeTimer > 0 ? this.speed * 0.4 : this.speed;
      this.x += (dx / dist) * currentSpeed * 60 * dt;
      this.y += (dy / dist) * currentSpeed * 60 * dt;
    }
  }
  draw(ctx, camera) {
    const screenX = this.x - camera.x, screenY = this.y - camera.y;
    ctx.save();
    ctx.translate(screenX, screenY);
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }
    if (this.isBoss) {
      const pulse = Math.sin(this.animTime * 6) * 6;
      ctx.shadowColor = this.color; ctx.shadowBlur = 22;
      ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Body
    ctx.fillStyle = this.freezeTimer > 0 ? '#58a6ff' : this.color;
    // Phantom enemies get dashed outline
    if (this.isPhantom) ctx.globalAlpha = 0.88;
    ctx.beginPath();
    if (this.typeKey === 'merge_conflict' || this.typeKey === 'null_pointer') {
      // diamond shape
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.closePath();
    } else if (this.typeKey === 'ddos_packet') {
      // hexagon / signal node
      for (let i=0;i<6;i++){ const a=i/6*Math.PI*2; const x=Math.cos(a)*this.radius, y=Math.sin(a)*this.radius; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath();
    } else {
      ctx.arc(0, 0, this.radius, 0, Math.PI*2);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = this.isBoss ? 2.2 : 1.1;
    ctx.stroke();

    if (this.spiky) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
      for (let i=0;i<8;i++){ const ang=(i/8)*Math.PI*2+this.animTime*2; const x1=Math.cos(ang)*(this.radius-1), y1=Math.sin(ang)*(this.radius-1); const x2=Math.cos(ang)*(this.radius+6), y2=Math.sin(ang)*(this.radius+6); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    }
    // Inner glyph (text code, not emoji)
    ctx.fillStyle = '#0d1117';
    ctx.font = `bold ${Math.max(8, Math.floor(this.radius*0.75))}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let label = this.code;
    if (this.typeKey === 'memory_leak') label = 'LEAK';
    if (this.typeKey === 'error_404') label = '404';
    ctx.fillText(label, 0, 1);

    // Growth ring for memory leak
    if (this.grows) {
      ctx.strokeStyle = 'rgba(126,231,135,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0,0,this.radius+4+Math.sin(this.animTime*4)*2,0,Math.PI*2); ctx.stroke();
    }

    if (this.isBoss) {
      const bw = this.radius*2.2, bh=6;
      const hpPct = Math.max(0, this.hp/this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(-bw/2, -this.radius-18, bw, bh);
      ctx.fillStyle = '#f85149'; ctx.fillRect(-bw/2, -this.radius-18, bw*hpPct, bh);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(-bw/2, -this.radius-18, bw, bh);
      ctx.fillStyle = '#ff7b72'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(this.name.toUpperCase(), 0, -this.radius-26);
    }
    ctx.restore();
  }
}

export class Projectile {
  constructor(opts) {
    this.type = opts.type;
    this.x = opts.x; this.y = opts.y;
    this.vx = opts.vx || 0; this.vy = opts.vy || 0;
    this.damage = opts.damage || 10;
    this.radius = opts.radius || 6;
    this.lifetime = opts.lifetime || 2.0;
    this.pierce = opts.pierce !== undefined ? opts.pierce : 1;
    this.hits = new Set();
    this.text = opts.text || '';
    this.color = opts.color || '#58a6ff';
    this.bounces = opts.bounces || 0;
    this.splash = opts.splash || 0;
    this.freeze = !!opts.freeze;
    this.stun = !!opts.stun;
    this.homing = !!opts.homing;
    this.homingStrength = opts.homingStrength || 6;
    this.retarget = !!opts.retarget;
    this.projectileColor = opts.projectileColor || opts.color || '#58a6ff';
    this.chainExplode = !!opts.chainExplode;
    this.chainCount = opts.chainCount || 0;
    this.pull = !!opts.pull;
    this.mineLabel = opts.mineLabel || 'DK';
    this.dead = false; this.anim = 0;
    this.trail = [];
  }
  update(dt, enemies) {
    this.anim += dt; this.lifetime -= dt;
    if (this.lifetime <=0){ this.dead=true; return; }
    if (this.type === 'commit') {
      this.trail.push({x:this.x, y:this.y});
      if (this.trail.length > 6) this.trail.shift();
    }
    // Homing steering toward nearest living enemy
    if (this.homing && enemies && enemies.length > 0) {
      let target = null, best = Infinity;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < best) { best = d; target = e; }
      }
      if (target) {
        const speed = Math.max(0.1, Math.hypot(this.vx, this.vy));
        const currentAngle = Math.atan2(this.vy, this.vx);
        const wantAngle = Math.atan2(target.y - this.y, target.x - this.x);
        let diff = wantAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const steer = Math.max(-this.homingStrength * dt, Math.min(this.homingStrength * dt, diff));
        const newAngle = currentAngle + steer;
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }
    }
    this.x+=this.vx*60*dt; this.y+=this.vy*60*dt;
  }
  draw(ctx, camera) {
    const screenX = this.x - camera.x, screenY = this.y - camera.y;
    if (this.type === 'commit' && this.trail.length > 1) {
      ctx.save();
      for (let i=0;i<this.trail.length;i++) {
        const t = this.trail[i];
        const a = (i+1)/this.trail.length;
        const tx = t.x - camera.x, ty = t.y - camera.y;
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = '#79c0ff';
        const s = 3 + a*4;
        ctx.beginPath(); ctx.arc(tx,ty,s,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save(); ctx.translate(screenX, screenY);
    if (this.type === 'commit') {
      const angle = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.rotate(angle);
      ctx.shadowColor = '#58a6ff'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#1f6feb';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-16,-9,32,18,5); ctx.fill(); } else ctx.fillRect(-16,-9,32,18);
      ctx.strokeStyle = '#79c0ff'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(this.text || 'commit',0,0);
    } else if (this.type === 'duck') {
      // Vector duck: no emoji, draw simple duck silhouette
      ctx.fillStyle = '#d29922'; ctx.strokeStyle='#8a5a00'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.ellipse(0,2,10,7,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(6,-4,5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#ff7b72'; ctx.beginPath(); ctx.moveTo(11,-4); ctx.lineTo(15,-2); ctx.lineTo(11,0); ctx.fill();
      ctx.fillStyle='#0d1117'; ctx.beginPath(); ctx.arc(7,-5,1.2,0,Math.PI*2); ctx.fill();
      // ripple
      ctx.strokeStyle='rgba(210,153,34,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,14+Math.sin(this.anim*6)*2,0,Math.PI*2); ctx.stroke();
    } else if (this.type === 'rocket') {
      // Homing rocket: vector body rotated to velocity + flame + trail glow
      const angle = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.rotate(angle);
      ctx.shadowColor = this.projectileColor; ctx.shadowBlur = 14;
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(-8, -7); ctx.lineTo(-5, 0); ctx.lineTo(-8, 7);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = this.projectileColor; ctx.lineWidth = 2; ctx.stroke();
      const flame = 6 + Math.sin(this.anim * 30) * 3;
      ctx.fillStyle = this.projectileColor;
      ctx.beginPath();
      ctx.moveTo(-8, -4); ctx.lineTo(-8 - flame, 0); ctx.lineTo(-8, 4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = this.projectileColor;
      ctx.beginPath();
      ctx.arc(-Math.cos(angle) * 12, -Math.sin(angle) * 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'mine') {
      const pulse = Math.sin(this.anim*8)*3;
      ctx.shadowColor = '#388bfd'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#1f6feb'; ctx.fillRect(-18,-13,36,26);
      ctx.strokeStyle='#a5d6ff'; ctx.lineWidth=1.8; ctx.strokeRect(-18,-13,36,26);
      ctx.shadowBlur=0;
      ctx.fillStyle='#ffffff'; ctx.font='bold 10px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(this.mineLabel || 'DK',0,0);
      ctx.strokeStyle='#58a6ff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(0,0,this.radius+pulse,0,Math.PI*2); ctx.stroke();
      // blinking led
      ctx.fillStyle = Math.floor(this.anim*4)%2===0 ? '#39d353' : '#0e4429';
      ctx.beginPath(); ctx.arc(14,-9,2.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

export class Gem {
  constructor(x, y, baseValue, opts = {}) {
    this.x = x; this.y = y;
    this.radius = 7;
    this.isAttracted = false;
    this.vx = 0; this.vy = 0;
    this.animTime = Math.random() * 5;

    // Roll rarity (skip for boss / forced gems)
    let multiplier = 1;
    let rarity = 'common';
    if (!opts.forceRarity) {
      const roll = Math.random();
      if (roll < 0.01) { multiplier = 13; rarity = 'legendary'; }
      else if (roll < 0.08) { multiplier = 6; rarity = 'rare'; }
    } else {
      rarity = opts.forceRarity;
      multiplier = rarity === 'legendary' ? 13 : rarity === 'rare' ? 6 : 1;
    }

    this.baseValue = baseValue;
    this.multiplier = multiplier;
    this.rarity = rarity;
    this.xpValue = baseValue * multiplier;

    if (rarity === 'legendary') {
      this.color = '#f85149';
      this.glow = '#ff7b72';
      this.size = 13;
      this.borderColor = '#ffa198';
    } else if (rarity === 'rare') {
      this.color = '#d29922';
      this.glow = '#e3b341';
      this.size = 10;
      this.borderColor = '#f0b429';
    } else {
      this.color = '#0e4429';
      this.glow = '#39d353';
      this.size = 7;
      this.borderColor = '#39d353';
    }
  }

  update(dt, player) {
    this.animTime += dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.pickupRadius) this.isAttracted = true;
    // Homing lurus ke pemain, tanpa velocity sisa (tidak muter-muter/orbit)
    if (this.isAttracted && dist > 1) {
      const step = Math.min(dist, Math.max(4, dist * 0.22) * 60 * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.vx = 0; this.vy = 0;
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x, screenY = this.y - camera.y;
    const hover = Math.sin(this.animTime * 4) * 1.8;

    ctx.save();
    ctx.translate(screenX, screenY + hover);

    if (this.rarity === 'legendary') {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.animTime * 6) * 0.15;
      ctx.strokeStyle = '#ff7b72';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.rarity === 'rare') {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#e3b341';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.shadowColor = this.glow;
    // Common gem tanpa shadowBlur (hemat performa, anti lag saat gem banyak)
    ctx.shadowBlur = this.rarity === 'common' ? 0 : (this.rarity === 'legendary' ? 16 : 12);

    if (this.rarity === 'legendary') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, -this.size + 3);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('13', 0, 1);
    } else if (this.rarity === 'rare') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * this.size;
        const y = Math.sin(a) * this.size;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 8px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('6', 0, 1);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }

    ctx.restore();
  }
}

export class Particle {
  constructor(opts){ this.x=opts.x; this.y=opts.y; this.vx=opts.vx; this.vy=opts.vy; this.color=opts.color||'#39d353'; this.size=opts.size||4; this.maxLife=opts.life||0.6; this.life=this.maxLife; this.char=opts.char||null; this.dead=false; }
  update(dt){ this.life-=dt; if(this.life<=0){ this.dead=true; return; } this.x+=this.vx*60*dt; this.y+=this.vy*60*dt; this.vx*=0.94; this.vy*=0.94; }
  draw(ctx, camera){
    const screenX=this.x-camera.x, screenY=this.y-camera.y; const alpha=Math.max(0,this.life/this.maxLife);
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(screenX, screenY);
    if(this.char){ ctx.fillStyle=this.color; ctx.font=`bold ${Math.round(this.size*2)}px ui-monospace, monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(this.char,0,0); }
    else { ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}

export class FloatingText {
  constructor(opts){ this.x=opts.x; this.y=opts.y; this.text=opts.text; this.color=opts.color||'#ffffff'; this.isCrit=!!opts.isCrit; this.maxLife=opts.life||0.8; this.life=this.maxLife; this.vy=-1.6; this.dead=false; }
  update(dt){ this.life-=dt; if(this.life<=0){ this.dead=true; return; } this.y+=this.vy*60*dt; }
  draw(ctx, camera){
    const screenX=this.x-camera.x, screenY=this.y-camera.y; const alpha=Math.max(0,this.life/this.maxLife);
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(screenX, screenY);
    ctx.font=this.isCrit?'bold 16px ui-monospace, monospace':'bold 12px ui-monospace, monospace';
    ctx.fillStyle=this.color; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='#000000'; ctx.shadowBlur=4; ctx.fillText(this.text,0,0);
    ctx.restore();
  }
}
