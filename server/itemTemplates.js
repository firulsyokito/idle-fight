// server/itemTemplates.js
// Template data untuk sistem shop dan validasi item

const RARITIES = {
  common:    { multiplier: 1.0,  baseNpcSell: 15,    color: '#94a3b8' },
  uncommon:  { multiplier: 2.0,  baseNpcSell: 60,    color: '#22c55e' },
  rare:      { multiplier: 6.0,  baseNpcSell: 350,   color: '#3b82f6' },
  epic:      { multiplier: 30.0, baseNpcSell: 2200,  color: '#a855f7' },
  legendary: { multiplier: 90.0, baseNpcSell: 10000, color: '#f59e0b' }
};

const SYSTEM_ITEM_TEMPLATES = [
  // Common
  { id: 'iron_dagger',       name: 'Belati Besi Tumpul',        slot: 'weapon',    stat: 'atk',             baseVal: 4,    unit: '',  icon: '🗡️', desc: '+ATK Flat' },
  { id: 'wooden_club',       name: 'Gada Kayu Berat',           slot: 'weapon',    stat: 'atk',             baseVal: 5,    unit: '',  icon: '🪵', desc: '+ATK Flat' },
  { id: 'hunting_slingshot', name: 'Ketapel Berburu',           slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.08, unit: 'x', icon: '🪀', desc: '+Atk Speed' },
  { id: 'leather_vest',      name: 'Rompi Kulit Domba',         slot: 'armor',     stat: 'damageReduction', baseVal: 1,    unit: '%', icon: '🦺', desc: '+Dmg Reduction' },
  { id: 'worn_sandals',      name: 'Sandal Usang',              slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.05, unit: 'x', icon: '🥿', desc: '+Atk Speed' },
  { id: 'wooden_buckler',    name: 'Tameng Kayu',               slot: 'shield',    stat: 'maxHp',           baseVal: 12,   unit: '',  icon: '🛡️', desc: '+Max HP' },
  { id: 'simple_charm',      name: 'Jimat Sederhana',           slot: 'accessory', stat: 'dropRateBonus',   baseVal: 3,    unit: '%', icon: '🧿', desc: '+Drop Rate' },
  { id: 'coin_purse',        name: 'Dompet Koin',               slot: 'special',   stat: 'goldBonus',       baseVal: 6,    unit: '%', icon: '💰', desc: '+Gold Bonus' },

  // Uncommon
  { id: 'iron_sword',        name: 'Pedang Besi',               slot: 'weapon',    stat: 'atk',             baseVal: 6,    unit: '',  icon: '⚔️',  desc: '+ATK Flat' },
  { id: 'wooden_bow',        name: 'Busur Kayu',                slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.20, unit: 'x', icon: '🏹', desc: '+Atk Speed' },
  { id: 'sickle_steel',      name: 'Celurit Baja',              slot: 'weapon',    stat: 'critRate',        baseVal: 3,    unit: '%', icon: '💢', desc: '+Crit Rate' },
  { id: 'shadow_cloak',      name: 'Jubah Bayangan',            slot: 'armor',     stat: 'dodge',           baseVal: 4,    unit: '%', icon: '🧥', desc: '+Dodge Chance' },
  { id: 'titan_belt',        name: 'Sabuk Titan',               slot: 'armor',     stat: 'damageReduction', baseVal: 3,    unit: '%', icon: '🩳', desc: '+Dmg Reduction' },
  { id: 'hunter_boots',      name: 'Sepatu Laras Pemburu',      slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.12, unit: 'x', icon: '🥾', desc: '+Atk Speed' },
  { id: 'iron_kite_shield',  name: 'Perisai Layang Besi',       slot: 'shield',    stat: 'maxHp',           baseVal: 25,   unit: '',  icon: '🛡️', desc: '+Max HP' },
  { id: 'silver_ring',       name: 'Cincin Perak Tempaan',      slot: 'accessory', stat: 'critRate',        baseVal: 4,    unit: '%', icon: '💍', desc: '+Crit Rate' },
  { id: 'fortune_dice',      name: 'Dadu Keberuntungan',        slot: 'special',   stat: 'dropRateBonus',   baseVal: 6,    unit: '%', icon: '🎲', desc: '+Drop Rate' },

  // Rare
  { id: 'berserker_axe',     name: 'Kapak Mengamuk',            slot: 'weapon',    stat: 'critDmg',         baseVal: 20,   unit: '%', icon: '🪓', desc: '+Crit Damage' },
  { id: 'warrior_sword',     name: 'Pedang Prajurit',           slot: 'weapon',    stat: 'atk',             baseVal: 14,   unit: '',  icon: '🗡️', desc: '+ATK Flat' },
  { id: 'ice_spear',         name: 'Tombak Es',                 slot: 'weapon',    stat: 'atkSpeed',        baseVal: 0.25, unit: 'x', icon: '❄️',  desc: '+Atk Speed' },
  { id: 'steel_plate_armor', name: 'Zirah Lempeng Baja',        slot: 'armor',     stat: 'damageReduction', baseVal: 5,    unit: '%', icon: '🛡️', desc: '+Dmg Reduction' },
  { id: 'giant_shield',      name: 'Perisai Raksasa',           slot: 'shield',    stat: 'maxHp',           baseVal: 35,   unit: '',  icon: '🛡️', desc: '+Max HP Flat' },
  { id: 'agile_boots',       name: 'Sepatu Gesit',              slot: 'boots',     stat: 'atkSpeed',        baseVal: 0.15, unit: 'x', icon: '👢', desc: '+Atk Speed' },
  { id: 'blood_amulet',      name: 'Amulet Darah',              slot: 'accessory', stat: 'lifesteal',       baseVal: 6,    unit: '%', icon: '🧣', desc: '+Lifesteal' },
  { id: 'ruby_ring',         name: 'Cincin Permata Merah',      slot: 'accessory', stat: 'critRate',        baseVal: 6,    unit: '%', icon: '💍', desc: '+Crit Rate' },
  { id: 'merchant_pouch',    name: 'Kantong Saudagar',          slot: 'special',   stat: 'goldBonus',       baseVal: 15,   unit: '%', icon: '👛', desc: '+Gold Multiplier' },

  // Epic
  { id: 'shadow_sword',      name: 'Pedang Bayangan',           slot: 'weapon',    stat: 'atk',             baseVal: 22,   unit: '',  icon: '🗡️', desc: '+ATK + Shadow' },
  { id: 'fire_bow',          name: 'Busur Api Neraka',          slot: 'weapon',    stat: 'critDmg',         baseVal: 35,   unit: '%', icon: '🔥', desc: '+CritDmg Inferno' },
  { id: 'dark_robe',         name: 'Jubah Kegelapan',           slot: 'armor',     stat: 'damageReduction', baseVal: 8,    unit: '%', icon: '🌪️', desc: '+Dmg Reduction' },
  { id: 'aegis_of_valor',    name: 'Tameng Keberanian Suci',    slot: 'shield',    stat: 'maxHp',           baseVal: 80,   unit: '',  icon: '✨',  desc: '+Max HP Flat' },
  { id: 'wind_walker_boots', name: 'Sepatu Pejalan Angin',      slot: 'boots',     stat: 'dodge',           baseVal: 12,   unit: '%', icon: '👟', desc: '+Dodge Chance' },
  { id: 'amethyst_eye',      name: 'Mata Ametis Mistik',        slot: 'accessory', stat: 'critRate',        baseVal: 8,    unit: '%', icon: '🔮', desc: '+Crit Rate' },

  // Legendary
  {
    id: 'divine_thunder_sword',
    name: 'Pedang Petir Dewa',
    slot: 'weapon',
    stat: 'atk',
    baseVal: 18,
    unit: '',
    icon: '⚡',
    desc: '+ATK + Kilat Berantai',
    rarity: 'legendary',
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
    icon: '👻',
    desc: '+DR + Perisai Jiwa',
    rarity: 'legendary',
    legendaryEffect: 'soulShield',
    legendaryVfx: 'soulBubble',
    legendaryDesc: 'Setiap wave baru: absorb 1 serangan secara penuh (Perisai Jiwa)'
  },
  {
    id: 'phoenix_feather_cloak',
    name: 'Jubah Sayap Phoenix',
    slot: 'armor',
    stat: 'maxHp',
    baseVal: 120,
    unit: '',
    icon: '🪶',
    desc: '+HP + Bangkit Dari Mati',
    rarity: 'legendary',
    legendaryEffect: 'phoenixRevive',
    legendaryVfx: 'phoenixWings',
    legendaryDesc: 'Revive instan 1x saat HP habis dengan 100% HP (cooldown per run)'
  }
];

module.exports = {
  RARITIES,
  SYSTEM_ITEM_TEMPLATES
};

