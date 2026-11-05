const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { RARITIES, SYSTEM_ITEM_TEMPLATES } = require('./itemTemplates');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'market.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

// Durasi pending release sesuai Rarity:
// Di bawah Epic (Common, Uncommon, Rare) = 5 menit
// Epic = 10 menit
// Legendary = 20 menit
function getPendingDurationMs(rarity) {
  const r = (rarity || '').toLowerCase();
  if (r === 'legendary') return 20 * 60 * 1000;
  if (r === 'epic') return 10 * 60 * 1000;
  return 5 * 60 * 1000;
}

// Batasan Harga Marketplace sesuai Rarity
const PRICE_LIMITS = {
  common: { min: 10, max: 60, label: 'Common (10 - 60 Gold)' },
  uncommon: { min: 50, max: 350, label: 'Uncommon (50 - 350 Gold)' },
  rare: { min: 300, max: 2000, label: 'Rare (300 - 2.000 Gold)' },
  epic: { min: 2000, max: 15000, label: 'Epic (2.000 - 15.000 Gold)' },
  legendary: { min: 1, max: 100000000, label: 'Legendary (Harga Bebas)' }
};

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// Sajikan folder public jika ada (opsional jika frontend ditaruh satu server)
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Health-check / Status endpoint saat membuka URL server di browser
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Idle Fight RPG Server',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// In-Memory Mutex Lock untuk mencegah race condition pembelian ganda
const lockedItems = new Set();

// Utility Database File I/O
function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ listings: [], transactions: [] }, null, 2));
  }
  if (!fs.existsSync(PLAYERS_FILE)) {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify({ players: {} }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { listings: [], transactions: [] };
  }
}

function writeDb(data) {
  ensureDb();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

function readPlayersDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(PLAYERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { players: {} };
  }
}

function writePlayersDb(data) {
  ensureDb();
  const tempFile = `${PLAYERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, PLAYERS_FILE);
}

function getLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ interface: name, ip: net.address });
      }
    }
  }
  return results;
}

// ================================================================
// 1. INFO SERVER & AKSES MULTI-DEVICE (LAN / WIFI)
// ================================================================
app.get('/api/server-info', (req, res) => {
  const ips = getLocalIpAddresses();
  const primaryIp = ips.length > 0 ? ips[0].ip : 'localhost';
  res.json({
    port: PORT,
    primaryIp: primaryIp,
    lanUrls: ips.map(i => `http://${i.ip}:${PORT}`),
    localUrl: `http://localhost:${PORT}`
  });
});

// ================================================================
// 2. SISTEM AKUN & SIMPAN PROGRESS SETIAP ID AKUN (CLOUD SAVE)
// ================================================================

// A. Ambil Data Akun Berdasarkan ID
app.get('/api/player/:id', (req, res) => {
  const { id } = req.params;
  const db = readPlayersDb();
  const player = db.players[id];

  if (!player) {
    return res.status(404).json({ error: 'Akun ID tidak ditemukan.' });
  }

  res.json({ success: true, player });
});

// B. Simpan / Sinkronisasi Progress Akun ke Server
app.post('/api/player/save', (req, res) => {
  const { id, name, gold, wave, highestWaveReached, lastDeathWave, equipped, inventory } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID Akun diperlukan.' });
  }

  const db = readPlayersDb();
  const existing = db.players[id] || {};

  db.players[id] = {
    id,
    name: name || existing.name || 'Hero',
    gold: typeof gold === 'number' ? gold : (existing.gold ?? 150),
    wave: typeof wave === 'number' ? wave : (existing.wave ?? 1),
    highestWaveReached: typeof highestWaveReached === 'number' ? highestWaveReached : (existing.highestWaveReached ?? 1),
    lastDeathWave: lastDeathWave !== undefined ? lastDeathWave : (existing.lastDeathWave ?? null),
    equipped: equipped || existing.equipped || {},
    inventory: Array.isArray(inventory) ? inventory : (existing.inventory || []),
    updatedAt: Date.now()
  };

  writePlayersDb(db);

  res.json({
    success: true,
    message: 'Progress berhasil tersimpan di server cloud!',
    savedAt: db.players[id].updatedAt
  });
});

