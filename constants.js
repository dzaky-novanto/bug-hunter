// constants.js - Game Configuration, Characters, Weapons, Enemies, and Achievements

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const CHARACTERS = {
  junior_dev: {
    id: 'junior_dev',
    name: 'Junior Dev',
    title: 'StackOverflow Explorer',
    shortLabel: 'JR',
    description: 'Semangat tinggi, penuh rasa penasaran. Memulai dengan Git Commit level 1.',
    speed: 3.2,
    maxHp: 100,
    startingWeapon: 'git_commit',
    color: '#58a6ff',
    passiveDescription: '+10% XP Gem Pickup Radius'
  },
  senior_architect: {
    id: 'senior_architect',
    name: 'Senior 10x Dev',
    title: 'The Clean Code Master',
    shortLabel: 'SR',
    description: 'Sudah melihat ribuan bug di masa hidupnya. Memulai dengan Linter Shield.',
    speed: 3.0,
    maxHp: 130,
    startingWeapon: 'linter_shield',
    color: '#3fb950',
    passiveDescription: '+15% Damage & Defense'
  },
  devops_wizard: {
    id: 'devops_wizard',
    name: 'DevOps Ninja',
    title: 'Kubernetes Whisperer',
    shortLabel: 'OPS',
    description: 'Bekerja di server gelap. Memulai dengan Docker Container.',
    speed: 3.6,
    maxHp: 90,
    startingWeapon: 'docker_container',
    color: '#bc8cff',
    passiveDescription: '+20% Move Speed & Cooldown Reduction'
  }
};

export const WEAPONS = {
  git_commit: {
    id: 'git_commit',
    name: 'Git Commit',
    code: 'GC',
    type: 'projectile',
    description: 'Menembakkan commit hash yang meledak jadi tanda centang hijau.',
    cooldown: 0.42,
    damage: 22,
    speed: 7.5,
    range: 650,
    count: 1,
    pierce: 1,
    maxLevel: 5,
    levelUps: [
      { desc: '+1 Proyektil Commit & +20% Damage', bonus: { count: 1, damage: 6 } },
      { desc: '-15% Cooldown & Menembus 1 musuh', bonus: { cooldown: -0.06, pierce: 1 } },
      { desc: '+2 Proyektil Commit tambahan', bonus: { count: 2 } },
      { desc: 'EVOLUSI: Git Push --force! Ledakan area kritis!', bonus: { damage: 15, splash: 50, count: 1 } }
    ]
  },
  linter_shield: {
    id: 'linter_shield',
    name: 'Linter Orbit',
    code: 'LO',
    type: 'orbit',
    description: 'Simbol kurung kurawal { } dan titik koma ; yang berputar membabat bug sekitar.',
    damage: 16,
    orbitRadius: 75,
    speed: 2.8,
    count: 2,
    maxLevel: 5,
    levelUps: [
      { desc: '+1 Simbol Orbit & Radius lebih luas', bonus: { count: 1, orbitRadius: 15 } },
      { desc: '+25% Damage & Putaran lebih kencang', bonus: { damage: 8, speed: 0.8 } },
      { desc: '+2 Simbol Orbit tambahan', bonus: { count: 2 } },
      { desc: 'EVOLUSI: Strict TypeScript Armor! Stun musuh 0.5s', bonus: { damage: 18, stun: true } }
    ]
  },
  hotfix_laser: {
    id: 'hotfix_laser',
    name: 'Hotfix Laser',
    code: 'HL',
    type: 'beam',
    description: 'Menembakkan laser horizontal/vertikal berdaya tembus tinggi.',
    cooldown: 1.8,
    duration: 0.35,
    damage: 40,
    width: 28,
    maxLevel: 5,
    levelUps: [
      { desc: '+30% Damage Laser & Sinar lebih tebal', bonus: { damage: 15, width: 10 } },
      { desc: '-25% Cooldown Laser', bonus: { cooldown: -0.4 } },
      { desc: 'Menembak 2 arah sekaligus (Depan & Belakang)', bonus: { dualBeam: true } },
      { desc: 'EVOLUSI: Zero-Downtime Hyperbeam! 360 Cross Beam!', bonus: { damage: 35, crossBeam: true } }
    ]
  },
  docker_container: {
    id: 'docker_container',
    name: 'Docker Deploy',
    code: 'DK',
    type: 'mine',
    description: 'Meletakkan container yang menarik musuh lalu meledak area dingin.',
    cooldown: 2.5,
    damage: 55,
    radius: 90,
    duration: 3.5,
    maxLevel: 5,
    levelUps: [
      { desc: '+40% Radius ledakan kontainer', bonus: { radius: 35 } },
      { desc: '-30% Cooldown Spawn', bonus: { cooldown: -0.7 } },
      { desc: '+35 Damage ledakan', bonus: { damage: 25 } },
      { desc: 'EVOLUSI: Kubernetes Cluster! Meledak ganda dan freeze musuh!', bonus: { damage: 40, cluster: true, freeze: true } }
    ]
  },
  copilot_drone: {
    id: 'copilot_drone',
    name: 'AI Copilot Drone',
    code: 'AI',
    type: 'drone',
    description: 'Drone melayang otomatis mencari dan menyengat target terdekat.',
    cooldown: 0.65,
    damage: 18,
    maxLevel: 5,
    levelUps: [
      { desc: '+25% Attack Speed Drone', bonus: { cooldown: -0.15 } },
      { desc: '+10 Damage Sengatan Listrik', bonus: { damage: 10 } },
      { desc: 'Drone memanggil 1 mini-drone klon', bonus: { clone: true } },
      { desc: 'EVOLUSI: Autonomous GPT-5! Tembakan rantai petir multi-target!', bonus: { damage: 20, chainLightning: 3 } }
    ]
  },
  rubber_duck: {
    id: 'rubber_duck',
    name: 'Rubber Duck Bomb',
    code: 'RB',
    type: 'bouncing',
    description: 'Bebek karet memantul ke sudut layar dan memicu shockwave.',
    cooldown: 3.0,
    damage: 50,
    bounces: 4,
    maxLevel: 5,
    levelUps: [
      { desc: '+2 Pantulan & +15 Damage Shockwave', bonus: { bounces: 2, damage: 15 } },
      { desc: '-25% Cooldown Bebek', bonus: { cooldown: -0.7 } },
      { desc: '+1 Bebek dilempar bersamaan', bonus: { extraDuck: 1 } },
      { desc: 'EVOLUSI: Mega Quack of Doom! Shockwave menyapu separuh layar!', bonus: { damage: 50, megaQuack: true } }
    ]
  }
};

