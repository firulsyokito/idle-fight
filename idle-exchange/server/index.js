const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { RARITIES, SYSTEM_ITEM_TEMPLATES } = require('./itemTemplates');

// Atomic Mutex implementation (supports async-mutex with built-in Promise fallback)
let Mutex;
try {
  Mutex = require('async-mutex').Mutex;
} catch (e) {
  Mutex = class {
    constructor() {
      this._queue = Promise.resolve();
    }
    async runExclusive(callback) {
      let release;
      const waitPromise = new Promise(resolve => { release = resolve; });
      const currentQueue = this._queue;
      this._queue = currentQueue.then(() => waitPromise);
      try {
        await currentQueue;
        return await callback();
      } finally {
        release();
      }
    }
  };
}

const marketMutex = new Mutex();
const playerMutex = new Mutex();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'market.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

// Durasi rilis pasar: 30 Menit untuk semua item (Idle Exchange V2.0 Spec)
const MARKET_RELEASE_DELAY_MS = 30 * 60 * 1000;

// Batasan Harga Marketplace sesuai Rarity
const PRICE_LIMITS = {
  common: { min: 10, max: 60, label: 'Common (10 - 60 Gold)' },
  uncommon: { min: 50, max: 350, label: 'Uncommon (50 - 350 Gold)' },
  rare: { min: 300, max: 2000, label: 'Rare (300 - 2.000 Gold)' },
  epic: { min: 2000, max: 15000, label: 'Epic (2.000 - 15.000 Gold)' },
  legendary: { min: 1, max: 100000000, label: 'Legendary (Harga Bebas)' }
};

// CORS configuration supporting GitHub Pages HTTPS and local dev
const allowedOrigins = [
  'https://firulsyokito.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.github.io')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for production deployment on Render
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Endpoint Info Server & IP LAN
app.get('/api/server-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(`http://${address.address}:${PORT}`);
      }
    }
  }
  res.json({
    port: PORT,
    lanUrls: addresses,
    localUrl: `http://localhost:${PORT}`
  });
});

// GET: Ambil semua listing aktif di marketplace
app.get('/api/market/listings', async (req, res) => {
  const data = readDb();
  const now = Date.now();

  const formatted = data.listings.map(item => {
    const remainingMs = Math.max(0, (item.availableAt || 0) - now);
    return {
      ...item,
      isPending: remainingMs > 0,
      remainingSeconds: Math.ceil(remainingMs / 1000)
    };
  });

  res.json({
    success: true,
    total: formatted.length,
    listings: formatted
  });
});

// POST: Pasang item ke marketplace (Pending 30 Menit)
app.post('/api/market/list', async (req, res) => {
  return await marketMutex.runExclusive(async () => {
    try {
      const { sellerId, sellerName, item, price } = req.body;

      if (!sellerId || !sellerName || !item || !price) {
        return res.status(400).json({ success: false, error: 'Data listing tidak lengkap.' });
      }

      const numPrice = parseInt(price, 10);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ success: false, error: 'Harga harus berupa angka positif.' });
      }

      // Validasi batas harga sesuai Rarity
      const rarity = (item.rarity || 'common').toLowerCase();
      const limit = PRICE_LIMITS[rarity] || PRICE_LIMITS.common;
      if (numPrice < limit.min || numPrice > limit.max) {
        return res.status(400).json({
          success: false,
          error: `Harga untuk tier ${rarity.toUpperCase()} harus antara ${limit.min}G hingga ${limit.max}G.`
        });
      }

      const data = readDb();
      const now = Date.now();
      const availableAt = now + MARKET_RELEASE_DELAY_MS;

      const newListing = {
        id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sellerId,
        sellerName,
        item,
        price: numPrice,
        listedAt: now,
        availableAt,
        status: 'active'
      };

      data.listings.unshift(newListing);
      writeDb(data);

      res.json({
        success: true,
        message: 'Item berhasil dipasang di bursa pasar!',
        listing: newListing,
        availableAt
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  });
});

