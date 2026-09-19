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

    if (this.charId === 'junior_dev') {
      this.pickupRadius *= 1.35;
    } else if (this.charId === 'senior_architect') {
      this.damageMultiplier *= 1.15;
      this.damageReduction = 0.15;
    } else if (this.charId === 'devops_wizard') {
      this.speed *= 1.15;
      this.cooldownMultiplier *= 0.85;
    }

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
    let dmgRed = this.charId === 'senior_architect' ? 0.15 : 0;
    let pickupBonus = this.charId === 'junior_dev' ? 0.35 : 0;
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
    this.damageMultiplier = (this.charId === 'senior_architect' ? 1.15 : 1.0) * (1 + dmgBonus);
    this.cooldownMultiplier = Math.max(0.3, (this.charId === 'devops_wizard' ? 0.85 : 1.0) * (1 + cdBonus));
    this.pickupRadius = 90 * (1 + pickupBonus);
    this.damageReduction = Math.min(0.6, dmgRed);
  }

  addXp(amount) {
    this.xp += amount;
    this.totalXpEarned += amount;
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

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

  update(dt, inputVector) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (inputVector.x !== 0 || inputVector.y !== 0) {
      this.isMoving = true;
      this.vx = inputVector.x * this.speed;
      this.vy = inputVector.y * this.speed;
      if (inputVector.x > 0) this.facing = 1;
      else if (inputVector.x < 0) this.facing = -1;
      this.walkCycle += dt * 10;
    } else {
      this.isMoving = false;
      this.vx *= 0.8;
      this.vy *= 0.8;
    }
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
  }

  // --- VECTOR SPRITE DRAWING (no emoji) ---
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;
    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.strokeStyle = 'rgba(57, 211, 83, 0.10)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.pickupRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = this.isMoving ? Math.sin(this.walkCycle) * 2.5 : 0;
    ctx.translate(0, bob);

    // Common body
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0f141b';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    // rounded body
    ctx.roundRect(-14, -6, 28, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Character-specific head/gear (pure vector, no text emoji)
    if (this.charId === 'junior_dev') {
      // Head
      ctx.fillStyle = '#c9d1d9';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Cap / hood
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, -22, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-10, -22, 20, 3);
      // Glasses
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, -20, 7, 5);
      ctx.strokeRect(1, -20, 7, 5);
      ctx.beginPath(); ctx.moveTo(-1, -17.5); ctx.lineTo(1, -17.5); ctx.stroke();
      // Laptop
      ctx.fillStyle = '#21262d';
      ctx.strokeStyle = '#8b949e';
      ctx.lineWidth = 1;
      ctx.fillRect(-9, 2, 18, 10);
      ctx.strokeRect(-9, 2, 18, 10);
      ctx.fillStyle = this.color;
      ctx.fillRect(-7, 4, 14, 2);
    } else if (this.charId === 'senior_architect') {
      // Head
      ctx.fillStyle = '#d2a8ff';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Beard
      ctx.fillStyle = '#e6edf3';
      ctx.beginPath();
      ctx.arc(0, -10, 9, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fill();
      // Staff / ruler line vertical behind
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11 * this.facing, -8);
      ctx.lineTo(11 * this.facing, 10);
      ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(11 * this.facing, -10, 4, 0, Math.PI*2);
      ctx.fill();
      // Glasses small
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.arc(-4, -18, 2.2, 0, Math.PI*2);
      ctx.arc(4, -18, 2.2, 0, Math.PI*2);
      ctx.fill();
    } else if (this.charId === 'devops_wizard') {
      // Head
      ctx.fillStyle = '#c9d1d9';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -18, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Ninja mask
      ctx.fillStyle = '#21262d';
      ctx.fillRect(-10, -18, 20, 8);
      ctx.fillStyle = this.color;
      ctx.fillRect(-10, -14, 20, 1.5);
      // Eye slit
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -15.5, 5, 2);
      ctx.fillRect(1, -15.5, 5, 2);
      ctx.fillStyle = this.color;
      ctx.fillRect(-5, -15, 3, 1);
      ctx.fillRect(2, -15, 3, 1);
      // Shuriken / gear behind body hint
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2,2]);
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0, Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Health bar
    const barWidth = 42, barHeight = 5;
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(-barWidth / 2, -34, barWidth, barHeight);
    ctx.fillStyle = hpPct > 0.5 ? '#3fb950' : hpPct > 0.25 ? '#d29922' : '#f85149';
    ctx.fillRect(-barWidth / 2, -34, barWidth * hpPct, barHeight);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, -34, barWidth, barHeight);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv.${this.level}`, 0, -38);

    // Short label under body
    ctx.fillStyle = 'rgba(201,209,217,0.9)';
    ctx.font = 'bold 7px ui-monospace, monospace';
    ctx.fillText(this.shortLabel, 0, 20);

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
    this.dead = false;
  }
  takeDamage(amount) { this.hp -= amount; this.hitFlashTimer = 0.12; if (this.hp <= 0) this.dead = true; }
  update(dt, player) {
    this.animTime += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
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
    this.dead = false; this.anim = 0;
  }
  update(dt) { this.anim += dt; this.lifetime -= dt; if (this.lifetime <=0){ this.dead=true; return; } this.x+=this.vx*60*dt; this.y+=this.vy*60*dt; }
  draw(ctx, camera) {
    const screenX = this.x - camera.x, screenY = this.y - camera.y;
    ctx.save(); ctx.translate(screenX, screenY);
    if (this.type === 'commit') {
      ctx.shadowColor = '#58a6ff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#1f6feb';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-16,-9,32,18,5); ctx.fill(); } else ctx.fillRect(-16,-9,32,18);
      ctx.strokeStyle = '#79c0ff'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(this.text || 'commit',0,0);
    } else if (this.type === 'duck') {
      // Vector duck: no emoji, draw simple duck silhouette
      ctx.fillStyle = '#d29922'; ctx.strokeStyle='#8a5a00'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.ellipse(0,2,10,7,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(6,-4,5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#ff7b72'; ctx.beginPath(); ctx.moveTo(11,-4); ctx.lineTo(15,-2); ctx.lineTo(11,0); ctx.fill();
      ctx.fillStyle='#0d1117'; ctx.beginPath(); ctx.arc(7,-5,1.2,0,Math.PI*2); ctx.fill();
      // ripple
      ctx.strokeStyle='rgba(210,153,34,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,14+Math.sin(this.anim*6)*2,0,Math.PI*2); ctx.stroke();
    } else if (this.type === 'mine') {
      const pulse = Math.sin(this.anim*8)*3;
      ctx.shadowColor = '#388bfd'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#1f6feb'; ctx.fillRect(-18,-13,36,26);
      ctx.strokeStyle='#a5d6ff'; ctx.lineWidth=1.8; ctx.strokeRect(-18,-13,36,26);
      ctx.shadowBlur=0;
      ctx.fillStyle='#ffffff'; ctx.font='bold 10px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('DK',0,0);
      ctx.strokeStyle='#58a6ff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(0,0,this.radius+pulse,0,Math.PI*2); ctx.stroke();
      // blinking led
      ctx.fillStyle = Math.floor(this.anim*4)%2===0 ? '#39d353' : '#0e4429';
      ctx.beginPath(); ctx.arc(14,-9,2.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

export class Gem {
  constructor(x, y, xpValue) {
    this.x=x; this.y=y; this.xpValue=xpValue; this.radius=7; this.isAttracted=false; this.vx=0; this.vy=0; this.animTime=Math.random()*5;
    if (xpValue>=50){ this.color='#39d353'; this.glow='#39d353'; this.size=11; }
    else if (xpValue>=10){ this.color='#26a641'; this.glow='#26a641'; this.size=9; }
    else if (xpValue>=3){ this.color='#006d32'; this.glow='#006d32'; this.size=8; }
    else { this.color='#0e4429'; this.glow='#39d353'; this.size=7; }
  }
  update(dt, player){ this.animTime+=dt; const dx=player.x-this.x, dy=player.y-this.y; const dist=Math.hypot(dx,dy); if(dist<player.pickupRadius) this.isAttracted=true; if(this.isAttracted){ const pullSpeed=Math.min(18,Math.max(8,300/(dist+10))); this.vx+=(dx/dist)*pullSpeed*60*dt; this.vy+=(dy/dist)*pullSpeed*60*dt; this.x+=this.vx*dt; this.y+=this.vy*dt; } }
  draw(ctx, camera){
    const screenX=this.x-camera.x, screenY=this.y-camera.y; const hover=Math.sin(this.animTime*4)*1.8;
    ctx.save(); ctx.translate(screenX, screenY+hover);
    ctx.shadowColor=this.glow; ctx.shadowBlur=7;
    ctx.fillStyle=this.color; ctx.fillRect(-this.size/2,-this.size/2,this.size,this.size);
    ctx.strokeStyle='#39d353'; ctx.lineWidth=1; ctx.strokeRect(-this.size/2,-this.size/2,this.size,this.size);
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