export const PASSIVES = {
  coffee: {
    id: 'coffee',
    name: 'Espresso Overclock',
    code: 'CF',
    description: '+15% Kecepatan jalan & gerak lincah.',
    maxLevel: 5,
    bonusPerLevel: { speedPct: 0.15 }
  },
  keyboard: {
    id: 'keyboard',
    name: 'Mechanical Keyboard',
    code: 'KB',
    description: '+18% Total Damage semua senjata.',
    maxLevel: 5,
    bonusPerLevel: { damagePct: 0.18 }
  },
  energy_drink: {
    id: 'energy_drink',
    name: 'Energy Drink Rush',
    code: 'EN',
    description: '-12% Cooldown semua skill/senjata.',
    maxLevel: 5,
    bonusPerLevel: { cooldownPct: -0.12 }
  },
  git_stash: {
    id: 'git_stash',
    name: 'Git Stash Armor',
    code: 'GS',
    description: '+20 Max HP & kurangi 15% damage musuh.',
    maxLevel: 5,
    bonusPerLevel: { maxHp: 20, damageReduction: 0.15 }
  },
  code_magnet: {
    id: 'code_magnet',
    name: 'Clean Code Magnet',
    code: 'MG',
    description: '+45% Jangkauan hisapan GitHub Green Tile (XP).',
    maxLevel: 5,
    bonusPerLevel: { pickupRadiusPct: 0.45 }
  }
};

export const ENEMY_TYPES = {
  bug: {
    name: 'Bug',
    code: 'BUG',
    hp: 20,
    speed: 1.8,
    damage: 8,
    xpValue: 1,
    color: '#f85149',
    radius: 14
  },
  error_404: {
    name: '404 Not Found',
    code: '404',
    hp: 14,
    speed: 2.8,
    damage: 6,
    xpValue: 1.5,
    color: '#e3b341',
    radius: 12,
    isPhantom: true
  },
  null_pointer: {
    name: 'NullPointerException',
    code: 'NPE',
    hp: 45,
    speed: 1.4,
    damage: 15,
    xpValue: 3,
    color: '#ff7b72',
    radius: 18
  },
  merge_conflict: {
    name: 'Merge Conflict',
    code: 'CNF',
    hp: 75,
    speed: 1.2,
    damage: 20,
    xpValue: 5,
    color: '#da3633',
    radius: 20,
    spiky: true
  },
  memory_leak: {
    name: 'Memory Leak',
    code: 'LEAK',
    hp: 140,
    speed: 0.8,
    damage: 25,
    xpValue: 8,
    color: '#7ee787',
    radius: 26,
    grows: true
  },
  ddos_packet: {
    name: 'DDoS Packet',
    code: 'DOS',
    hp: 10,
    speed: 3.4,
    damage: 5,
    xpValue: 1,
    color: '#a371f7',
    radius: 10
  },
  boss_friday_prod: {
    name: 'Friday 5PM Production Outage',
    code: 'BOSS',
    hp: 1600,
    speed: 1.1,
    damage: 35,
    xpValue: 60,
    color: '#f85149',
    radius: 46,
    isBoss: true
  },
  boss_legacy_spaghetti: {
    name: 'Legacy Spaghetti Codebase',
    code: 'BOSS',
    hp: 3000,
    speed: 0.95,
    damage: 42,
    xpValue: 100,
    color: '#ffa657',
    radius: 54,
    isBoss: true
  }
};

export const ACHIEVEMENTS = [
  { id: 'first_commit', title: 'First Commit', desc: 'Mulai game pertama kali.', tag: '01' },
  { id: 'survive_1m', title: 'Junior Survivor', desc: 'Bertahan hidup selama 1 menit.', tag: '02' },
  { id: 'survive_3m', title: 'Sprint Finisher', desc: 'Bertahan hidup selama 3 menit.', tag: '03' },
  { id: 'survive_5m', title: 'Senior Stamina', desc: 'Bertahan hidup selama 5 menit.', tag: '04' },
  { id: 'defeat_boss', title: 'Saved Production!', desc: 'Kalahkan Boss Friday 5PM Outage!', tag: '05' },
  { id: 'level_10', title: '10x Engineer', desc: 'Capai Level 10 dalam satu run.', tag: '06' },
  { id: 'level_20', title: 'Principal Architect', desc: 'Capai Level 20 dalam satu run.', tag: '07' },
  { id: 'squash_500', title: 'Exterminator', desc: 'Basmi 500 bug.', tag: '08' },
  { id: 'max_weapon', title: 'Fully Refactored', desc: 'Tingkatkan salah satu skill ke level maksimal (5).', tag: '09' }
];