// C. Login / Ganti Akun ID
app.post('/api/player/login', (req, res) => {
  const { id, name } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID Akun diperlukan.' });
  }

  const db = readPlayersDb();
  let player = db.players[id];

  if (!player) {
    // Jika belum ada, buat akun baru di server
    player = {
      id,
      name: name || `Hero_${Math.floor(100 + Math.random() * 900)}`,
      gold: 150,
      wave: 1,
      highestWaveReached: 1,
      lastDeathWave: null,
      equipped: {
        weapon: null,
        armor: null,
        shield: null,
        boots: null,
        accessory: null,
        special: null
      },
      inventory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    db.players[id] = player;
    writePlayersDb(db);
  }

  res.json({
    success: true,
    message: 'Berhasil masuk ke akun!',
    player
  });
});

// D. Papan Peringkat Global Seluruh Pemain (Leaderboard)
app.get('/api/leaderboard', (req, res) => {
  const db = readPlayersDb();
  const list = Object.values(db.players || {}).map(p => {
    const equippedList = Object.values(p.equipped || {}).filter(Boolean);
    const legendaryCount = equippedList.filter(eq => eq.rarity === 'legendary').length;
    return {
      id: p.id,
      name: p.name || 'Hero',
      wave: typeof p.wave === 'number' ? p.wave : 1,
      highestWaveReached: typeof p.highestWaveReached === 'number' ? p.highestWaveReached : (p.wave || 1),
      gold: typeof p.gold === 'number' ? p.gold : 0,
      legendaryCount,
      updatedAt: p.updatedAt || 0
    };
  });

  // Urutkan peringkat berdasarkan Rekor Wave (Highest Wave), kemudian Wave aktif, kemudian Gold
  list.sort((a, b) => {
    if (b.highestWaveReached !== a.highestWaveReached) {
      return b.highestWaveReached - a.highestWaveReached;
    }
    if (b.wave !== a.wave) {
      return b.wave - a.wave;
    }
    return b.gold - a.gold;
  });

  const topList = list.slice(0, 50).map((item, idx) => ({
    rank: idx + 1,
    ...item
  }));

  res.json({
    success: true,
    totalPlayers: list.length,
    leaderboard: topList
  });
});

// E. Ganti Nama Karakter Pahlawan (Rename)
app.post('/api/player/rename', (req, res) => {
  const { id, newName } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID Akun diperlukan.' });
  }
  const cleanName = (newName || '').trim();
  if (!cleanName || cleanName.length < 2 || cleanName.length > 20) {
    return res.status(400).json({ error: 'Nama harus memiliki panjang 2 sampai 20 karakter!' });
  }

  const db = readPlayersDb();
  if (!db.players[id]) {
    return res.status(404).json({ error: 'Akun ID tidak ditemukan.' });
  }

  db.players[id].name = cleanName;
  db.players[id].updatedAt = Date.now();
  writePlayersDb(db);

  res.json({
    success: true,
    message: 'Nama pahlawan berhasil diperbarui!',
    name: cleanName
  });
});

// ================================================================
// 3. SEMI-ONLINE MARKET EXCHANGE SYSTEM
// ================================================================

// Rules Pasar
app.get('/api/market/rules', (req, res) => {
  res.json({
    priceLimits: PRICE_LIMITS,
    pendingDurations: {
      underEpic: 5 * 60 * 1000,
      epic: 10 * 60 * 1000,
      legendary: 20 * 60 * 1000
    }
  });
});

