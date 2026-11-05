/**
 * IDLE EXCHANGE - GameEngine.js
 * Logika Loop, Combat Data, Wave System, Corpse Tracking, Drop System & Auras
 */

// 2. HELPER NAMA & IKON SLOT/PART ITEM (Bahasa Indonesia yang Jelas)
const SLOT_NAMES = {
  weapon: { name: 'Senjata', icon: '🗡️' },
  armor: { name: 'Baju Zirah', icon: '🥋' },
  shield: { name: 'Perisai', icon: '🛡️' },
  boots: { name: 'Sepatu', icon: '👢' },
  accessory: { name: 'Aksesori', icon: '💍' },
  special: { name: 'Item Khusus', icon: '🔮' }
};

function getItemSlotInfo(item) {
  if (!item || !item.slot) return { name: 'Item', icon: '📦' };
  const slotKey = String(item.slot).toLowerCase();
  return SLOT_NAMES[slotKey] || { name: item.slot, icon: '📦' };
}
const ITEM_TEMPLATES = [
  // ════════════════════════════════════════════════════════════
  // ── COMMON WEAPONS (10 items) ──
  // ════════════════════════════════════════════════════════════
  { id: 'wooden_stick',      name: 'Tongkat Kayu Lapuk',       slot: 'weapon',    stat: 'atk',             baseVal: 2,    unit: '',  icon: '\u{1FAB5}', desc: '+ATK Flat' },
  { id: 'wooden_spear',      name: 'Tombak Kayu',               slot: 'weapon',    stat: 'atk',             baseVal: 4,    unit: '',  icon: '\u{1F3CF}', desc: '+ATK Flat' },
  { id: 'rusty_dagger',      name: 'Pisau Berkarat',            slot: 'weapon',    stat: 'atk',             baseVal: 5,    unit: '',  icon: '\u{1F5E1}', desc: '+ATK Flat' },
  { id: 'stone_axe',         name: 'Kapak Batu',                slot: 'weapon',    stat: 'atk',             baseVal: 5,    unit: '',  icon: '\u{1FAA8}', desc: '+ATK Flat' },
  { id: 'bamboo_spear',      name: 'Tombak Bambu Runcing',      slot: 'weapon',    stat: 'atk',             baseVal: 3,    unit: '',  icon: '\u{1F38D}', desc: '+ATK Flat' },
  { id: 'iron_dagger',       name: 'Belati Besi Tumpul',        slot: 'weapon',    stat: 'atk',             baseVal: 4,    unit: '',  icon: '\u{1F5E1}', desc: '+ATK Flat' },
  { id: 'mining_pick',       name: 'Beliung Penambang',         slot: 'weapon',    stat: 'atk',             baseVal: 4,    unit: '',  icon: '\u{26CF}',  desc: '+ATK Flat' },
  { id: 'wooden_club',       name: 'Gada Kayu Berat',           slot: 'weapon',    stat: 'atk',             baseVal: 5,    unit: '',  icon: '\u{1F94F}', desc: '+ATK Flat' },
  { id: 'hunting_slingshot', name: 'Ketapel Berburu',           slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.08, unit: 'x', icon: '\u{1FA80}', desc: '+Atk Speed' },
  { id: 'old_machete',       name: 'Golok Tua Berkarat',        slot: 'weapon',    stat: 'atk',             baseVal: 5,    unit: '',  icon: '\u{1F52A}', desc: '+ATK Flat' },

  // ── COMMON ARMOR & SUPPORT (12 items) ──
  { id: 'tattered_cloth',    name: 'Kain Kumal',                slot: 'armor',     stat: 'damageReduction', baseVal: 1,    unit: '%', icon: '\u{1F9F5}', desc: '+Dmg Reduction' },
  { id: 'straw_hat',         name: 'Topi Jerami Petani',        slot: 'armor',     stat: 'dodge',           baseVal: 2,    unit: '%', icon: '\u{1F9E2}', desc: '+Dodge Chance' },
  { id: 'leather_vest',      name: 'Rompi Kulit Domba',         slot: 'armor',     stat: 'damageReduction', baseVal: 1,    unit: '%', icon: '\u{1F9BA}', desc: '+Dmg Reduction' },
  { id: 'linen_shirt',       name: 'Kemeja Linen Lusuh',        slot: 'armor',     stat: 'maxHp',           baseVal: 15,   unit: '',  icon: '\u{1F455}', desc: '+Max HP' },
  { id: 'worn_sandals',      name: 'Sandal Usang',              slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.05, unit: 'x', icon: '\u{1F97F}', desc: '+Atk Speed' },
  { id: 'straw_shoes',       name: 'Sepatu Anyaman Jerami',     slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.06, unit: 'x', icon: '\u{1F45E}', desc: '+Atk Speed' },
  { id: 'leather_slippers',  name: 'Selop Kulit Usang',         slot: 'boots',     stat: 'dodge',           baseVal: 2,    unit: '%', icon: '\u{1F97E}', desc: '+Dodge Chance' },
  { id: 'wooden_buckler',    name: 'Tameng Kayu',               slot: 'shield',    stat: 'maxHp',           baseVal: 12,   unit: '',  icon: '\u{1F6E1}', desc: '+Max HP' },
  { id: 'pot_lid',           name: 'Tutup Panci Baja',          slot: 'shield',    stat: 'maxHp',           baseVal: 10,   unit: '',  icon: '\u{1F373}', desc: '+Max HP' },
  { id: 'bark_shield',       name: 'Perisai Kulit Kayu',        slot: 'shield',    stat: 'damageReduction', baseVal: 1,    unit: '%', icon: '\u{1FAB5}', desc: '+Dmg Reduction' },
  { id: 'simple_charm',      name: 'Jimat Sederhana',           slot: 'accessory', stat: 'dropRateBonus',   baseVal: 3,    unit: '%', icon: '\u{1F9FF}', desc: '+Drop Rate' },
  { id: 'bead_necklace',     name: 'Kalung Manik Hutan',        slot: 'accessory', stat: 'dropRateBonus',   baseVal: 2,    unit: '%', icon: '\u{1F4FF}', desc: '+Drop Rate' },
  { id: 'copper_bangle',     name: 'Gelang Tembaga',            slot: 'accessory', stat: 'goldBonus',       baseVal: 4,    unit: '%', icon: '\u{1FA99}', desc: '+Gold Bonus' },
  { id: 'crude_ring',        name: 'Cincin Besi Kasar',         slot: 'accessory', stat: 'atk',             baseVal: 2,    unit: '',  icon: '\u{1F48D}', desc: '+ATK Flat' },
  { id: 'coin_purse',        name: 'Dompet Koin',               slot: 'special',   stat: 'goldBonus',       baseVal: 6,    unit: '%', icon: '\u{1F4B0}', desc: '+Gold Bonus' },
  { id: 'rabbit_paw',        name: 'Kaki Kelinci Keberuntungan',slot: 'special',   stat: 'dropRateBonus',   baseVal: 4,    unit: '%', icon: '\u{1F430}', desc: '+Drop Rate' },
  { id: 'clay_piggybank',    name: 'Celengan Tanah Liat',       slot: 'special',   stat: 'goldBonus',       baseVal: 5,    unit: '%', icon: '\u{1F437}', desc: '+Gold Bonus' },

  // ════════════════════════════════════════════════════════════
  // ── UNCOMMON WEAPONS (7 items) ──
  // ════════════════════════════════════════════════════════════
  { id: 'iron_sword',        name: 'Pedang Besi',               slot: 'weapon',    stat: 'atk',             baseVal: 6,    unit: '',  icon: '\u{2694}',  desc: '+ATK Flat' },
  { id: 'wooden_bow',        name: 'Busur Kayu',                slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.20, unit: 'x', icon: '\u{1F3F9}', desc: '+Atk Speed' },
  { id: 'sickle_steel',      name: 'Celurit Baja',              slot: 'weapon',    stat: 'critRate',        baseVal: 3,    unit: '%', icon: '\u{1F4A2}', desc: '+Crit Rate' },
  { id: 'steel_gladius',     name: 'Pedang Gladius Baja',       slot: 'weapon',    stat: 'atk',             baseVal: 8,    unit: '',  icon: '\u{1F5E1}', desc: '+ATK Flat' },
  { id: 'hunting_crossbow',  name: 'Panah Silang Pemburu',      slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.18, unit: 'x', icon: '\u{1F3AF}', desc: '+Atk Speed' },
  { id: 'spiked_mace',       name: 'Gada Berduri',              slot: 'weapon',    stat: 'critDmg',         baseVal: 15,   unit: '%', icon: '\u{1F528}', desc: '+Crit Damage' },
  { id: 'battle_spear',      name: 'Tombak Kavaleri',           slot: 'weapon',    stat: 'atk',             baseVal: 9,    unit: '',  icon: '\u{1F531}', desc: '+ATK Flat' },

  // ── UNCOMMON ARMOR & SUPPORT (12 items) ──
  { id: 'shadow_cloak',      name: 'Jubah Bayangan',            slot: 'armor',     stat: 'dodge',           baseVal: 4,    unit: '%', icon: '\u{1F9E5}', desc: '+Dodge Chance' },
  { id: 'titan_belt',        name: 'Sabuk Titan',               slot: 'armor',     stat: 'damageReduction', baseVal: 3,    unit: '%', icon: '\u{1F97A}', desc: '+Dmg Reduction' },
  { id: 'chainmail_vest',    name: 'Rompi Rantai Besi',         slot: 'armor',     stat: 'damageReduction', baseVal: 3,    unit: '%', icon: '\u{1F9BE}', desc: '+Dmg Reduction' },
  { id: 'ranger_tunic',      name: 'Tunika Penjaga Hutan',      slot: 'armor',     stat: 'dodge',           baseVal: 5,    unit: '%', icon: '\u{1F33F}', desc: '+Dodge Chance' },
  { id: 'padded_gambeson',   name: 'Gambeson Berlapis',         slot: 'armor',     stat: 'maxHp',           baseVal: 30,   unit: '',  icon: '\u{1F456}', desc: '+Max HP' },
  { id: 'hunter_boots',      name: 'Sepatu Laras Pemburu',      slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.12, unit: 'x', icon: '\u{1F97E}', desc: '+Atk Speed' },
  { id: 'wolf_pelt_boots',   name: 'Sepatu Kulit Serigala',     slot: 'boots',     stat: 'dodge',           baseVal: 4,    unit: '%', icon: '\u{1F43A}', desc: '+Dodge Chance' },
  { id: 'iron_kite_shield',  name: 'Perisai Layang Besi',       slot: 'shield',    stat: 'maxHp',           baseVal: 25,   unit: '',  icon: '\u{1F6E1}', desc: '+Max HP' },
  { id: 'spiked_buckler',    name: 'Tameng Bundar Berduri',     slot: 'shield',    stat: 'atk',             baseVal: 4,    unit: '',  icon: '\u{2694}',  desc: '+ATK Flat' },
  { id: 'bronze_ring',       name: 'Cincin Perunggu',           slot: 'accessory', stat: 'critRate',        baseVal: 4,    unit: '%', icon: '\u{1F48D}', desc: '+Crit Rate' },
  { id: 'leather_band',      name: 'Gelang Kulit',              slot: 'accessory', stat: 'lifesteal',       baseVal: 4,    unit: '%', icon: '\u{1F9FF}', desc: '+Lifesteal' },
  { id: 'silver_ring',       name: 'Cincin Perak Tempaan',      slot: 'accessory', stat: 'critRate',        baseVal: 4,    unit: '%', icon: '\u{1F48E}', desc: '+Crit Rate' },
  { id: 'wolf_tooth_amulet', name: 'Amulet Gigi Serigala',      slot: 'accessory', stat: 'atk',             baseVal: 5,    unit: '',  icon: '\u{1F9B7}', desc: '+ATK Flat' },
  { id: 'vitality_pendant',  name: 'Liontin Vitalitas',         slot: 'accessory', stat: 'maxHp',           baseVal: 25,   unit: '',  icon: '\u{1F49A}', desc: '+Max HP' },
  { id: 'fortune_dice',      name: 'Dadu Keberuntungan',        slot: 'special',   stat: 'dropRateBonus',   baseVal: 6,    unit: '%', icon: '\u{1F3B2}', desc: '+Drop Rate' },

  // ════════════════════════════════════════════════════════════
  // ── RARE WEAPONS (6 items) ──
  // ════════════════════════════════════════════════════════════
  { id: 'berserker_axe',     name: 'Kapak Mengamuk',            slot: 'weapon',    stat: 'critDmg',         baseVal: 20,   unit: '%', icon: '\u{1FA93}', desc: '+Crit Damage' },
  { id: 'warrior_sword',     name: 'Pedang Prajurit',           slot: 'weapon',    stat: 'atk',             baseVal: 14,   unit: '',  icon: '\u{1F5E1}', desc: '+ATK Flat' },
  { id: 'ice_spear',         name: 'Tombak Es',                 slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.25, unit: 'x', icon: '\u{2744}',  desc: '+Atk Speed' },
  { id: 'knight_claymore',   name: 'Pedang Besar Ksatria',      slot: 'weapon',    stat: 'atk',             baseVal: 16,   unit: '',  icon: '\u{2694}',  desc: '+ATK Flat' },
  { id: 'storm_cutlass',     name: 'Pedang Badai Samudra',      slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.22, unit: 'x', icon: '\u{1F30A}', desc: '+Atk Speed' },
  { id: 'war_hammer',        name: 'Palu Perang Penghancur',    slot: 'weapon',    stat: 'critDmg',         baseVal: 28,   unit: '%', icon: '\u{1F528}', desc: '+Crit Damage' },

  // ── RARE ARMOR & SUPPORT (10 items) ──
  { id: 'giant_shield',      name: 'Perisai Raksasa',           slot: 'shield',    stat: 'maxHp',           baseVal: 35,   unit: '',  icon: '\u{1F6E1}', desc: '+Max HP Flat' },
  { id: 'tower_shield',      name: 'Perisai Menara Kokoh',      slot: 'shield',    stat: 'maxHp',           baseVal: 55,   unit: '',  icon: '\u{1F3F0}', desc: '+Max HP Flat' },
  { id: 'mirror_shield',     name: 'Perisai Cermin Pemantul',   slot: 'shield',    stat: 'damageReduction', baseVal: 4,    unit: '%', icon: '\u{1FA9E}', desc: '+Dmg Reduction' },
  { id: 'steel_plate_armor', name: 'Zirah Lempeng Baja',        slot: 'armor',     stat: 'damageReduction', baseVal: 5,    unit: '%', icon: '\u{1F6E1}', desc: '+Dmg Reduction' },
  { id: 'assassin_garb',     name: 'Busana Pembunuh Bayangan',  slot: 'armor',     stat: 'dodge',           baseVal: 8,    unit: '%', icon: '\u{1F977}', desc: '+Dodge Chance' },
  { id: 'agile_boots',       name: 'Sepatu Gesit',              slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.15, unit: 'x', icon: '\u{1F462}', desc: '+Atk Speed' },
  { id: 'swift_stride_boots',name: 'Sepatu Langkah Kilat',      slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.20, unit: 'x', icon: '\u{1F3C3}', desc: '+Atk Speed' },
  { id: 'blood_amulet',      name: 'Amulet Darah',              slot: 'accessory', stat: 'lifesteal',       baseVal: 6,    unit: '%', icon: '\u{1F9E3}', desc: '+Lifesteal' },
  { id: 'ruby_ring',         name: 'Cincin Permata Merah',      slot: 'accessory', stat: 'critRate',        baseVal: 6,    unit: '%', icon: '\u{1F48D}', desc: '+Crit Rate' },
  { id: 'vampire_fang',      name: 'Taring Vampir Kuno',        slot: 'accessory', stat: 'lifesteal',       baseVal: 7,    unit: '%', icon: '\u{1F9DB}', desc: '+Lifesteal' },
  { id: 'merchant_pouch',    name: 'Kantong Saudagar',          slot: 'special',   stat: 'goldBonus',       baseVal: 15,   unit: '%', icon: '\u{1F45B}', desc: '+Gold Multiplier' },
  { id: 'lucky_clover',      name: 'Semanggi Keberuntungan',    slot: 'special',   stat: 'dropRateBonus',   baseVal: 8,    unit: '%', icon: '\u{1F340}', desc: '+Drop Rate Bonus' },
  { id: 'golden_horseshoe',  name: 'Ladam Kuda Emas',           slot: 'special',   stat: 'goldBonus',       baseVal: 18,   unit: '%', icon: '\u{1F9F2}', desc: '+Gold Multiplier' },

  // ════════════════════════════════════════════════════════════
  // ── EPIC WEAPONS & ARMOR (10 items) ──
  // ════════════════════════════════════════════════════════════
  { id: 'shadow_sword',      name: 'Pedang Bayangan',           slot: 'weapon',    stat: 'atk',             baseVal: 22,   unit: '',  icon: '\u{1F5E1}', desc: '+ATK + Shadow' },
  { id: 'fire_bow',          name: 'Busur Api Neraka',          slot: 'weapon',    stat: 'critDmg',         baseVal: 35,   unit: '%', icon: '\u{1F525}', desc: '+CritDmg Inferno' },
  { id: 'frostbite_blade',   name: 'Pedang Gigitan Beku',       slot: 'weapon',    stat: 'atk',             baseVal: 24,   unit: '',  icon: '\u{2744}',  desc: '+ATK Frostbite' },
  { id: 'void_bow',          name: 'Busur Hampa Dimensi',       slot: 'weapon',    stat: 'critDmg',         baseVal: 40,   unit: '%', icon: '\u{1F52E}', desc: '+CritDmg Void' },
  { id: 'dark_robe',         name: 'Jubah Kegelapan',           slot: 'armor',     stat: 'damageReduction', baseVal: 8,    unit: '%', icon: '\u{1F32A}', desc: '+Dmg Reduction' },
  { id: 'dragon_scale_mail', name: 'Zirah Sisik Naga Purba',    slot: 'armor',     stat: 'damageReduction', baseVal: 9,    unit: '%', icon: '\u{1F409}', desc: '+Dmg Reduction' },
  { id: 'aegis_of_valor',    name: 'Tameng Keberanian Suci',    slot: 'shield',    stat: 'maxHp',           baseVal: 80,   unit: '',  icon: '\u{2728}',  desc: '+Max HP Flat' },
  { id: 'wind_walker_boots', name: 'Sepatu Pejalan Angin',      slot: 'boots',     stat: 'dodge',           baseVal: 12,   unit: '%', icon: '\u{1F45F}', desc: '+Dodge Chance' },
  { id: 'dragon_ring',       name: 'Cincin Naga',               slot: 'accessory', stat: 'critRate',        baseVal: 5,    unit: '%', icon: '\u{1F432}', desc: '+Crit Rate' },
  { id: 'amethyst_eye',      name: 'Mata Ametis Mistik',        slot: 'accessory', stat: 'critRate',        baseVal: 8,    unit: '%', icon: '\u{1F52E}', desc: '+Crit Rate' },

  // ════════════════════════════════════════════════════════════
  // ── LEGENDARY (10 Items Lengkap — Efek Spesial & VFX Unik) ──
  // ════════════════════════════════════════════════════════════
  {
    id: 'divine_thunder_sword',
    name: 'Pedang Petir Dewa',
    slot: 'weapon',
    stat: 'atk',
    baseVal: 18,
    unit: '',
    icon: '\u26A1',
    desc: '+ATK + Kilat Berantai',
    legendaryEffect: 'chainLightning',
    legendaryVfx: 'lightning',
    legendaryDesc: '10% peluang: serangan memantul ke musuh (+50% bonus DMG)'
  },
  {
    id: 'soul_robe',
    name: 'Jubah Jiwa Abadi',
    slot: 'armor',
    stat: 'damageReduction',
    baseVal: 5,
    unit: '%',
    icon: '\u{1F47B}',
    desc: '+DR + Perisai Jiwa',
    legendaryEffect: 'soulShield',
    legendaryVfx: 'soulBubble',
    legendaryDesc: 'Setiap wave baru: absorb 1 serangan secara penuh (Perisai Jiwa)'
  },
  {
    id: 'demon_blood_ring',
    name: 'Cincin Darah Iblis',
    slot: 'accessory',
    stat: 'lifesteal',
    baseVal: 8,
    unit: '%',
    icon: '\u{1FA78}',
    desc: '+Lifesteal + Ledakan Darah',
    legendaryEffect: 'vampiricBurst',
    legendaryVfx: 'bloodNova',
    legendaryDesc: 'Tiap 5 musuh tewas: sembuhkan 30% Max HP (Blood Nova meledak)'
  },
  {
    id: 'grand_merchant_sack',
    name: 'Kantong Agung Saudagar',
    slot: 'special',
    stat: 'goldBonus',
    baseVal: 20,
    unit: '%',
    icon: '\u{1F48E}',
    desc: '+Gold x3 + Magnet Koin',
    legendaryEffect: 'goldMagnet',
    legendaryVfx: 'goldCoins',
    legendaryDesc: 'Gold drop x3 lipat. Koin emas mengorbit player.'
  },
  {
    id: 'phoenix_aegis',
    name: 'Tameng Sayap Phoenix',
    slot: 'shield',
    stat: 'maxHp',
    baseVal: 45,
    unit: '',
    icon: '\u{1F525}',
    desc: '+HP + Kebangkitan Phoenix',
    legendaryEffect: 'phoenixRevive',
    legendaryVfx: 'phoenixWings',
    legendaryDesc: 'Saat sekarat (fatal hit): Hidup kembali dengan 50% HP & bakar musuh 20% HP (1x per wave)'
  },
  {
    id: 'frost_emperor_boots',
    name: 'Sepatu Kaisar Es Abadi',
    slot: 'boots',
    stat: 'atkSpeed',
    baseVal: 0.35,
    unit: 'x',
    icon: '\u{2744}',
    desc: '+Speed + Badai Pembeku',
    legendaryEffect: 'absoluteZero',
    legendaryVfx: 'frostBlizzard',
    legendaryDesc: 'Tiap 4 serangan: Bekukan musuh selama 1.2 detik & beri +75% bonus Cold Damage'
  },
  {
    id: 'abyssal_scythe',
    name: 'Sabit Kegelapan Abadi',
    slot: 'weapon',
    stat: 'critDmg',
    baseVal: 40,
    unit: '%',
    icon: '\u{1F5A4}',
    desc: '+CritDmg + Retakan Jurang',
    legendaryEffect: 'soulReaper',
    legendaryVfx: 'abyssalRift',
    legendaryDesc: 'Critical Hit punya 40% peluang membuka Retakan Jurang (+100% True Damage & hisap +10 Gold)'
  },
  {
    id: 'dragons_heart_armor',
    name: 'Zirah Jantung Naga',
    slot: 'armor',
    stat: 'damageReduction',
    baseVal: 6,
    unit: '%',
    icon: '\u{1F409}',
    desc: '+DR + Napas Pembalas Naga',
    legendaryEffect: 'dragonThorns',
    legendaryVfx: 'dragonBreath',
    legendaryDesc: 'Saat terkena serangan: Pantulkan 70% kerusakan kembali ke musuh sebagai semburan api naga'
  },
  {
    id: 'celestial_crown',
    name: 'Mahkota Bintang Astral',
    slot: 'accessory',
    stat: 'critRate',
    baseVal: 10,
    unit: '%',
    icon: '\u{1F451}',
    desc: '+Crit + Hantaman Meteor',
    legendaryEffect: 'meteorStrike',
    legendaryVfx: 'celestialMeteor',
    legendaryDesc: 'Tiap 5 serangan pahlawan: Panggil Meteor Astral raksasa jatuh menabrak musuh (+150% ATK damage)'
  },
  {
    id: 'hourglass_of_infinity',
    name: 'Jam Pasir Keabadian',
    slot: 'special',
    stat: 'dropRateBonus',
    baseVal: 18,
    unit: '%',
    icon: '\u{23F3}',
    desc: '+Drop + Distorsi Waktu',
    legendaryEffect: 'timeWarp',
    legendaryVfx: 'timeMatrix',
    legendaryDesc: '18% peluang saat menyerang memicu Time Warp: Serang 3x berturut-turut seketika'
  }
];

