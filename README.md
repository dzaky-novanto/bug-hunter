# 🐛 BUG HUNTER: DEV SURVIVOR ⚡

Arcade Survivor ala Vampire Survivors tapi versi developer! Bantai gerombolan **Bug 🐛, 404 Error, NullPointer ⚠️, Merge Conflict ❌, Memory Leak ☣️**, dan selamatkan diri dari **Friday 5PM Production Outage 🚨**!

Live demo: `https://<username>.github.io/bug-hunter-survivor/` (aktifkan GitHub Pages 👇)

![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen) ![WebAudio](https://img.shields.io/badge/audio-WebAudio%20procedural-blueviolet) ![Mobile Ready](https://img.shields.io/badge/mobile-touch%20joystick-blue)

## 🎮 Mainkan Sekarang (tanpa install!)

1. Clone / buka folder `bug-hunter-survivor/`
2. Jalankan server lokal apa saja, contoh:
```bash
cd bug-hunter-survivor
npx serve .
# atau
python -m http.server 8000
```
3. Buka `http://localhost:8000` → pilih karakter → **MULAI RUN BARU**

> Kenapa butuh server lokal? Karena game pakai ES Modules (`import/export`), tidak bisa dibuka via `file://` langsung.

## ✨ Fitur Seru

- **3 Karakter Developer:** Junior Dev 👨‍💻, Senior 10x Dev 🧙‍♂️, DevOps Ninja 🥷 (masing-masing ada passive unik!)
- **6 Senjata Auto-Attack yang bisa Evolusi (max Lv.5):**
  - ⚡ Git Commit → `Git Push --force!`
  - 🛡️ Linter Orbit → `Strict TypeScript Armor!`
  - 🔥 Hotfix Laser → `Zero-Downtime Hyperbeam!`
  - 🐳 Docker Deploy → `Kubernetes Cluster!`
  - 🤖 AI Copilot Drone → `Autonomous GPT-5 Chain Lightning!`
  - 🦆 Rubber Duck Bomb → `Mega Quack of Doom!`
- **5 Passive Upgrade:** Espresso ☕, Mechanical Keyboard ⌨️, Energy Drink, Git Stash Armor, Clean Code Magnet 🧲
- **Boss Fight:** Friday 5PM Outage (menit 5) & Legacy Spaghetti Codebase (menit 8)
- **GitHub Green Tile XP System** — makin banyak commit, makin kuat!
- **9 Achievements + High Score (localStorage)** + tombol Share ke X/Twitter
- **100% Procedural Web Audio:** SFX tembakan, ledakan, level-up fanfare + BGM chiptune 8-bit, tanpa file MP3!
- **Mobile ready:** Virtual touch joystick otomatis muncul di HP
- **Zero dependencies:** HTML + CSS + Vanilla JS doang, ringan & gampang di-fork!

## 🕹️ Kontrol

| Aksi | Keyboard | Mobile |
|------|----------|--------|
| Gerak | `WASD` / `Arrow Keys` | Virtual Joystick (sentuh & drag) |
| Pause | `P` / `ESC` | - |
| Pilih Upgrade | `1` / `2` / `3` atau Klik | Tap kartu |

## 🚀 Deploy ke GitHub Pages (biar rame!)

Supaya bisa dimainkan orang langsung dari profil GitHub kamu:

```bash
# 1. Buat repo baru di GitHub, misal: bug-hunter-survivor
# 2. Di folder ini:
git init
git add .
git commit -m "feat: bug hunter survivor game 🎮"
git branch -M main
git remote add origin https://github.com/<username>/bug-hunter-survivor.git
git push -u origin main

# 3. Di GitHub: Settings → Pages → Deploy from branch → main / root → Save
# 4. Tunggu 1-2 menit, game live di:
# https://<username>.github.io/bug-hunter-survivor/
```

Tips biar rame:
- Pasang link demo di `About` repo + di bio GitHub
- Tambahkan screenshot/GIF gameplay ke README ini
- Share skor kamu pakai tombol **📢 Share ke X** di layar Game Over
- Ajak orang PR: tambah musuh baru (`constants.js` → `ENEMY_TYPES`), senjata baru (`WEAPONS`), atau karakter baru (`CHARACTERS`)

## 📁 Struktur File

```
bug-hunter-survivor/
├── index.html    # Layout HUD, menu, modal level-up / game over
├── style.css     # Tema cyber dark GitHub-style
├── constants.js  # Karakter, senjata, passive, musuh, achievement (EDIT DI SINI!)
├── entities.js   # Player, Enemy, Projectile, Gem, Particle
├── input.js      # Keyboard + touch joystick
├── game.js       # Engine, spawner, combat, render loop
├── ui.js         # HUD, menu karakter, modal, toast
├── audio.js      # Synthesizer SFX + BGM chiptune (tanpa aset!)
└── main.js       # Entry point
```

Mau modding cepat? Cukup edit `constants.js` — semua damage, cooldown, HP musuh, dan deskripsi ada di sana.

## 🤝 Kontribusi

PR & Issue sangat welcome! Ide gampang buat pemula:
- [ ] Musuh baru: `CORS Error`, `Infinite Loop`, `Zombie Process`
- [ ] Senjata baru: `StackOverflow Nuke`, `Regex Catastrophe`
- [ ] Mode Hardcore / Endless leaderboard
- [ ] Skin Octocat 🐙

Jangan lupa kasih ⭐ kalau seru!

## 📜 Lisensi

MIT — bebas dipakai, dimodif, dan dishare. Dibuat dengan ☕ + 💻 untuk meramaikan GitHub Indonesia.
