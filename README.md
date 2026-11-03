# ⚔️ Idle Exchange - Semi-Online Fantasy RPG & Marketplace (V2.0 Juiciness & VFX)

Aplikasi Web Idle Game Semi-Online yang efisien, modular, dan hemat token dengan sistem **Battle Arena HTML5 Canvas (VFX & Juiciness)**, **10 Item Berbeda dengan 5 Tingkat Rarity**, **Corpse & Respawn System**, serta **Marketplace Semi-Online Antar Pemain** (Timed Release 30 Menit & Atomic Lock Purchase).

---

## 🎨 Pembaruan Fitur V2.0

### 1. Tata Letak (2-Column Layout: 60% Kiri : 40% Kanan)
- **Kolom Kiri (60%)**:
  - **Top**: Arena Pertarungan HTML5 Canvas beresolusi tajam dengan background *Fantasy Forest* berulang secara konstan (*parallax horizontal loop*).
  - **Bottom**: Tas Inventory (24 Slot) & Equipment Terpasang (6 Slot Set).
- **Kolom Kanan (40%)**:
  - **Top**: Status Karakter Lengkap & Indikator Aura Set Aktif (*Dynamic Aura Tier*).
  - **Bottom**: Bursa Marketplace Pemain (Tab Jual Beli & Toko Saya).

### 2. Animasi & Visual Effects (Juiciness Engine)
- **Idle Squash & Stretch**:
  Sprite Player bergoyang hidup dengan deformasi sinus:
  `scaleY = 1 + Math.sin(time * 0.005) * 0.05` dan `scaleX = 1 - Math.sin(time * 0.005) * 0.03`.
- **Dynamic Player Aura (Set Bonus Visual)**:
  - **Tier 0**: Tanpa aura jika ada slot kosong atau memiliki item Common.
  - **Tier 1 (Cyan Mystic)**: Aktif jika semua 6 slot memiliki rarity > Common (Uncommon/Rare).
  - **Tier 2 (Violet Ethereal)**: Aktif jika semua 6 slot memiliki rarity >= Epic (partikel ungu mengalir ke atas).
  - **Tier 3 (Golden Celestial)**: Aktif jika seluruh 6 slot berkategori 'Legendary' (api emas berkilau + star rays).
- **Combat Hits & Screen Shake**:
  - Animasi *Lunge Attack*: Player maju (X + 25px) dengan efek tebasan pedang sabit biru (*Crescent Slash VFX*).
  - Musuh maju mendesak (X - 25px).
  - Efek Menerima Damage: *Hit Flash Tint* (putih/merah) + *Screen Shake* acak -4px s/d +4px selama 120-150ms.
  - *Floating Damage Text*: Angka merah melayang untuk damage yang diterima Player, putih/kuning untuk Musuh, dan teks Emas `💥 CRIT! -X` untuk serangan kritikal.
- **Loot Drop & Flying Effect**:
  - Saat musuh mati, item membal di atas tanah dengan fisika gravitasi (*Ground Bounce Physics*).
  - Pemain dapat mengklik loot di tanah canvas untuk menerbangkannya secara melengkung (*Bezier Curve Lerp*) menuju ikon tas inventory di layar.
  - Saat tiba di tas, ikon tas berkedip dan membesar (*Pulse Flash Animation*).
  - Disediakan tombol **"🧲 Tarik Semua Loot"** untuk kepraktisan bermain idle.

### 3. Tipe Musuh & Spawning
- **Slime (Common - 70%)**: Masuk dari kanan layar dengan gerakan parabola/lompatan sinus berulang pada sumbu Y.
- **Goblin (Elite - 25% / Kelipatan Wave 5)**: Berjalan lurus dengan zirah kulit dan belati.
- **Ogre (Boss - 5% / Kelipatan Wave 10)**: Ukuran sprite 1.55x lebih besar dengan tanduk raksasa dan pemukul kayu berduri, berjalan perlahan.

### 4. Corpse & Respawn System (Sistem Mayat)
- Melacak `highestWaveReached` dan `lastDeathWave`.
- Jika Player gugur:
  1. Wave di-reset kembali ke **Wave 1** dan monster di-reset ke status awal.
  2. Mencatat `lastDeathWave = wave_saat_mati`.
  3. Saat berada di `currentWave === lastDeathWave`, sebuah **Sisa Mayat Pahlawan** (tengkorak & pedang tertancap dengan opacity 0.7) dirender di latar belakang arena.
  4. Begitu Wave tersebut terlampaui (`currentWave > lastDeathWave`), mayat otomatis hilang.

---

## 📁 Struktur Modul Kode

```text
idle-exchange/
├── server/
│   └── index.js           # Express REST API, Atomic Mutex Locking, JSON DB Storage
├── public/
│   ├── index.html         # 2-Column Responsive Dashboard
│   ├── css/
│   │   └── style.css      # Dark Cyber-Fantasy Theme, Aura Badges, Inventory Pulse
│   └── js/
│       ├── RenderEngine.js # Canvas 2D VFX, Parallax Forest, Sprites, Auras, Particles
│       ├── GameEngine.js   # Combat Loop, Corpse Tracking, Spawning, Stats Recalculation
│       └── MarketEngine.js # REST API Market, Countdown 30 Menit, Atomic Buy
├── data/
│   └── market.json        # Database pasar terstruktur
└── package.json
```

---

## ⚡ Cara Menjalankan

Server Express aktif di:
👉 **`http://localhost:3000`**
