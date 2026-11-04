/**
 * IDLE EXCHANGE - RenderEngine.js
 * Canvas 2D Visual Effects, Parallax Fantasy Forest ("BG Berjalan"),
 * Karakter di Kiri, Musuh dari Kanan, Auras, Hit Flash & Loot Physics
 */

const RenderEngine = {
  canvas: null,
  ctx: null,
  width: 800,
  height: 480,
  groundY: 380,

  // Parallax Background Layers ("BG Berjalan" dari Kanan ke Kiri)
  bgOffset: 0,
  bgSpeed: 55, // pixels per second untuk efek maju yang terasa
  fireflies: [],

  // Animations & Timers
  time: 0,
  screenShakeTimer: 0,
  screenShakeMagnitude: 4,

  // Sprites Coordinates
  player: {
    baseX: 160,
    baseY: 380,
    currentX: 160,
    currentY: 380,
    attackOffset: 0,
    isAttacking: false,
    attackProgress: 0,
    hitFlashTimer: 0,
    slashVfx: null
  },

  enemy: {
    baseX: 640,
    baseY: 380,
    currentX: 640,
    currentY: 380,
    attackOffset: 0,
    isAttacking: false,
    attackProgress: 0,
    hitFlashTimer: 0,
    entryProgress: 1.0,
    isEntering: false
  },

  // Visual Pools (Semua array diproteksi dari memory leak dengan auto-filtering)
  auraTier: 0,
  auraParticles: [],
  floatingTexts: [],
  droppedLoots: [],
  flyingLoots: [],
  legendaryVfxPool: [],   // Pool semua efek VFX legendary aktif

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.groundY = 380;
    this.player.baseY = this.groundY;
    this.enemy.baseY = this.groundY;

    // Partikel Kunang-kunang di Hutan Fantasi
    this.fireflies = [];
    for (let i = 0; i < 30; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: 60 + Math.random() * 260,
        radius: 1.2 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.8,
        speedX: -15 - Math.random() * 20,
        speedY: (Math.random() - 0.5) * 12
      });
    }

    // Klik event untuk Loot Drop di Canvas
    this.canvas.addEventListener('pointerdown', (e) => this.handleCanvasClick(e));
  },

  // 1. UPDATE LOOP
  update(dt) {
    this.time += dt;

    // Background Scroll ("BG Berjalan" Bergerak terus dari kanan ke kiri)
    this.bgOffset = (this.bgOffset + this.bgSpeed * dt) % this.width;

    // Screen Shake
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
    }

    // Hit Flash
    if (this.player.hitFlashTimer > 0) this.player.hitFlashTimer -= dt;
    if (this.enemy.hitFlashTimer > 0) this.enemy.hitFlashTimer -= dt;

    // Animasi Lunge Serang Player (Maju X+30px)
    if (this.player.isAttacking) {
      this.player.attackProgress += dt * 5;
      if (this.player.attackProgress >= 1) {
        this.player.isAttacking = false;
        this.player.attackOffset = 0;
      } else {
        this.player.attackOffset = Math.sin(this.player.attackProgress * Math.PI) * 30;
      }
    }

    // Slash VFX
    if (this.player.slashVfx) {
      this.player.slashVfx.progress += dt * 6;
      if (this.player.slashVfx.progress >= 1) {
        this.player.slashVfx = null;
      }
    }

    // Animasi Lunge Serang Musuh (Maju X-30px)
    if (this.enemy.isAttacking) {
      this.enemy.attackProgress += dt * 5;
      if (this.enemy.attackProgress >= 1) {
        this.enemy.isAttacking = false;
        this.enemy.attackOffset = 0;
      } else {
        this.enemy.attackOffset = -Math.sin(this.enemy.attackProgress * Math.PI) * 30;
      }
    }

    // Animasi Masuk Musuh (Entry Spawn dari Kanan Layar)
    if (this.enemy.isEntering) {
      this.enemy.entryProgress += dt * 1.25;
      if (this.enemy.entryProgress >= 1) {
        this.enemy.entryProgress = 1;
        this.enemy.isEntering = false;
      }
    }

    // Update Kunang-kunang
    this.fireflies.forEach(f => {
      f.x += f.speedX * dt;
      f.y += f.speedY * dt;
      if (f.x < 0) f.x = this.width + 10;
      if (f.y < 50 || f.y > 330) f.speedY *= -1;
    });

    // Update Aura Partikel
    this.updateAuraParticles(dt);

    // Update Floating Damage Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 45;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Dropped Loot (Bouncing Physics dengan batas aman margin 2-3 cm & Auto-Collect Timer)
    const marginX = 95; // Batas margin ~2.5 cm dari tepi kiri dan kanan
    for (let i = this.droppedLoots.length - 1; i >= 0; i--) {
      const loot = this.droppedLoots[i];
      if (!loot.resting) {
        loot.x += loot.vx * dt * 60;
        loot.y += loot.vy * dt * 60;
        loot.vy += loot.gravity * dt * 60;

        // Cegah item keluar dari batas frame layar (Margin 2-3 cm)
        if (loot.x < marginX) {
          loot.x = marginX;
          loot.vx = Math.abs(loot.vx) * 0.45;
        } else if (loot.x > this.width - marginX) {
          loot.x = this.width - marginX;
          loot.vx = -Math.abs(loot.vx) * 0.45;
        }

        if (loot.y >= this.groundY - 12) {
          loot.y = this.groundY - 12;
          loot.vy = -loot.vy * 0.45;
          loot.vx *= 0.6;
          if (Math.abs(loot.vy) < 0.8) {
            loot.resting = true;
            loot.restTimer = 0;
          }
        }
      } else {
        // Tetap pastikan koordinat di dalam batas margin
        loot.x = Math.max(marginX, Math.min(this.width - marginX, loot.x));

        // Auto-Collect Loot Setelah Batas Waktu (5 detik setelah jatuh & beristirahat di tanah)
        loot.restTimer = (loot.restTimer || 0) + dt;
        if (loot.restTimer >= 5.0) {
          const collectedItem = loot.item;
          this.droppedLoots.splice(i, 1);
          this.launchLootFlyAnimation(loot.x, loot.y, collectedItem);
          continue;
        }
      }
      loot.pulse = Math.sin(this.time * 6 + i) * 3;
    }

    // Update Flying Loot (Terbang menuju Tas / Inventory)
    for (let i = this.flyingLoots.length - 1; i >= 0; i--) {
      const fl = this.flyingLoots[i];
      fl.progress += dt * 1.6;
      if (fl.progress >= 1) {
        if (fl.onArrived) fl.onArrived();
        this.flyingLoots.splice(i, 1);
      } else {
        const t = fl.progress;
        const cpX = (fl.startX + fl.targetX) / 2;
        const cpY = Math.min(fl.startY, fl.targetY) - 120;
        fl.x = (1 - t) * (1 - t) * fl.startX + 2 * (1 - t) * t * cpX + t * t * fl.targetX;
        fl.y = (1 - t) * (1 - t) * fl.startY + 2 * (1 - t) * t * cpY + t * t * fl.targetY;
        fl.scale = 1 - t * 0.4;
      }
    }

    // Update Legendary VFX Pool (auto-expire + partikel internal)
    for (let i = this.legendaryVfxPool.length - 1; i >= 0; i--) {
      const vfx = this.legendaryVfxPool[i];
      vfx.life -= dt;
      vfx.age = (vfx.age || 0) + dt;
      if (vfx.life <= 0) { this.legendaryVfxPool.splice(i, 1); continue; }
      if (vfx.particles) {
        for (const p of vfx.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        vfx.particles = vfx.particles.filter(p => p.life > 0);
      }
    }
  },

  // 2. PARALLAX "BG BERJALAN" (FANTASY FOREST SEAMLESS HORIZONTAL LOOP)
  drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Layer 0: Langit Malam Fantasi
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#060a17');
    skyGrad.addColorStop(0.5, '#0f1b33');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Bulan Mistis Bersinar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(w - 140, 80, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Layer 1: Siluet Pegunungan Jauh (Slow Scroll)
    const offsetMtn = (this.bgOffset * 0.25) % w;
    this.drawMountains(offsetMtn, '#131b2e', 220, 90);
    this.drawMountains(offsetMtn - w, '#131b2e', 220, 90);

    // Layer 2: Hutan Pinus Kuno Kabut Tengah (Medium Scroll)
    const offsetForest = (this.bgOffset * 0.55) % w;
    this.drawTreeLayer(offsetForest, '#17253d', 300, 75);
    this.drawTreeLayer(offsetForest - w, '#17253d', 300, 75);

    // Kunang-kunang Hutan Melayang
    this.fireflies.forEach(f => {
      ctx.fillStyle = `rgba(167, 243, 208, ${f.alpha})`;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Layer 3: Tanah Berlumut & Rerumputan Fantasi
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, h);
    groundGrad.addColorStop(0, '#1c283d');
    groundGrad.addColorStop(0.25, '#111827');
    groundGrad.addColorStop(1, '#080d18');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // Garis Permukaan Rumput Bercahaya Hijau
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(w, this.groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rerumputan Bergerak Cepat Seiring Langkah Kaki
    const grassOffset = (this.bgOffset * 1.2) % 30;
    ctx.fillStyle = '#10b981';
    for (let x = -grassOffset; x < w + 30; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + 5, this.groundY - 8);
      ctx.lineTo(x + 10, this.groundY);
      ctx.fill();
    }
  },

  drawMountains(offsetX, color, baseY, height) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-offsetX, this.groundY);
    ctx.lineTo(120 - offsetX, baseY - height);
    ctx.lineTo(300 - offsetX, baseY + 20);
    ctx.lineTo(520 - offsetX, baseY - height * 1.25);
    ctx.lineTo(680 - offsetX, baseY);
    ctx.lineTo(840 - offsetX, baseY - height);
    ctx.lineTo(this.width + 120 - offsetX, this.groundY);
    ctx.fill();
  },

  drawTreeLayer(offsetX, color, baseY, treeHeight) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    for (let x = -offsetX; x < this.width + 120; x += 65) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + 22, baseY - treeHeight);
      ctx.lineTo(x + 44, this.groundY);
      ctx.fill();
    }
  },

  // 3. SISA MAYAT PLAYER (CORPSE SYSTEM)
  drawPlayerCorpse(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.72;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 32, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(x - 26, y - 12, 42, 14, 6);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + 18, y - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 20, y - 11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 2);
    ctx.lineTo(x - 16, y - 28);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 24);
    ctx.lineTo(x - 12, y - 20);
    ctx.stroke();

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.fillText('💀 Sisa Mayat Terakhir', x, y - 36);

    ctx.restore();
  },

  // 4. PLAYER SPRITE (DI SISI KIRI ARENA)
  drawPlayer(gameState) {
    const ctx = this.ctx;
    const x = this.player.baseX + this.player.attackOffset;
    const y = this.player.baseY;

    // Squash & Stretch Animasi Idle
    const timeVal = this.time * 1000;
    const scaleY = 1 + Math.sin(timeVal * 0.005) * 0.05;
    const scaleX = 1 - Math.sin(timeVal * 0.005) * 0.03;

    ctx.save();
    ctx.translate(x, y);

    // Bayangan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28 * scaleX, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pivot Kaki
    ctx.scale(scaleX, scaleY);

    // Hit Flash
    if (this.player.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.2) drop-shadow(0 0 12px #ef4444)';
    }

    // Jubah Biru Belakang
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    const capeFlutter = Math.sin(timeVal * 0.008) * 5;
    ctx.moveTo(-18, -48);
    ctx.lineTo(-34 + capeFlutter, -10);
    ctx.lineTo(-14, -6);
    ctx.fill();

    // Tubuh & Zirah
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-16, -52, 32, 44, 6);
    ctx.fill();

    // Pelindung Dada Emas
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-9, -48, 18, 24, 4);
    ctx.fill();

    // Kepala / Helm Baja
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -64, 16, 0, Math.PI * 2);
    ctx.fill();

    // Visor Helm Bercahaya Cyan
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(2, -67, 12, 6);
    ctx.shadowBlur = 0;

    // Perisai di tangan kiri
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-18, -36, 9, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pedang di tangan kanan
    ctx.save();
    ctx.translate(16, -36);
    const swordSwing = this.player.isAttacking ? Math.PI / 4 : -Math.PI / 8;
    ctx.rotate(swordSwing);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-2, 0, 4, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = this.player.isAttacking ? 18 : 8;
    ctx.fillRect(-3, -44, 6, 44);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore();

    // Slash VFX Visual
    if (this.player.slashVfx) {
      this.drawSlashVfx(x + 40, y - 40, this.player.slashVfx.progress);
    }
  },

  drawSlashVfx(x, y, progress) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 6);
    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - progress})`;
    ctx.lineWidth = 7 * (1 - progress * 0.5);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, 42, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.restore();
  },

  // 5. MUSUH (MUNCUL & BERGERAK DARI KANAN MENUJU PLAYER)
  drawEnemy(gameState) {
    const ctx = this.ctx;
    const enemy = gameState.enemy;
    if (!enemy || enemy.currentHp <= 0) return;

    let targetX = this.enemy.baseX + this.enemy.attackOffset;
    let targetY = this.enemy.baseY;

    // Gerak maju dari tepi kanan layar (X: width -> targetX)
    const entryT = this.enemy.entryProgress;
    let x = (1 - entryT) * (this.width + 60) + entryT * targetX;
    let y = targetY;

    // Gerakan khusus per tipe:
    if (enemy.type === 'slime') {
      if (this.enemy.isEntering) {
        // Lompatan parabola sine wave saat masuk dari kanan
        const bounceCount = 3;
        const bounceY = -Math.abs(Math.sin(entryT * Math.PI * bounceCount)) * 48;
        y += bounceY;
      } else {
        const squish = Math.sin(this.time * 8) * 4;
        y += squish * 0.5;
      }
    }

    const isBoss = enemy.type === 'ogre';
    const scale = isBoss ? 1.6 : (enemy.type === 'goblin' ? 1.2 : 1.05);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (this.enemy.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.5) drop-shadow(0 0 14px #ef4444)';
    }

    // Bayangan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.type === 'slime') {
      this.drawSlimeSprite(ctx);
    } else if (enemy.type === 'goblin') {
      this.drawGoblinSprite(ctx);
    } else if (enemy.type === 'ogre') {
      this.drawOgreSprite(ctx);
    }

    ctx.restore();

    // Bar HP Musuh di atas kepala
    this.drawEnemyWorldHpBar(x, y - (58 * scale), enemy);
  },

  drawSlimeSprite(ctx) {
    const wobble = Math.sin(this.time * 10) * 0.08;
    ctx.scale(1 + wobble, 1 - wobble);

    const grad = ctx.createRadialGradient(-4, -20, 5, 0, -18, 28);
    grad.addColorStop(0, '#86efac');
    grad.addColorStop(0.7, '#22c55e');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.bezierCurveTo(-28, -32, -14, -40, 0, -40);
    ctx.bezierCurveTo(14, -40, 28, -32, 24, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-9, -20, 4, 0, Math.PI * 2);
    ctx.arc(9, -20, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -21, 1.5, 0, Math.PI * 2);
    ctx.arc(8, -21, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },

  drawGoblinSprite(ctx) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-11, -12, 7, 12);
    ctx.fillRect(4, -12, 7, 12);

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(-14, -42, 28, 32, 4);
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.fillRect(-12, -38, 24, 20);

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(0, -52, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-14, -54);
    ctx.lineTo(-26, -64);
    ctx.lineTo(-12, -48);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-9, -54, 5, 3.5);
    ctx.fillRect(2, -54, 5, 3.5);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-20, -36, 7, 20);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-20, -38, 7, 5);
  },

  drawOgreSprite(ctx) {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-18, -16, 14, 16);
    ctx.fillRect(7, -16, 14, 16);

    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.roundRect(-25, -60, 50, 48, 9);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(-25, -24, 50, 9);
    ctx.fillStyle = '#cbd5e1';
    for (let i = -20; i <= 20; i += 10) {
      ctx.beginPath();
      ctx.arc(i, -20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(0, -72, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-16, -82);
    ctx.lineTo(-30, -104);
    ctx.lineTo(-7, -88);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -82);
    ctx.lineTo(30, -104);
    ctx.lineTo(7, -88);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(-9, -68, 5, 7);
    ctx.fillRect(4, -68, 5, 7);

    // Great Spiked Club
    ctx.fillStyle = '#451a03';
    ctx.save();
    ctx.translate(-30, -50);
    ctx.rotate(-Math.PI / 5);
    ctx.fillRect(-7, -50, 16, 62);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-12, -44, 5, 5);
    ctx.fillRect(9, -35, 5, 5);
    ctx.fillRect(-12, -24, 5, 5);
    ctx.restore();
  },

  drawEnemyWorldHpBar(x, y, enemy) {
    const ctx = this.ctx;
    const barW = 80;
    const barH = 8;
    const pct = Math.max(0, Math.min(1, enemy.currentHp / enemy.maxHp));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - barW / 2, y, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x - barW / 2, y, barW * pct, barH, 4);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText(`${enemy.name}`, x, y - 6);
  },

  // 6. DYNAMIC PLAYER AURA
  setAuraTier(tier) {
    this.auraTier = tier;
  },

  updateAuraParticles(dt) {
    if (this.auraTier === 0) {
      this.auraParticles = [];
      return;
    }

    const maxParticles = this.auraTier === 3 ? 35 : (this.auraTier === 2 ? 25 : 15);
    if (this.auraParticles.length < maxParticles) {
      const pX = this.player.baseX + this.player.attackOffset;
      const pY = this.player.baseY;

      let color = '#38bdf8';
      let vy = -30 - Math.random() * 40;
      let size = 2.5 + Math.random() * 3.5;

      if (this.auraTier === 2) {
        color = '#c084fc';
        vy = -45 - Math.random() * 50;
        size = 3.5 + Math.random() * 4;
      } else if (this.auraTier === 3) {
        color = Math.random() > 0.3 ? '#fbbf24' : '#f59e0b';
        vy = -60 - Math.random() * 65;
        size = 4 + Math.random() * 5;
      }

      this.auraParticles.push({
        x: pX + (Math.random() - 0.5) * 42,
        y: pY - 5 - Math.random() * 18,
        vx: (Math.random() - 0.5) * 14,
        vy: vy,
        color: color,
        size: size,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }

    for (let i = this.auraParticles.length - 1; i >= 0; i--) {
      const part = this.auraParticles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      if (part.life <= 0) {
        this.auraParticles.splice(i, 1);
      }
    }
  },

  drawPlayerAura() {
    if (this.auraTier === 0) return;
    const ctx = this.ctx;
    const pX = this.player.baseX + this.player.attackOffset;
    const pY = this.player.baseY;

    ctx.save();
    let glowColor = 'rgba(56, 189, 248, 0.4)';
    if (this.auraTier === 2) glowColor = 'rgba(192, 132, 252, 0.5)';
    if (this.auraTier === 3) glowColor = 'rgba(251, 191, 36, 0.65)';

    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.auraTier === 3 ? 28 : 18;
    ctx.beginPath();
    ctx.ellipse(pX, pY, 36, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    this.auraParticles.forEach(part => {
      const alpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = part.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  },

  // 7. FLOATING DAMAGE TEXTS
  addFloatingDamage(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 18;
    let prefix = '';

    if (type === 'player_hit') {
      color = '#ef4444'; prefix = '-';
    } else if (type === 'enemy_crit') {
      color = '#fbbf24'; size = 22; prefix = '💥 CRIT! -';
    } else if (type === 'legendary_lightning') {
      color = '#fde047'; size = 20; prefix = '⚡ -';
    } else if (type === 'legendary_shield') {
      color = '#c4b5fd'; size = 19; prefix = '';
    } else if (type === 'legendary_heal') {
      color = '#f43f5e'; size = 19; prefix = '';
    } else if (type === 'legendary_reaper') {
      color = '#c084fc'; size = 21; prefix = '🖤 REAP! -';
    } else if (type === 'legendary_frost') {
      color = '#67e8f9'; size = 20; prefix = '❄️ FROST! -';
    } else if (type === 'legendary_meteor') {
      color = '#f59e0b'; size = 24; prefix = '👑 METEOR! -';
    } else if (type === 'legendary_timewarp') {
      color = '#4ade80'; size = 19; prefix = '⏳ TIME! -';
    } else if (type === 'legendary_dragon') {
      color = '#ea580c'; size = 20; prefix = '🐉 REFLECT! -';
    } else if (type === 'legendary_phoenix') {
      color = '#f97316'; size = 23; prefix = '🔥 ';
    } else if (type === 'legendary_fire') {
      color = '#ef4444'; size = 20; prefix = '🔥 BURN! -';
    } else {
      color = '#e2e8f0'; prefix = '-';
    }

    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 25,
      y: y - 10,
      vy: -2.0,
      text: `${prefix}${text}`,
      color: color,
      size: size,
      alpha: 1.0,
      life: 0.95,
      maxLife: 0.95
    });
  },

  triggerScreenShake(duration = 0.15) {
    this.screenShakeTimer = duration;
  },

  // ══════════════════════════════════════════════════════════
  // LEGENDARY VFX SYSTEM — Efek Unik & Masif per Item
  // ══════════════════════════════════════════════════════════

  /**
   * triggerLegendaryVfx(type, x, y, ambient)
   * type: 'lightning' | 'soulBubble' | 'bloodNova' | 'goldCoins'
   * ambient: true = efek pasif/ambien, false = burst satu kali
   */
  triggerLegendaryVfx(type, x, y, ambient = false) {

    if (type === 'lightning') {
      // ⚡ CHAIN LIGHTNING — 3 cabang petir dari langit, setiap cabang bercabang lagi
      const branches = [];
      for (let b = 0; b < 3; b++) {
        const bx = x + (b - 1) * 35;
        const segs = [];
        const numSegs = 8;
        for (let i = 0; i < numSegs; i++) {
          segs.push({
            x1: bx + (Math.random() - 0.5) * 50,
            y1: y - 160 + (i / numSegs) * 160,
            x2: bx + (Math.random() - 0.5) * 45,
            y2: y - 160 + ((i + 1) / numSegs) * 160
          });
        }
        branches.push(segs);
      }
      // Percikan di titik impact
      const sparks = [];
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 120;
        sparks.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 40, life: 0.25 + Math.random() * 0.2 });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 0.45, age: 0, branches, sparks });

    } else if (type === 'soulBubble') {
      // 👻 SOUL SHIELD — Lingkaran berlapis ungu + rune berputar + ray keluar
      const runes = [];
      for (let i = 0; i < 6; i++) {
        runes.push({ angle: (i / 6) * Math.PI * 2, symbol: ['✦', '✧', '◈', '⊕', '✶', '✵'][i] });
      }
      const rays = [];
      for (let i = 0; i < 12; i++) {
        rays.push({ angle: (i / 12) * Math.PI * 2, len: 25 + Math.random() * 30 });
      }
      this.legendaryVfxPool.push({ type, x, y, life: ambient ? 1.0 : 0.75, age: 0, radius: 42, runes, rays });

    } else if (type === 'bloodNova') {
      // 🩸 BLOOD NOVA — Multi-cincin merah + partikel darah + drips jatuh ke bawah
      const particles = [];
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const speed = 80 + Math.random() * 100;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          gravity: 80,
          life: 0.7 + Math.random() * 0.3,
          size: 4 + Math.random() * 7,
          trail: []
        });
      }
      // Drip tetesan darah jatuh ke bawah
      const drips = [];
      for (let i = 0; i < 8; i++) {
        drips.push({ x: x + (Math.random() - 0.5) * 80, y: y, vy: 60 + Math.random() * 80, life: 0.5 });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 0.85, age: 0, particles, drips });

    } else if (type === 'goldCoins') {
      // 💎 GOLD MAGNET — 12 koin + bintang bertebaran + efek cahaya emas memancar
      const coins = [];
      for (let i = 0; i < 12; i++) {
        coins.push({
          angle: (i / 12) * Math.PI * 2,
          r: 45 + Math.random() * 25,
          size: 7 + Math.random() * 5,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
      const stars = [];
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 70;
        stars.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0.8 + Math.random() * 0.4, size: 3 + Math.random() * 4 });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 2.2, age: 0, coins, stars });

    } else if (type === 'phoenixWings') {
      // 🔥 PHOENIX WINGS — Sayap api phoenix membentang + 35 api melayang naik
      const feathers = [];
      for (let i = 0; i < 35; i++) {
        feathers.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 80,
          vy: -60 - Math.random() * 90,
          size: 4 + Math.random() * 6,
          life: 0.8 + Math.random() * 0.4
        });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 1.4, age: 0, feathers });

    } else if (type === 'frostBlizzard') {
      // ❄️ FROST BLIZZARD — Lingkaran es heksagonal + kristal salju berputar
      const flakes = [];
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 70;
        flakes.push({
          angle,
          dist,
          rotSpd: 2.5 + Math.random() * 3.5,
          size: 3 + Math.random() * 5,
          life: 1.2
        });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 1.2, age: 0, flakes });

    } else if (type === 'abyssalRift') {
      // 🖤 ABYSSAL RIFT — Retakan dimensi vertikal hitam/ungu membuka dengan sulur
      const tendrils = [];
      for (let i = 0; i < 12; i++) {
        tendrils.push({
          angle: (i / 12) * Math.PI * 2,
          len: 30 + Math.random() * 45,
          curve: (Math.random() - 0.5) * 20
        });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 0.9, age: 0, tendrils });

    } else if (type === 'dragonBreath') {
      // 🐉 DRAGON BREATH — Semburan api naga dari player menuju musuh
      const flames = [];
      for (let i = 0; i < 32; i++) {
        flames.push({
          x: x + 20,
          y: y - 30 + (Math.random() - 0.5) * 25,
          vx: 260 + Math.random() * 260,
          vy: (Math.random() - 0.5) * 80,
          size: 8 + Math.random() * 12,
          life: 0.55 + Math.random() * 0.3
        });
      }
      this.legendaryVfxPool.push({ type, x, y, life: 0.75, age: 0, flames });

    } else if (type === 'celestialMeteor') {
      // 👑 CELESTIAL METEOR — Meteor kosmik jatuh dari langit kiri-atas ke musuh
      this.legendaryVfxPool.push({
        type,
        startX: x - 180,
        startY: y - 240,
        targetX: x,
        targetY: y,
        life: 0.75,
        age: 0
      });

    } else if (type === 'timeMatrix') {
      // ⏳ TIME MATRIX — Jam holografik cyan/hijau berputar dan mendistorsi layar
      this.legendaryVfxPool.push({ type, x, y, life: 1.1, age: 0 });
    }
  },

  drawLegendaryVfx() {
    if (!this.legendaryVfxPool.length) return;
    const ctx = this.ctx;

    for (const vfx of this.legendaryVfxPool) {
      ctx.save();

      // ── ⚡ CHAIN LIGHTNING ──────────────────────────────────────────
      if (vfx.type === 'lightning') {
        const a = Math.min(1, vfx.life * 2.5);

        // Lingkaran cahaya di titik impact
        const impactGlow = ctx.createRadialGradient(vfx.x, vfx.y, 0, vfx.x, vfx.y, 55);
        impactGlow.addColorStop(0, `rgba(253,224,71,${a * 0.6})`);
        impactGlow.addColorStop(0.5, `rgba(250,204,21,${a * 0.25})`);
        impactGlow.addColorStop(1, `rgba(250,204,21,0)`);
        ctx.fillStyle = impactGlow;
        ctx.beginPath();
        ctx.arc(vfx.x, vfx.y, 55, 0, Math.PI * 2);
        ctx.fill();

        // Cabang-cabang petir (3 cabang utama)
        for (const branch of vfx.branches) {
          // Glow luar tebal
          ctx.strokeStyle = `rgba(251,191,36,${a * 0.55})`;
          ctx.lineWidth = 8 + Math.random() * 4;
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 32;
          ctx.beginPath();
          for (const seg of branch) {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          }
          ctx.stroke();
          // Inti putih tajam
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.95})`;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 12;
          ctx.stroke();
        }

        // Percikan impact
        if (vfx.sparks) {
          for (const sp of vfx.sparks) {
            const sa = Math.max(0, sp.life / 0.45) * a;
            ctx.fillStyle = `rgba(253,224,71,${sa})`;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      // ── 👻 SOUL SHIELD ─────────────────────────────────────────────
      } else if (vfx.type === 'soulBubble') {
        const pulse = 1 + Math.sin(vfx.age * 10) * 0.08;
        const a = Math.min(1, vfx.life * 1.5) * 0.9;
        const cx = vfx.x;
        const cy = vfx.y - 35;
        const R = vfx.radius * pulse;

        // Lingkaran aura luar besar
        const auraGrad = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.6);
        auraGrad.addColorStop(0, `rgba(167,139,250,${a * 0.12})`);
        auraGrad.addColorStop(1, `rgba(139,92,246,0)`);
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Cincin 1 — tebal luar
        ctx.strokeStyle = `rgba(167,139,250,${a * 0.45})`;
        ctx.lineWidth = 14;
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 36;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        // Cincin 2 — inti terang
        ctx.strokeStyle = `rgba(233,213,255,${a * 0.9})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Ray memancar keluar (12 sinar)
        if (vfx.rays) {
          for (const ray of vfx.rays) {
            const rAngle = ray.angle + vfx.age * 1.2;
            ctx.strokeStyle = `rgba(196,181,253,${a * 0.6})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#c4b5fd';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(rAngle) * R, cy + Math.sin(rAngle) * R);
            ctx.lineTo(cx + Math.cos(rAngle) * (R + ray.len), cy + Math.sin(rAngle) * (R + ray.len));
            ctx.stroke();
          }
        }

        // Rune simbol berputar
        if (vfx.runes) {
          ctx.font = 'bold 16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (const rune of vfx.runes) {
            const rAngle = rune.angle + vfx.age * 1.8;
            const rx = cx + Math.cos(rAngle) * R;
            const ry = cy + Math.sin(rAngle) * R;
            ctx.fillStyle = `rgba(216,180,254,${a * 0.85})`;
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 12;
            ctx.fillText(rune.symbol, rx, ry);
          }
        }

      // ── 🩸 BLOOD NOVA ───────────────────────────────────────────────
      } else if (vfx.type === 'bloodNova') {
        const totalLife = 0.85;
        const progress = vfx.age / totalLife;

        // 3 cincin merah melebar dengan jeda waktu
        for (let r = 0; r < 3; r++) {
          const rProgress = Math.max(0, progress - r * 0.08);
          if (rProgress <= 0) continue;
          const ringR = rProgress * 180;
          const ringA = Math.max(0, (1 - rProgress) * 0.8);
          ctx.strokeStyle = `rgba(239,68,68,${ringA})`;
          ctx.lineWidth = 6 - r * 1.5;
          ctx.shadowColor = r === 0 ? '#ef4444' : '#b91c1c';
          ctx.shadowBlur = 24 - r * 6;
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, Math.max(1, ringR), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Partikel darah bergerak
        if (vfx.particles) {
          for (const p of vfx.particles) {
            const pa = Math.max(0, p.life / 1.0);
            ctx.fillStyle = `rgba(220,38,38,${pa})`;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * pa, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Drip tetesan jatuh
        if (vfx.drips) {
          for (const drip of vfx.drips) {
            const da = Math.max(0, drip.life / 0.5);
            ctx.fillStyle = `rgba(185,28,28,${da * 0.85})`;
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(drip.x, drip.y, 3, 7 * da, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Flash merah di tengah saat baru muncul
        if (vfx.age < 0.12) {
          const flashA = (1 - vfx.age / 0.12) * 0.55;
          const flashGrad = ctx.createRadialGradient(vfx.x, vfx.y, 0, vfx.x, vfx.y, 70);
          flashGrad.addColorStop(0, `rgba(239,68,68,${flashA})`);
          flashGrad.addColorStop(1, `rgba(239,68,68,0)`);
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, 70, 0, Math.PI * 2);
          ctx.fill();
        }

      // ── 💎 GOLD MAGNET / GOLD COINS ─────────────────────────────────
      } else if (vfx.type === 'goldCoins') {
        const pX = this.player.baseX + this.player.attackOffset;
        const pY = this.player.baseY - 40;
        const lifeAlpha = Math.min(1, vfx.life / 0.4);

        // Cahaya emas memancar dari player
        const goldGlow = ctx.createRadialGradient(pX, pY, 0, pX, pY, 90);
        goldGlow.addColorStop(0, `rgba(251,191,36,${lifeAlpha * 0.3})`);
        goldGlow.addColorStop(1, `rgba(245,158,11,0)`);
        ctx.fillStyle = goldGlow;
        ctx.beginPath();
        ctx.arc(pX, pY, 90, 0, Math.PI * 2);
        ctx.fill();

        // 12 koin berputar
        for (const coin of vfx.coins) {
          const angle = coin.angle + vfx.age * 2.2;
          const coinPulse = 1 + Math.sin(vfx.age * 6 + coin.pulseOffset) * 0.2;
          const cx = pX + Math.cos(angle) * coin.r;
          const cy = pY + Math.sin(angle) * (coin.r * 0.45);

          // Shadow koin
          ctx.fillStyle = `rgba(180,110,0,${lifeAlpha * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 3, coin.size * coinPulse, coin.size * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Koin utama
          ctx.fillStyle = `rgba(251,191,36,${lifeAlpha * 0.95})`;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(cx, cy, coin.size * coinPulse, 0, Math.PI * 2);
          ctx.fill();

          // Highlight putih
          ctx.fillStyle = `rgba(255,255,255,${lifeAlpha * 0.65})`;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(cx - coin.size * 0.28, cy - coin.size * 0.28, coin.size * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bintang bertebaran
        if (vfx.stars) {
          for (const star of vfx.stars) {
            const sa = Math.max(0, star.life / 1.2) * lifeAlpha;
            ctx.fillStyle = `rgba(253,224,71,${sa})`;
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 12;
            // Bintang 4 sudut
            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(vfx.age * 3);
            ctx.beginPath();
            for (let pt = 0; pt < 4; pt++) {
              const pa = (pt / 4) * Math.PI * 2;
              const outerX = Math.cos(pa) * star.size;
              const outerY = Math.sin(pa) * star.size;
              const innerX = Math.cos(pa + Math.PI / 4) * (star.size * 0.38);
              const innerY = Math.sin(pa + Math.PI / 4) * (star.size * 0.38);
              if (pt === 0) ctx.moveTo(outerX, outerY);
              else ctx.lineTo(outerX, outerY);
              ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }

      // ── 🔥 PHOENIX WINGS ───────────────────────────────────────────
      } else if (vfx.type === 'phoenixWings') {
        const a = Math.min(1, vfx.life / 0.4);
        const px = vfx.x;
        const py = vfx.y - 35;
        const wingSpan = 55 + Math.sin(vfx.age * 14) * 8;

        // Sayap Api Kiri & Kanan
        for (const dir of [-1, 1]) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(dir, 1);

          const wingGrad = ctx.createRadialGradient(25, -15, 5, 45, -25, wingSpan);
          wingGrad.addColorStop(0, `rgba(254,240,138,${a * 0.95})`);
          wingGrad.addColorStop(0.4, `rgba(249,115,22,${a * 0.8})`);
          wingGrad.addColorStop(0.8, `rgba(220,38,38,${a * 0.5})`);
          wingGrad.addColorStop(1, 'rgba(185,28,28,0)');

          ctx.fillStyle = wingGrad;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 28;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(20, -35, wingSpan, -30);
          ctx.quadraticCurveTo(wingSpan + 15, -15, wingSpan - 10, 5);
          ctx.quadraticCurveTo(25, 10, 0, 0);
          ctx.fill();
          ctx.restore();
        }

        // Partikel Abu Api Melayang Naik
        if (vfx.feathers) {
          for (const f of vfx.feathers) {
            f.x += f.vx * 0.016;
            f.y += f.vy * 0.016;
            const fa = Math.max(0, f.life / 1.0) * a;
            ctx.fillStyle = `rgba(251,146,60,${fa})`;
            ctx.shadowColor = '#ea580c';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * fa, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      // ── ❄️ FROST BLIZZARD ──────────────────────────────────────────
      } else if (vfx.type === 'frostBlizzard') {
        const a = Math.min(1, vfx.life / 0.4);
        const ex = vfx.x;
        const ey = vfx.y;

        // Lingkaran Es Mandala di Tanah
        ctx.strokeStyle = `rgba(103,232,249,${a * 0.75})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + vfx.age * 0.8;
          const hx = ex + Math.cos(ang) * 45;
          const hy = ey + Math.sin(ang) * 22;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        // Kristal Salju Berputar di Udara
        if (vfx.flakes) {
          ctx.fillStyle = `rgba(224,242,254,${a * 0.9})`;
          ctx.shadowColor = '#7dd3fc';
          ctx.shadowBlur = 10;
          for (const flk of vfx.flakes) {
            const rot = flk.angle + vfx.age * flk.rotSpd;
            const fx = ex + Math.cos(rot) * flk.dist;
            const fy = ey - 30 + Math.sin(rot) * (flk.dist * 0.5);
            ctx.beginPath();
            ctx.arc(fx, fy, flk.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      // ── 🖤 ABYSSAL RIFT ────────────────────────────────────────────
      } else if (vfx.type === 'abyssalRift') {
        const a = Math.min(1, vfx.life / 0.3);
        const rx = vfx.x;
        const ry = vfx.y - 30;
        const w = 18 * Math.sin(Math.min(1, vfx.age * 4) * Math.PI);

        // Retakan Dimensi Vertikal
        ctx.fillStyle = `rgba(15,5,30,${a * 0.95})`;
        ctx.strokeStyle = `rgba(192,132,252,${a * 0.9})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 28;

        ctx.beginPath();
        ctx.ellipse(rx, ry, Math.max(1, w), 55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sulur Kegelapan Keluar dari Retakan
        if (vfx.tendrils) {
          ctx.strokeStyle = `rgba(168,85,247,${a * 0.7})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 12;
          for (const t of vfx.tendrils) {
            const tx = rx + Math.cos(t.angle + vfx.age * 2) * t.len;
            const ty = ry + Math.sin(t.angle + vfx.age * 2) * (t.len * 0.6);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.quadraticCurveTo(rx + t.curve, ry + t.curve, tx, ty);
            ctx.stroke();
          }
        }

      // ── 🐉 DRAGON BREATH ───────────────────────────────────────────
      } else if (vfx.type === 'dragonBreath') {
        const a = Math.min(1, vfx.life / 0.25);
        if (vfx.flames) {
          for (const fl of vfx.flames) {
            fl.x += fl.vx * 0.016;
            fl.y += fl.vy * 0.016;
            const fa = Math.max(0, fl.life / 0.7) * a;

            const fGrad = ctx.createRadialGradient(fl.x, fl.y, 1, fl.x, fl.y, fl.size);
            fGrad.addColorStop(0, `rgba(254,240,138,${fa})`);
            fGrad.addColorStop(0.5, `rgba(249,115,22,${fa * 0.8})`);
            fGrad.addColorStop(1, 'rgba(239,68,68,0)');

            ctx.fillStyle = fGrad;
            ctx.shadowColor = '#ea580c';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, fl.size * fa, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      // ── 👑 CELESTIAL METEOR ────────────────────────────────────────
      } else if (vfx.type === 'celestialMeteor') {
        const progress = Math.min(1, vfx.age / 0.45);
        const mx = vfx.startX + (vfx.targetX - vfx.startX) * progress;
        const my = vfx.startY + (vfx.targetY - vfx.startY) * progress;

        if (progress < 1) {
          // Ekor Asap & Api Meteor
          ctx.strokeStyle = 'rgba(251,191,36,0.7)';
          ctx.lineWidth = 14;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.moveTo(vfx.startX, vfx.startY);
          ctx.lineTo(mx, my);
          ctx.stroke();

          // Kepala Meteor
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(mx, my, 16, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Gelombang Ledakan Kawah Kosmik
          const shockA = Math.max(0, 1 - (vfx.age - 0.45) / 0.3);
          const r = (vfx.age - 0.45) * 220;
          ctx.strokeStyle = `rgba(245,158,11,${shockA})`;
          ctx.lineWidth = 6;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(vfx.targetX, vfx.targetY, r, 0, Math.PI * 2);
          ctx.stroke();
        }

      // ── ⏳ TIME MATRIX ─────────────────────────────────────────────
      } else if (vfx.type === 'timeMatrix') {
        const a = Math.min(1, vfx.life / 0.35);
        const cx = vfx.x;
        const cy = vfx.y - 35;
        const R = 48 + Math.sin(vfx.age * 8) * 6;

        // Dial Jam Hologram Hijau Neon
        ctx.strokeStyle = `rgba(74,222,128,${a * 0.8})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        // Jarum Jam Berputar Sangat Cepat
        const handAngle = vfx.age * 18;
        ctx.strokeStyle = `rgba(220,252,231,${a * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(handAngle) * (R * 0.75), cy + Math.sin(handAngle) * (R * 0.75));
        ctx.stroke();

        // Simbol Romawi Jam (XII, III, VI, IX)
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = `rgba(187,247,208,${a * 0.9})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('XII', cx, cy - R + 10);
        ctx.fillText('VI', cx, cy + R - 10);
        ctx.fillText('III', cx + R - 12, cy);
        ctx.fillText('IX', cx - R + 12, cy);
      }

      ctx.restore();
    }
  },

  drawFloatingTexts() {
    const ctx = this.ctx;
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `800 ${ft.size}px "JetBrains Mono", monospace`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 7;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  },

  // 8. LOOT DROP & INVENTORY FLY EFFECT (Dengan batas aman margin 2-3 cm)
  spawnLootDrop(x, y, item) {
    const marginX = 95; // Batas 2-3 cm dari tepi
    const clampedX = Math.max(marginX + 20, Math.min(this.width - marginX - 20, x));
    // Dorong pantulan ke arah tengah arena
    let initialVx = (Math.random() - 0.5) * 2.5;
    if (clampedX > this.width / 2) initialVx = -Math.abs(initialVx) - 0.5;
    else initialVx = Math.abs(initialVx) + 0.5;

    this.droppedLoots.push({
      id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x: clampedX,
      y: y - 25,
      vx: initialVx,
      vy: -4.8 - Math.random() * 1.8,
      gravity: 0.24,
      resting: false,
      item: item,
      pulse: 0
    });
  },

  drawDroppedLoots() {
    const ctx = this.ctx;
    this.droppedLoots.forEach(loot => {
      const item = loot.item;

      ctx.save();
      ctx.translate(loot.x, loot.y + loot.pulse);

      const rarityColors = {
        common: '#94a3b8',
        uncommon: '#22c55e',
        rare: '#38bdf8',
        epic: '#c084fc',
        legendary: '#f59e0b'
      };
      const col = rarityColors[item.rarity.toLowerCase()] || '#94a3b8';

      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Gunakan ITEM_ICON_MAP untuk fallback icon yang mungkin rusak dari save data
      const safeIcon = (item.icon && item.icon.codePointAt(0) > 255)
        ? item.icon
        : (window.ITEM_ICON_MAP && window.ITEM_ICON_MAP[item.templateId || item.id]) || '🎁';
      ctx.fillText(safeIcon, 0, 1);

      if (loot.resting) {
        ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('AMBIL!', 0, -25);
      }

      ctx.restore();
    });
  },

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (let i = this.droppedLoots.length - 1; i >= 0; i--) {
      const loot = this.droppedLoots[i];
      const dist = Math.hypot(clickX - loot.x, clickY - (loot.y + loot.pulse));

      if (dist <= 30) {
        const collectedItem = loot.item;
        this.droppedLoots.splice(i, 1);
        this.launchLootFlyAnimation(loot.x, loot.y, collectedItem);
        break;
      }
    }
  },

  launchLootFlyAnimation(startX, startY, item) {
    // Target ke ikon tombol "Tas" di panel navigasi kiri
    const invElement = document.getElementById('btn-nav-bag') || document.getElementById('inv-count-badge');
    let targetX = 50;
    let targetY = 120;

    if (invElement && this.canvas) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const invRect = invElement.getBoundingClientRect();
      const scaleX = this.canvas.width / canvasRect.width;
      const scaleY = this.canvas.height / canvasRect.height;

      targetX = (invRect.left + invRect.width / 2 - canvasRect.left) * scaleX;
      targetY = (invRect.top + invRect.height / 2 - canvasRect.top) * scaleY;
    }

    this.flyingLoots.push({
      item: item,
      startX: startX,
      startY: startY,
      targetX: targetX,
      targetY: targetY,
      x: startX,
      y: startY,
      scale: 1.0,
      progress: 0,
      onArrived: () => {
        if (window.GameEngine && window.GameEngine.collectLoot) {
          window.GameEngine.collectLoot(item);
        }
        const badge = document.getElementById('inv-count-badge');
        const bagBtn = document.getElementById('btn-nav-bag');
        if (badge) {
          badge.classList.remove('pulse-flash');
          void badge.offsetWidth;
          badge.classList.add('pulse-flash');
          setTimeout(() => badge.classList.remove('pulse-flash'), 600);
        }
        if (bagBtn) {
          bagBtn.classList.remove('pulse-flash');
          void bagBtn.offsetWidth;
          bagBtn.classList.add('pulse-flash');
          setTimeout(() => bagBtn.classList.remove('pulse-flash'), 600);
        }
      }
    });
  },

  drawFlyingLoots() {
    const ctx = this.ctx;
    this.flyingLoots.forEach(fl => {
      ctx.save();
      ctx.translate(fl.x, fl.y);
      ctx.scale(fl.scale, fl.scale);

      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fl.item.icon || '✨', 0, 0);

      ctx.restore();
    });
  },

  // 9. MASTER RENDER
  render(gameState) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();

    // Screen Shake Offset
    if (this.screenShakeTimer > 0) {
      const sx = (Math.random() - 0.5) * this.screenShakeMagnitude * 2;
      const sy = (Math.random() - 0.5) * this.screenShakeMagnitude * 2;
      ctx.translate(sx, sy);
    }

    // 1. BG Berjalan (Parallax Fantasy Forest)
    this.drawBackground();

    // 2. Mayat Player jika currentWave === lastDeathWave
    if (gameState.player.lastDeathWave && gameState.player.wave === gameState.player.lastDeathWave) {
      this.drawPlayerCorpse(this.player.baseX - 45, this.groundY - 8);
    }

    // 3. Aura Player
    this.drawPlayerAura();

    // 4. Player Sprite (Sisi Kiri)
    this.drawPlayer(gameState);

    // 5. Musuh (Maju dari Kanan)
    this.drawEnemy(gameState);

    // 6. Legendary VFX (di atas karakter, di bawah floating text)
    this.drawLegendaryVfx();

    // 7. Loot di Tanah
    this.drawDroppedLoots();

    // 8. Loot Terbang
    this.drawFlyingLoots();

    // 9. Floating Damage Text
    this.drawFloatingTexts();

    ctx.restore();
  }
};

window.RenderEngine = RenderEngine;
