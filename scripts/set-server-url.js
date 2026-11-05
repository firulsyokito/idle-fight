const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'public', 'js', 'config.js');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build-google-sites.js');

function updateUrl(newUrl) {
  if (!newUrl || !newUrl.trim()) {
    console.log('❌ URL tidak boleh kosong!');
    return;
  }
  const cleanUrl = newUrl.trim().replace(/\/+$/, '');
  
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ File config.js tidak ditemukan:', CONFIG_PATH);
    return;
  }

  let content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  content = content.replace(
    /window\.DEFAULT_SERVER_URL\s*=\s*['"`](.*?)['"`];/,
    `window.DEFAULT_SERVER_URL = '${cleanUrl}';`
  );

  fs.writeFileSync(CONFIG_PATH, content, 'utf-8');
  console.log(`\n✅ Berhasil mengubah window.DEFAULT_SERVER_URL di config.js menjadi:\n   ${cleanUrl}\n`);

  console.log('🔄 Membangun ulang bundle untuk GitHub Pages (index.html & dist)...');
  require(BUILD_SCRIPT);
  console.log('\n🎉 Selesai! File index.html sudah diperbarui dengan URL server terbaru.');
  console.log('Tinggal lakukan `git add .`, `git commit`, dan `git push` ke GitHub Pages!');
}

const argUrl = process.argv[2];
if (argUrl) {
  updateUrl(argUrl);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('👉 Masukkan URL Server Baru (contoh: https://xxx.trycloudflare.com):\n> ', (answer) => {
    rl.close();
    updateUrl(answer);
  });
}

