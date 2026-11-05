// ============================================================================
// 🌐 PENGATURAN ALAMAT SERVER GAME (IDLE FIGHT RPG)
// ============================================================================
// Ubah alamat di bawah ini jika URL server berubah (Cloudflare Tunnel / Koyeb / Render / VPS):
window.DEFAULT_SERVER_URL = 'https://smile-insured-stated-receives.trycloudflare.com';
// ============================================================================

/**
 * Mendapatkan URL server aktif (memprioritaskan server yang disetel pemain di UI localStorage)
 */
window.getServerUrl = function() {
  const custom = localStorage.getItem('GAME_SERVER_URL');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  if (window.DEFAULT_SERVER_URL && window.DEFAULT_SERVER_URL.trim()) {
    return window.DEFAULT_SERVER_URL.trim().replace(/\/+$/, '');
  }
  return '';
};

/**
 * Membentuk URL API lengkap berdasarkan endpoint
 * @param {string} endpoint contoh: '/api/player/login'
 * @returns {string} URL endpoint yang sudah digabung dengan host server
 */
window.getApiUrl = function(endpoint) {
  const base = window.getServerUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${path}` : path;
};

/**
 * Mengecek apakah server dapat dijangkau
 */
window.checkServerStatus = async function(customUrl) {
  const base = (customUrl || window.getServerUrl() || '').replace(/\/+$/, '');
  if (!base) return { ok: false, error: 'URL Server kosong' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/server-info`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