// Lookup map: templateId -> icon (untuk fix icon lama dari save data)
const ITEM_ICON_MAP = {};
ITEM_TEMPLATES.forEach(t => { ITEM_ICON_MAP[t.id] = t.icon; });

/** Ambil icon item secara aman — lookup dari template jika icon save data rusak */
function getItemIcon(item) {
  if (!item) return '❓';
  // Cek apakah icon field valid (emoji biasanya > 1 codepoint atau punya surrogate)
  const raw = item.icon || '';
  if (raw.length >= 1 && raw.codePointAt(0) > 255) return raw; // icon valid
  // Fallback ke lookup map berdasarkan templateId
  return ITEM_ICON_MAP[item.templateId] || ITEM_ICON_MAP[item.id] || '🎁';
}

// 2. RARITY & STAT MULTIPLIERS
// Aturan Kekuatan Item:
// • Common    : 1.0x (Dasar)
// • Uncommon  : 2.0x (2 kali lipat dari Common)
// • Rare      : 6.0x (3 kali lipat dari Uncommon)
// • Epic      : 30.0x (5 kali lipat dari Rare)
// • Legendary : 90.0x (Puncak Legendaris)
const RARITIES = {
  common: { name: 'Common', weight: 60, multiplier: 1.0, baseNpcSell: 15, rank: 1 },
  uncommon: { name: 'Uncommon', weight: 25, multiplier: 2.0, baseNpcSell: 60, rank: 2 },
  rare: { name: 'Rare', weight: 10, multiplier: 6.0, baseNpcSell: 350, rank: 3 },
  epic: { name: 'Epic', weight: 4, multiplier: 30.0, baseNpcSell: 2500, rank: 4 },
  legendary: { name: 'Legendary', weight: 1, multiplier: 90.0, baseNpcSell: 12000, rank: 5 }
};

const EQUIP_SLOTS = ['weapon', 'armor', 'shield', 'boots', 'accessory', 'special'];

// 3. MASTER GAME STATE
const GameState = {
  player: {
    id: localStorage.getItem('idle_player_id') || `hero_${Math.random().toString(36).substr(2, 7)}`,
    name: localStorage.getItem('idle_player_name') || `Hero_${Math.floor(100 + Math.random() * 900)}`,
    gold: 150,
    wave: 1,
    highestWaveReached: 1,
    lastDeathWave: null, // Melacak posisi mayat pahlawan
    currentHp: 100,
    baseStats: {
      maxHp: 100,
      atk: 14,
      atkSpeed: 1.0,
      critRate: 5,
      critDmg: 150,
      lifesteal: 0,
      damageReduction: 0,
      dodge: 0,
      goldBonus: 0,
      dropRateBonus: 0
    },
    stats: {},
    equipped: {
      weapon: null,
      armor: null,
      shield: null,
      boots: null,
      accessory: null,
      special: null
    },
    inventory: []
  },
  enemy: {
    type: 'slime', // 'slime' | 'goblin' | 'ogre'
    name: 'Slime Rawa',
    maxHp: 50,
    currentHp: 50,
    atk: 5
  },
  combat: {
    heroAttackTimer: 0,
    enemyAttackTimer: 0,
    isRespawning: false,
    killCount: 0,
    soulShieldActive: false,
    heroAttackCount: 0,
    phoenixReviveUsed: false,
    enemyFreezeTimer: 0
  }
};

localStorage.setItem('idle_player_id', GameState.player.id);
localStorage.setItem('idle_player_name', GameState.player.name);

