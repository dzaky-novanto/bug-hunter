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
  },
  prompt_engineer: {
    id: 'prompt_engineer',
    name: 'Prompt Engineer',
    title: 'The AI Whisperer',
    shortLabel: 'AI',
    description: 'Tidak pernah nulis kode manual lagi. Memulai dengan AI Copilot Drone otomatis.',
    speed: 3.3,
    maxHp: 95,
    startingWeapon: 'copilot_drone',
    color: '#f778ba',
    passiveDescription: '+25% XP Gain dari semua sumber'
  },
  frontend_wizard: {
    id: 'frontend_wizard',
    name: 'Frontend Wizard',
    title: 'React Component Master',
    shortLabel: 'FE',
    description: 'CSS-in-JS master. Attack speed gila-gilaan, HP rapuh tapi lincah.',
    speed: 3.7,
    maxHp: 80,
    startingWeapon: 'hot_reload',
    color: '#ff7b72',
    passiveDescription: '+25% Attack Speed (Cooldown -25%)'
  },
  backend_beast: {
    id: 'backend_beast',
    name: 'Backend Beast',
    title: 'API & Database Guru',
    shortLabel: 'BE',
    description: 'Server besar, HP tebal, lambat tapi setiap hit mematikan.',
    speed: 2.6,
    maxHp: 160,
    startingWeapon: 'docker_container',
    color: '#79c0ff',
    passiveDescription: '+30% Total Damage semua senjata'
  },
  qa_hunter: {
    id: 'qa_hunter',
    name: 'QA Hunter',
    title: 'Test Coverage Tracker',
    shortLabel: 'QA',
    description: 'Melihat bug sebelum jadi. Deteksi area luas dan XP bonus.',
    speed: 3.0,
    maxHp: 110,
    startingWeapon: 'unit_test',
    color: '#7ee787',
    passiveDescription: '+40% Pickup Radius & +15% XP Gain'
  },
  data_scientist: {
    id: 'data_scientist',
    name: 'Data Scientist',
    title: 'ML Model Trainer',
    shortLabel: 'DS',
    description: 'Menembak prediksi AI. Damage kritis tinggi ke target tunggal.',
    speed: 3.1,
    maxHp: 100,
    startingWeapon: 'binary_search',
    color: '#d2a8ff',
    passiveDescription: '+10% Damage & +15% Damage Reduction'
  },
  indie_hacker: {
    id: 'indie_hacker',
    name: 'Indie Hacker',
    title: 'Solo Founder',
    shortLabel: 'IH',
    description: 'Serba bisa. XP bonus dan heal dari gem lebih kuat.',
    speed: 3.4,
    maxHp: 105,
    startingWeapon: 'copilot_drone',
    color: '#f0883e',
    passiveDescription: '+15% Heal per XP Gem & +10% XP Gain'
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
  },

  // ==================== 26 SENJATA BARU ====================
  // --- PROJECTILE FAMILY (fireType: spread / rapid) ---
  api_endpoint: {
    id: 'api_endpoint', name: 'API Endpoint', code: 'API', type: 'projectile', fireType: 'spread',
    description: 'Menembak 3 request HTTP paralel ke musuh terdekat.',
    cooldown: 0.7, damage: 18, speed: 9, count: 3, pierce: 1, spread: 0.18, projectileColor: '#58a6ff',
    maxLevel: 5, levelUps: [
      { desc: '+1 Request & +5 Damage', bonus: { count: 1, damage: 5 } },
      { desc: '-20% CD & +1 Pierce', bonus: { cooldown: -0.14, pierce: 1 } },
      { desc: '+2 Request paralel', bonus: { count: 2 } },
      { desc: 'EVOLUSI: GraphQL Batch! +15 Dmg, pierce 3', bonus: { damage: 15, pierce: 2, count: 1 } }
    ]
  },
  cache_shot: {
    id: 'cache_shot', name: 'Cache Miss', code: 'CM', type: 'projectile', fireType: 'rapid',
    description: 'Proyektil kecil super cepat dari memory cache.',
    cooldown: 0.18, damage: 8, speed: 13, count: 1, pierce: 1, projectileColor: '#39d353',
    maxLevel: 5, levelUps: [
      { desc: '+1 Proyektil Cache', bonus: { count: 1 } },
      { desc: '-15% CD & +3 Damage', bonus: { cooldown: -0.027, damage: 3 } },
      { desc: '+2 Proyektil Cache', bonus: { count: 2 } },
      { desc: 'EVOLUSI: L1 Cache Hit! pierce 3, +10 Dmg', bonus: { damage: 10, pierce: 3, count: 1 } }
    ]
  },
  lambda_function: {
    id: 'lambda_function', name: 'Lambda Function', code: 'LM', type: 'projectile', fireType: 'spread',
    description: 'Fungsi serverless kecil, cepat, dan ringan.',
    cooldown: 0.5, damage: 14, speed: 8, count: 2, pierce: 2, spread: 0.12, projectileColor: '#d29922',
    maxLevel: 5, levelUps: [
      { desc: '+1 Lambda invoke', bonus: { count: 1 } },
      { desc: '-20% Cooldown', bonus: { cooldown: -0.1 } },
      { desc: '+8 Damage & +1 Pierce', bonus: { damage: 8, pierce: 1 } },
      { desc: 'EVOLUSI: Event Cascade! 4 invoke sekaligus', bonus: { count: 3, damage: 10 } }
    ]
  },
  webhook_ping: {
    id: 'webhook_ping', name: 'Webhook Ping', code: 'WH', type: 'projectile', fireType: 'rapid',
    description: 'Ping cepat ke server, damage kecil tapi ngebut.',
    cooldown: 0.12, damage: 6, speed: 15, count: 1, pierce: 1, projectileColor: '#a371f7',
    maxLevel: 5, levelUps: [
      { desc: '+1 Ping paralel', bonus: { count: 1 } },
      { desc: '+3 Damage ping', bonus: { damage: 3 } },
      { desc: '+2 Ping paralel', bonus: { count: 2 } },
      { desc: 'EVOLUSI: Realtime WebSocket! +12 Dmg, pierce 2', bonus: { damage: 12, pierce: 2, count: 1 } }
    ]
  },
  hot_reload: {
    id: 'hot_reload', name: 'Hot Module Reload', code: 'HMR', type: 'projectile', fireType: 'rapid',
    description: 'Reload instan tanpa downtime, tembak terus.',
    cooldown: 0.22, damage: 11, speed: 11, count: 1, pierce: 2, projectileColor: '#f778ba',
    maxLevel: 5, levelUps: [
      { desc: '-25% Cooldown reload', bonus: { cooldown: -0.055 } },
      { desc: '+5 Damage & +1 Pierce', bonus: { damage: 5, pierce: 1 } },
      { desc: '+2 Proyektil sekaligus', bonus: { count: 2 } },
      { desc: 'EVOLUSI: Zero-Downtime Deploy! +14 Dmg, pierce 4', bonus: { damage: 14, pierce: 2, count: 1 } }
    ]
  },
  thread_pool: {
    id: 'thread_pool', name: 'Thread Pool', code: 'TP', type: 'projectile', fireType: 'spread',
    description: 'Melepas banyak worker thread paralel sekaligus.',
    cooldown: 1.1, damage: 12, speed: 7, count: 5, pierce: 1, spread: 0.35, projectileColor: '#7ee787',
    maxLevel: 5, levelUps: [
      { desc: '+2 Worker thread', bonus: { count: 2 } },
      { desc: '-20% Cooldown spawn', bonus: { cooldown: -0.22 } },
      { desc: '+8 Damage per thread', bonus: { damage: 8 } },
      { desc: 'EVOLUSI: Async Race! 8 thread dan +15 Dmg', bonus: { count: 3, damage: 15, pierce: 1 } }
    ]
  },
  regex_catastrophe: {
    id: 'regex_catastrophe', name: 'Regex Catastrophe', code: '.*', type: 'projectile', fireType: 'spread',
    description: 'Pattern regex ngaco, proyektil berhamburan acak.',
    cooldown: 0.9, damage: 15, speed: 6, count: 6, pierce: 1, spread: 6.2832, chaos: true, projectileColor: '#ff7b72',
    maxLevel: 5, levelUps: [
      { desc: '+2 Pattern chaos', bonus: { count: 2 } },
      { desc: '-25% CD Compile', bonus: { cooldown: -0.22 } },
      { desc: '+8 Damage per pattern', bonus: { damage: 8 } },
      { desc: 'EVOLUSI: Catastrophic Backtracking! 12 pattern', bonus: { count: 4, damage: 15 } }
    ]
  },
  ddos_barrage: {
    id: 'ddos_barrage', name: 'DDoS Barrage', code: 'DOS', type: 'projectile', fireType: 'spread',
    description: 'Hujan packet ke segala arah, bombardir total.',
    cooldown: 1.4, damage: 10, speed: 8, count: 12, pierce: 1, spread: 6.2832, radial: true, projectileColor: '#e3b341',
    maxLevel: 5, levelUps: [
      { desc: '+4 Packet burst', bonus: { count: 4 } },
      { desc: '-25% CD serangan', bonus: { cooldown: -0.35 } },
      { desc: '+6 Damage per packet', bonus: { damage: 6 } },
      { desc: 'EVOLUSI: Amplification Attack! 24 packet', bonus: { count: 8, damage: 10 } }
    ]
  },
  promise_chain: {
    id: 'promise_chain', name: 'Promise Chain', code: 'PRM', type: 'projectile', fireType: 'spread',
    description: 'Rantai proyektil yang mengalir ke musuh berikutnya.',
    cooldown: 1.0, damage: 14, speed: 10, count: 3, pierce: 4, spread: 0.25, projectileColor: '#bc8cff',
    maxLevel: 5, levelUps: [
      { desc: '+1 Chain link', bonus: { count: 1 } },
      { desc: '-20% CD await', bonus: { cooldown: -0.2 } },
      { desc: '+6 Damage dan +2 Pierce', bonus: { damage: 6, pierce: 2 } },
      { desc: 'EVOLUSI: Async Await Cascade! +18 Dmg', bonus: { damage: 18, pierce: 3, count: 1 } }
    ]
  },

  // --- ROCKET FAMILY (fireType: rocket, homing) ---
  crash_reporter: {
    id: 'crash_reporter', name: 'Crash Reporter', code: 'CR', type: 'rocket', fireType: 'rocket',
    description: 'Roket pencari target, meledak jadi stack trace.',
    cooldown: 1.5, damage: 45, speed: 6, count: 1, splash: 55, homingStrength: 8, projectileColor: '#f85149',
    maxLevel: 5, levelUps: [
      { desc: '+1 Roket dan +10 Dmg', bonus: { count: 1, damage: 10 } },
      { desc: '-25% CD launch', bonus: { cooldown: -0.375 } },
      { desc: '+25 Damage dan +15 Splash', bonus: { damage: 25, splash: 15 } },
      { desc: 'EVOLUSI: Sentry Integration! +40 Dmg dan +30 Splash', bonus: { damage: 40, splash: 30, count: 1 } }
    ]
  },
  unit_test: {
    id: 'unit_test', name: 'Unit Test', code: 'UT', type: 'rocket', fireType: 'rocket',
    description: 'Test kecil melacak bug, auto-target nearest.',
    cooldown: 0.65, damage: 20, speed: 9, count: 2, homingStrength: 12, projectileColor: '#3fb950',
    maxLevel: 5, levelUps: [
      { desc: '+1 Test runner', bonus: { count: 1 } },
      { desc: '+8 Damage assertion', bonus: { damage: 8 } },
      { desc: '-30% CD test', bonus: { cooldown: -0.2 } },
      { desc: 'EVOLUSI: Integration Test Suite! 5 test paralel', bonus: { count: 2, damage: 15 } }
    ]
  },
  binary_search: {
    id: 'binary_search', name: 'Binary Search', code: 'BS', type: 'rocket', fireType: 'rocket',
    description: 'Satu target presisi O(log n), damage besar single-target.',
    cooldown: 1.8, damage: 95, speed: 12, count: 1, homingStrength: 20, projectileColor: '#58a6ff',
    maxLevel: 5, levelUps: [
      { desc: '+30 Damage presisi', bonus: { damage: 30 } },
      { desc: '-25% CD search', bonus: { cooldown: -0.45 } },
      { desc: '+1 Pencarian paralel', bonus: { count: 1 } },
      { desc: 'EVOLUSI: Divide and Conquer! +60 Dmg, 3 target', bonus: { damage: 60, count: 1 } }
    ]
  },
  load_balancer: {
    id: 'load_balancer', name: 'Load Balancer', code: 'LB', type: 'rocket', fireType: 'rocket',
    description: 'Roket pindah target otomatis ke musuh terdekat.',
    cooldown: 1.2, damage: 28, speed: 7, count: 2, homingStrength: 6, retarget: true, projectileColor: '#7ee787',
    maxLevel: 5, levelUps: [
      { desc: '+1 Rocket worker', bonus: { count: 1 } },
      { desc: '+10 Damage balancing', bonus: { damage: 10 } },
      { desc: '-25% CD routing', bonus: { cooldown: -0.3 } },
      { desc: 'EVOLUSI: HA Proxy Cluster! 5 rocket, retarget cepat', bonus: { count: 2, damage: 15, homingStrength: 4 } }
    ]
  },

  // --- ORBIT FAMILY (type: orbit) ---
  cdn_shield: {
    id: 'cdn_shield', name: 'CDN Edge Node', code: 'CDN', type: 'orbit',
    description: 'Node CDN kecil berputar cepat menghalau bug.',
    damage: 12, orbitRadius: 65, speed: 4.5, count: 4, orbitColor: '#58a6ff', symbols: ['CDN', 'EDG', 'POP', 'ANY'],
    maxLevel: 5, levelUps: [
      { desc: '+2 Edge node', bonus: { count: 2 } },
      { desc: '+8 Damage dan radius +10', bonus: { damage: 8, orbitRadius: 10 } },
      { desc: '+25% Speed putaran', bonus: { speed: 1.2 } },
      { desc: 'EVOLUSI: Anycast Global! 8 node, +20 Dmg', bonus: { count: 2, damage: 20 } }
    ]
  },
  firewall_ring: {
    id: 'firewall_ring', name: 'Firewall Ring', code: 'FW', type: 'orbit',
    description: 'Cincin firewall besar, siapa pun yang masuk terbakar.',
    damage: 22, orbitRadius: 110, speed: 1.8, count: 6, orbitColor: '#f85149', symbols: ['FW', 'ACL', 'WAF', 'IDS', 'IPS', 'VPN'],
    maxLevel: 5, levelUps: [
      { desc: '+2 Firewall node', bonus: { count: 2 } },
      { desc: '+10 Damage dan radius +20', bonus: { damage: 10, orbitRadius: 20 } },
      { desc: '+30% Speed', bonus: { speed: 0.8 } },
      { desc: 'EVOLUSI: Zero-Trust Perimeter! +25 Dmg, stun 0.8s', bonus: { damage: 25, stun: true } }
    ]
  },
  git_rebase: {
    id: 'git_rebase', name: 'Git Rebase', code: 'GRB', type: 'orbit',
    description: 'Commit history chaos, orbit tak beraturan tapi mematikan.',
    damage: 20, orbitRadius: 85, speed: 3.8, count: 3, chaosOrbit: true, orbitColor: '#bc8cff', symbols: ['RB', 'PICK', 'SQSH', 'DROP'],
    maxLevel: 5, levelUps: [
      { desc: '+1 Rebase commit', bonus: { count: 1 } },
      { desc: '+12 Damage dan radius +15', bonus: { damage: 12, orbitRadius: 15 } },
      { desc: '+2 Rebase commit', bonus: { count: 2 } },
      { desc: 'EVOLUSI: Interactive Rebase! +30 Dmg, stun 0.5s', bonus: { damage: 30, stun: true } }
    ]
  },
  code_review: {
    id: 'code_review', name: 'Code Review Aura', code: 'PR', type: 'orbit',
    description: 'Aura review, memperlambat musuh di sekitar.',
    damage: 8, orbitRadius: 140, speed: 1.2, count: 4, slow: true, orbitColor: '#d29922', symbols: ['PR', 'LGTM', 'NIT', 'REQ'],
    maxLevel: 5, levelUps: [
      { desc: '+2 Reviewer dan radius +20', bonus: { count: 2, orbitRadius: 20 } },
      { desc: '+15 Damage review', bonus: { damage: 15 } },
      { desc: '+8 Damage dan radius +15', bonus: { damage: 8, orbitRadius: 15 } },
      { desc: 'EVOLUSI: LGTM Army! +30 Dmg, radius 200', bonus: { damage: 30, orbitRadius: 30 } }
    ]
  },
  git_blame: {
    id: 'git_blame', name: 'Git Blame', code: 'BL', type: 'orbit',
    description: 'Menandai musuh, mereka terima damage ekstra dari semua sumber.',
    damage: 6, orbitRadius: 95, speed: 2.2, count: 3, mark: true, markAmp: 0.25, orbitColor: '#ff7b72', symbols: ['BL', 'LOG', 'DIFF', 'TAG'],
    maxLevel: 5, levelUps: [
      { desc: '+1 Blame marker', bonus: { count: 1 } },
      { desc: '+10% Damage amp', bonus: { markAmp: 0.1 } },
      { desc: '+10 Damage dan radius +15', bonus: { damage: 10, orbitRadius: 15 } },
      { desc: 'EVOLUSI: Full Code Attribution! +25% amp', bonus: { markAmp: 0.15, damage: 15 } }
    ]
  },

  // --- BEAM FAMILY (type: beam) ---
  refactor_beam: {
    id: 'refactor_beam', name: 'Refactor Ray', code: 'RF', type: 'beam',
    description: 'Sinar refactor panjang yang membersihkan kode jelek.',
    cooldown: 2.5, duration: 0.9, damage: 55, width: 22, color: '#7ee787',
    maxLevel: 5, levelUps: [
      { desc: '+25% Damage dan durasi +0.3s', bonus: { damage: 15, duration: 0.3 } },
      { desc: '-30% CD dan +10 width', bonus: { cooldown: -0.75, width: 10 } },
      { desc: 'Tembak 2 arah (depan-belakang)', bonus: { dualBeam: true } },
      { desc: 'EVOLUSI: Full Codebase Refactor! 360 beam', bonus: { damage: 40, crossBeam: true } }
    ]
  },
  sql_injection: {
    id: 'sql_injection', name: 'SQL Injection', code: 'SQL', type: 'beam',
    description: 'Sinar query menembus semua musuh segaris.',
    cooldown: 1.6, duration: 0.25, damage: 38, width: 16, color: '#e3b341',
    maxLevel: 5, levelUps: [
      { desc: '+20 Damage dan +6 width', bonus: { damage: 20, width: 6 } },
      { desc: '-25% CD injection', bonus: { cooldown: -0.4 } },
      { desc: '+1 Query paralel', bonus: { dualBeam: true } },
      { desc: 'EVOLUSI: DROP TABLE bugs! +50 Dmg, 4 arah', bonus: { damage: 50, crossBeam: true } }
    ]
  },
  debugger_freeze: {
    id: 'debugger_freeze', name: 'Debugger Breakpoint', code: 'DBG', type: 'beam',
    description: 'Sinar freeze, musuh yang kena akan membeku.',
    cooldown: 2.2, duration: 0.5, damage: 30, width: 35, color: '#58a6ff', freeze: true, freezeDuration: 1.5,
    maxLevel: 5, levelUps: [
      { desc: '+20 Damage dan freeze lebih lama', bonus: { damage: 20, freezeDuration: 1.0 } },
      { desc: '-25% CD breakpoint', bonus: { cooldown: -0.55 } },
      { desc: '+15 Width dan +1 detik freeze', bonus: { width: 15, freezeDuration: 1.0 } },
      { desc: 'EVOLUSI: Global Breakpoint! 360 freeze beam', bonus: { damage: 40, crossBeam: true, freezeDuration: 2.0 } }
    ]
  },

  // --- MINE FAMILY (type: mine) ---
  stackoverflow_nuke: {
    id: 'stackoverflow_nuke', name: 'StackOverflow Nuke', code: 'SO', type: 'mine',
    description: 'Ledakan besar, jawaban yang diterima (Accepted).',
    cooldown: 4.0, damage: 120, radius: 180, duration: 2.0, color: '#f85149',
    maxLevel: 5, levelUps: [
      { desc: '+50 Damage ledakan', bonus: { damage: 50 } },
      { desc: '+40 Radius dan -20% CD', bonus: { radius: 40, cooldown: -0.8 } },
      { desc: '+50 Damage', bonus: { damage: 50 } },
      { desc: 'EVOLUSI: Highly Upvoted Answer! +80 Dmg, 250 radius', bonus: { damage: 80, radius: 70 } }
    ]
  },
  kubernetes_cluster: {
    id: 'kubernetes_cluster', name: 'Kubernetes Cluster', code: 'K8S', type: 'mine',
    description: 'Deploy 3 pod, mereka meledak berantai.',
    cooldown: 3.0, damage: 70, radius: 100, duration: 3.5, cluster: true, clusterCount: 3, color: '#58a6ff',
    maxLevel: 5, levelUps: [
      { desc: '+1 Pod dan +20 Dmg', bonus: { clusterCount: 1, damage: 20 } },
      { desc: '-25% CD deployment', bonus: { cooldown: -0.75 } },
      { desc: '+1 Pod dan radius +30', bonus: { clusterCount: 1, radius: 30 } },
      { desc: 'EVOLUSI: Multi-Region Cluster! 6 pod, +50 Dmg', bonus: { clusterCount: 2, damage: 50 } }
    ]
  },
  docker_compose: {
    id: 'docker_compose', name: 'Docker Compose', code: 'DC', type: 'mine',
    description: 'Deploy 3 container sekaligus, semua service up.',
    cooldown: 2.8, damage: 65, radius: 95, duration: 3.5, cluster: true, clusterCount: 3, color: '#7ee787',
    maxLevel: 5, levelUps: [
      { desc: '+15 Damage dan +15 Radius', bonus: { damage: 15, radius: 15 } },
      { desc: '-30% CD compose', bonus: { cooldown: -0.85 } },
      { desc: '+1 Container', bonus: { clusterCount: 1 } },
      { desc: 'EVOLUSI: Swarm Mode! 6 container, +40 Dmg', bonus: { clusterCount: 2, damage: 40 } }
    ]
  },
  async_await: {
    id: 'async_await', name: 'Async Await', code: 'AA', type: 'mine',
    description: 'Delayed explosion, musuh tertarik dulu baru meledak.',
    cooldown: 3.2, damage: 85, radius: 130, duration: 4.5, pull: true, color: '#a371f7',
    maxLevel: 5, levelUps: [
      { desc: '+25 Damage dan radius +20', bonus: { damage: 25, radius: 20 } },
      { desc: '-25% CD promise', bonus: { cooldown: -0.8 } },
      { desc: '+25 Damage', bonus: { damage: 25 } },
      { desc: 'EVOLUSI: Promise.all()! +60 Dmg, 180 radius', bonus: { damage: 60, radius: 50 } }
    ]
  },
  devops_pipeline: {
    id: 'devops_pipeline', name: 'CI/CD Pipeline', code: 'CI', type: 'mine',
    description: 'Mine meledak berantai sepanjang pipeline.',
    cooldown: 3.5, damage: 55, radius: 85, duration: 2.5, chainExplode: true, chainCount: 4, color: '#39d353',
    maxLevel: 5, levelUps: [
      { desc: '+1 Stage pipeline', bonus: { chainCount: 1 } },
      { desc: '+20 Damage per stage', bonus: { damage: 20 } },
      { desc: '-30% CD build', bonus: { cooldown: -1.05 } },
      { desc: 'EVOLUSI: Zero-Downtime Blue-Green! 8 stage', bonus: { chainCount: 4, damage: 40 } }
    ]
  },
  event_emitter: {
    id: 'event_emitter', name: 'Event Emitter', code: 'EV', type: 'chain',
    description: 'Memancarkan event berantai, menyetrum musuh berdekatan.',
    cooldown: 0.9, damage: 25, chainCount: 3, chainRange: 200, chainDamageFalloff: 0.85, projectileColor: '#a371f7',
    maxLevel: 5, levelUps: [
      { desc: '+1 Chain jump', bonus: { chainCount: 1 } },
      { desc: '+8 Damage chain', bonus: { damage: 8 } },
      { desc: '-25% CD emit', bonus: { cooldown: -0.22 } },
      { desc: 'EVOLUSI: Event Bus Global! 6 jumps, +20 Dmg', bonus: { chainCount: 2, damage: 20 } }
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
  { id: 'max_weapon', title: 'Fully Refactored', desc: 'Tingkatkan salah satu skill ke level maksimal (5).', tag: '09' },
  { id: 'first_merge', title: 'Code Merger', desc: 'Lakukan merge senjata pertama kali.', tag: '10' },
  { id: 'mega_merge', title: 'Merged Empire', desc: 'Punya 2 super weapon sekaligus.', tag: '11' }
];

// ==================== MERGE SYSTEM ====================
// Kombinasi 2 senjata max-level yang menghasilkan SUPER weapon
export const MERGE_RECIPES = [
  { inputs: ['git_commit', 'api_endpoint'], resultId: 'git_force_push' },
  { inputs: ['cache_shot', 'webhook_ping'], resultId: 'redis_cluster' },
  { inputs: ['crash_reporter', 'unit_test'], resultId: 'sentry_suite' },
  { inputs: ['linter_shield', 'firewall_ring'], resultId: 'zero_trust_shield' },
  { inputs: ['cdn_shield', 'code_review'], resultId: 'global_mesh' },
  { inputs: ['hotfix_laser', 'refactor_beam'], resultId: 'hyperbeam' },
  { inputs: ['sql_injection', 'debugger_freeze'], resultId: 'root_access' },
  { inputs: ['docker_container', 'stackoverflow_nuke'], resultId: 'k8s_nuke' },
  { inputs: ['kubernetes_cluster', 'devops_pipeline'], resultId: 'chaos_engineering' },
  { inputs: ['copilot_drone', 'event_emitter'], resultId: 'gpt_5_agent' }
];

// Super weapons hasil merge (langsung max-level, tidak bisa diupgrade lagi)
export const SUPER_WEAPONS = {
  git_force_push: {
    id: 'git_force_push', name: 'Git Force Push', code: 'GFP', type: 'projectile', fireType: 'spread',
    description: 'Commit paksa ke main! Proyektil ganda dengan splash damage.',
    cooldown: 0.35, damage: 60, speed: 10, count: 4, pierce: 3, spread: 0.22, splash: 60, projectileColor: '#39d353',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  redis_cluster: {
    id: 'redis_cluster', name: 'Redis Cluster', code: 'RDS', type: 'projectile', fireType: 'rapid',
    description: 'Cache cluster, rapid fire tanpa henti.',
    cooldown: 0.08, damage: 22, speed: 15, count: 3, pierce: 2, projectileColor: '#f85149',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  sentry_suite: {
    id: 'sentry_suite', name: 'Sentry Test Suite', code: 'SEN', type: 'rocket', fireType: 'rocket',
    description: 'Roket homing dengan splash besar dan retarget otomatis.',
    cooldown: 0.8, damage: 90, speed: 8, count: 3, splash: 80, homingStrength: 10, retarget: true, projectileColor: '#3fb950',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  zero_trust_shield: {
    id: 'zero_trust_shield', name: 'Zero-Trust Shield', code: 'ZTS', type: 'orbit',
    description: 'Perimeter aman total, stun dan damage tinggi.',
    damage: 55, orbitRadius: 140, speed: 3.2, count: 10, stun: true, orbitColor: '#58a6ff',
    symbols: ['ZTS', 'ACL', 'WAF', 'FW', 'SSL', 'JWT', 'OA2', 'MFA', 'VPN', 'IDS'],
    maxLevel: 5, isMerged: true, levelUps: []
  },
  global_mesh: {
    id: 'global_mesh', name: 'Global Service Mesh', code: 'GSM', type: 'orbit',
    description: 'Mesh node global, slow musuh dalam radius besar.',
    damage: 32, orbitRadius: 190, speed: 2.5, count: 12, slow: true, orbitColor: '#7ee787',
    symbols: ['GSM', 'EDG', 'POP', 'ANY', 'CDN', 'DNS', 'LB', 'PRX', 'GW', 'ING', 'API', 'MESH'],
    maxLevel: 5, isMerged: true, levelUps: []
  },
  hyperbeam: {
    id: 'hyperbeam', name: 'Zero-Downtime Hyperbeam', code: 'HB', type: 'beam',
    description: 'Hyperbeam 360 derajat, semua arah, durasi panjang.',
    cooldown: 1.2, duration: 0.8, damage: 120, width: 50, crossBeam: true, color: '#ff7b72',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  root_access: {
    id: 'root_access', name: 'Root Access', code: 'ROOT', type: 'beam',
    description: 'SQL injection plus freeze, musuh membeku seketika.',
    cooldown: 1.5, duration: 0.7, damage: 85, width: 45, crossBeam: true, freeze: true, freezeDuration: 3.5, color: '#e3b341',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  k8s_nuke: {
    id: 'k8s_nuke', name: 'Kubernetes Nuke', code: 'KN', type: 'mine',
    description: 'Deploy cluster raksasa, ledakan area besar dan freeze.',
    cooldown: 2.5, damage: 250, radius: 280, duration: 2.5, cluster: true, clusterCount: 5, freeze: true, color: '#58a6ff',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  chaos_engineering: {
    id: 'chaos_engineering', name: 'Chaos Engineering', code: 'CHAOS', type: 'mine',
    description: 'Ledakan berantai tanpa henti, pipeline chaos.',
    cooldown: 3.0, damage: 180, radius: 220, duration: 2.5, chainExplode: true, chainCount: 8, pull: true, color: '#39d353',
    maxLevel: 5, isMerged: true, levelUps: []
  },
  gpt_5_agent: {
    id: 'gpt_5_agent', name: 'GPT-5 Autonomous Agent', code: 'GPT5', type: 'chain',
    description: 'AI agent cerdas, chain lightning tanpa batas.',
    cooldown: 0.6, damage: 70, chainCount: 8, chainRange: 250, chainDamageFalloff: 0.9, projectileColor: '#a371f7',
    maxLevel: 5, isMerged: true, levelUps: []
  }
};