// Mengambil Semua Listing Aktif
app.get('/api/market/listings', (req, res) => {
  const db = readDb();
  const now = Date.now();

  const formatted = db.listings
    .filter(item => !item.sold)
    .map(item => {
      const remainingMs = Math.max(0, item.releaseAt - now);
      return {
        ...item,
        isPending: remainingMs > 0,
        remainingMs: remainingMs
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json({ listings: formatted, serverTime: now });
});

// Pasang Item ke Pasar (Listing)
app.post('/api/market/list', (req, res) => {
  const { sellerId, sellerName, item, price } = req.body;

  if (!sellerId || !item || !item.id || !item.rarity || typeof price !== 'number') {
    return res.status(400).json({ error: 'Data listing tidak lengkap.' });
  }

  const rarity = (item.rarity || '').toLowerCase();
  const limits = PRICE_LIMITS[rarity];

  if (!limits) {
    return res.status(400).json({ error: `Rarity "${item.rarity}" tidak valid.` });
  }

  if (price < limits.min || price > limits.max) {
    return res.status(400).json({
      error: `Harga untuk ${item.rarity.toUpperCase()} harus antara ${limits.min} dan ${limits.max} Gold!`
    });
  }

  const now = Date.now();
  const pendingMs = getPendingDurationMs(item.rarity);
  const newListing = {
    listingId: `list_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sellerId,
    sellerName: sellerName || 'Unknown Hero',
    item,
    price: Math.floor(price),
    createdAt: now,
    releaseAt: now + pendingMs,
    sold: false,
    soldTo: null,
    soldAt: null
  };

  const db = readDb();
  db.listings.push(newListing);
  writeDb(db);

  res.json({
    success: true,
    message: `Item berhasil dipasang di marketplace (Status: Pending Release ${pendingMs / 60000} menit).`,
    listing: {
      ...newListing,
      isPending: true,
      remainingMs: pendingMs
    }
  });
});

// Beli Item (Atomic Purchase & Lock)
app.post('/api/market/buy', (req, res) => {
  const { listingId, buyerId, buyerName, buyerGold } = req.body;

  if (!listingId || !buyerId || typeof buyerGold !== 'number') {
    return res.status(400).json({ error: 'Parameter pembelian tidak lengkap.' });
  }

  if (lockedItems.has(listingId)) {
    return res.status(409).json({
      error: 'Item sedang dalam proses transaksi oleh pemain lain. Silakan coba lagi.'
    });
  }

  lockedItems.add(listingId);

  try {
    const db = readDb();
    const index = db.listings.findIndex(l => l.listingId === listingId);

    if (index === -1) {
      return res.status(404).json({ error: 'Item tidak ditemukan di marketplace.' });
    }

    const listing = db.listings[index];

    if (listing.sold) {
      return res.status(410).json({ error: 'Item sudah terjual ke pemain lain!' });
    }

    if (listing.sellerId === buyerId) {
      return res.status(400).json({ error: 'Anda tidak dapat membeli item milik sendiri.' });
    }

    const now = Date.now();
    if (now < listing.releaseAt) {
      const remainingSec = Math.ceil((listing.releaseAt - now) / 1000);
      return res.status(400).json({
        error: `Item masih dalam masa pending release! Sisa waktu: ${remainingSec} detik.`
      });
    }

    if (buyerGold < listing.price) {
      return res.status(400).json({
        error: `Gold tidak mencukupi! Diperlukan: ${listing.price} Gold, Gold Anda: ${buyerGold}`
      });
    }

    listing.sold = true;
    listing.soldTo = { buyerId, buyerName: buyerName || 'Hero' };
    listing.soldAt = now;

    db.transactions.push({
      txId: `tx_${now}`,
      listingId: listing.listingId,
      sellerId: listing.sellerId,
      buyerId,
      price: listing.price,
      item: listing.item,
      timestamp: now
    });

    writeDb(db);

    res.json({
      success: true,
      message: `Sukses membeli ${listing.item.name} seharga ${listing.price} Gold!`,
      item: listing.item,
      priceDeducted: listing.price,
      sellerId: listing.sellerId
    });
  } finally {
    lockedItems.delete(listingId);
  }
});

// Cek Hasil Penjualan Player
app.get('/api/market/my-sales/:playerId', (req, res) => {
  const { playerId } = req.params;
  const db = readDb();

  const soldItems = db.listings.filter(
    l => l.sellerId === playerId && l.sold && !l.claimed
  );

  const totalGoldEarned = soldItems.reduce((acc, cur) => acc + cur.price, 0);

  res.json({
    soldItems,
    totalGoldEarned
  });
});

// Klaim Gold Hasil Penjualan
app.post('/api/market/claim-sales', (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'PlayerId diperlukan.' });

  const db = readDb();
  let claimedGold = 0;
  const claimedList = [];

  db.listings.forEach(l => {
    if (l.sellerId === playerId && l.sold && !l.claimed) {
      l.claimed = true;
      claimedGold += l.price;
      claimedList.push(l.item.name);
    }
  });

  if (claimedGold > 0) {
    writeDb(db);
  }

  res.json({
    success: true,
    claimedGold,
    itemsClaimed: claimedList
  });
});

// Batalkan Listing (Cancel)
app.post('/api/market/cancel', (req, res) => {
  const { listingId, sellerId } = req.body;
  if (!listingId || !sellerId) return res.status(400).json({ error: 'Parameter tidak valid.' });

  if (lockedItems.has(listingId)) {
    return res.status(409).json({ error: 'Item sedang diproses, tidak bisa dibatalkan saat ini.' });
  }

  lockedItems.add(listingId);
  try {
    const db = readDb();
    const idx = db.listings.findIndex(l => l.listingId === listingId && l.sellerId === sellerId);

    if (idx === -1) {
      return res.status(404).json({ error: 'Listing tidak ditemukan atau bukan milik Anda.' });
    }

    const listing = db.listings[idx];
    if (listing.sold) {
      return res.status(400).json({ error: 'Item sudah laku terjual, tidak bisa dibatalkan.' });
    }

    const returnedItem = listing.item;
    db.listings.splice(idx, 1);
    writeDb(db);

    res.json({
      success: true,
      message: 'Item berhasil ditarik kembali ke inventory.',
      item: returnedItem
    });
  } finally {
    lockedItems.delete(listingId);
  }
});

// ================================================================
// 4. TOKO SISTEM GAME (5 ITEM ACAK, RESET PER 20 MENIT)
// ================================================================
const SYSTEM_SHOP_INTERVAL_MS = 20 * 60 * 1000; // 20 Menit
const systemShopPurchases = {}; // { [cycleId]: { [playerId]: [itemIds...] } }

function getSystemShopCycleId() {
  return Math.floor(Date.now() / SYSTEM_SHOP_INTERVAL_MS);
}

function generateSystemShopItems(cycleId) {
  let seed = (cycleId * 9301 + 49297) % 233280;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const pool = SYSTEM_ITEM_TEMPLATES;
  const items = [];

  const slotRarities = [
    rnd() < 0.6 ? 'common' : 'uncommon',
    'uncommon',
    rnd() < 0.6 ? 'rare' : 'uncommon',
    rnd() < 0.5 ? 'rare' : 'epic',
    rnd() < 0.12 ? 'legendary' : 'epic'
  ];

  for (let i = 0; i < 5; i++) {
    const targetRarity = slotRarities[i];
    let eligible = pool.filter(t => {
      if (targetRarity === 'legendary') return !!t.legendaryEffect;
      return !t.legendaryEffect;
    });
    if (!eligible.length) eligible = pool;

    const chosenIdx = Math.floor(rnd() * eligible.length);
    const tmpl = eligible[chosenIdx];
    const rarData = RARITIES[targetRarity] || RARITIES.common;

    let finalStatVal = tmpl.baseVal * rarData.multiplier;
    if (tmpl.stat === 'atkSpeed') {
      finalStatVal = Math.round(finalStatVal * 100) / 100;
    } else {
      finalStatVal = Math.round(finalStatVal);
    }

    let price = Math.floor(rarData.baseNpcSell * (1.3 + rnd() * 0.4));
    if (targetRarity === 'legendary') price = Math.floor(18000 + rnd() * 12000);

    items.push({
      id: `sys_${cycleId}_slot_${i}_${tmpl.id}`,
      templateId: tmpl.id,
      name: tmpl.name,
      slot: tmpl.slot,
      stat: tmpl.stat,
      statVal: finalStatVal,
      unit: tmpl.unit,
      desc: tmpl.desc,
      icon: tmpl.icon,
      rarity: targetRarity,
      price: price,
      npcSellPrice: rarData.baseNpcSell,
      legendaryEffect: tmpl.legendaryEffect,
      legendaryVfx: tmpl.legendaryVfx,
      legendaryDesc: tmpl.legendaryDesc
    });
  }

  return items;
}

// Ambil 5 Item Toko Sistem & Waktu Reset 20 Menit
app.get('/api/market/system-shop', (req, res) => {
  const playerId = req.query.playerId;
  const now = Date.now();
  const cycleId = getSystemShopCycleId();
  const nextResetAt = (cycleId + 1) * SYSTEM_SHOP_INTERVAL_MS;
  const remainingMs = Math.max(0, nextResetAt - now);

  const rawItems = generateSystemShopItems(cycleId);
  const cyclePurchases = (systemShopPurchases[cycleId] && systemShopPurchases[cycleId][playerId]) || [];

  const items = rawItems.map(item => ({
    ...item,
    isSoldOut: cyclePurchases.includes(item.id)
  }));

  res.json({
    success: true,
    cycleId,
    nextResetAt,
    remainingMs,
    items
  });
});

// Pembelian Item dari Toko Sistem
app.post('/api/market/system-buy', (req, res) => {
  const { playerId, itemId } = req.body;
  if (!playerId || !itemId) {
    return res.status(400).json({ error: 'Parameter pembelian tidak lengkap.' });
  }

  const cycleId = getSystemShopCycleId();
  const rawItems = generateSystemShopItems(cycleId);
  const targetItem = rawItems.find(i => i.id === itemId);

  if (!targetItem) {
    return res.status(404).json({ error: 'Item toko sistem tidak ditemukan atau rotasi sudah berakhir.' });
  }

  if (!systemShopPurchases[cycleId]) systemShopPurchases[cycleId] = {};
  if (!systemShopPurchases[cycleId][playerId]) systemShopPurchases[cycleId][playerId] = [];

  if (systemShopPurchases[cycleId][playerId].includes(itemId)) {
    return res.status(400).json({ error: 'Anda sudah membeli item ini pada rotasi 20 menit ini!' });
  }

  const db = readPlayersDb();
  const player = db.players[playerId];
  if (!player) {
    return res.status(404).json({ error: 'Pemain tidak ditemukan.' });
  }

  if ((player.inventory || []).length >= 24) {
    return res.status(400).json({ error: 'Tas inventory penuh (Maksimal 24 slot)!' });
  }

  if (player.gold < targetItem.price) {
    return res.status(400).json({ error: 'Gold Anda tidak mencukupi untuk membeli item ini.' });
  }

  // Lakukan transaksi
  player.gold -= targetItem.price;
  const purchasedItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateId: targetItem.templateId,
    name: targetItem.name,
    slot: targetItem.slot,
    stat: targetItem.stat,
    statVal: targetItem.statVal,
    unit: targetItem.unit,
    desc: targetItem.desc,
    icon: targetItem.icon,
    rarity: targetItem.rarity,
    npcSellPrice: targetItem.npcSellPrice,
    legendaryEffect: targetItem.legendaryEffect,
    legendaryVfx: targetItem.legendaryVfx,
    legendaryDesc: targetItem.legendaryDesc
  };

  player.inventory.push(purchasedItem);
  player.updatedAt = Date.now();
  writePlayersDb(db);

  systemShopPurchases[cycleId][playerId].push(itemId);

  res.json({
    success: true,
    message: `Berhasil membeli ${targetItem.name} dari Toko Sistem!`,
    item: purchasedItem,
    remainingGold: player.gold
  });
});

// Jalankan server pada 0.0.0.0 agar bisa diakses dari HP / Laptop lain dalam Wi-Fi yang sama
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log(`===================================================`);
  console.log(`[Idle Exchange] Server Aktif Multi-Device!`);
  console.log(`• Akses PC Ini        : http://localhost:${PORT}`);
  ips.forEach(net => {
    console.log(`• Akses HP/Device Lain: http://${net.ip}:${PORT}  (${net.interface})`);
  });
  console.log(`Market release delay  : <Epic: 5 mnt | Epic: 10 mnt | Legendary: 20 mnt`);
  console.log(`===================================================`);
});