const GameEngine = {
  lastTime: performance.now(),

  init() {
    this.loadGame();
    RenderEngine.init('battleCanvas');

    this.recalculatePlayerStats();
    this.updateGoldUI();
    this.renderEquipment();
    this.renderInventory();
    this.updateWaveUI();
    this.spawnEnemy();

    // Event listener tombol cepat
    const btnSellTier = document.getElementById('btn-sell-all-tier');
    const selSellTier = document.getElementById('sell-tier-select');
    if (btnSellTier && selSellTier) {
      btnSellTier.onclick = () => this.sellAllByTier(selSellTier.value);
    }
    const btnSellCommon = document.getElementById('btn-sell-all-common');
    if (btnSellCommon) btnSellCommon.onclick = () => this.sellAllByTier('common');

    const btnCollectAll = document.getElementById('btn-collect-all-loot');
    if (btnCollectAll) btnCollectAll.onclick = () => this.collectAllCanvasLoot();

    // Event listener modal upgrade perlengkapan
    const modalUpgradeClose = document.getElementById('modal-upgrade-close');
    const modalUpgradeCloseBtn = document.getElementById('modal-upgrade-close-btn');
    const modalUpgradeConfirmBtn = document.getElementById('modal-upgrade-confirm-btn');
    if (modalUpgradeClose) modalUpgradeClose.onclick = () => this.closeUpgradeModal();
    if (modalUpgradeCloseBtn) modalUpgradeCloseBtn.onclick = () => this.closeUpgradeModal();
    if (modalUpgradeConfirmBtn) {
      modalUpgradeConfirmBtn.onclick = () => {
        if (this.activeUpgradeSlot) {
          this.executeUpgradeEquippedItem(this.activeUpgradeSlot);
        }
      };
    }

    // Sinkronisasi data awal dengan server cloud
    this.syncWithServer();

    // Jalankan sistem eksekusi background tab agar game terus berjalan saat tab diminimalkan
    this.setupBackgroundExecution();

    // Auto-save ke cloud setiap 15 detik
    setInterval(() => {
      this.saveToServer();
    }, 15000);

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  },

  loop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // 1. Update Logika Pertarungan jika tidak sedang respawn
    if (!GameState.combat.isRespawning) {
      this.updateCombat(dt);
    }

    // 2. Update Render Engine VFX & Canvas
    RenderEngine.update(dt);
    RenderEngine.render(GameState);

    requestAnimationFrame((t) => this.loop(t));
  },

  // 4. SISTEM MUSUH (Slime, Goblin, Ogre) & SPAWN
  spawnEnemy() {
    const wave = GameState.player.wave;
    let type = 'slime';
    let typeName = 'Slime Rawa';

    // Aturan Spawning:
    // - Kelipatan Wave 10: Ogre (Boss)
    // - Kelipatan Wave 5: Goblin (Elite)
    // - Selain itu: 70% Slime, 25% Goblin, 5% Ogre
    if (wave % 10 === 0) {
      type = 'ogre';
      typeName = 'Ogre Raksasa (BOSS)';
    } else if (wave % 5 === 0) {
      type = 'goblin';
      typeName = 'Goblin Warlord (ELITE)';
    } else {
      const roll = Math.random() * 100;
      if (roll < 70) {
        type = 'slime';
        typeName = 'Slime Rawa';
      } else if (roll < 95) {
        type = 'goblin';
        typeName = 'Goblin Scout';
      } else {
        type = 'ogre';
        typeName = 'Ogre Pengembara';
      }
    }

    // Skala HP & ATK dibuat seimbang agar pemain tanpa item Legendary dapat menembus Wave 50
    // Menggunakan kurva pertumbuhan halus (+5.5% HP dan +4.2% ATK per wave)
    const waveFactorHp = Math.pow(1.055, wave - 1);
    const waveFactorAtk = Math.pow(1.042, wave - 1);

    let baseHp = 36;
    let baseAtk = 4;

    if (type === 'goblin') {
      baseHp = 55;
      baseAtk = 6;
    } else if (type === 'ogre') {
      baseHp = 120;
      baseAtk = 10;
    }

    const hp = Math.max(10, Math.floor(baseHp * waveFactorHp));
    const atk = Math.max(1, Math.floor(baseAtk * waveFactorAtk));

    GameState.enemy = {
      type: type,
      name: `${typeName} (Lv.${wave})`,
      maxHp: hp,
      currentHp: hp,
      atk: atk
    };

    // Picu animasi masuk musuh di RenderEngine
    RenderEngine.enemy.entryProgress = 0;
    RenderEngine.enemy.isEntering = true;

    // Legendary resets per wave
    GameState.combat.phoenixReviveUsed = false;
    GameState.combat.enemyFreezeTimer = 0;

    const armorEq = GameState.player.equipped.armor;
    if (armorEq && armorEq.legendaryEffect === 'soulShield') {
      GameState.combat.soulShieldActive = true;
      RenderEngine.triggerLegendaryVfx('soulBubble', RenderEngine.player.baseX, RenderEngine.groundY - 55, true);
    }

    this.logCombat(`Musuh baru mendekat: <b>${GameState.enemy.name}</b>!`);
    this.updateEnemyDOMUI();
  },

  // 5. UPDATE COMBAT (Serangan Player & Musuh)
  updateCombat(dt) {
    const p = GameState.player;
    const enemy = GameState.enemy;

    // Hitung mundur efek beku pada musuh (Absolute Zero)
    if (GameState.combat.enemyFreezeTimer > 0) {
      GameState.combat.enemyFreezeTimer = Math.max(0, GameState.combat.enemyFreezeTimer - dt);
    }

    // A. Player Menyerang Musuh
    GameState.combat.heroAttackTimer += dt;
    const attackInterval = 1 / p.stats.atkSpeed;

    if (GameState.combat.heroAttackTimer >= attackInterval && enemy.currentHp > 0 && !RenderEngine.enemy.isEntering) {
      GameState.combat.heroAttackTimer = 0;
      this.heroAttack();
    }

    // B. Musuh Menyerang Player (Hanya jika musuh tidak sedang membeku)
    if (enemy.currentHp > 0 && !RenderEngine.enemy.isEntering && GameState.combat.enemyFreezeTimer <= 0) {
      GameState.combat.enemyAttackTimer += dt;
      // Ogre serang tiap 2.0s, Slime 1.4s, Goblin 1.2s
      const enemyInterval = enemy.type === 'ogre' ? 2.0 : (enemy.type === 'goblin' ? 1.2 : 1.4);

      if (GameState.combat.enemyAttackTimer >= enemyInterval) {
        GameState.combat.enemyAttackTimer = 0;
        this.enemyAttack();
      }
    }
  },

  heroAttack() {
    const stats = GameState.player.stats;
    const isCrit = Math.random() * 100 < stats.critRate;
    let dmg = stats.atk;

    if (isCrit) {
      dmg = Math.floor(dmg * (stats.critDmg / 100));
    }
    dmg = Math.floor(dmg * (0.9 + Math.random() * 0.2));
    dmg = Math.max(1, dmg);

    GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - dmg);
    GameState.combat.heroAttackCount = (GameState.combat.heroAttackCount || 0) + 1;

    // Animasi Serang Player di Canvas
    RenderEngine.player.isAttacking = true;
    RenderEngine.player.attackProgress = 0;
    RenderEngine.player.slashVfx = { progress: 0 };

    // Hit Flash & Screen Shake pada musuh
    RenderEngine.enemy.hitFlashTimer = 0.1;
    RenderEngine.triggerScreenShake(0.12);

    // Floating Damage Text
    const enemyTargetX = RenderEngine.enemy.baseX;
    RenderEngine.addFloatingDamage(enemyTargetX, RenderEngine.groundY - 50, dmg, isCrit ? 'enemy_crit' : 'enemy_hit');

    // Lifesteal jika ada
    if (stats.lifesteal > 0 && dmg > 0) {
      const heal = Math.ceil(dmg * (stats.lifesteal / 100));
      GameState.player.currentHp = Math.min(stats.maxHp, GameState.player.currentHp + heal);
      this.updatePlayerHpUI();
    }

    // ── 1. LEGENDARY PASSIVE: chainLightning (Pedang Petir Dewa) ──
    const weaponItem = GameState.player.equipped.weapon;
    if (weaponItem && weaponItem.legendaryEffect === 'chainLightning' && Math.random() < 0.10) {
      const bonusDmg = Math.floor(dmg * 0.5);
      if (GameState.enemy.currentHp > 0) {
        GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - bonusDmg);
        RenderEngine.triggerLegendaryVfx('lightning', RenderEngine.enemy.baseX, RenderEngine.groundY - 60);
        RenderEngine.addFloatingDamage(enemyTargetX, RenderEngine.groundY - 80, bonusDmg, 'legendary_lightning');
        this.logCombat(`⚡ <b style="color:#fbbf24;">Kilat Berantai! -${bonusDmg} bonus DMG!</b>`);
        this.updateEnemyDOMUI();
      }
    }

    // ── 2. LEGENDARY PASSIVE: soulReaper (Sabit Kegelapan Abadi) ──
    if (weaponItem && weaponItem.legendaryEffect === 'soulReaper' && isCrit && Math.random() < 0.40) {
      const reaperDmg = dmg;
      if (GameState.enemy.currentHp > 0) {
        GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - reaperDmg);
        GameState.player.gold += 10;
        this.updateGoldUI();
        RenderEngine.triggerLegendaryVfx('abyssalRift', RenderEngine.enemy.baseX, RenderEngine.groundY - 60);
        RenderEngine.addFloatingDamage(enemyTargetX, RenderEngine.groundY - 85, reaperDmg, 'legendary_reaper');
        this.logCombat(`🖤 <b style="color:#c084fc;">Retakan Jurang Abadi! -${reaperDmg} True DMG (+10G terserap)!</b>`);
        this.updateEnemyDOMUI();
      }
    }

    // ── 3. LEGENDARY PASSIVE: absoluteZero (Sepatu Kaisar Es Abadi) ──
    const bootsItem = GameState.player.equipped.boots;
    if (bootsItem && bootsItem.legendaryEffect === 'absoluteZero' && GameState.combat.heroAttackCount % 4 === 0) {
      const frostDmg = Math.floor(dmg * 0.75);
      GameState.combat.enemyFreezeTimer = 1.2;
      GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - frostDmg);
      RenderEngine.triggerLegendaryVfx('frostBlizzard', RenderEngine.enemy.baseX, RenderEngine.groundY - 45);
      RenderEngine.addFloatingDamage(enemyTargetX, RenderEngine.groundY - 75, frostDmg, 'legendary_frost');
      this.logCombat(`❄️ <b style="color:#67e8f9;">Badai Pembeku! -${frostDmg} Frost DMG & Musuh Beku 1.2s!</b>`);
      this.updateEnemyDOMUI();
    }

    // ── 4. LEGENDARY PASSIVE: meteorStrike (Mahkota Bintang Astral) ──
    const accItem = GameState.player.equipped.accessory;
    if (accItem && accItem.legendaryEffect === 'meteorStrike' && GameState.combat.heroAttackCount % 5 === 0) {
      const meteorDmg = Math.floor(stats.atk * 1.5);
      GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - meteorDmg);
      RenderEngine.triggerLegendaryVfx('celestialMeteor', RenderEngine.enemy.baseX, RenderEngine.groundY - 50);
      RenderEngine.triggerScreenShake(0.25);
      RenderEngine.addFloatingDamage(enemyTargetX, RenderEngine.groundY - 90, meteorDmg, 'legendary_meteor');
      this.logCombat(`👑 <b style="color:#f59e0b;">Meteor Astral Jatuh! -${meteorDmg} Massive Cosmic DMG!</b>`);
      this.updateEnemyDOMUI();
    }

    // ── 5. LEGENDARY PASSIVE: timeWarp (Jam Pasir Keabadian) ──
    const specialItem = GameState.player.equipped.special;
    if (specialItem && specialItem.legendaryEffect === 'timeWarp' && Math.random() < 0.18 && !GameState.combat.isTimeWarping) {
      GameState.combat.isTimeWarping = true;
      RenderEngine.triggerLegendaryVfx('timeMatrix', RenderEngine.player.baseX, RenderEngine.groundY - 50);
      this.logCombat(`⏳ <b style="color:#4ade80;">TIME WARP! Waktu terdistorsi, serangan instan 3x!</b>`);

      for (let w = 1; w <= 2; w++) {
        setTimeout(() => {
          if (GameState.enemy.currentHp > 0) {
            const extraDmg = Math.max(1, Math.floor(stats.atk * 0.85));
            GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - extraDmg);
            RenderEngine.addFloatingDamage(RenderEngine.enemy.baseX, RenderEngine.groundY - 50 - w * 15, extraDmg, 'legendary_timewarp');
            this.updateEnemyDOMUI();
            if (GameState.enemy.currentHp <= 0) this.handleEnemyDefeat();
          }
          if (w === 2) GameState.combat.isTimeWarping = false;
        }, w * 160);
      }
    }

    this.logCombat(`Hero menyerang ${GameState.enemy.name}: <b style="color:#f87171;">-${dmg}</b>${isCrit ? ' 💥(CRIT!)' : ''}`);
    this.updateEnemyDOMUI();

    if (GameState.enemy.currentHp <= 0) {
      this.handleEnemyDefeat();
    }
  },

  enemyAttack() {
    const stats = GameState.player.stats;

    // Cek Dodge
    if (Math.random() * 100 < stats.dodge) {
      RenderEngine.addFloatingDamage(RenderEngine.player.baseX, RenderEngine.groundY - 45, 'DODGE!', 'normal');
      this.logCombat(`💨 Hero berhasil menghindar dari serangan ${GameState.enemy.name}!`);
      return;
    }

    // ── 6. LEGENDARY PASSIVE: soulShield (Jubah Jiwa Abadi) ──
    const armorItem = GameState.player.equipped.armor;
    if (armorItem && armorItem.legendaryEffect === 'soulShield' && GameState.combat.soulShieldActive) {
      GameState.combat.soulShieldActive = false;
      RenderEngine.triggerLegendaryVfx('soulBubble', RenderEngine.player.baseX, RenderEngine.groundY - 55);
      RenderEngine.addFloatingDamage(RenderEngine.player.baseX, RenderEngine.groundY - 60, 'SOUL SHIELD!', 'legendary_shield');
      this.logCombat(`👻 <b style="color:#a78bfa;">Perisai Jiwa menyerap serangan penuh!</b>`);
      RenderEngine.enemy.isAttacking = true;
      RenderEngine.enemy.attackProgress = 0;
      return;
    }

    let rawDmg = GameState.enemy.atk;
    let actualDmg = Math.floor(rawDmg * (1 - stats.damageReduction / 100));
    actualDmg = Math.max(1, actualDmg);

    // ── 7. LEGENDARY PASSIVE: dragonThorns (Zirah Jantung Naga) ──
    if (armorItem && armorItem.legendaryEffect === 'dragonThorns') {
      const reflectDmg = Math.max(1, Math.floor(actualDmg * 0.70));
      GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - reflectDmg);
      RenderEngine.triggerLegendaryVfx('dragonBreath', RenderEngine.player.baseX, RenderEngine.groundY - 45);
      RenderEngine.addFloatingDamage(RenderEngine.enemy.baseX, RenderEngine.groundY - 55, reflectDmg, 'legendary_dragon');
      this.logCombat(`🐉 <b style="color:#ea580c;">Napas Pembalas Naga! Memantulkan -${reflectDmg} DMG!</b>`);
      this.updateEnemyDOMUI();
      if (GameState.enemy.currentHp <= 0) {
        this.handleEnemyDefeat();
      }
    }

    GameState.player.currentHp = Math.max(0, GameState.player.currentHp - actualDmg);

    // Animasi Serang Musuh di Canvas
    RenderEngine.enemy.isAttacking = true;
    RenderEngine.enemy.attackProgress = 0;

    // Hit Flash Player & Screen Shake
    RenderEngine.player.hitFlashTimer = 0.1;
    RenderEngine.triggerScreenShake(0.15);

    // Floating Damage Text Merah di tubuh Player
    RenderEngine.addFloatingDamage(RenderEngine.player.baseX, RenderEngine.groundY - 45, actualDmg, 'player_hit');

    this.logCombat(`${GameState.enemy.name} memberi <b style="color:#ef4444;">-${actualDmg}</b> kerusakan ke Hero!`);
    this.updatePlayerHpUI();

    // ── 8. LEGENDARY PASSIVE: phoenixRevive (Tameng Sayap Phoenix) ──
    if (GameState.player.currentHp <= 0) {
      const shieldItem = GameState.player.equipped.shield;
      if (shieldItem && shieldItem.legendaryEffect === 'phoenixRevive' && !GameState.combat.phoenixReviveUsed) {
        GameState.combat.phoenixReviveUsed = true;
        const reviveHp = Math.floor(stats.maxHp * 0.50);
        GameState.player.currentHp = reviveHp;

        const burnDmg = Math.max(1, Math.floor(GameState.enemy.maxHp * 0.20));
        GameState.enemy.currentHp = Math.max(0, GameState.enemy.currentHp - burnDmg);

        RenderEngine.triggerLegendaryVfx('phoenixWings', RenderEngine.player.baseX, RenderEngine.groundY - 50);
        RenderEngine.triggerScreenShake(0.3);
        RenderEngine.addFloatingDamage(RenderEngine.player.baseX, RenderEngine.groundY - 70, `+${reviveHp} PHOENIX!`, 'legendary_phoenix');
        RenderEngine.addFloatingDamage(RenderEngine.enemy.baseX, RenderEngine.groundY - 60, burnDmg, 'legendary_fire');

        this.logCombat(`🔥 <b style="color:#f97316;">KEBANGKITAN PHOENIX! Bangkit kembali (+${reviveHp} HP) & bakar musuh -${burnDmg}!</b>`);
        this.showToast('🔥 Sayap Phoenix membara! Anda bangkit dari kematian!', 'success');
        this.updatePlayerHpUI();
        this.updateEnemyDOMUI();
        return;
      }

      this.handlePlayerDeath();
    }
  },

  // 6. KEMATIAN PLAYER & CORPSE SYSTEM
  handlePlayerDeath() {
    GameState.combat.isRespawning = true;
    const deathWave = GameState.player.wave;

    // Catat lastDeathWave dan reset wave ke 1
    GameState.player.lastDeathWave = deathWave;
    GameState.player.wave = 1;

    this.logCombat(`💀 <b>Hero gugur pada Wave ${deathWave}!</b> Mayat tertinggal di arena. Kembali ke Wave 1...`);
    this.showToast(`Hero gugur di Wave ${deathWave}! Kembali ke Wave 1...`, 'error');

    this.updateWaveUI();
    this.saveGame();

    setTimeout(() => {
      GameState.player.currentHp = GameState.player.stats.maxHp;
      GameState.combat.isRespawning = false;
      this.updatePlayerHpUI();
      this.spawnEnemy();
      this.logCombat(`✨ Hero bangkit kembali dari Wave 1 untuk membalas dendam!`);
    }, 2800);
  },

  // 7. MUSUH TEWAS & DROP LOOT DI TANAH
  handleEnemyDefeat() {
    const wave = GameState.player.wave;
    const stats = GameState.player.stats;

    // Hadiah Gold — goldMagnet (Kantong Agung Saudagar) ×3
    const specialItem = GameState.player.equipped.special;
    const goldMult = (specialItem && specialItem.legendaryEffect === 'goldMagnet') ? 3 : 1;
    const baseGold = Math.floor(10 * Math.pow(1.11, wave - 1));
    const totalGold = Math.floor(baseGold * (1 + stats.goldBonus / 100) * goldMult);
    GameState.player.gold += totalGold;

    if (goldMult > 1) {
      RenderEngine.triggerLegendaryVfx('goldCoins', RenderEngine.player.baseX, RenderEngine.groundY - 50);
      this.logCombat(`💎 <b style="color:#fbbf24;">Gold Magnet! ×${goldMult} → +${totalGold} Gold</b>`);
    } else {
      this.logCombat(`🎉 ${GameState.enemy.name} kalah! Dapat <b>+${totalGold} Gold</b>.`);
    }
    this.updateGoldUI();

    // Kill counter untuk vampiricBurst
    GameState.combat.killCount = (GameState.combat.killCount || 0) + 1;

    // ── LEGENDARY PASSIVE: vampiricBurst (Cincin Darah Iblis) — setiap 5 kill ──
    const accItem = GameState.player.equipped.accessory;
    if (accItem && accItem.legendaryEffect === 'vampiricBurst' && GameState.combat.killCount % 5 === 0) {
      const healAmt = Math.floor(stats.maxHp * 0.30);
      GameState.player.currentHp = Math.min(stats.maxHp, GameState.player.currentHp + healAmt);
      RenderEngine.triggerLegendaryVfx('bloodNova', RenderEngine.player.baseX, RenderEngine.groundY - 50);
      RenderEngine.addFloatingDamage(RenderEngine.player.baseX, RenderEngine.groundY - 70, `+${healAmt} HP`, 'legendary_heal');
      this.logCombat(`🩸 <b style="color:#f43f5e;">Ledakan Darah! +${healAmt} HP sembuh (30% Max HP)!</b>`);
      this.updatePlayerHpUI();
    }

    // Catat rekor highest wave
    if (wave > GameState.player.highestWaveReached) {
      GameState.player.highestWaveReached = wave;
    }

    // Sistem Mayat: Jika pemain berhasil melewati wave kematian lamanya, mayat dihilangkan!
    if (GameState.player.lastDeathWave !== null && wave >= GameState.player.lastDeathWave) {
      if (wave === GameState.player.lastDeathWave) {
        this.logCombat(`⚔️ <b>Anda telah menembus kembali Wave tempat gugur Anda (${wave})!</b>`);
      }
      if (wave > GameState.player.lastDeathWave) {
        GameState.player.lastDeathWave = null;
      }
    }

    // ── HITUNG PELUANG DROP ITEM MUSUH (20% -> Naik tiap 5 Wave hingga Max 70%) ──
    const dropInfo = this.calculateEnemyDropRate();
    const dropRoll = Math.random() * 100;

    if (dropRoll <= dropInfo.totalDrop) {
      const droppedItem = this.generateLootItem();
      // Munculkan Loot di area aman (tidak keluar frame layar, margin 2-3 cm)
      const spawnX = Math.min(RenderEngine.width - 130, Math.max(130, RenderEngine.enemy.baseX - 50));
      const spawnY = RenderEngine.groundY - 15;
      RenderEngine.spawnLootDrop(spawnX, spawnY, droppedItem);

      this.logCombat(`🎁 Terjatuh di tanah: <b class="rarity-${droppedItem.rarity}">[${droppedItem.rarity.toUpperCase()}] ${droppedItem.name}</b>! (Klik untuk mengambil)`);
    }

    // Naik Wave Berikutnya
    GameState.player.wave++;
    this.updateWaveUI();
    this.saveGame();

    setTimeout(() => {
      this.spawnEnemy();
    }, 700);
  },

  // Dipanggil saat item di tanah diklik atau diambil otomatis setelah batas waktu
  collectLoot(item) {
    if (GameState.player.inventory.length >= 24) {
      // Tas penuh saat idle / auto-collect: item otomatis dijual ke NPC agar tidak hangus
      const sellPrice = item.npcSellPrice || 15;
      GameState.player.gold += sellPrice;
      this.updateGoldUI();
      this.showToast(`🎒 Tas penuh! [${item.name}] otomatis dijual (+${sellPrice} Gold)`, 'warn');
      this.logCombat(`🎒 Tas penuh! Item <b>${item.name}</b> otomatis dijual ke NPC seharga <b>+${sellPrice} Gold</b>.`);
      this.saveGame();
      return;
    }

    GameState.player.inventory.push(item);
    this.showToast(`🎁 Masuk Tas: [${item.rarity.toUpperCase()}] ${item.name}!`, 'success');
    this.renderInventory();
    this.saveGame();
  },

  collectAllCanvasLoot() {
    if (RenderEngine.droppedLoots.length === 0) {
      this.showToast('Tidak ada loot di tanah arena saat ini.', 'info');
      return;
    }

    while (RenderEngine.droppedLoots.length > 0) {
      const loot = RenderEngine.droppedLoots.shift();
      RenderEngine.launchLootFlyAnimation(loot.x, loot.y, loot.item);
    }
  },

  // ── KALKULASI PROBABILITAS & DROP RATE DINAMIS ──
  calculateEnemyDropRate(targetWave = null) {
    const wave = targetWave !== null ? targetWave : (GameState.player ? GameState.player.wave : 1);
    // Peningkatan terjadi setiap 5 wave, berulang maksimal 100 kali (Wave 500+)
    const steps = Math.min(100, Math.floor(wave / 5));
    // Peluang dasar 20%, meningkat +0.50% setiap 5 wave, batas maksimal 70%
    const baseDrop = Math.min(70, 20 + steps * 0.50);
    const stats = (GameState.player && GameState.player.stats) || {};
    const totalDrop = Math.min(100, baseDrop + (stats.dropRateBonus || 0));
    return { baseDrop, totalDrop, steps };
  },

  getRarityChances(wave) {
    const w = wave || (GameState.player ? GameState.player.wave : 1);
    // Peningkatan terjadi setiap 5 wave, berulang maksimal 100 kali
    const steps = Math.min(100, Math.floor(w / 5));

    // Legendary: Dasar 0.01% -> batas maksimal 1% (naik 0.0099% per step)
    const legendary = Math.min(1.0, 0.01 + steps * 0.0099);

    // Epic: Dasar 2.0% -> batas maksimal 20% (naik 0.18% per step)
    const epic = Math.min(20.0, 2.0 + steps * 0.18);

    // Rare: Dasar 5.0% -> batas maksimal 50% (naik 0.45% per step)
    const rare = Math.min(50.0, 5.0 + steps * 0.45);

    // Sisa persentase didistribusikan proporsional ke Common (76.50%) & Uncommon (16.49%)
    const remaining = 100.0 - (rare + epic + legendary);
    const common = remaining * (76.50 / 92.99);
    const uncommon = remaining * (16.49 / 92.99);

    return { common, uncommon, rare, epic, legendary, steps };
  },

  // 8. GENERATOR ITEM
  generateLootItem(targetWave = null) {
    const wave = targetWave !== null ? targetWave : (GameState.player ? GameState.player.wave : 1);
    const chances = this.getRarityChances(wave);

    const rand = Math.random() * 100;
    let rarityKey = 'common';

    if (rand < chances.legendary) {
      rarityKey = 'legendary';
    } else if (rand < chances.legendary + chances.epic) {
      rarityKey = 'epic';
    } else if (rand < chances.legendary + chances.epic + chances.rare) {
      rarityKey = 'rare';
    } else if (rand < chances.legendary + chances.epic + chances.rare + chances.uncommon) {
      rarityKey = 'uncommon';
    } else {
      rarityKey = 'common';
    }

    // Filter template: legendary hanya dari item legendary, lainnya dari non-legendary
    let pool;
    if (rarityKey === 'legendary') {
      pool = ITEM_TEMPLATES.filter(t => t.legendaryEffect);
    } else {
      pool = ITEM_TEMPLATES.filter(t => !t.legendaryEffect);
    }
    if (!pool.length) pool = ITEM_TEMPLATES; // fallback
    const template = pool[Math.floor(Math.random() * pool.length)];

    const rarityData = RARITIES[rarityKey];
    let finalStatVal = template.baseVal * rarityData.multiplier;
    if (template.stat === 'atkSpeed') {
      finalStatVal = Math.round(finalStatVal * 100) / 100;
    } else {
      finalStatVal = Math.round(finalStatVal);
    }

    const npcSellPrice = Math.floor(rarityData.baseNpcSell * (0.9 + Math.random() * 0.2));

    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      templateId: template.id,
      name: template.name,
      slot: template.slot,
      stat: template.stat,
      statVal: finalStatVal,
      unit: template.unit,
      desc: template.desc,
      icon: template.icon,
      rarity: rarityKey,
      npcSellPrice: npcSellPrice,
      // Legendary fields (hanya ada jika template-nya legendary)
      legendaryEffect: template.legendaryEffect || null,
      legendaryVfx:    template.legendaryVfx    || null,
      legendaryDesc:   template.legendaryDesc   || null
    };
  },

  // 9. DYNAMIC PLAYER AURA CHECKER (checkEquippedRarityAura)
  checkEquippedRarityAura() {
    const equipped = GameState.player.equipped;

    // Cek apakah ada slot kosong
    for (const slot of EQUIP_SLOTS) {
      if (!equipped[slot]) {
        return 0; // Tier 0: Tanpa aura jika ada 1 saja slot kosong
      }
    }

    // Dapatkan rarity terendah dari seluruh 6 slot
    let lowestRank = 5;
    for (const slot of EQUIP_SLOTS) {
      const item = equipped[slot];
      const rData = RARITIES[item.rarity.toLowerCase()] || { rank: 1 };
      if (rData.rank < lowestRank) {
        lowestRank = rData.rank;
      }
    }

    // Aturan Penentuan Aura Tier:
    // - lowestRank === 5 (Semua Legendary): Tier 3 (Golden Flame & Sparkle)
    // - lowestRank >= 4 (Semua >= Epic): Tier 2 (Purple Ethereal Aura)
    // - lowestRank >= 2 (Semua > Common, misal Uncommon/Rare): Tier 1 (Cyan Mystic Glow)
    // - lowestRank === 1 (Ada Common): Tier 0 (Tanpa Aura)
    if (lowestRank === 5) return 3;
    if (lowestRank >= 4) return 2;
    if (lowestRank >= 2) return 1;
    return 0;
  },

  // 10. REKALKULASI STATUS KARAKTER
  recalculatePlayerStats() {
    const p = GameState.player;
    const computed = { ...p.baseStats };

    for (const slot of EQUIP_SLOTS) {
      const item = p.equipped[slot];
      if (item) {
        if (item.stat === 'maxHp') computed.maxHp += item.statVal;
        else if (item.stat === 'atk') computed.atk += item.statVal;
        else if (item.stat === 'atkSpeed') computed.atkSpeed += item.statVal;
        else if (item.stat === 'critRate') computed.critRate += item.statVal;
        else if (item.stat === 'critDmg') computed.critDmg += item.statVal;
        else if (item.stat === 'lifesteal') computed.lifesteal += item.statVal;
        else if (item.stat === 'damageReduction') computed.damageReduction += item.statVal;
        else if (item.stat === 'dodge') computed.dodge += item.statVal;
        else if (item.stat === 'goldBonus') computed.goldBonus += item.statVal;
        else if (item.stat === 'dropRateBonus') computed.dropRateBonus += item.statVal;
      }
    }

    computed.critRate = Math.min(85, computed.critRate);
    computed.dodge = Math.min(65, computed.dodge);
    computed.damageReduction = Math.min(75, computed.damageReduction);
    computed.lifesteal = Math.min(65, computed.lifesteal);
    computed.atkSpeed = Math.min(4.5, Math.max(0.5, Math.round(computed.atkSpeed * 100) / 100));

    p.stats = computed;
    p.currentHp = Math.min(p.currentHp, p.stats.maxHp);

    // Cek Aura Set Bonus
    const auraTier = this.checkEquippedRarityAura();
    RenderEngine.setAuraTier(auraTier);
    this.updateAuraBadgeUI(auraTier);

    this.updateStatsUI();
  },

  // 11. EQUIPMENT & INVENTORY OPERATIONS
  equipItem(itemIndex) {
    const item = GameState.player.inventory[itemIndex];
    if (!item) return;

    const slot = item.slot;
    const currentEquipped = GameState.player.equipped[slot];

    GameState.player.inventory.splice(itemIndex, 1);
    if (currentEquipped) {
      GameState.player.inventory.push(currentEquipped);
    }

    GameState.player.equipped[slot] = item;
    this.showToast(`Berhasil memakai ${item.name}!`, 'success');

    this.recalculatePlayerStats();
    this.renderInventory();
    this.renderEquipment();
    this.saveGame();
  },

  unequipItem(slot) {
    const item = GameState.player.equipped[slot];
    if (!item) return;

    if (GameState.player.inventory.length >= 24) {
      this.showToast('Inventory penuh! Kosongkan slot terlebih dahulu.', 'warn');
      return;
    }

    GameState.player.equipped[slot] = null;
    GameState.player.inventory.push(item);
    this.showToast(`Melepas ${item.name}.`, 'info');

    this.recalculatePlayerStats();
    this.renderInventory();
    this.renderEquipment();
    this.saveGame();
  },

  sellToNpc(itemIndex) {
    const item = GameState.player.inventory[itemIndex];
    if (!item) return;

    GameState.player.gold += item.npcSellPrice;
    GameState.player.inventory.splice(itemIndex, 1);

    this.showToast(`Menjual ${item.name} seharga +${item.npcSellPrice} Gold ke NPC.`, 'success');
    this.updateGoldUI();
    this.renderInventory();
    this.saveGame();
  },

  sellAllByTier(maxTier = 'common') {
    const targetRank = (RARITIES[maxTier] && RARITIES[maxTier].rank) || 1;
    let soldCount = 0;
    let earnedGold = 0;

    for (let i = GameState.player.inventory.length - 1; i >= 0; i--) {
      const item = GameState.player.inventory[i];
      if (!item) continue;
      const rank = (RARITIES[item.rarity] && RARITIES[item.rarity].rank) || 1;
      // Jangan pernah jual Legendary (rank 5)
      if (rank <= targetRank && rank < 5) {
        earnedGold += (item.npcSellPrice || 10);
        GameState.player.inventory.splice(i, 1);
        soldCount++;
      }
    }

    if (soldCount > 0) {
      GameState.player.gold += earnedGold;
      const tierName = RARITIES[maxTier] ? RARITIES[maxTier].name : maxTier;
      this.showToast(`💰 Berhasil menjual ${soldCount} item (${tierName} & di bawahnya) seharga +${earnedGold} Gold.`, 'success');
      this.updateGoldUI();
      this.renderInventory();
      this.saveGame();
      if (this.activeUpgradeSlot) {
        this.renderUpgradeModalContent(this.activeUpgradeSlot);
      }
    } else {
      this.showToast('Tidak ada item di tas yang cocok dengan tier tersebut.', 'info');
    }
  },

  sellAllCommonItems() {
    this.sellAllByTier('common');
  },

  // 12. UI DOM RENDERING
  updateStatsUI() {
    const s = GameState.player.stats;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal('stat-atk', s.atk);
    setVal('stat-maxhp', s.maxHp);
    setVal('stat-atkspeed', `${s.atkSpeed.toFixed(2)}x`);
    setVal('stat-crit', `${s.critRate}%`);
    setVal('stat-critdmg', `${s.critDmg}%`);
    setVal('stat-lifesteal', `${s.lifesteal}%`);
    setVal('stat-def', `${s.damageReduction}%`);
    setVal('stat-dodge', `${s.dodge}%`);
    setVal('stat-goldbonus', `+${s.goldBonus}%`);
    setVal('stat-dropbonus', `+${s.dropRateBonus}%`);

    this.updatePlayerHpUI();
  },

  updatePlayerHpUI() {
    const p = GameState.player;
    const pct = Math.max(0, Math.min(100, (p.currentHp / p.stats.maxHp) * 100));
    const hpBar = document.getElementById('hero-hp-bar');
    const hpText = document.getElementById('hero-hp-text');

    if (hpBar) hpBar.style.width = `${pct}%`;
    if (hpText) hpText.innerText = `${p.currentHp} / ${p.stats.maxHp}`;
  },

  updateEnemyDOMUI() {
    const e = GameState.enemy;
    const pct = Math.max(0, Math.min(100, (e.currentHp / e.maxHp) * 100));
    const enemyName = document.getElementById('enemy-name');
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const enemyHpText = document.getElementById('enemy-hp-text');

    if (enemyName) enemyName.innerText = e.name;
    if (enemyHpBar) enemyHpBar.style.width = `${pct}%`;
    if (enemyHpText) enemyHpText.innerText = `${e.currentHp} / ${e.maxHp}`;
  },

  updateGoldUI() {
    const el = document.getElementById('player-gold');
    if (el) el.innerText = GameState.player.gold.toLocaleString();
  },

  updateWaveUI() {
    const waveEl = document.getElementById('wave-display');
    if (waveEl) waveEl.innerText = `WAVE ${GameState.player.wave}`;

    const highestEl = document.getElementById('highest-wave-display');
    if (highestEl) highestEl.innerText = `Rekor: Wave ${GameState.player.highestWaveReached}`;

    const corpseEl = document.getElementById('corpse-indicator');
    if (corpseEl) {
      if (GameState.player.lastDeathWave) {
        corpseEl.style.display = 'inline-flex';
        corpseEl.innerText = `💀 Mayat di Wave ${GameState.player.lastDeathWave}`;
      } else {
        corpseEl.style.display = 'none';
      }
    }

    // Tampilkan indikator drop rate dinamis di Top HUD
    const dropInfo = this.calculateEnemyDropRate();
    const chances = this.getRarityChances(GameState.player.wave);
    const dropBadge = document.getElementById('hud-drop-rate-badge');
    if (dropBadge) {
      dropBadge.innerText = `🎁 Drop: ${dropInfo.baseDrop.toFixed(1)}%`;
      dropBadge.title = `Wave ${GameState.player.wave} (Step ${dropInfo.steps}/100)\n• Peluang Drop: ${dropInfo.baseDrop.toFixed(1)}% (+${(dropInfo.totalDrop - dropInfo.baseDrop).toFixed(1)}% Bonus)\n• Common: ${chances.common.toFixed(1)}%\n• Uncommon: ${chances.uncommon.toFixed(1)}%\n• Rare: ${chances.rare.toFixed(1)}%\n• Epic: ${chances.epic.toFixed(1)}%\n• Legendary: ${chances.legendary.toFixed(2)}%`;
    }
  },

  updateAuraBadgeUI(tier) {
    const el = document.getElementById('aura-badge');
    if (!el) return;

    el.className = 'aura-mini-badge';
    if (tier === 3) {
      el.classList.add('aura-tier-3');
      el.innerHTML = '✨ TIER 3 (Celestial)';
    } else if (tier === 2) {
      el.classList.add('aura-tier-2');
      el.innerHTML = '🔮 TIER 2 (Ethereal)';
    } else if (tier === 1) {
      el.classList.add('aura-tier-1');
      el.innerHTML = '🌀 TIER 1 (Mystic)';
    } else {
      el.innerHTML = '🛡️ Aura: Off';
    }
  },

  renderEquipment() {
    const container = document.getElementById('equipped-grid');
    if (!container) return;
    container.innerHTML = '';

    EQUIP_SLOTS.forEach(slot => {
      const item = GameState.player.equipped[slot];
      const slotEl = document.createElement('div');
      slotEl.className = `equip-slot ${item ? `filled rarity-${item.rarity}` : ''}`;
      const defaultInfo = SLOT_NAMES[slot] || { name: slot, icon: '🛡️' };

      if (item) {
        const itemSlotInfo = getItemSlotInfo(item);
        const itemLevel = item.level || 1;
        slotEl.innerHTML = `
          <div class="equip-slot-top-row">
            <span class="equip-slot-part-badge">${itemSlotInfo.icon} ${itemSlotInfo.name}</span>
            <div style="display:flex; gap:3px; align-items:center;">
              ${itemLevel > 1 ? `<span class="equip-level-badge">Lv.${itemLevel}</span>` : ''}
              <span class="equip-rarity-tag bg-rarity-${item.rarity}">${item.rarity}</span>
            </div>
          </div>
          <div class="equip-slot-name" title="${item.name}">${getItemIcon(item)} ${item.name}</div>
          <div class="equip-slot-stat">+${item.statVal}${item.unit} ${item.desc}</div>
          ${item.legendaryEffect ? `<div class="equip-slot-legendary" title="${item.legendaryDesc || ''}">✨ ${item.legendaryEffect}</div>` : ''}
        `;
        slotEl.title = `[${itemSlotInfo.name}] ${item.name} ${itemLevel > 1 ? `(Lv.${itemLevel})` : ''}\n+${item.statVal}${item.unit} ${item.desc}`;
        slotEl.onclick = (e) => this.showEquippedContextMenu(e, item, slot);
        slotEl.oncontextmenu = (e) => {
          e.preventDefault();
          this.showEquippedContextMenu(e, item, slot);
        };
      } else {
        slotEl.innerHTML = `
          <div class="equip-slot-title">${defaultInfo.icon} ${defaultInfo.name}</div>
          <div class="equip-slot-empty-label">[Kosong]</div>
        `;
      }
      container.appendChild(slotEl);
    });
  },

  renderInventory() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    container.innerHTML = '';
    const inv = GameState.player.inventory;
    const maxSlots = 24;

    const countBadge = document.getElementById('inv-count-badge');
    if (countBadge) countBadge.innerText = `${inv.length} / ${maxSlots} Slot`;

    for (let i = 0; i < maxSlots; i++) {
      const item = inv[i];
      const slotEl = document.createElement('div');

      if (item) {
        const slotInfo = getItemSlotInfo(item);
        const itemLevel = item.level || 1;
        slotEl.className = `inv-slot rarity-${item.rarity}`;
        slotEl.innerHTML = `
          <div class="inv-item-top">
            <span class="inv-slot-part-badge">${slotInfo.icon} ${slotInfo.name}</span>
            <div style="display:flex; gap:2px; align-items:center;">
              ${itemLevel > 1 ? `<span class="equip-level-badge inv-level-badge">Lv.${itemLevel}</span>` : ''}
              <span class="inv-rarity-pill bg-rarity-${item.rarity}">${item.rarity}</span>
            </div>
          </div>
          <div class="inv-item-center">
            <span class="inv-icon">${getItemIcon(item)}</span>
            <div class="inv-item-name" title="${item.name}">${item.name}</div>
          </div>
          <div class="inv-item-stat">+${item.statVal}${item.unit} ${item.desc}</div>
          ${item.legendaryEffect ? `<div class="inv-item-legendary" title="${item.legendaryDesc || ''}">⚡ ${item.legendaryEffect}</div>` : ''}
        `;
        slotEl.title = `[${slotInfo.name}] ${item.name} ${itemLevel > 1 ? `(Lv.${itemLevel})` : ''}\n+${item.statVal}${item.unit} ${item.desc}`;
        slotEl.onclick = (e) => this.showItemContextMenu(e, item, i);
        slotEl.oncontextmenu = (e) => {
          e.preventDefault();
          this.showItemContextMenu(e, item, i);
        };
      } else {
        slotEl.className = 'inv-slot empty';
      }

      container.appendChild(slotEl);
    }
  },

  showItemContextMenu(e, item, index) {
    this.closeItemContextMenu();
    e.stopPropagation();

    const popup = document.createElement('div');
    popup.className = 'item-context-popup';
    popup.id = 'active-context-popup';
    popup.innerHTML = `
      <div style="font-size:0.75rem; font-weight:700; margin-bottom:4px; color:#fff;">${getItemIcon(item)} ${item.name}</div>
      ${item.legendaryEffect ? `<div style="font-size:0.67rem;color:#fbbf24;margin-bottom:5px;line-height:1.3;">⚡ ${item.legendaryDesc || item.legendaryEffect}</div>` : ''}
      <button class="ctx-btn" id="ctx-equip">⚡ Equip ke ${item.slot}</button>
      <button class="ctx-btn ctx-sell" id="ctx-npc-sell">💰 Jual NPC (+${item.npcSellPrice}G)</button>
      <button class="ctx-btn ctx-market" id="ctx-list-market">🏛️ Jual ke Marketplace</button>
    `;

    document.body.appendChild(popup);
    const rect = e.currentTarget.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popup.style.left = `${Math.min(window.innerWidth - 180, rect.left + window.scrollX)}px`;

    popup.querySelector('#ctx-equip').onclick = () => {
      this.closeItemContextMenu();
      this.equipItem(index);
    };
    popup.querySelector('#ctx-npc-sell').onclick = () => {
      this.closeItemContextMenu();
      this.sellToNpc(index);
    };
    popup.querySelector('#ctx-list-market').onclick = () => {
      this.closeItemContextMenu();
      if (window.MarketEngine && window.MarketEngine.openListingModal) {
        window.MarketEngine.openListingModal(item, index);
      }
    };
  },

  showEquippedContextMenu(e, item, slot) {
    this.closeItemContextMenu();
    e.stopPropagation();

    const itemLevel = item.level || 1;
    const popup = document.createElement('div');
    popup.className = 'item-context-popup equip-context-popup';
    popup.id = 'active-context-popup';
    popup.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:6px;">
        <span style="font-size:1.4rem;">${getItemIcon(item)}</span>
        <div style="flex:1;">
          <div style="font-size:0.82rem; font-weight:700;" class="rarity-${item.rarity}">${item.name}</div>
          <div style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase; display:flex; gap:4px; align-items:center;">
            <span>[${slot.toUpperCase()}] • <b class="rarity-${item.rarity}">${item.rarity.toUpperCase()}</b></span>
            <span class="equip-level-badge">Lv.${itemLevel}</span>
          </div>
        </div>
      </div>
      <div style="font-size:0.75rem; color:#38bdf8; font-weight:600; margin-bottom:4px; line-height:1.3;">
        Stat Bonus: +${item.statVal}${item.unit} ${item.desc}
      </div>
      ${item.legendaryEffect ? `
        <div style="font-size:0.68rem; color:#fbbf24; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.45); border-radius:6px; padding:5px 7px; margin-bottom:6px; line-height:1.35;">
          ⚡ <b>${item.legendaryEffect}:</b><br>${item.legendaryDesc || 'Efek pasif mistis legendaris aktif!'}
        </div>
      ` : ''}
      <div style="font-size:0.65rem; color:#64748b; margin-bottom:6px;">
        Status: <i>Sedang aktif digunakan</i>
      </div>
      <button class="ctx-btn ctx-upgrade" id="ctx-upgrade-equip" style="background:#1e3a8a; border-color:#3b82f6; color:#93c5fd; font-weight:700;">
        🔥 Tempa / Upgrade Level (Bakar Item)
      </button>
      <button class="ctx-btn ctx-unequip" id="ctx-unequip">
        🛡️ Lepas Perlengkapan
      </button>
      <button class="ctx-btn" id="ctx-close-detail" style="text-align:center; color:#94a3b8; font-size:0.7rem;">
        ✕ Tutup
      </button>
    `;

    document.body.appendChild(popup);
    const rect = e.currentTarget.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popup.style.left = `${Math.min(window.innerWidth - 220, Math.max(10, rect.left + window.scrollX - 20))}px`;

    popup.querySelector('#ctx-upgrade-equip').onclick = () => {
      this.closeItemContextMenu();
      this.openUpgradeModal(slot);
    };
    popup.querySelector('#ctx-unequip').onclick = () => {
      this.closeItemContextMenu();
      this.unequipItem(slot);
    };
    popup.querySelector('#ctx-close-detail').onclick = () => {
      this.closeItemContextMenu();
    };
  },

  getUpgradeExpNeeded(level) {
    return Math.floor(30 * Math.pow(1.35, Math.max(0, (level || 1) - 1)));
  },

  getItemStatAtLevel(item, level) {
    const base = (item.baseStatVal !== undefined && item.baseStatVal !== null) ? item.baseStatVal : item.statVal;
    const mult = 1 + ((level || 1) - 1) * 0.12;
    if (item.unit === 'x') {
      return Math.round(base * mult * 100) / 100;
    }
    if (item.unit === '%') {
      return Math.round(base * mult * 10) / 10;
    }
    return Math.round(base * mult);
  },

  openUpgradeModal(slot) {
    const item = GameState.player.equipped[slot];
    if (!item) {
      this.showToast('Tidak ada perlengkapan yang dipasang di slot ini.', 'warn');
      return;
    }
    this.activeUpgradeSlot = slot;
    if (!this.upgradeSacrificeTier) this.upgradeSacrificeTier = 'common';

    const modal = document.getElementById('modal-item-upgrade');
    if (modal) {
      modal.classList.add('active');
      this.renderUpgradeModalContent(slot);
    }
  },

  closeUpgradeModal() {
    this.activeUpgradeSlot = null;
    const modal = document.getElementById('modal-item-upgrade');
    if (modal) modal.classList.remove('active');
  },

  renderUpgradeModalContent(slot) {
    const body = document.getElementById('modal-upgrade-body');
    if (!body) return;

    const item = GameState.player.equipped[slot];
    if (!item) {
      body.innerHTML = '<div style="text-align:center; padding:1.5rem; color:#94a3b8;">Item perlengkapan tidak ditemukan atau telah dilepas.</div>';
      return;
    }

    if (!item.level) item.level = 1;
    if (item.upgradeExp === undefined) item.upgradeExp = 0;
    if (item.baseStatVal === undefined) item.baseStatVal = item.statVal;

    const currentLevel = item.level;
    const currentStat = item.statVal;
    const expNeeded = this.getUpgradeExpNeeded(currentLevel);
    const expPct = Math.min(100, Math.floor((item.upgradeExp / expNeeded) * 100));

    const selectedTier = this.upgradeSacrificeTier || 'common';
    const targetRank = (RARITIES[selectedTier] && RARITIES[selectedTier].rank) || 1;

    // Filter item bahan dari inventory (legendary tidak pernah dibakar)
    const matchingItems = GameState.player.inventory.filter(invItem => {
      if (!invItem) return false;
      const r = (RARITIES[invItem.rarity] && RARITIES[invItem.rarity].rank) || 1;
      return r <= targetRank && r < 5;
    });

    const SACRIFICE_EXP = { common: 15, uncommon: 45, rare: 150, epic: 600 };
    let totalGainedExp = 0;
    for (const m of matchingItems) {
      totalGainedExp += (SACRIFICE_EXP[m.rarity] || 15);
    }

    // Simulasi kenaikan level dengan bahan yang tersedia
    let simLevel = currentLevel;
    let simExp = item.upgradeExp + totalGainedExp;
    let simReq = this.getUpgradeExpNeeded(simLevel);
    let levelsGained = 0;
    while (simExp >= simReq) {
      simExp -= simReq;
      simLevel++;
      levelsGained++;
      simReq = this.getUpgradeExpNeeded(simLevel);
    }
    const nextStat = this.getItemStatAtLevel(item, simLevel);
    const statDiff = Math.round((nextStat - currentStat) * 10) / 10;
    const slotInfo = getItemSlotInfo(item);

    body.innerHTML = `
      <div class="upgrade-target-card rarity-${item.rarity}">
        <div class="upgrade-target-header">
          <div class="upgrade-target-icon">${getItemIcon(item)}</div>
          <div class="upgrade-target-info">
            <div class="upgrade-target-name">${item.name}</div>
            <div class="upgrade-target-meta">
              <span class="inv-slot-part-badge">${slotInfo.icon} ${slotInfo.name}</span>
              <span class="inv-rarity-pill bg-rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
              <span class="equip-level-badge">Lv.${currentLevel}</span>
            </div>
          </div>
        </div>

        <div class="upgrade-stat-comparison">
          <div class="stat-compare-box">
            <span class="compare-lbl">Level Perlengkapan</span>
            <div class="compare-val">
              <span class="old-val">Lv.${currentLevel}</span>
              ${levelsGained > 0 ? `<span class="arrow-val">➔</span><span class="new-val">Lv.${simLevel}</span>` : ''}
            </div>
          </div>
          <div class="stat-compare-box">
            <span class="compare-lbl">Stat Bonus (${item.desc})</span>
            <div class="compare-val">
              <span class="old-val">+${currentStat}${item.unit}</span>
              ${levelsGained > 0 ? `<span class="arrow-val">➔</span><span class="new-val">+${nextStat}${item.unit} (+${statDiff})</span>` : ''}
            </div>
          </div>
        </div>

        <div class="upgrade-exp-bar-container">
          <div class="upgrade-exp-bar-labels">
            <span>Progress EXP Tempa</span>
            <span>${item.upgradeExp} / ${expNeeded} EXP (${expPct}%)</span>
          </div>
          <div class="upgrade-exp-track">
            <div class="upgrade-exp-fill" style="width: ${expPct}%;"></div>
          </div>
        </div>
      </div>

      <div class="upgrade-options-box">
        <label class="upgrade-section-label">Pilih Batas Tier Item Tas yang Akan Dibakar:</label>
        <select id="upgrade-tier-select-input" class="form-input upgrade-tier-dropdown">
          <option value="common" ${selectedTier === 'common' ? 'selected' : ''}>⚪ Common & di bawahnya (Hanya Common)</option>
          <option value="uncommon" ${selectedTier === 'uncommon' ? 'selected' : ''}>🟢 Uncommon & di bawahnya (Common + Uncommon)</option>
          <option value="rare" ${selectedTier === 'rare' ? 'selected' : ''}>🔵 Rare & di bawahnya (Common + Uncommon + Rare)</option>
          <option value="epic" ${selectedTier === 'epic' ? 'selected' : ''}>🟣 Epic & di bawahnya (Common + Uncommon + Rare + Epic)</option>
        </select>
        <div class="upgrade-tier-hint">
          🛡️ <i>Item Legendary <b>TIDAK AKAN PERNAH</b> dibakar demi keamanan perlengkapan langka Anda.</i>
        </div>
      </div>

      <div class="upgrade-preview-box ${matchingItems.length > 0 ? 'has-items' : 'empty-items'}">
        <div class="preview-row">
          <span>Item cocok di tas:</span>
          <b>${matchingItems.length} Item</b>
        </div>
        <div class="preview-row">
          <span>Total EXP Tempa didapat:</span>
          <b style="color:#38bdf8;">+${totalGainedExp} EXP</b>
        </div>
        <div class="preview-row">
          <span>Hasil Tempa:</span>
          ${levelsGained > 0 
            ? `<b style="color:#4ade80;">🎉 Naik +${levelsGained} Level (ke Lv.${simLevel})!</b>` 
            : (matchingItems.length > 0 
                ? `<span style="color:#fbbf24;">EXP bertambah (${simExp}/${simReq} EXP)</span>` 
                : `<span style="color:#ef4444;">Tas tidak memiliki item tier ini!</span>`)}
        </div>
      </div>
    `;

    // Pasang listener ganti tier
    const sel = document.getElementById('upgrade-tier-select-input');
    if (sel) {
      sel.onchange = (e) => {
        this.upgradeSacrificeTier = e.target.value;
        this.renderUpgradeModalContent(slot);
      };
    }

    // Update tombol konfirmasi
    const confirmBtn = document.getElementById('modal-upgrade-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = matchingItems.length === 0;
      confirmBtn.innerText = matchingItems.length > 0
        ? `🔥 Bakar ${matchingItems.length} Item & Upgrade`
        : `🔥 Tidak Ada Bahan di Tas`;
    }
  },

  executeUpgradeEquippedItem(slot) {
    const item = GameState.player.equipped[slot];
    if (!item) {
      this.showToast('Item tidak ditemukan.', 'warn');
      return;
    }

    if (!item.level) item.level = 1;
    if (item.upgradeExp === undefined) item.upgradeExp = 0;
    if (item.baseStatVal === undefined) item.baseStatVal = item.statVal;

    const selectedTier = this.upgradeSacrificeTier || 'common';
    const targetRank = (RARITIES[selectedTier] && RARITIES[selectedTier].rank) || 1;

    const SACRIFICE_EXP = { common: 15, uncommon: 45, rare: 150, epic: 600 };
    let totalGainedExp = 0;
    let burnedCount = 0;

    // Hapus dari inventory dari index belakang
    for (let i = GameState.player.inventory.length - 1; i >= 0; i--) {
      const invItem = GameState.player.inventory[i];
      if (!invItem) continue;
      const r = (RARITIES[invItem.rarity] && RARITIES[invItem.rarity].rank) || 1;
      if (r <= targetRank && r < 5) {
        totalGainedExp += (SACRIFICE_EXP[invItem.rarity] || 15);
        GameState.player.inventory.splice(i, 1);
        burnedCount++;
      }
    }

    if (burnedCount === 0) {
      this.showToast('Tidak ada item di tas yang cocok untuk dibakar!', 'warn');
      return;
    }

    item.upgradeExp += totalGainedExp;
    let expReq = this.getUpgradeExpNeeded(item.level);
    let levelsGained = 0;
    while (item.upgradeExp >= expReq) {
      item.upgradeExp -= expReq;
      item.level++;
      levelsGained++;
      expReq = this.getUpgradeExpNeeded(item.level);
    }

    // Update stat & sell price
    item.statVal = this.getItemStatAtLevel(item, item.level);
    item.npcSellPrice = Math.round((item.npcSellPrice || 10) * (1 + (item.level - 1) * 0.15));

    // Rekalkulasi & UI
    this.recalculatePlayerStats();
    this.renderEquipment();
    this.renderInventory();
    this.saveGame();

    if (levelsGained > 0) {
      this.showToast(`🔥 Sukses membakar ${burnedCount} item! ${item.name} naik ke Level ${item.level}!`, 'success');
      this.logCombat(`🔥 [TEMPA] <b>${item.name}</b> berhasil ditempa ke <b>Level ${item.level}</b> (+${item.statVal}${item.unit} ${item.desc})!`);
    } else {
      this.showToast(`🔥 Sukses membakar ${burnedCount} item! Mendapatkan +${totalGainedExp} EXP Tempa.`, 'info');
      this.logCombat(`🔥 [TEMPA] Membakar ${burnedCount} item untuk <b>${item.name}</b> (+${totalGainedExp} EXP).`);
    }

    // Refresh isi modal
    this.renderUpgradeModalContent(slot);
  },

  closeItemContextMenu() {
    const existing = document.getElementById('active-context-popup');
    if (existing) existing.remove();
  },

  logCombat(msg) {
    const ticker = document.getElementById('combat-ticker');
    if (!ticker) return;
    const line = document.createElement('div');
    line.className = 'ticker-line';
    line.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
    ticker.prepend(line);

    while (ticker.children.length > 20) {
      ticker.removeChild(ticker.lastChild);
    }
  },

  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2800);
  },

  serverSaveTimer: null,

  async syncWithServer() {
    try {
      const url = window.getApiUrl ? window.getApiUrl(`/api/player/${GameState.player.id}`) : `/api/player/${GameState.player.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.player) {
          const s = data.player;
          GameState.player.name = s.name || GameState.player.name;
          if (typeof s.gold === 'number') GameState.player.gold = s.gold;
          if (typeof s.wave === 'number') GameState.player.wave = s.wave;
          if (typeof s.highestWaveReached === 'number') GameState.player.highestWaveReached = s.highestWaveReached;
          if (s.lastDeathWave !== undefined) GameState.player.lastDeathWave = s.lastDeathWave;
          if (s.equipped) GameState.player.equipped = s.equipped;
          if (Array.isArray(s.inventory)) GameState.player.inventory = s.inventory;

          this.recalculatePlayerStats();
          this.updateGoldUI();
          this.renderEquipment();
          this.renderInventory();
          this.updateWaveUI();

          // Periksa waktu offline untuk menghitung progres idle saat web ditutup
          const lastTime = s.updatedAt || parseInt(localStorage.getItem('idle_last_active') || '0', 10);
          if (lastTime > 0) {
            const elapsed = Math.floor((Date.now() - lastTime) / 1000);
            if (elapsed >= 30) {
              this.processOfflineProgress(elapsed);
            }
          }
        }
      } else {
        // Belum tersimpan di server cloud, simpan sekarang
        this.saveToServer();
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi dengan server:', err);
    }
  },

  async saveToServer() {
    try {
      const payload = {
        id: GameState.player.id,
        name: GameState.player.name,
        gold: GameState.player.gold,
        wave: GameState.player.wave,
        highestWaveReached: GameState.player.highestWaveReached,
        lastDeathWave: GameState.player.lastDeathWave,
        equipped: GameState.player.equipped,
        inventory: GameState.player.inventory
      };
      const saveUrl = window.getApiUrl ? window.getApiUrl('/api/player/save') : '/api/player/save';
      await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Offline fallback silent
    }
  },

  saveGame() {
    const data = {
      gold: GameState.player.gold,
      wave: GameState.player.wave,
      highestWaveReached: GameState.player.highestWaveReached,
      lastDeathWave: GameState.player.lastDeathWave,
      inventory: GameState.player.inventory,
      equipped: GameState.player.equipped
    };
    localStorage.setItem('idle_exchange_save', JSON.stringify(data));
    localStorage.setItem('idle_last_active', Date.now().toString());

    // Debounced Cloud Save (Maksimal 1 kali tiap 1 detik)
    if (this.serverSaveTimer) clearTimeout(this.serverSaveTimer);
    this.serverSaveTimer = setTimeout(() => {
      this.saveToServer();
    }, 1000);
  },

  // ── EKSEKUSI GAME DI LATAR BELAKANG (BACKGROUND TAB RUNNER) ──
  setupBackgroundExecution() {
    let bgInterval = null;
    let lastBgTick = performance.now();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab diminimalkan / pindah tab: jalankan interval 500ms yang sangat efisien dan ringan
        lastBgTick = performance.now();
        if (!bgInterval) {
          bgInterval = setInterval(() => {
            const now = performance.now();
            const dt = Math.min(1.0, (now - lastBgTick) / 1000);
            lastBgTick = now;

            if (!GameState.combat.isRespawning) {
              this.updateCombat(dt);
            }
            RenderEngine.update(dt);
          }, 500); // 2 kali per detik (0.5s per tick)
        }
      } else {
        // Tab aktif kembali: matikan background loop dan reset lastTime agar rendering halus
        if (bgInterval) {
          clearInterval(bgInterval);
          bgInterval = null;
        }
        this.lastTime = performance.now();
      }
    });

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('idle_last_active', Date.now().toString());
      this.saveToServer();
    });
  },

  // ── KALKULASI PROGRES OFFLINE / SAAT WEB DITUTUP (IDLE PROGRESS SIMULATOR) ──
  processOfflineProgress(elapsedSeconds) {
    if (elapsedSeconds < 30) return; // minimal 30 detik offline

    // Batasi kalkulasi maksimal 12 jam (43.200 detik)
    const cappedSeconds = Math.min(43200, elapsedSeconds);

    const stats = GameState.player.stats || { atk: 14, atkSpeed: 1.0, maxHp: 100, def: 0, critRate: 5, critDmg: 150, lifesteal: 0, goldBonus: 0, dropRateBonus: 0 };
    const avgHit = Math.max(1, (stats.atk || 14)) * (1 + ((stats.critRate || 5) / 100) * (((stats.critDmg || 150) / 100) - 1));
    const playerDPS = Math.max(1, avgHit * (stats.atkSpeed || 1.0));
    const playerLifestealDPS = playerDPS * ((stats.lifesteal || 0) / 100);

    let currentWave = GameState.player.wave || 1;
    let highestWave = GameState.player.highestWaveReached || currentWave;
    let kills = 0;
    let earnedGold = 0;
    const gainedItems = [];
    let autoSoldItemsCount = 0;
    let autoSoldGold = 0;

    let remainingTime = cappedSeconds;
    let maxSimulationSteps = 5000; // Pembatas aman komputasi instan

    while (remainingTime > 1.0 && maxSimulationSteps > 0) {
      maxSimulationSteps--;
      const enemyHp = 30 * Math.pow(1.055, currentWave - 1);
      const enemyAtk = 4 * Math.pow(1.042, currentWave - 1);
      const enemyDps = Math.max(1, enemyAtk * (1 - (stats.def || 0) / 100)) * 0.7;

      // Waktu bunuh musuh (dps player + delay respawn 0.7 detik)
      const killTime = Math.max(0.6, enemyHp / playerDPS) + 0.7;

      if (remainingTime < killTime) break;

      // Cek apakah player bertahan menghadapi musuh di wave ini
      const netDmgPerSec = Math.max(0, enemyDps - playerLifestealDPS);
      const totalDmgTaken = netDmgPerSec * (killTime - 0.7);

      if (totalDmgTaken >= (stats.maxHp || 100)) {
        // Player kalah di wave ini, mundur 1 wave untuk farming aman
        currentWave = Math.max(1, currentWave - 1);
        remainingTime -= killTime;
      } else {
        // Player menang membunuh musuh
        kills++;
        remainingTime -= killTime;

        // Hadiah Gold per musuh
        const baseGold = Math.floor((currentWave * 2 + 5) * (1 + (stats.goldBonus || 0) / 100));
        earnedGold += baseGold;

        // Peluang Drop Item
        const dropInfo = this.calculateEnemyDropRate(currentWave);
        if (Math.random() * 100 <= dropInfo.totalDrop) {
          const item = this.generateLootItem(currentWave);
          if (GameState.player.inventory.length + gainedItems.length < 24) {
            gainedItems.push(item);
          } else {
            // Tas penuh, jual otomatis ke NPC!
            autoSoldItemsCount++;
            autoSoldGold += item.npcSellPrice || 15;
          }
        }

        // Peningkatan wave: setiap 5 kills, naik 1 wave
        if (kills % 5 === 0 && currentWave < 500) {
          currentWave++;
          if (currentWave > highestWave) highestWave = currentWave;
        }
      }
    }

    // Terapkan hasil offline ke state pemain
    GameState.player.gold += (earnedGold + autoSoldGold);
    GameState.player.wave = currentWave;
    GameState.player.highestWaveReached = Math.max(GameState.player.highestWaveReached, highestWave);

    gainedItems.forEach(item => {
      GameState.player.inventory.push(item);
    });

    this.recalculatePlayerStats();
    this.updateGoldUI();
    this.renderInventory();
    this.updateWaveUI();
    this.saveGame();

    // Format durasi offline
    const hours = Math.floor(cappedSeconds / 3600);
    const mins = Math.floor((cappedSeconds % 3600) / 60);
    const secs = cappedSeconds % 60;
    let timeStr = '';
    if (hours > 0) timeStr += `${hours} Jam `;
    if (mins > 0) timeStr += `${mins} Menit `;
    if (hours === 0 && mins === 0) timeStr += `${secs} Detik`;

    // Tampilkan Modal Laporan Offline
    this.showOfflineReportModal({
      durationStr: timeStr.trim(),
      kills,
      earnedGold,
      autoSoldGold,
      totalGold: earnedGold + autoSoldGold,
      gainedItems,
      autoSoldItemsCount,
      waveReached: currentWave
    });
  },

  showOfflineReportModal(report) {
    const modal = document.getElementById('modal-offline-report');
    if (!modal) return;

    const durationEl = document.getElementById('offline-duration');
    const killsEl = document.getElementById('offline-kills');
    const goldEl = document.getElementById('offline-gold');
    const itemsEl = document.getElementById('offline-items');
    const waveEl = document.getElementById('offline-wave');
    const autoSellNote = document.getElementById('offline-autosell-note');

    if (durationEl) durationEl.innerText = report.durationStr;
    if (killsEl) killsEl.innerText = report.kills.toLocaleString('id-ID');
    if (goldEl) goldEl.innerText = `+${report.totalGold.toLocaleString('id-ID')} Gold`;
    if (itemsEl) itemsEl.innerText = `+${report.gainedItems.length} Item`;
    if (waveEl) waveEl.innerText = `Wave ${report.waveReached}`;

    if (autoSellNote) {
      if (report.autoSoldItemsCount > 0) {
        autoSellNote.style.display = 'block';
        autoSellNote.innerHTML = `⚠️ Tas penuh! <b>${report.autoSoldItemsCount} item</b> lainnya otomatis dijual ke NPC seharga <b>+${report.autoSoldGold.toLocaleString('id-ID')} Gold</b>.`;
      } else {
        autoSellNote.style.display = 'none';
      }
    }

    modal.classList.add('active');
  },

  // ── PAPAN PERINGKAT GLOBAL (LEADERBOARD) ──
  async loadLeaderboard() {
    const listEl = document.getElementById('leaderboard-list-body');
    const totalEl = document.getElementById('leaderboard-total-count');
    if (!listEl) return;

    listEl.innerHTML = '<div class="leaderboard-loading">Memuat peringkat dari server...</div>';

    // 1. Coba ambil dari server API lokal / online publik
    try {
      const lbUrl = window.getApiUrl ? window.getApiUrl('/api/leaderboard') : '/api/leaderboard';
      const res = await fetch(lbUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard && data.leaderboard.length > 0) {
          this.renderLeaderboardRows(listEl, totalEl, data.leaderboard, data.totalPlayers || data.leaderboard.length);
          return;
        }
      }
    } catch (e) {}

    // 2. Coba ambil dari data statis data/players.json (GitHub Pages / Standalone)
    try {
      const paths = ['data/players.json', './data/players.json', '/idle-fight/data/players.json'];
      let staticData = null;
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            staticData = await res.json();
            break;
          }
        } catch (err) {}
      }

      if (staticData && staticData.players) {
        const list = Object.values(staticData.players).map(p => {
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

        // Gabungkan dengan karakter saat ini jika belum ada di snapshot
        const exists = list.some(x => x.id === GameState.player.id);
        if (!exists) {
          const currentHero = {
            id: GameState.player.id,
            name: GameState.player.name,
            wave: GameState.player.wave,
            highestWaveReached: GameState.player.highestWaveReached || GameState.player.wave,
            gold: GameState.player.gold,
            legendaryCount: Object.values(GameState.player.equipped || {}).filter(eq => eq && eq.rarity === 'legendary').length
          };
          list.push(currentHero);
        }

        list.sort((a, b) => {
          if (b.highestWaveReached !== a.highestWaveReached) return b.highestWaveReached - a.highestWaveReached;
          if (b.wave !== a.wave) return b.wave - a.wave;
          return b.gold - a.gold;
        });

        const formatted = list.map((item, idx) => ({ rank: idx + 1, ...item }));
        this.renderLeaderboardRows(listEl, totalEl, formatted, list.length);
        return;
      }
    } catch (e) {}

    // 3. Fallback: Standalone LocalStorage Leaderboard
    this.renderStandaloneLeaderboard(listEl, totalEl);
  },

  renderLeaderboardRows(listEl, totalEl, playerList, totalCount) {
    if (!listEl) return;
    if (totalEl) totalEl.innerText = `${totalCount || playerList.length} Pahlawan Terdaftar`;

    if (!playerList || playerList.length === 0) {
      listEl.innerHTML = '<div class="leaderboard-loading">Belum ada data pahlawan di server.</div>';
      return;
    }

    let html = '';
    playerList.forEach((player) => {
      const isMe = player.id === GameState.player.id;
      let rankBadgeClass = '';
      let rankDisplay = `#${player.rank}`;

      if (player.rank === 1) {
        rankBadgeClass = 'rank-1';
        rankDisplay = '🥇 1';
      } else if (player.rank === 2) {
        rankBadgeClass = 'rank-2';
        rankDisplay = '🥈 2';
      } else if (player.rank === 3) {
        rankBadgeClass = 'rank-3';
        rankDisplay = '🥉 3';
      }

      const legBadge = player.legendaryCount > 0
        ? `<span class="leg-gear-badge" title="${player.legendaryCount} Item Legendary">✨ ${player.legendaryCount} Leg</span>`
        : '';

      html += `
        <div class="leaderboard-row ${isMe ? 'is-me' : ''}">
          <div class="rank-col ${rankBadgeClass}">${rankDisplay}</div>
          <div class="name-col">
            <span class="player-rank-name">${this.escapeHtml(player.name)}</span>
            ${isMe ? '<span class="you-tag">(Anda)</span>' : ''}
            ${legBadge}
          </div>
          <div class="wave-col">
            <span class="wave-record-badge">Wave ${player.highestWaveReached}</span>
          </div>
          <div class="curwave-col">Wave ${player.wave}</div>
          <div class="gold-col">💰 ${(player.gold || 0).toLocaleString('id-ID')}</div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  renderStandaloneLeaderboard(listEl, totalEl) {
    if (!listEl) return;

    // Ambil daftar pemain yang tersimpan (hanya pahlawan pemain asli)
    let standaloneSavedPlayers = [];
    try {
      const stored = localStorage.getItem('idle_standalone_players_list');
      if (stored) {
        standaloneSavedPlayers = JSON.parse(stored);
      }
    } catch (e) {}

    const currentHero = {
      id: GameState.player.id,
      name: GameState.player.name,
      wave: GameState.player.wave,
      highestWaveReached: GameState.player.highestWaveReached || GameState.player.wave,
      gold: GameState.player.gold,
      legendaryCount: Object.values(GameState.player.equipped || {}).filter(eq => eq && eq.rarity === 'legendary').length
    };

    // Filter dan update entri pemain saat ini tanpa bot/nama asing
    const playerMap = new Map();
    standaloneSavedPlayers.forEach(p => {
      if (p && p.name && !p.id.startsWith('bot_')) {
        playerMap.set(p.id, p);
      }
    });
    playerMap.set(currentHero.id, currentHero);

    const combined = Array.from(playerMap.values());
    try {
      localStorage.setItem('idle_standalone_players_list', JSON.stringify(combined));
    } catch (e) {}

    combined.sort((a, b) => {
      if (b.highestWaveReached !== a.highestWaveReached) return b.highestWaveReached - a.highestWaveReached;
      if (b.wave !== a.wave) return b.wave - a.wave;
      return b.gold - a.gold;
    });

    if (totalEl) totalEl.innerText = `${combined.length} Pahlawan Terdaftar`;

    let html = '';
    combined.forEach((player, idx) => {
      const rank = idx + 1;
      const isMe = player.id === GameState.player.id;
      let rankBadgeClass = '';
      let rankDisplay = `#${rank}`;

      if (rank === 1) { rankBadgeClass = 'rank-1'; rankDisplay = '🥇 1'; }
      else if (rank === 2) { rankBadgeClass = 'rank-2'; rankDisplay = '🥈 2'; }
      else if (rank === 3) { rankBadgeClass = 'rank-3'; rankDisplay = '🥉 3'; }

      const legBadge = player.legendaryCount > 0
        ? `<span class="leg-gear-badge" title="${player.legendaryCount} Item Legendary">✨ ${player.legendaryCount} Leg</span>`
        : '';

      html += `
        <div class="leaderboard-row ${isMe ? 'is-me' : ''}">
          <div class="rank-col ${rankBadgeClass}">${rankDisplay}</div>
          <div class="name-col">
            <span class="player-rank-name">${this.escapeHtml(player.name)}</span>
            ${isMe ? '<span class="you-tag">(Anda)</span>' : ''}
            ${legBadge}
          </div>
          <div class="wave-col">
            <span class="wave-record-badge">Wave ${player.highestWaveReached}</span>
          </div>
          <div class="curwave-col">Wave ${player.wave}</div>
          <div class="gold-col">💰 ${(player.gold || 0).toLocaleString('id-ID')}</div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  // ── GANTI NAMA KARAKTER PAHLAWAN (RENAME) ──
  async changePlayerName(newName) {
    const clean = (newName || '').trim();
    if (!clean || clean.length < 2 || clean.length > 20) {
      this.showToast('Nama harus antara 2 hingga 20 karakter!', 'error');
      return false;
    }

    try {
      const renameUrl = window.getApiUrl ? window.getApiUrl('/api/player/rename') : '/api/player/rename';
      const res = await fetch(renameUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: GameState.player.id, newName: clean })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || 'Gagal mengubah nama', 'error');
        return false;
      }
    } catch (err) {
      // Standalone / Google Sites Mode: Simpan lokal
    }

    GameState.player.name = clean;
    localStorage.setItem('idle_player_name', clean);
    this.saveGame();

    // Update UI Header
    const profileNameEl = document.getElementById('profile-name');
    if (profileNameEl) profileNameEl.innerText = clean;

    this.showToast(`✨ Nama berhasil diubah menjadi: ${clean}!`, 'success');
    this.logCombat(`✨ Karakter pahlawan berganti nama menjadi <b>${clean}</b>.`);
    return true;
  },

  // ── EKSPOR & IMPOR SAVE GAME (TRANSFER & GOOGLE SITES BACKUP) ──
  exportSave() {
    const data = {
      id: GameState.player.id,
      name: GameState.player.name,
      gold: GameState.player.gold,
      wave: GameState.player.wave,
      highestWaveReached: GameState.player.highestWaveReached,
      lastDeathWave: GameState.player.lastDeathWave,
      inventory: GameState.player.inventory,
      equipped: GameState.player.equipped,
      savedAt: Date.now()
    };
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      navigator.clipboard.writeText(b64);
      this.showToast('📋 Kode save game disalin ke clipboard!', 'success');
    } catch (e) {
      prompt('Salin teks kode save berikut:', JSON.stringify(data));
    }
  },

  importSave() {
    const code = prompt('Tempelkan kode save game Anda di bawah ini:');
    if (!code || !code.trim()) return;

    try {
      let rawJson = code.trim();
      if (!rawJson.startsWith('{')) {
        rawJson = decodeURIComponent(escape(atob(rawJson)));
      }
      const parsed = JSON.parse(rawJson);
      if (!parsed.id) throw new Error('Format kode save tidak valid');

      GameState.player.id = parsed.id;
      GameState.player.name = parsed.name || 'Hero';
      GameState.player.gold = typeof parsed.gold === 'number' ? parsed.gold : 150;
      GameState.player.wave = typeof parsed.wave === 'number' ? parsed.wave : 1;
      GameState.player.highestWaveReached = typeof parsed.highestWaveReached === 'number' ? parsed.highestWaveReached : parsed.wave || 1;
      GameState.player.lastDeathWave = parsed.lastDeathWave;
      GameState.player.equipped = parsed.equipped || {};
      GameState.player.inventory = Array.isArray(parsed.inventory) ? parsed.inventory : [];

      localStorage.setItem('idle_player_id', parsed.id);
      localStorage.setItem('idle_player_name', parsed.name);
      this.saveGame();

      this.recalculatePlayerStats();
      this.updateGoldUI();
      this.renderEquipment();
      this.renderInventory();
      this.updateWaveUI();
      this.spawnEnemy();

      const profileNameEl = document.getElementById('profile-name');
      const profileIdEl = document.getElementById('profile-id');
      if (profileNameEl) profileNameEl.innerText = parsed.name;
      if (profileIdEl) profileIdEl.innerText = `ID: ${parsed.id}`;

      this.showToast('🎉 Berhasil memulihkan progres karakter!', 'success');
      this.logCombat(`🎉 Progres karakter <b>${parsed.name}</b> berhasil dimuat!`);
    } catch (err) {
      this.showToast('Kode save tidak valid atau rusak!', 'error');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  async switchAccount(targetId, targetName) {
    if (!targetId || !targetId.trim()) {
      this.showToast('Masukkan ID Akun yang valid!', 'error');
      return false;
    }
    const cleanId = targetId.trim();

    // 1. Coba hubungi server backend (jika bermain via localhost / online publik)
    try {
      const loginUrl = window.getApiUrl ? window.getApiUrl('/api/player/login') : '/api/player/login';
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId, name: targetName })
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.player;
        this.applyLoadedPlayer(p);
        return true;
      }
    } catch (err) {
      // Fallback untuk GitHub Pages / Standalone mode
    }

    // 2. Fallback GitHub Pages: cari di snapshot file statis data/players.json
    try {
      const paths = ['data/players.json', './data/players.json', '/idle-fight/data/players.json'];
      let staticDb = null;
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            staticDb = await res.json();
            break;
          }
        } catch (e) {}
      }

      if (staticDb && staticDb.players && staticDb.players[cleanId]) {
        const p = staticDb.players[cleanId];
        this.applyLoadedPlayer(p);
        return true;
      }
    } catch (err) {}

    // 3. Jika ID baru di GitHub Pages, buat karakter lokal dengan ID & Nama tersebut
    const fallbackPlayer = {
      id: cleanId,
      name: targetName || cleanId,
      gold: 150,
      wave: 1,
      highestWaveReached: 1,
      lastDeathWave: null,
      equipped: {},
      inventory: []
    };
    this.applyLoadedPlayer(fallbackPlayer);
    return true;
  },

  applyLoadedPlayer(p) {
    GameState.player.id = p.id;
    GameState.player.name = p.name || 'Hero';
    GameState.player.gold = typeof p.gold === 'number' ? p.gold : 150;
    GameState.player.wave = typeof p.wave === 'number' ? p.wave : 1;
    GameState.player.highestWaveReached = typeof p.highestWaveReached === 'number' ? p.highestWaveReached : (p.wave || 1);
    GameState.player.lastDeathWave = p.lastDeathWave || null;
    GameState.player.equipped = p.equipped || {};
    GameState.player.inventory = Array.isArray(p.inventory) ? p.inventory : [];

    localStorage.setItem('idle_player_id', p.id);
    localStorage.setItem('idle_player_name', p.name);
    this.saveGame();

    // Update UI Header
    const profileNameEl = document.getElementById('profile-name');
    const profileIdEl = document.getElementById('profile-id');
    if (profileNameEl) profileNameEl.innerText = p.name;
    if (profileIdEl) profileIdEl.innerText = `ID: ${p.id}`;

    this.recalculatePlayerStats();
    this.updateGoldUI();
    this.renderEquipment();
    this.renderInventory();
    this.updateWaveUI();
    this.spawnEnemy();

    this.showToast(`✨ Berhasil memuat Akun: ${p.name}!`, 'success');
    this.logCombat(`✨ Berganti ke Akun: <b>${p.name}</b> (Wave ${p.wave}, Gold ${p.gold}).`);
  },

  loadGame() {
    try {
      const raw = localStorage.getItem('idle_exchange_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.gold === 'number') GameState.player.gold = parsed.gold;
        if (typeof parsed.wave === 'number') GameState.player.wave = parsed.wave;
        if (typeof parsed.highestWaveReached === 'number') GameState.player.highestWaveReached = parsed.highestWaveReached;
        if (parsed.lastDeathWave !== undefined) GameState.player.lastDeathWave = parsed.lastDeathWave;
        if (Array.isArray(parsed.inventory)) GameState.player.inventory = parsed.inventory;
        if (parsed.equipped) GameState.player.equipped = parsed.equipped;
      }
    } catch (err) {
      console.warn('Gagal load save game:', err);
    }
  }
};

document.addEventListener('click', () => GameEngine.closeItemContextMenu());

window.GameState = GameState;
window.GameEngine = GameEngine;
window.ITEM_ICON_MAP = ITEM_ICON_MAP;
window.getItemIcon = getItemIcon;
window.ITEM_TEMPLATES = ITEM_TEMPLATES;
window.RARITIES = RARITIES;

