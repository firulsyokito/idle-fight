/**
 * IDLE EXCHANGE - MarketEngine.js
 * Logika Pasar, Aturan Batas Harga, Countdown 30 Menit & Pembelian Atomik
 */

const MarketEngine = {
  currentListings: [],
  mySalesData: { soldItems: [], totalGoldEarned: 0 },
  rules: null,
  activeListingTarget: null,
  tickerInterval: null,
  activeSubTab: 'player', // 'player' atau 'system'
  systemShopData: { cycleId: 0, items: [], nextResetAt: 0, remainingMs: 0 },

  async init() {
    await this.fetchRules();
    await this.refreshListings();
    await this.fetchSystemShop();
    this.startCountdownTicker();

    // Event listeners Subtab Pemisah: Item Pemain vs Toko Sistem
    const tabPlayerBtn = document.getElementById('tab-market-player');
    const tabSystemBtn = document.getElementById('tab-market-system');
    if (tabPlayerBtn) tabPlayerBtn.onclick = () => this.switchSubTab('player');
    if (tabSystemBtn) tabSystemBtn.onclick = () => this.switchSubTab('system');

    // Event listeners
    const tabBrowseBtn = document.getElementById('tab-browse-btn');
    if (tabBrowseBtn) tabBrowseBtn.onclick = () => this.switchTab('tab-browse');

    const tabMyShopBtn = document.getElementById('tab-myshop-btn');
    if (tabMyShopBtn) tabMyShopBtn.onclick = () => this.switchTab('tab-myshop');

    const btnRefresh = document.getElementById('btn-refresh-market');
    if (btnRefresh) {
      btnRefresh.onclick = () => {
        if (this.activeSubTab === 'system') {
          this.fetchSystemShop();
        } else {
          this.refreshListings();
        }
      };
    }

    const filterRarity = document.getElementById('market-filter-rarity');
    if (filterRarity) filterRarity.onchange = () => this.renderListings();

    const btnClaim = document.getElementById('btn-claim-sales');
    if (btnClaim) btnClaim.onclick = () => this.claimSalesGold();

    // Modal Events
    const modalClose = document.getElementById('modal-market-close');
    if (modalClose) modalClose.onclick = () => this.closeListingModal();

    const modalCancel = document.getElementById('modal-market-cancel');
    if (modalCancel) modalCancel.onclick = () => this.closeListingModal();

    const modalSubmit = document.getElementById('modal-market-submit');
    if (modalSubmit) modalSubmit.onclick = () => this.submitListing();

    // Auto sync berkala setiap 25 detik
    setInterval(() => {
      this.refreshListings();
    }, 25000);
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    const tabPlayer = document.getElementById('tab-market-player');
    const tabSystem = document.getElementById('tab-market-system');
    const viewPlayer = document.getElementById('view-market-player');
    const viewSystem = document.getElementById('view-market-system');

    if (tab === 'system') {
      if (tabSystem) tabSystem.classList.add('active');
      if (tabPlayer) tabPlayer.classList.remove('active');
      if (viewSystem) viewSystem.classList.add('active');
      if (viewPlayer) viewPlayer.classList.remove('active');
      this.fetchSystemShop();
    } else {
      if (tabPlayer) tabPlayer.classList.add('active');
      if (tabSystem) tabSystem.classList.remove('active');
      if (viewPlayer) viewPlayer.classList.add('active');
      if (viewSystem) viewSystem.classList.remove('active');
      this.refreshListings();
    }
  },

  async fetchRules() {
    try {
      const res = await fetch('/api/market/rules');
      if (res.ok) {
        this.rules = await res.json();
        return;
      }
    } catch (err) {
      // offline / standalone fallback
    }

    this.rules = {
      priceLimits: {
        common: { min: 10, max: 60, label: 'Common (10 - 60 Gold)' },
        uncommon: { min: 50, max: 350, label: 'Uncommon (50 - 350 Gold)' },
        rare: { min: 300, max: 2000, label: 'Rare (300 - 2.000 Gold)' },
        epic: { min: 2000, max: 15000, label: 'Epic (2.000 - 15.000 Gold)' },
        legendary: { min: 1, max: 100000000, label: 'Legendary (Harga Bebas)' }
      },
      pendingDurations: {
        underEpic: 5 * 60 * 1000,
        epic: 10 * 60 * 1000,
        legendary: 20 * 60 * 1000
      }
    };
  },

  async refreshListings() {
    try {
      const res = await fetch('/api/market/listings');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const clientNow = Date.now();
      const timeDelta = clientNow - data.serverTime;

      this.currentListings = data.listings.map(l => ({
        ...l,
        localReleaseAt: l.releaseAt + timeDelta
      }));

      this.renderListings();
      this.fetchMySales();
    } catch (err) {
      // Standalone / Google Sites Mode: Gunakan simulasi bursa mandiri
      this.loadStandaloneMarket();
    }
  },

  loadStandaloneMarket() {
    this.fetchRules();
    const now = Date.now();
    let raw = localStorage.getItem('idle_standalone_market');
    let listings = [];
    if (raw) {
      try { listings = JSON.parse(raw); } catch (e) { listings = []; }
    }

    if (!listings || listings.length === 0) {
      // Inisialisasi awal beberapa barang di bursa agar pasar terasa ramai
      const sampleTemplates = (window.ITEM_TEMPLATES || []).slice(5, 20);
      listings = sampleTemplates.map((tmpl, idx) => {
        const rar = idx % 5 === 0 ? 'epic' : (idx % 2 === 0 ? 'rare' : 'uncommon');
        const rarData = window.RARITIES ? window.RARITIES[rar] : { multiplier: 2, baseNpcSell: 80 };
        return {
          listingId: `list_bot_${Date.now()}_${idx}`,
          sellerId: `bot_trader_${idx}`,
          sellerName: `Pedagang_Kelana_${idx + 1}`,
          price: Math.floor((rarData.baseNpcSell || 80) * 1.5),
          releaseAt: now - 5000,
          localReleaseAt: now - 5000,
          item: {
            id: `item_bot_${Date.now()}_${idx}`,
            templateId: tmpl.id,
            name: tmpl.name,
            slot: tmpl.slot,
            stat: tmpl.stat,
            statVal: Math.round(tmpl.baseVal * (rarData.multiplier || 2)),
            unit: tmpl.unit,
            desc: tmpl.desc,
            icon: tmpl.icon,
            rarity: rar,
            npcSellPrice: rarData.baseNpcSell || 80
          }
        };
      });
      localStorage.setItem('idle_standalone_market', JSON.stringify(listings));
    }

    // Cek apakah item milik pemain yang pending sudah selesai dan laku dibeli
    const myPlayerId = GameState.player.id;
    let earnedNew = 0;
    listings.forEach(l => {
      l.localReleaseAt = l.releaseAt;
      if (l.sellerId === myPlayerId && !l.sold) {
        if (now >= l.releaseAt) {
          l.sold = true;
          earnedNew += l.price;
        }
      }
    });

    if (earnedNew > 0) {
      let currentUnclaimed = parseInt(localStorage.getItem('idle_standalone_unclaimed_gold') || '0', 10);
      currentUnclaimed += earnedNew;
      localStorage.setItem('idle_standalone_unclaimed_gold', currentUnclaimed.toString());
      this.mySalesData.totalGoldEarned = currentUnclaimed;
      GameEngine.showToast(`💰 Item dagangan Anda di bursa laku terjual! (+${earnedNew.toLocaleString()} Gold)`, 'success');
      GameEngine.logCombat(`💰 Item dagangan Anda di bursa laku terjual seharga <b>+${earnedNew} Gold</b>!`);
    } else {
      let currentUnclaimed = parseInt(localStorage.getItem('idle_standalone_unclaimed_gold') || '0', 10);
      this.mySalesData.totalGoldEarned = currentUnclaimed;
    }

    // Simpan data listing yang aktif
    localStorage.setItem('idle_standalone_market', JSON.stringify(listings));

    this.currentListings = listings.filter(l => !l.sold || l.sellerId === myPlayerId);
    this.renderListings();
    this.renderMyShop();
  },

  renderListings() {
    const container = document.getElementById('market-listing-container');
    if (!container) return;

    // Perbarui badge jumlah item pemain
    const badgePlayerCount = document.getElementById('badge-player-market-count');
    if (badgePlayerCount) {
      badgePlayerCount.innerText = (this.currentListings || []).length.toString();
    }

    const filterSelect = document.getElementById('market-filter-rarity');
    const filterRarity = filterSelect ? filterSelect.value : 'all';
    const myPlayerId = GameState.player.id;
    const now = Date.now();

    let list = this.currentListings;
    if (filterRarity !== 'all') {
      list = list.filter(l => l.item.rarity.toLowerCase() === filterRarity);
    }

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state">Belum ada item yang terdaftar di bursa pemain.</div>`;
      return;
    }

    container.innerHTML = '';

    list.forEach(listing => {
      const isOwner = listing.sellerId === myPlayerId;
      const remainingMs = Math.max(0, listing.localReleaseAt - now);
      const isPending = remainingMs > 0;
      const item = listing.item;

      const card = document.createElement('div');
      card.className = `market-item-tile rarity-${item.rarity} ${isPending ? 'is-pending' : 'is-ready'}`;
      card.dataset.listingId = listing.listingId;

      const formattedTime = this.formatCountdown(remainingMs);
      const canAfford = GameState.player.gold >= listing.price;

      let actionHtml = '';
      if (isOwner) {
        actionHtml = `<div class="tile-badge-owner">Item Anda</div>`;
      } else if (isPending) {
        actionHtml = `<div class="tile-badge-pending">⏳ ${formattedTime}</div>`;
      } else {
        const disabledAttr = !canAfford ? 'disabled' : '';
        const btnText = canAfford ? 'Beli' : 'Gold Kurang';

        actionHtml = `
          <button class="btn-buy-tile" ${disabledAttr} onclick="MarketEngine.purchaseItem('${listing.listingId}')">
            🛒 ${btnText}
          </button>
        `;
      }

      const itemIcon = (window.getItemIcon ? window.getItemIcon(item) : (item.icon || '🎁'));

      card.innerHTML = `
        <div class="tile-top">
          <span class="tile-icon">${itemIcon}</span>
          <span class="tile-rarity bg-rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
        </div>
        <div class="tile-mid">
          <div class="tile-badge-player" title="Penjual: ${listing.sellerName || 'Pemain'}">👤 ${listing.sellerName || 'Pemain'}</div>
          <div class="tile-name rarity-${item.rarity}" title="${item.name}">${item.name}</div>
          <div class="tile-stat">+${item.statVal}${item.unit || ''} ${item.desc || ''}</div>
        </div>
        <div class="tile-bottom">
          <div class="tile-price">💰 ${listing.price.toLocaleString()} G</div>
          ${actionHtml}
        </div>
      `;

      container.appendChild(card);
    });
  },

  // ── TOKO SISTEM GAME (5 ITEM ACAK, RESET PER 20 MENIT) ──
  async fetchSystemShop() {
    const playerId = GameState.player.id;
    try {
      const res = await fetch(`/api/market/system-shop?playerId=${playerId}`);
      if (!res.ok) throw new Error('Offline');
      const data = await res.json();
      this.systemShopData = data;
      this.renderSystemShop();
    } catch (err) {
      // Standalone / Google Sites Mode: kalkulasi rotasi 20 menit mandiri
      this.loadStandaloneSystemShop();
    }
  },

  loadStandaloneSystemShop() {
    const SYSTEM_INTERVAL = 20 * 60 * 1000;
    const now = Date.now();
    const cycleId = Math.floor(now / SYSTEM_INTERVAL);
    const nextResetAt = (cycleId + 1) * SYSTEM_INTERVAL;
    const remainingMs = Math.max(0, nextResetAt - now);

    let seed = (cycleId * 9301 + 49297) % 233280;
    function rnd() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    const pool = (window.ITEM_TEMPLATES && window.ITEM_TEMPLATES.length)
      ? window.ITEM_TEMPLATES
      : (this.rules ? Object.keys(this.rules.priceLimits) : []);

    const raritiesMap = window.RARITIES || {
      common:    { multiplier: 1.0,  baseNpcSell: 15 },
      uncommon:  { multiplier: 2.0,  baseNpcSell: 60 },
      rare:      { multiplier: 6.0,  baseNpcSell: 350 },
      epic:      { multiplier: 30.0, baseNpcSell: 2200 },
      legendary: { multiplier: 90.0, baseNpcSell: 10000 }
    };

    const slotRarities = [
      rnd() < 0.6 ? 'common' : 'uncommon',
      'uncommon',
      rnd() < 0.6 ? 'rare' : 'uncommon',
      rnd() < 0.5 ? 'rare' : 'epic',
      rnd() < 0.12 ? 'legendary' : 'epic'
    ];

    let boughtIds = [];
    try {
      boughtIds = JSON.parse(localStorage.getItem('idle_sys_bought_' + cycleId) || '[]');
    } catch (e) { boughtIds = []; }

    const items = [];
    for (let i = 0; i < 5; i++) {
      const targetRarity = slotRarities[i];
      let eligible = pool.filter(t => {
        if (targetRarity === 'legendary') return !!t.legendaryEffect;
        return !t.legendaryEffect;
      });
      if (!eligible.length) eligible = pool;

      const chosenIdx = Math.floor(rnd() * eligible.length);
      const tmpl = eligible[chosenIdx] || pool[0];
      const rarData = raritiesMap[targetRarity] || raritiesMap.common;

      let finalStatVal = (tmpl.baseVal || 5) * (rarData.multiplier || 1);
      if (tmpl.stat === 'atkSpeed') {
        finalStatVal = Math.round(finalStatVal * 100) / 100;
      } else {
        finalStatVal = Math.round(finalStatVal);
      }

      let price = Math.floor((rarData.baseNpcSell || 50) * (1.3 + rnd() * 0.4));
      if (targetRarity === 'legendary') price = Math.floor(18000 + rnd() * 12000);

      const itemId = `sys_${cycleId}_slot_${i}_${tmpl.id}`;
      items.push({
        id: itemId,
        templateId: tmpl.id,
        name: tmpl.name,
        slot: tmpl.slot,
        stat: tmpl.stat,
        statVal: finalStatVal,
        unit: tmpl.unit || '',
        desc: tmpl.desc || '',
        icon: tmpl.icon || '🎁',
        rarity: targetRarity,
        price: price,
        npcSellPrice: rarData.baseNpcSell,
        legendaryEffect: tmpl.legendaryEffect,
        legendaryVfx: tmpl.legendaryVfx,
        legendaryDesc: tmpl.legendaryDesc,
        isSoldOut: boughtIds.includes(itemId)
      });
    }

    this.systemShopData = {
      cycleId,
      nextResetAt,
      remainingMs,
      items
    };

    this.renderSystemShop();
  },

  renderSystemShop() {
    const container = document.getElementById('system-shop-container');
    if (!container) return;

    const items = (this.systemShopData && this.systemShopData.items) || [];
    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state">Toko Sistem sedang menyiapkan barang baru...</div>`;
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const isSoldOut = !!item.isSoldOut;
      const canAfford = GameState.player.gold >= item.price;
      const itemIcon = (window.getItemIcon ? window.getItemIcon(item) : (item.icon || '🎁'));

      const card = document.createElement('div');
      card.className = `market-item-tile rarity-${item.rarity} ${isSoldOut ? 'is-sold-out' : 'is-ready'}`;
      card.dataset.sysItemId = item.id;

      let actionHtml = '';
      if (isSoldOut) {
        actionHtml = `<button class="btn-buy-tile" disabled style="background:#334155;border-color:#475569;color:#94a3b8;cursor:not-allowed;">✅ Habis</button>`;
      } else {
        const disabledAttr = !canAfford ? 'disabled' : '';
        const btnText = canAfford ? 'Beli' : 'Gold Kurang';
        actionHtml = `
          <button class="btn-buy-tile" ${disabledAttr} onclick="MarketEngine.purchaseSystemShopItem('${item.id}')">
            🛒 ${btnText}
          </button>
        `;
      }

      card.innerHTML = `
        <div class="tile-top">
          <span class="tile-icon">${itemIcon}</span>
          <span class="tile-rarity bg-rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
        </div>
        <div class="tile-mid">
          <div class="tile-badge-system">🏛️ Toko Sistem</div>
          <div class="tile-name rarity-${item.rarity}" title="${item.name}">${item.name}</div>
          <div class="tile-stat">+${item.statVal}${item.unit || ''} ${item.desc || ''}</div>
        </div>
        <div class="tile-bottom">
          <div class="tile-price">💰 ${item.price.toLocaleString()} G</div>
          ${actionHtml}
        </div>
      `;

      container.appendChild(card);
    });
  },

  async purchaseSystemShopItem(itemId) {
    if (!this.systemShopData || !this.systemShopData.items) return;
    const target = this.systemShopData.items.find(i => i.id === itemId);
    if (!target) return;

    if (target.isSoldOut) {
      GameEngine.showToast('Item ini sudah habis terjual pada rotasi ini.', 'info');
      return;
    }

    if (GameState.player.inventory.length >= 24) {
      GameEngine.showToast('Inventory penuh! Kosongkan slot terlebih dahulu.', 'warn');
      return;
    }

    if (GameState.player.gold < target.price) {
      GameEngine.showToast('Gold Anda tidak cukup untuk membeli item ini!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/market/system-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: GameState.player.id,
          itemId: target.id,
          cycleId: this.systemShopData.cycleId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        GameEngine.showToast(data.error || 'Pembelian gagal.', 'error');
        return;
      }

      GameState.player.gold = data.remainingGold;
      GameState.player.inventory.push(data.item);

      target.isSoldOut = true;
      GameEngine.showToast(`🎉 Sukses membeli [${target.name}] dari Toko Sistem!`, 'success');
      GameEngine.logCombat(`🏛️ Anda membeli <b class="rarity-${target.rarity}">[${target.name}]</b> dari Toko Sistem seharga ${target.price} Gold.`);

      GameEngine.updateGoldUI();
      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.renderSystemShop();
    } catch (err) {
      // Standalone Fallback
      GameState.player.gold -= target.price;
      const purchasedItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        templateId: target.templateId,
        name: target.name,
        slot: target.slot,
        stat: target.stat,
        statVal: target.statVal,
        unit: target.unit,
        desc: target.desc,
        icon: target.icon,
        rarity: target.rarity,
        npcSellPrice: target.npcSellPrice,
        legendaryEffect: target.legendaryEffect,
        legendaryVfx: target.legendaryVfx,
        legendaryDesc: target.legendaryDesc
      };

      GameState.player.inventory.push(purchasedItem);
      target.isSoldOut = true;

      const cycleId = this.systemShopData.cycleId;
      let boughtIds = [];
      try { boughtIds = JSON.parse(localStorage.getItem('idle_sys_bought_' + cycleId) || '[]'); } catch (e) {}
      boughtIds.push(target.id);
      localStorage.setItem('idle_sys_bought_' + cycleId, JSON.stringify(boughtIds));

      GameEngine.showToast(`🎉 Sukses membeli [${target.name}] dari Toko Sistem!`, 'success');
      GameEngine.logCombat(`🏛️ Anda membeli <b class="rarity-${target.rarity}">[${target.name}]</b> dari Toko Sistem seharga ${target.price} Gold.`);

      GameEngine.updateGoldUI();
      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.renderSystemShop();
    }
  },

  async fetchMySales() {
    const myPlayerId = GameState.player.id;
    try {
      const res = await fetch(`/api/market/my-sales/${myPlayerId}`);
      if (res.ok) {
        this.mySalesData = await res.json();
        this.renderMyShop();
      }
    } catch (err) {
      console.warn('Gagal memuat status toko:', err);
    }
  },

  renderMyShop() {
    const unclaimedDisplay = document.getElementById('unclaimed-gold-display');
    const claimBtn = document.getElementById('btn-claim-sales');
    const myListContainer = document.getElementById('my-listings-list');
    if (!myListContainer) return;

    const myPlayerId = GameState.player.id;
    const now = Date.now();

    const totalEarned = this.mySalesData.totalGoldEarned || 0;
    if (unclaimedDisplay) unclaimedDisplay.innerText = `${totalEarned.toLocaleString()} Gold`;
    if (claimBtn) claimBtn.disabled = totalEarned <= 0;

    const myListings = this.currentListings.filter(l => l.sellerId === myPlayerId && !l.sold);

    if (myListings.length === 0) {
      myListContainer.innerHTML = `<div class="empty-state">Anda tidak memiliki barang yang sedang dipasang di pasar.</div>`;
      return;
    }

    myListContainer.innerHTML = '';
    myListings.forEach(listing => {
      const item = listing.item;
      const remainingMs = Math.max(0, listing.localReleaseAt - now);
      const isPending = remainingMs > 0;

      const itemIcon = (window.getItemIcon ? window.getItemIcon(item) : (item.icon || '🎁'));

      const row = document.createElement('div');
      row.className = 'listing-card';
      row.innerHTML = `
        <div class="listing-left">
          <span class="listing-icon">${itemIcon}</span>
          <div class="listing-details">
            <h4 class="rarity-${item.rarity}">${item.name}</h4>
            <div class="listing-stat">+${item.statVal}${item.unit} ${item.desc}</div>
            <div class="countdown-badge ${isPending ? 'countdown-pending' : 'countdown-ready'}" style="margin-top:4px;">
              ${isPending ? `⏳ Pending: ${this.formatCountdown(remainingMs)}` : '✅ Aktif Siap Dibeli'}
            </div>
          </div>
        </div>
        <div class="listing-right">
          <div class="listing-price">💰 ${listing.price.toLocaleString()} G</div>
          <button class="btn-cancel" onclick="MarketEngine.cancelListing('${listing.listingId}')">❌ Tarik Item</button>
        </div>
      `;
      myListContainer.appendChild(row);
    });
  },

  async purchaseItem(listingId) {
    const listing = this.currentListings.find(l => l.listingId === listingId);
    if (!listing) return;

    if (GameState.player.inventory.length >= 24) {
      GameEngine.showToast('Inventory penuh! Kosongkan slot terlebih dahulu.', 'warn');
      return;
    }

    if (GameState.player.gold < listing.price) {
      GameEngine.showToast('Gold Anda tidak cukup!', 'error');
      return;
    }

    const btn = document.querySelector(`[data-listing-id="${listingId}"] .btn-buy`);
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Memproses...';
    }

    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          buyerId: GameState.player.id,
          buyerName: GameState.player.name,
          buyerGold: GameState.player.gold
        })
      });

      const data = await res.json();

      if (!res.ok) {
        GameEngine.showToast(data.error || 'Pembelian gagal.', 'error');
        this.refreshListings();
        return;
      }

      // Pembelian Atomik Sukses!
      GameState.player.gold -= data.priceDeducted;
      GameState.player.inventory.push(data.item);

      GameEngine.showToast(`🎉 Sukses membeli ${data.item.name}!`, 'success');
      GameEngine.logCombat(`🛒 Anda membeli <b class="rarity-${data.item.rarity}">[${data.item.name}]</b> seharga ${data.priceDeducted} Gold.`);

      GameEngine.updateGoldUI();
      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.refreshListings();
    } catch (err) {
      // Standalone Fallback
      const idx = this.currentListings.findIndex(l => l.listingId === listingId);
      if (idx !== -1) {
        const target = this.currentListings[idx];
        GameState.player.gold -= target.price;
        GameState.player.inventory.push(target.item);
        this.currentListings.splice(idx, 1);
        localStorage.setItem('idle_standalone_market', JSON.stringify(this.currentListings));

        GameEngine.showToast(`🎉 Sukses membeli ${target.item.name}!`, 'success');
        GameEngine.logCombat(`🛒 Anda membeli <b class="rarity-${target.item.rarity}">[${target.item.name}]</b> seharga ${target.price} Gold.`);

        GameEngine.updateGoldUI();
        GameEngine.renderInventory();
        GameEngine.saveGame();
        this.renderListings();
      } else {
        GameEngine.showToast('Item sudah tidak tersedia di bursa.', 'error');
      }
    }
  },

  async claimSalesGold() {
    try {
      const res = await fetch('/api/market/claim-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: GameState.player.id })
      });

      const data = await res.json();
      if (res.ok && data.claimedGold > 0) {
        GameState.player.gold += data.claimedGold;
        GameEngine.showToast(`💰 Berhasil klaim +${data.claimedGold.toLocaleString()} Gold hasil penjualan!`, 'success');
        GameEngine.logCombat(`💰 Anda mencairkan hasil penjualan pasar sebesar <b>+${data.claimedGold} Gold</b>.`);
        GameEngine.updateGoldUI();
        GameEngine.saveGame();
        this.fetchMySales();
      }
    } catch (err) {
      // Standalone Fallback
      const unclaim = parseInt(localStorage.getItem('idle_standalone_unclaimed_gold') || '0', 10);
      if (unclaim > 0) {
        GameState.player.gold += unclaim;
        localStorage.setItem('idle_standalone_unclaimed_gold', '0');
        this.mySalesData.totalGoldEarned = 0;
        GameEngine.showToast(`💰 Berhasil klaim +${unclaim.toLocaleString()} Gold hasil penjualan!`, 'success');
        GameEngine.logCombat(`💰 Anda mencairkan hasil penjualan pasar sebesar <b>+${unclaim} Gold</b>.`);
        GameEngine.updateGoldUI();
        GameEngine.saveGame();
        this.renderMyShop();
      } else {
        GameEngine.showToast('Belum ada gold hasil penjualan yang dapat diklaim.', 'info');
      }
    }
  },

  async cancelListing(listingId) {
    if (GameState.player.inventory.length >= 24) {
      GameEngine.showToast('Inventory penuh! Tidak bisa menarik item.', 'warn');
      return;
    }

    try {
      const res = await fetch('/api/market/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, sellerId: GameState.player.id })
      });

      const data = await res.json();
      if (!res.ok) {
        GameEngine.showToast(data.error || 'Gagal menarik item.', 'error');
        this.refreshListings();
        return;
      }

      GameState.player.inventory.push(data.item);
      GameEngine.showToast(data.message, 'success');
      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.refreshListings();
    } catch (err) {
      // Standalone Fallback
      let standListings = [];
      try { standListings = JSON.parse(localStorage.getItem('idle_standalone_market') || '[]'); } catch (e) {}
      const fIdx = standListings.findIndex(l => l.listingId === listingId && l.sellerId === GameState.player.id);
      if (fIdx !== -1) {
        const item = standListings[fIdx].item;
        standListings.splice(fIdx, 1);
        localStorage.setItem('idle_standalone_market', JSON.stringify(standListings));
        GameState.player.inventory.push(item);
        GameEngine.showToast('Item berhasil ditarik kembali ke tas.', 'success');
        GameEngine.renderInventory();
        GameEngine.saveGame();
        this.loadStandaloneMarket();
      } else {
        GameEngine.showToast('Gagal membatalkan listing.', 'error');
      }
    }
  },

  getPendingMinutes(rarity) {
    const r = (rarity || '').toLowerCase();
    if (r === 'legendary') return 20;
    if (r === 'epic') return 10;
    return 5;
  },

  openListingModal(item, inventoryIndex) {
    this.activeListingTarget = { item, inventoryIndex };

    const modal = document.getElementById('modal-market-listing');
    const body = document.getElementById('modal-market-body');
    const rarity = item.rarity.toLowerCase();
    const pendingMinutes = this.getPendingMinutes(rarity);
    const itemIcon = (window.getItemIcon ? window.getItemIcon(item) : (item.icon || '🎁'));

    const limits = (this.rules && this.rules.priceLimits)
      ? this.rules.priceLimits[rarity]
      : { min: 10, max: 100000, label: 'Sesuai Rarity' };

    const defaultPrice = (rarity === 'legendary')
      ? 10000
      : Math.floor((limits.min + limits.max) / 2);

    body.innerHTML = `
      <div class="modal-item-preview rarity-${item.rarity}">
        <span style="font-size:2.5rem;">${itemIcon}</span>
        <div>
          <h4 style="font-size:1rem;" class="rarity-${item.rarity}">${item.name}</h4>
          <div style="font-size:0.8rem; color:#38bdf8;">+${item.statVal}${item.unit} ${item.desc}</div>
          <div style="font-size:0.75rem; color:#94a3b8;">Rarity: <b>${item.rarity.toUpperCase()}</b> • Pending: <b>${pendingMinutes} Menit</b></div>
        </div>
      </div>

      <div class="modal-form-group">
        <label for="input-market-price"><b>Tentukan Harga Jual (Gold):</b></label>
        <input type="number" id="input-market-price" class="form-input" value="${defaultPrice}" min="${limits.min}" max="${limits.max}">
      </div>

      <div class="modal-rules-notice">
        <b>📜 Aturan Marketplace:</b><br>
        • Batasan Harga: <b>${limits.label}</b>.<br>
        • Status: <b>Pending Release ${pendingMinutes} menit</b> sebelum dapat dibeli.<br>
        • Aturan Waktu: &lt;Epic: <b>5 mnt</b>, Epic: <b>10 mnt</b>, Legendary: <b>20 mnt</b>.<br>
        • Pembelian instan menggunakan sistem FCFS & Atomic Mutex Locking.
      </div>
    `;

    modal.classList.add('active');
  },

  closeListingModal() {
    const modal = document.getElementById('modal-market-listing');
    if (modal) modal.classList.remove('active');
    this.activeListingTarget = null;
  },

  async submitListing() {
    if (!this.activeListingTarget) return;

    const { item, inventoryIndex } = this.activeListingTarget;
    const priceInput = document.getElementById('input-market-price');
    const price = parseInt(priceInput.value, 10);

    if (isNaN(price) || price <= 0) {
      GameEngine.showToast('Masukkan nominal harga yang valid!', 'error');
      return;
    }

    const rarity = item.rarity.toLowerCase();
    const limits = this.rules && this.rules.priceLimits && this.rules.priceLimits[rarity];

    if (limits) {
      if (price < limits.min || price > limits.max) {
        GameEngine.showToast(`Harga harus antara ${limits.min} dan ${limits.max} Gold!`, 'error');
        return;
      }
    }

    try {
      const res = await fetch('/api/market/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: GameState.player.id,
          sellerName: GameState.player.name,
          item: item,
          price: price
        })
      });

      const data = await res.json();
      if (!res.ok) {
        GameEngine.showToast(data.error || 'Gagal memasang item.', 'error');
        return;
      }

      GameState.player.inventory.splice(inventoryIndex, 1);
      this.closeListingModal();

      const pendingMinutes = this.getPendingMinutes(item.rarity);
      GameEngine.showToast(`Item dipasang di bursa seharga ${price} Gold (Pending ${pendingMinutes} mnt).`, 'success');
      GameEngine.logCombat(`🏛️ Memasang <b class="rarity-${item.rarity}">[${item.name}]</b> ke marketplace seharga ${price} Gold (Pending ${pendingMinutes} mnt).`);

      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.refreshListings();
      if (window.switchPanelView) {
        window.switchPanelView('shop');
      }
    } catch (err) {
      // Standalone Fallback
      const durationMs = this.getPendingMinutes(item.rarity) * 60 * 1000;
      const newListing = {
        listingId: `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sellerId: GameState.player.id,
        sellerName: GameState.player.name,
        price: price,
        releaseAt: Date.now() + durationMs,
        localReleaseAt: Date.now() + durationMs,
        item: item
      };

      GameState.player.inventory.splice(inventoryIndex, 1);
      this.closeListingModal();

      let standListings = [];
      try { standListings = JSON.parse(localStorage.getItem('idle_standalone_market') || '[]'); } catch (e) {}
      standListings.push(newListing);
      localStorage.setItem('idle_standalone_market', JSON.stringify(standListings));

      const pendingMinutes = this.getPendingMinutes(item.rarity);
      GameEngine.showToast(`Item dipasang di bursa seharga ${price} Gold (Pending ${pendingMinutes} mnt).`, 'success');
      GameEngine.logCombat(`🏛️ Memasang <b class="rarity-${item.rarity}">[${item.name}]</b> ke marketplace seharga ${price} Gold (Pending ${pendingMinutes} mnt).`);

      GameEngine.renderInventory();
      GameEngine.saveGame();
      this.loadStandaloneMarket();
      if (window.switchPanelView) {
        window.switchPanelView('shop');
      }
    }
  },

  formatCountdown(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  startCountdownTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    this.tickerInterval = setInterval(() => {
      const now = Date.now();
      let needsReRender = false;

      this.currentListings.forEach(l => {
        const prevPending = (l.localReleaseAt - (now - 1000)) > 0;
        const currPending = (l.localReleaseAt - now) > 0;
        if (prevPending && !currPending) {
          needsReRender = true;
        }
      });

      if (needsReRender) {
        this.renderListings();
        this.renderMyShop();
      } else {
        const cards = document.querySelectorAll('.listing-card.is-pending');
        cards.forEach(card => {
          const id = card.dataset.listingId;
          const itm = this.currentListings.find(l => l.listingId === id);
          if (itm) {
            const rem = Math.max(0, itm.localReleaseAt - now);
            const badge = card.querySelector('.countdown-badge');
            if (badge) {
              badge.innerHTML = `⏳ Buka: ${this.formatCountdown(rem)}`;
            }
          }
        });

        const tiles = document.querySelectorAll('.market-item-tile.is-pending');
        tiles.forEach(tile => {
          const id = tile.dataset.listingId;
          const itm = this.currentListings.find(l => l.listingId === id);
          if (itm) {
            const rem = Math.max(0, itm.localReleaseAt - now);
            const badge = tile.querySelector('.tile-badge-pending');
            if (badge) {
              badge.innerHTML = `⏳ ${this.formatCountdown(rem)}`;
            }
          }
        });
      }

      // Update Countdown Toko Sistem (Reset per 20 menit)
      if (this.systemShopData && this.systemShopData.nextResetAt) {
        const sysRem = Math.max(0, this.systemShopData.nextResetAt - now);
        const cdFormatted = this.formatCountdown(sysRem);

        const timerBadge = document.getElementById('system-shop-timer');
        const timerBanner = document.getElementById('sys-shop-countdown-display');
        if (timerBadge) timerBadge.innerText = `⏳ ${cdFormatted}`;
        if (timerBanner) timerBanner.innerText = cdFormatted;

        if (sysRem <= 0) {
          // 20 Menit habis! Otomatis refresh 5 item baru dari Toko Sistem
          this.fetchSystemShop();
        }
      }
    }, 1000);
  },

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);

    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');

    if (tabId === 'tab-myshop') {
      this.fetchMySales();
    }
  }
};

window.MarketEngine = MarketEngine;

