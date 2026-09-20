# BUG HUNTER: DEV SURVIVOR

Arcade Survivor ala Vampire Survivors tapi versi developer! Bantai gerombolan **Bug, 404 Error, NullPointer, Merge Conflict, Memory Leak**, dan selamatkan diri dari **Friday 5PM Production Outage**!

Live demo: `https://<username>.github.io/bug-hunter-survivor/` (aktifkan GitHub Pages, lihat bawah)

![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen) ![WebAudio](https://img.shields.io/badge/audio-WebAudio%20procedural-blueviolet) ![Mobile Ready](https://img.shields.io/badge/mobile-touch%20joystick-blue)

## Mainkan Sekarang (tanpa install!)

1. Clone / buka folder `bug-hunter-survivor/`
2. Jalankan server lokal apa saja, contoh:
```bash
cd bug-hunter-survivor
npx serve .
# atau
python -m http.server 8000
```
3. Buka `http://localhost:8000` > isi nickname > pilih karakter + senjata pembuka > **MULAI**

> Kenapa butuh server lokal? Karena game pakai ES Modules (`import/export`), tidak bisa dibuka via `file://` langsung.

## Fitur

- **4 Karakter Developer (vector sprite, tanpa emoji):** Junior Dev (JR), Senior 10x Dev (SR), DevOps Ninja (OPS), Prompt Engineer (AI, +25% XP gain)
- **32 Senjata Total (6 lama + 26 baru!), semua bisa Evolusi max Lv.5:**
  - Projectile: `Git Commit`, `API Endpoint`, `Cache Miss`, `Lambda Function`, `Webhook Ping`, `Hot Module Reload`, `Thread Pool`, `Regex Catastrophe`, `DDoS Barrage`, `Promise Chain`
  - Rocket homing: `Crash Reporter` (splash), `Unit Test`, `Binary Search` (95+ dmg), `Load Balancer` (retarget)
  - Orbit: `Linter Orbit`, `CDN Edge Node`, `Firewall Ring`, `Git Rebase` (chaos), `Code Review` (slow aura), `Git Blame` (mark + damage amp)
  - Beam: `Hotfix Laser`, `Refactor Ray`, `SQL Injection`, `Debugger Breakpoint` (freeze)
  - Mine: `Docker Deploy`, `StackOverflow Nuke`, `Kubernetes Cluster`, `Docker Compose`, `Async Await` (pull), `CI/CD Pipeline` (chain)
  - Spesial: `AI Copilot Drone`, `Rubber Duck Bomb`
- **5 Passive Upgrade:** Espresso, Mechanical Keyboard, Energy Drink, Git Stash Armor, Clean Code Magnet
- **Co-op 2 Player lokal:** P1 = WASD/touch, P2 = Arrow keys. Kamera midpoint, XP/gem berbagi area, level-up antre per pemain, game over kalau dua-duanya down
- **Aim System:** mode Manual (ikut arah gerak) atau Auto (prioritas Nearest / Strongest / Weakest / Farthest)
- **Weapon Select + Nickname + Volume Settings** di menu utama
- **Boss tiap 5 menit + SECTOR CLEAR:** boss bergantian (Friday Outage / Spaghetti) dan makin kuat tiap siklus (HP +90%, damage +15%). Bunuh boss = semua musuh jadi gem + hujan bonus gem (termasuk legendary) + 1 senjata/upgade gratis + musuh berikutnya HP x1.35, damage x1.15, XP x1.25, spawn makin cepat
- **GitHub Green Tile XP System**, **9 Achievements + High Score (localStorage)** + tombol Share
- **100% Procedural Web Audio:** SFX + BGM chiptune 8-bit, tanpa file MP3
- **Mobile ready:** Virtual touch joystick otomatis muncul di HP
- **Zero dependencies:** HTML + CSS + Vanilla JS doang

## Kontrol

| Aksi | P1 | P2 (co-op) | Mobile |
|------|----|------------|--------|
| Gerak | `WASD` | `Arrow Keys` | Virtual Joystick |
| Pause | `P` / `ESC` | - | - |
| Fullscreen | `F` / tombol FULL | - | Otomatis saat mulai |
| Pilih Upgrade | `1` / `2` / `3` atau Klik | - | Tap kartu |

> ESC keluar dari fullscreen (aturan browser) — tekan `F` atau tombol FULL untuk masuk lagi.


## Struktur File

```
bug-hunter-survivor/
├── index.html    # HUD, login, char/weapon select, modal level-up / game over / settings
├── style.css     # Tema cyber dark GitHub-style
├── constants.js  # Karakter, 32 senjata, passive, musuh, achievement (EDIT DI SINI!)
├── entities.js   # Player, Enemy, Projectile (homing/rocket), Gem, Particle
├── input.js      # Keyboard P1/P2 + touch joystick
├── game.js       # Engine, spawner, combat generik, co-op loop
├── ui.js         # HUD, menu, weapon grid, toast
├── audio.js      # Synthesizer SFX + BGM chiptune + volume mixer
└── main.js       # Entry point
```

Mau modding cepat? Cukup edit `constants.js` — semua damage, cooldown, HP musuh, dan deskripsi ada di sana.

## Kontribusi

PR dan Issue welcome! Ide gampang buat pemula:
- [ ] Musuh baru: `CORS Error`, `Infinite Loop`, `Zombie Process`
- [ ] Senjata baru keluarga baru: `StackOverflow Nuke` sudah ada, coba `Regex Catastrophe` versi beam
- [ ] Mode Hardcore / Endless leaderboard

Jangan lupa kasih Star kalau seru!

## Lisensi

MIT — bebas dipakai, dimodif, dan dishare.
