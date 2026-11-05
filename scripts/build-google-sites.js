const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function buildGoogleSitesEmbed() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  let html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
  const css = fs.readFileSync(path.join(PUBLIC_DIR, 'css', 'style.css'), 'utf-8');
  const config = fs.readFileSync(path.join(PUBLIC_DIR, 'js', 'config.js'), 'utf-8');
  const renderEngine = fs.readFileSync(path.join(PUBLIC_DIR, 'js', 'RenderEngine.js'), 'utf-8');
  const gameEngine = fs.readFileSync(path.join(PUBLIC_DIR, 'js', 'GameEngine.js'), 'utf-8');
  const marketEngine = fs.readFileSync(path.join(PUBLIC_DIR, 'js', 'MarketEngine.js'), 'utf-8');

  // 1. Inline CSS
  const cssTag = `<style>\n${css}\n</style>`;
  html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/, cssTag);

  // 2. Inline JavaScript engines
  const bundledScripts = `
<script>
/* --- config.js --- */
${config}
</script>
<script>
/* --- RenderEngine.js --- */
${renderEngine}
</script>
<script>
/* --- GameEngine.js --- */
${gameEngine}
</script>
<script>
/* --- MarketEngine.js --- */
${marketEngine}
</script>
  `.trim();

  // Replace external script tags with bundled scripts
  html = html.replace(
    /<script src="js\/config\.js"><\/script>\s*<script src="js\/RenderEngine\.js"><\/script>\s*<script src="js\/GameEngine\.js"><\/script>\s*<script src="js\/MarketEngine\.js"><\/script>/,
    bundledScripts
  );

  const outputPath = path.join(DIST_DIR, 'google-sites-embed.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`[SUCCESS] Bundle Google Sites berhasil dibuat di:\n${outputPath}`);
  console.log(`Ukuran file: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

  // Update root index.html juga agar siap di-hosting langsung (misal GitHub Pages)
  const rootIndexPath = path.join(ROOT_DIR, 'index.html');
  fs.writeFileSync(rootIndexPath, html, 'utf-8');
  console.log(`[SUCCESS] Root index.html berhasil diperbarui untuk GitHub Pages:\n${rootIndexPath}`);
}

buildGoogleSitesEmbed();