// POST: Pembelian Item dengan Atomic Mutex Lock
app.post('/api/market/buy', async (req, res) => {
  return await marketMutex.runExclusive(async () => {
    try {
      const { listingId, buyerId, buyerName, buyerGold } = req.body;

      if (!listingId || !buyerId || !buyerName) {
        return res.status(400).json({ success: false, error: 'Parameter pembelian tidak valid.' });
      }

      // Cegah race-condition in-memory lock
      if (lockedItems.has(listingId)) {
        return res.status(409).json({ success: false, error: 'Item sedang dalam proses transaksi lain!' });
      }
      lockedItems.add(listingId);

      try {
        const data = readDb();
        const index = data.listings.findIndex(l => l.id === listingId);

        if (index === -1) {
          return res.status(404).json({ success: false, error: 'Item sudah tidak tersedia atau telah terjual.' });
        }

        const listing = data.listings[index];

        if (listing.sellerId === buyerId) {
          return res.status(400).json({ success: false, error: 'Anda tidak dapat membeli item dagangan Anda sendiri!' });
        }

        const now = Date.now();
        if (now < listing.availableAt) {
          const remainingSec = Math.ceil((listing.availableAt - now) / 1000);
          return res.status(400).json({
            success: false,
            error: `Item masih dalam masa pending rilis (${remainingSec} detik lagi).`
          });
        }

        if (buyerGold < listing.price) {
          return res.status(400).json({ success: false, error: 'Gold Anda tidak mencukupi untuk membeli item ini.' });
        }

        // Transaksi Berhasil: Catat transaksi & hapus dari listing
        const transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          listingId: listing.id,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          buyerId,
          buyerName,
          item: listing.item,
          price: listing.price,
          soldAt: now,
          claimed: false
        };

        data.listings.splice(index, 1);
        if (!data.transactions) data.transactions = [];
        data.transactions.unshift(transaction);
        writeDb(data);

        // Update saldo pemain di database players.json
        const playersData = readPlayersDb();
        if (playersData.players[buyerId]) {
          playersData.players[buyerId].gold -= listing.price;
        }

        res.json({
          success: true,
          message: `Berhasil membeli ${listing.item.name}!`,
          purchasedItem: listing.item,
          spentGold: listing.price,
          transaction
        });
      } finally {
        lockedItems.delete(listingId);
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'Terjadi kesalahan pada transaksi pasar.' });
    }
  });
});

// POST: Klaim hasil penjualan oleh Penjual
app.post('/api/market/claim', async (req, res) => {
  return await marketMutex.runExclusive(async () => {
    try {
      const { sellerId } = req.body;
      if (!sellerId) return res.status(400).json({ success: false, error: 'ID Penjual tidak valid.' });

      const data = readDb();
      const unclaimed = (data.transactions || []).filter(tx => tx.sellerId === sellerId && !tx.claimed);

      if (unclaimed.length === 0) {
        return res.json({ success: true, claimedGold: 0, message: 'Tidak ada hasil penjualan yang belum diklaim.' });
      }

      let totalGold = 0;
      unclaimed.forEach(tx => {
        totalGold += tx.price;
        tx.claimed = true;
      });

      writeDb(data);

      res.json({
        success: true,
        claimedGold: totalGold,
        count: unclaimed.length,
        message: `Berhasil mengklaim +${totalGold} Gold dari ${unclaimed.length} barang terjual!`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Gagal mengklaim hasil penjualan.' });
    }
  });
});

// GET: Papan Peringkat Global
app.get('/api/leaderboard', (req, res) => {
  try {
    const playersData = readPlayersDb();
    const list = Object.values(playersData.players).map(p => {
      const equippedList = Object.values(p.equipped || {}).filter(Boolean);
      const legendaryCount = equippedList.filter(eq => eq.rarity === 'legendary').length;
      return {
        id: p.id,
        name: p.name || 'Hero',
        wave: typeof p.wave === 'number' ? p.wave : 1,
        highestWaveReached: typeof p.highestWaveReached === 'number' ? p.highestWaveReached : (p.wave || 1),
        gold: typeof p.gold === 'number' ? p.gold : 0,
        legendaryCount
      };
    });

    list.sort((a, b) => {
      if (b.highestWaveReached !== a.highestWaveReached) return b.highestWaveReached - a.highestWaveReached;
      if (b.wave !== a.wave) return b.wave - a.wave;
      return b.gold - a.gold;
    });

    const ranked = list.map((item, idx) => ({ rank: idx + 1, ...item }));
    res.json({ success: true, leaderboard: ranked, totalPlayers: ranked.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memuat papan peringkat.' });
  }
});

// POST: Sinkronisasi progres pahlawan ke cloud
app.post('/api/player/sync', async (req, res) => {
  return await playerMutex.runExclusive(async () => {
    try {
      const p = req.body;
      if (!p || !p.id) return res.status(400).json({ success: false, error: 'Data pahlawan tidak valid.' });

      const playersData = readPlayersDb();
      playersData.players[p.id] = {
        ...p,
        updatedAt: Date.now()
      };
      writePlayersDb(playersData);

      res.json({ success: true, message: 'Progres karakter tersinkron ke cloud server!' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Gagal sinkronisasi data pemain.' });
    }
  });
});

// POST: Login / Ganti Akun
app.post('/api/player/login', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID Akun diperlukan.' });

    const playersData = readPlayersDb();
    const hero = playersData.players[id];
    if (hero) {
      return res.json({ success: true, player: hero });
    }

    return res.status(404).json({ success: false, error: 'Karakter tidak ditemukan di server.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memuat akun.' });
  }
});

app.listen(PORT, () => {
  console.log(`[IDLE EXCHANGE V2.0] Backend Server listening on port ${PORT}`);
});

