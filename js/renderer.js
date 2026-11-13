/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 高精細アニメ調ベクターCanvasレンダラー（js/renderer.js）
 *
 * - 木目積み木床、金属光沢歯車、ビスケット壁、鉄ブロック、ワープ土管、黄金ギア
 * - 主人公ブリキロボット「ネジ丸」の進化パーツ合体描画＆感情アニメーション
 * - 失敗時：目を白黒させ煙を吹き、頭のゼンマイが飛び出すコミカル演出
 * - パーティクル＆実行トレース用エフェクト
 */
(function (root) {
  'use strict';

  var JP_FONT = "'Hiragino Maru Gothic ProN', 'Yu Gothic', 'Meiryo', 'Noto Sans JP', sans-serif";

  function drawGearShape(ctx, cx, cy, outerR, innerR, teeth, rotation, fillStyle, strokeStyle, holeR) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.beginPath();
    var step = (Math.PI * 2) / teeth;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step;
      var a1 = a0 + step * 0.2;
      var a2 = a0 + step * 0.32;
      var a3 = a0 + step * 0.68;
      var a4 = a0 + step * 0.8;
      if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.lineWidth = Math.max(1.5, outerR * 0.08);
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
    if (holeR > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, holeR, 0, Math.PI * 2);
      ctx.fillStyle = strokeStyle || '#475569';
      ctx.fill();
    }
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.bgGears = [
      { rx: 0.1, ry: 0.14, r: 46, teeth: 10, speed: 0.25, color: 'rgba(217, 119, 6, 0.12)' },
      { rx: 0.9, ry: 0.18, r: 58, teeth: 12, speed: -0.2, color: 'rgba(180, 83, 9, 0.10)' },
      { rx: 0.15, ry: 0.85, r: 52, teeth: 11, speed: -0.22, color: 'rgba(217, 119, 6, 0.10)' },
      { rx: 0.88, ry: 0.84, r: 42, teeth: 9, speed: 0.3, color: 'rgba(245, 158, 11, 0.12)' }
    ];
    this.dustMotes = [];
    for (var i = 0; i < 18; i++) {
      this.dustMotes.push({
        x: Math.random(),
        y: Math.random(),
        r: 1.5 + Math.random() * 2.5,
        vy: -0.012 - Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2
      });
    }
    this.layout = { cellSize: 48, offsetX: 0, offsetY: 0, cols: 5, rows: 5 };
  }

  Renderer.prototype.resize = function () {
    var parent = this.canvas.parentElement;
    if (!parent) return;
    var cw = parent.clientWidth;
    var ch = parent.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var w = Math.max(240, Math.floor(cw));
    var h = Math.max(200, Math.floor(ch));
    var targetW = Math.floor(w * dpr);
    var targetH = Math.floor(h * dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    this.logicalWidth = w;
    this.logicalHeight = h;
    this.dpr = dpr;
  };

  Renderer.prototype.spawnParticles = function (gridX, gridY, kind, count) {
    var cs = this.layout.cellSize;
    var cx = this.layout.offsetX + (gridX + 0.5) * cs;
    var cy = this.layout.offsetY + (gridY + 0.5) * cs;
    var n = count || 14;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = (0.8 + Math.random() * 2.8) * (cs / 52);
      var color = '#fbbf24';
      var size = 4 + Math.random() * 5;
      var shape = 'circle';
      var life = 0.7 + Math.random() * 0.5;
      if (kind === 'biscuit') {
        color = i % 2 === 0 ? '#d97706' : '#fef3c7';
        shape = 'crumb';
      } else if (kind === 'smoke') {
        color = i % 2 === 0 ? 'rgba(148,163,184,0.85)' : 'rgba(71,85,105,0.75)';
        size = 7 + Math.random() * 8;
        spd *= 0.6;
        life = 1.1 + Math.random() * 0.5;
      } else if (kind === 'turbo') {
        color = i % 2 === 0 ? '#38bdf8' : '#fef08a';
        shape = 'star';
      } else if (kind === 'magnet') {
        color = i % 2 === 0 ? '#60a5fa' : '#f472b6';
        shape = 'star';
      } else if (kind === 'gear' || kind === 'clear') {
        var palette = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#fb923c'];
        color = palette[i % palette.length];
        shape = i % 2 === 0 ? 'star' : 'confetti';
        spd *= 1.35;
        life = 1.1 + Math.random() * 0.6;
      }
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (kind === 'smoke' ? 1.2 : 0.4),
        color: color,
        size: size,
        shape: shape,
        life: life,
        maxLife: life,
        rot: Math.random() * Math.PI * 2
      });
    }
  };

  Renderer.prototype.updateParticles = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      if (p.shape !== 'smoke') {
        p.vy += 0.05 * 60 * dt;
      }
      p.rot += 3 * dt;
    }
    for (var m = 0; m < this.dustMotes.length; m++) {
      var dm = this.dustMotes[m];
      dm.y += dm.vy * dt;
      if (dm.y < -0.05) dm.y = 1.05;
    }
  };

  Renderer.prototype.getRobotScreenCenter = function (rx, ry) {
    var cs = this.layout.cellSize;
    return {
      x: this.layout.offsetX + (rx + 0.5) * cs,
      y: this.layout.offsetY + (ry + 0.5) * cs
    };
  };

  Renderer.prototype.drawWoodTile = function (ctx, x, y, cs, isAlt) {
    var pad = 2;
    var tx = x + pad;
    var ty = y + pad;
    var ts = cs - pad * 2;
    // ドロップシャドウ
    ctx.fillStyle = 'rgba(120, 53, 15, 0.2)';
    roundRectPath(ctx, tx, ty + 3, ts, ts, ts * 0.16);
    ctx.fill();

    // 木目グラデーション
    var grad = ctx.createLinearGradient(tx, ty, tx, ty + ts);
    if (isAlt) {
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(1, '#f59e0b');
    } else {
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(1, '#fbbf24');
    }
    ctx.fillStyle = grad;
    roundRectPath(ctx, tx, ty, ts, ts, ts * 0.16);
    ctx.fill();

    // 積み木のエッジハイライトと木目ライン
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, tx + 2, ty + 2, ts - 4, ts - 4, ts * 0.12);
    ctx.clip();
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.12)';
    ctx.lineWidth = 1.2;
    for (var g = 1; g <= 3; g++) {
      var gy = ty + (ts * g) / 4;
      ctx.beginPath();
      ctx.moveTo(tx, gy);
      ctx.bezierCurveTo(tx + ts * 0.35, gy - 3, tx + ts * 0.65, gy + 3, tx + ts, gy);
      ctx.stroke();
    }
    // 上端ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(tx + 4, ty + 2, ts - 8, 3);
    ctx.restore();
  };

  Renderer.prototype.drawWallTile = function (ctx, x, y, cs) {
    var pad = 1.5;
    var tx = x + pad;
    var ty = y + pad - cs * 0.08;
    var ts = cs - pad * 2;
    // 側面（立体感）
    ctx.fillStyle = '#9a3412';
    roundRectPath(ctx, tx, ty + cs * 0.12, ts, ts, ts * 0.16);
    ctx.fill();

    // 天面
    var grad = ctx.createLinearGradient(tx, ty, tx + ts, ty + ts);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(0.5, '#ea580c');
    grad.addColorStop(1, '#c2410c');
    ctx.fillStyle = grad;
    roundRectPath(ctx, tx, ty, ts, ts * 0.96, ts * 0.16);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 積み木スタッド（レゴ・木ブロック風の丸突起）
    var studOffsets = [
      [0.32, 0.32], [0.68, 0.32],
      [0.32, 0.66], [0.68, 0.66]
    ];
    for (var i = 0; i < studOffsets.length; i++) {
      var sx = tx + ts * studOffsets[i][0];
      var sy = ty + ts * studOffsets[i][1];
      ctx.beginPath();
      ctx.arc(sx, sy + 2, ts * 0.11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124,45,18,0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, ts * 0.11, 0, Math.PI * 2);
      ctx.fillStyle = '#fdba74';
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  Renderer.prototype.drawHoleTile = function (ctx, x, y, cs) {
    var pad = 3;
    var tx = x + pad;
    var ty = y + pad;
    var ts = cs - pad * 2;
    var grad = ctx.createRadialGradient(tx + ts * 0.5, ty + ts * 0.5, ts * 0.08, tx + ts * 0.5, ty + ts * 0.5, ts * 0.68);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.7, '#1e293b');
    grad.addColorStop(1, '#334155');
    ctx.fillStyle = grad;
    roundRectPath(ctx, tx, ty, ts, ts, ts * 0.2);
    ctx.fill();
    // 縁の影
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // 内側の警告しま模様の縁
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([4, 4]);
    roundRectPath(ctx, tx + 3, ty + 3, ts - 6, ts - 6, ts * 0.14);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  Renderer.prototype.drawSpikeTile = function (ctx, x, y, cs, time) {
    this.drawWoodTile(ctx, x, y, cs, false);
    var cx = x + cs * 0.5;
    var cy = y + cs * 0.5;
    // 赤い警告プレート
    ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
    roundRectPath(ctx, x + cs * 0.12, y + cs * 0.12, cs * 0.76, cs * 0.76, cs * 0.12);
    ctx.fill();

    // 4本の金属トゲ
    var pts = [
      [x + cs * 0.3, y + cs * 0.34],
      [x + cs * 0.7, y + cs * 0.34],
      [x + cs * 0.3, y + cs * 0.72],
      [x + cs * 0.7, y + cs * 0.72]
    ];
    var pulse = Math.sin(time * 4) * 1.2;
    for (var i = 0; i < pts.length; i++) {
      var px = pts[i][0];
      var py = pts[i][1];
      ctx.beginPath();
      ctx.ellipse(px, py + 3, cs * 0.12, cs * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px - cs * 0.09, py + 2);
      ctx.lineTo(px, py - cs * 0.19 - pulse);
      ctx.lineTo(px + cs * 0.09, py + 2);
      ctx.closePath();
      var sGrad = ctx.createLinearGradient(px - 6, py - 12, px + 6, py);
      sGrad.addColorStop(0, '#f8fafc');
      sGrad.addColorStop(0.5, '#cbd5e1');
      sGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = sGrad;
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    void cx;
    void cy;
  };

  Renderer.prototype.drawBiscuitWall = function (ctx, x, y, cs) {
    var pad = 2;
    var tx = x + pad;
    var ty = y + pad - cs * 0.05;
    var ts = cs - pad * 2;
    ctx.fillStyle = '#92400e';
    roundRectPath(ctx, tx, ty + cs * 0.09, ts, ts * 0.95, ts * 0.18);
    ctx.fill();

    var grad = ctx.createLinearGradient(tx, ty, tx + ts, ty + ts);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.5, '#d97706');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    roundRectPath(ctx, tx, ty, ts, ts * 0.94, ts * 0.18);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ビスケットのドット穴
    var holes = [[0.26, 0.26], [0.74, 0.26], [0.26, 0.7], [0.74, 0.7]];
    ctx.fillStyle = '#78350f';
    for (var i = 0; i < holes.length; i++) {
      ctx.beginPath();
      ctx.arc(tx + ts * holes[i][0], ty + ts * holes[i][1], ts * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }

    // ひび割れライン
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx + ts * 0.22, ty + ts * 0.15);
    ctx.lineTo(tx + ts * 0.48, ty + ts * 0.45);
    ctx.lineTo(tx + ts * 0.35, ty + ts * 0.62);
    ctx.lineTo(tx + ts * 0.68, ty + ts * 0.82);
    ctx.moveTo(tx + ts * 0.48, ty + ts * 0.45);
    ctx.lineTo(tx + ts * 0.76, ty + ts * 0.32);
    ctx.stroke();
  };

  Renderer.prototype.drawIronBlock = function (ctx, x, y, cs, isBridge) {
    var pad = 2;
    var tx = x + pad;
    var ty = y + pad - (isBridge ? 0 : cs * 0.05);
    var ts = cs - pad * 2;
    if (isBridge) {
      this.drawHoleTile(ctx, x, y, cs);
      tx += 2;
      ty += 2;
      ts -= 4;
    } else {
      ctx.fillStyle = '#334155';
      roundRectPath(ctx, tx, ty + cs * 0.08, ts, ts * 0.94, ts * 0.14);
      ctx.fill();
    }

    var grad = ctx.createLinearGradient(tx, ty, tx + ts, ty + ts);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.45, '#94a3b8');
    grad.addColorStop(1, '#475569');
    ctx.fillStyle = grad;
    roundRectPath(ctx, tx, ty, ts, ts * (isBridge ? 1 : 0.94), ts * 0.14);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // リベットとXボルト模様
    ctx.strokeStyle = 'rgba(30,41,59,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx + ts * 0.18, ty + ts * 0.18, ts * 0.64, ts * 0.6);
    var rivets = [[0.2, 0.2], [0.8, 0.2], [0.2, 0.75], [0.8, 0.75]];
    ctx.fillStyle = '#f8fafc';
    for (var i = 0; i < rivets.length; i++) {
      ctx.beginPath();
      ctx.arc(tx + ts * rivets[i][0], ty + ts * rivets[i][1], ts * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  Renderer.prototype.drawConveyorTile = function (ctx, x, y, cs, ch, time) {
    var pad = 2;
    var tx = x + pad;
    var ty = y + pad;
    var ts = cs - pad * 2;
    ctx.fillStyle = '#334155';
    roundRectPath(ctx, tx, ty, ts, ts, ts * 0.14);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    var dirMap = { U: -Math.PI / 2, R: 0, D: Math.PI / 2, L: Math.PI };
    var angle = dirMap[ch] || 0;
    ctx.save();
    ctx.translate(tx + ts * 0.5, ty + ts * 0.5);
    ctx.rotate(angle);
    // 動くベルトライン
    var shift = ((time * 28) % (ts * 0.34));
    ctx.beginPath();
    roundRectPath(ctx, -ts * 0.42, -ts * 0.42, ts * 0.84, ts * 0.84, ts * 0.1);
    ctx.clip();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = Math.max(2.5, ts * 0.09);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var off = -ts * 0.68; off <= ts * 0.68; off += ts * 0.34) {
      var ox = off + shift;
      ctx.beginPath();
      ctx.moveTo(ox - ts * 0.12, -ts * 0.2);
      ctx.lineTo(ox + ts * 0.08, 0);
      ctx.lineTo(ox - ts * 0.12, ts * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  };

  Renderer.prototype.drawRotatePlate = function (ctx, x, y, cs, isCW, time) {
    this.drawWoodTile(ctx, x, y, cs, true);
    var cx = x + cs * 0.5;
    var cy = y + cs * 0.5;
    var rot = time * (isCW ? 1.8 : -1.8);
    drawGearShape(ctx, cx, cy, cs * 0.34, cs * 0.26, 8, rot, isCW ? '#60a5fa' : '#f472b6', '#1e3a8a', cs * 0.12);
    // 矢印アイコン
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, cs * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isCW) {
      ctx.arc(0, 0, cs * 0.18, -Math.PI * 0.7, Math.PI * 0.45);
    } else {
      ctx.arc(0, 0, cs * 0.18, Math.PI * 0.55, -Math.PI * 0.3, true);
    }
    ctx.stroke();
    ctx.restore();
  };

  Renderer.prototype.drawWarpTile = function (ctx, x, y, cs, ch, time) {
    this.drawWoodTile(ctx, x, y, cs, false);
    var cx = x + cs * 0.5;
    var cy = y + cs * 0.5;
    var warpColors = {
      '1': ['#22c55e', '#15803d', '#bbf7d0'],
      '2': ['#a855f7', '#6b21a8', '#e9d5ff'],
      '3': ['#06b6d4', '#0e7490', '#cffafe'],
      '4': ['#ec4899', '#9d174d', '#fbcfe8']
    };
    var pal = warpColors[ch] || warpColors['1'];
    // 土管リム
    ctx.beginPath();
    ctx.arc(cx, cy, cs * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = pal[1];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, cs * 0.31, 0, Math.PI * 2);
    ctx.fillStyle = pal[0];
    ctx.fill();
    // 渦巻き発光
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 2.5);
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = pal[2];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.13, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
    // ペア番号バッジ
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.max(10, Math.floor(cs * 0.24)) + 'px ' + JP_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, cx, cy + 1);
  };

  Renderer.prototype.drawGoalTile = function (ctx, x, y, cs, time) {
    this.drawWoodTile(ctx, x, y, cs, false);
    var cx = x + cs * 0.5;
    var cy = y + cs * 0.5;
    var pulse = 1 + Math.sin(time * 4) * 0.06;

    // 黄金のゴールマット
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    var grad = ctx.createRadialGradient(0, 0, 2, 0, 0, cs * 0.42);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#d97706');
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // チェッカーフラッグ＆時計針マーク
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-cs * 0.18, -cs * 0.26, cs * 0.05, cs * 0.44);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-cs * 0.13, -cs * 0.26);
    ctx.lineTo(cs * 0.22, -cs * 0.14);
    ctx.lineTo(-cs * 0.13, -cs * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.max(9, Math.floor(cs * 0.18)) + 'px ' + JP_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOAL', 0, cs * 0.18);
    ctx.restore();
  };

  Renderer.prototype.drawGoldenGear = function (ctx, gx, gy, time) {
    var cs = this.layout.cellSize;
    var cx = this.layout.offsetX + (gx + 0.5) * cs;
    var cy = this.layout.offsetY + (gy + 0.5) * cs + Math.sin(time * 3.5) * (cs * 0.05);

    ctx.save();
    ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
    ctx.shadowBlur = 12;
    // 外側キラキラリング
    var grad = ctx.createRadialGradient(cx - cs * 0.08, cy - cs * 0.08, 2, cx, cy, cs * 0.34);
    grad.addColorStop(0, '#fef9c3');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(1, '#ca8a04');
    drawGearShape(ctx, cx, cy, cs * 0.32, cs * 0.23, 8, time * 1.4, grad, '#854d0e', cs * 0.09);
    ctx.restore();

    // キラキラ星
    var spX = cx + Math.cos(time * 2.5) * cs * 0.26;
    var spY = cy - Math.sin(time * 2.5) * cs * 0.26;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spX, spY, cs * 0.045, 0, Math.PI * 2);
    ctx.fill();
  };

  /**
   * 主人公ブリキロボット「ネジ丸」の描画（ゲーム本編＆図鑑ミニCanvas共用）
   */
  Renderer.prototype.drawNejimaru = function (ctx, cx, cy, size, state) {
    var dir = state.dir !== undefined ? state.dir : 1; // 0:U, 1:R, 2:D, 3:L
    var parts = state.parts || [];
    var levels = state.partLevels || {};
    var emotion = state.emotion || 'normal'; // 'normal' | 'happy' | 'fail' | 'stun' | 'jump' | 'drill' | 'turbo' | 'magnet'
    var time = state.time || 0;
    var hasSpring = parts.indexOf('spring') >= 0;
    var hasDrill = parts.indexOf('drill') >= 0;
    var hasTurbo = parts.indexOf('turbo') >= 0;
    var hasMagnet = parts.indexOf('magnet') >= 0;

    ctx.save();
    ctx.translate(cx, cy);

    // 地面の影
    var jumpArc = emotion === 'jump' ? Math.sin((state.animProgress || 0.5) * Math.PI) * size * 0.35 : 0;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.38, size * (0.3 - jumpArc * 0.004), size * 0.11, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.fill();

    ctx.translate(0, -jumpArc);
    if (emotion === 'fail') {
      ctx.rotate(Math.sin(time * 18) * 0.12);
    } else if (emotion === 'stun') {
      ctx.rotate(Math.sin(time * 24) * 0.1);
    }

    // 1. 脚部（通常脚 or スプリング脚）
    if (hasSpring) {
      var springGold = (levels.spring || 1) >= 2;
      ctx.strokeStyle = springGold ? '#f59e0b' : '#475569';
      ctx.lineWidth = Math.max(2.5, size * 0.06);
      ctx.lineCap = 'round';
      for (var leg = -1; leg <= 1; leg += 2) {
        var lx = leg * size * 0.14;
        ctx.beginPath();
        ctx.moveTo(lx, size * 0.15);
        ctx.lineTo(lx - size * 0.05, size * 0.22);
        ctx.lineTo(lx + size * 0.05, size * 0.28);
        ctx.lineTo(lx, size * 0.35);
        ctx.stroke();
        // ブーツ
        ctx.fillStyle = '#ea580c';
        roundRectPath(ctx, lx - size * 0.08, size * 0.32, size * 0.16, size * 0.08, 4);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#475569';
      roundRectPath(ctx, -size * 0.2, size * 0.18, size * 0.13, size * 0.18, 4);
      ctx.fill();
      roundRectPath(ctx, size * 0.07, size * 0.18, size * 0.13, size * 0.18, 4);
      ctx.fill();
    }

    // 2. 背中のターボ歯車（ターボパーツ装着時）
    if (hasTurbo) {
      var turboSpin = emotion === 'turbo' ? time * 18 : time * 2.5;
      var tGold = (levels.turbo || 1) >= 2;
      drawGearShape(
        ctx,
        dir === 1 ? -size * 0.28 : (dir === 3 ? size * 0.28 : 0),
        size * 0.02,
        size * 0.2,
        size * 0.14,
        8,
        turboSpin,
        tGold ? '#fbbf24' : '#ef4444',
        '#7f1d1d',
        size * 0.05
      );
      if (emotion === 'turbo') {
        // ターボ噴射炎
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        var flameDir = dir === 1 ? -1 : (dir === 3 ? 1 : 0);
        if (flameDir !== 0) {
          ctx.moveTo(flameDir * size * 0.3, -size * 0.04);
          ctx.lineTo(flameDir * size * 0.56, size * 0.02);
          ctx.lineTo(flameDir * size * 0.3, size * 0.09);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 3. 背中の黄金ゼンマイキー（失敗時は飛び出す！）
    var keyAngle = emotion === 'fail' ? -0.6 : Math.sin(time * 3) * 0.15;
    var keyFlyY = emotion === 'fail' ? -size * 0.38 - Math.abs(Math.sin(time * 5)) * size * 0.1 : -size * 0.36;
    var keyFlyX = emotion === 'fail' ? size * 0.22 : 0;
    ctx.save();
    ctx.translate(keyFlyX, keyFlyY);
    ctx.rotate(keyAngle);
    ctx.strokeStyle = '#d97706';
    ctx.fillStyle = '#fde047';
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.fillRect(-size * 0.03, -size * 0.04, size * 0.06, size * 0.14);
    ctx.beginPath();
    ctx.arc(-size * 0.07, -size * 0.07, size * 0.07, 0, Math.PI * 2);
    ctx.arc(size * 0.07, -size * 0.07, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. 胴体（ブリキロボットボディ）
    var bodyGrad = ctx.createLinearGradient(-size * 0.28, -size * 0.12, size * 0.28, size * 0.22);
    bodyGrad.addColorStop(0, '#bae6fd');
    bodyGrad.addColorStop(0.5, '#38bdf8');
    bodyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bodyGrad;
    roundRectPath(ctx, -size * 0.24, -size * 0.05, size * 0.48, size * 0.27, size * 0.1);
    ctx.fill();
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 胸のメーターハート／時計窓
    ctx.beginPath();
    ctx.arc(0, size * 0.08, size * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, size * 0.08);
    ctx.lineTo(Math.cos(time * 4) * size * 0.06, size * 0.08 + Math.sin(time * 4) * size * 0.06);
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // 5. ドリル腕 or 通常腕
    var drillSide = dir === 3 ? -1 : 1;
    if (hasDrill) {
      var dGold = (levels.drill || 1) >= 2;
      var dSpin = emotion === 'drill' ? Math.sin(time * 35) * 3 : 0;
      ctx.save();
      ctx.translate(drillSide * size * 0.26, size * 0.07 + dSpin);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.09);
      ctx.lineTo(drillSide * size * 0.24, 0);
      ctx.lineTo(0, size * 0.09);
      ctx.closePath();
      ctx.fillStyle = dGold ? '#fde047' : '#fb923c';
      ctx.fill();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // 螺旋線
      ctx.beginPath();
      ctx.moveTo(drillSide * size * 0.07, -size * 0.05);
      ctx.lineTo(drillSide * size * 0.11, size * 0.04);
      ctx.moveTo(drillSide * size * 0.14, -size * 0.03);
      ctx.lineTo(drillSide * size * 0.17, size * 0.02);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-size * 0.28, size * 0.08, size * 0.07, 0, Math.PI * 2);
      ctx.arc(size * 0.28, size * 0.08, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 6. 頭部
    var headGrad = ctx.createLinearGradient(-size * 0.26, -size * 0.34, size * 0.26, -size * 0.04);
    headGrad.addColorStop(0, '#f8fafc');
    headGrad.addColorStop(0.6, '#cbd5e1');
    headGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = headGrad;
    roundRectPath(ctx, -size * 0.26, -size * 0.33, size * 0.52, size * 0.3, size * 0.12);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // マグネット頭脳（U字磁石アンテナ）
    if (hasMagnet) {
      ctx.save();
      ctx.translate(0, -size * 0.35);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(3, size * 0.07);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(0, -size * 0.04, size * 0.11, Math.PI, 0, false);
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-size * 0.14, -size * 0.05, size * 0.06, size * 0.06);
      ctx.fillRect(size * 0.08, -size * 0.05, size * 0.06, size * 0.06);
      if (emotion === 'magnet') {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -size * 0.05, size * (0.2 + (time * 0.5) % 0.25), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. 顔と向き表現（目の位置が進行方向へオフセット）
    var lookX = dir === 1 ? size * 0.06 : (dir === 3 ? -size * 0.06 : 0);
    var lookY = dir === 2 ? size * 0.03 : (dir === 0 ? -size * 0.03 : 0);
    // バイザー画面
    ctx.fillStyle = '#0f172a';
    roundRectPath(ctx, -size * 0.2 + lookX * 0.5, -size * 0.27 + lookY * 0.4, size * 0.4, size * 0.18, size * 0.07);
    ctx.fill();

    // 感情別の目
    if (dir === 0) {
      // 上向き（後ろ姿風：アンテナランプ）
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -size * 0.18, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'fail' || emotion === 'stun') {
      // 目が白黒（ぐるぐる / ×_×）
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (var ex = -1; ex <= 1; ex += 2) {
        var cxE = ex * size * 0.09 + lookX * 0.5;
        var cyE = -size * 0.18 + lookY * 0.4;
        ctx.beginPath();
        ctx.arc(cxE, cyE, size * 0.055, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cxE + Math.cos(time * 16) * 2, cyE + Math.sin(time * 16) * 2, size * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
      }
      // 頭の周りのピヨピヨ星
      for (var st = 0; st < 3; st++) {
        var sa = time * 5 + (st * Math.PI * 2) / 3;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * size * 0.28, -size * 0.36 + Math.sin(sa) * size * 0.07, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (emotion === 'happy') {
      // にっこり目（^ ^）
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = Math.max(2, size * 0.05);
      ctx.lineCap = 'round';
      for (var hx = -1; hx <= 1; hx += 2) {
        var hcx = hx * size * 0.09 + lookX * 0.5;
        ctx.beginPath();
        ctx.arc(hcx, -size * 0.16, size * 0.055, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else {
      // キラキラ丸目
      for (var nx = -1; nx <= 1; nx += 2) {
        var ncx = nx * size * 0.09 + lookX * 0.6;
        var ncy = -size * 0.18 + lookY * 0.4;
        ctx.beginPath();
        ctx.arc(ncx, ncy, size * 0.052, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ncx - size * 0.015, ncy - size * 0.015, size * 0.018, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    // 進行方向ガイドの小さな三角矢印（子どもが向きを1秒で把握できるように）
    var arrowOffsets = [
      { x: 0, y: -size * 0.48, a: -Math.PI / 2 },
      { x: size * 0.44, y: 0, a: 0 },
      { x: 0, y: size * 0.48, a: Math.PI / 2 },
      { x: -size * 0.44, y: 0, a: Math.PI }
    ];
    var ao = arrowOffsets[dir];
    ctx.save();
    ctx.translate(ao.x, ao.y);
    ctx.rotate(ao.a);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, 0);
    ctx.lineTo(-size * 0.06, -size * 0.07);
    ctx.lineTo(-size * 0.06, size * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  Renderer.prototype.drawParticles = function (ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'crumb' || p.shape === 'confetti') {
        ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);
      } else if (p.shape === 'star') {
        ctx.beginPath();
        for (var s = 0; s < 5; s++) {
          var a = (s * Math.PI * 2) / 5;
          var r1 = p.size;
          var r2 = p.size * 0.42;
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.lineTo(Math.cos(a + Math.PI / 5) * r2, Math.sin(a + Math.PI / 5) * r2);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  Renderer.prototype.renderScene = function (params) {
    this.resize();
    var ctx = this.ctx;
    var w = this.logicalWidth;
    var h = this.logicalHeight;
    var stage = params.stage;
    var grid = params.grid;
    var theme = params.theme;
    var time = params.time || 0;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. 工房背景グラデーション
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, theme ? theme.bgTop : '#fef3c7');
    bg.addColorStop(1, theme ? theme.bgBottom : '#fde68a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 2. 背景のゆっくり回る大歯車
    for (var g = 0; g < this.bgGears.length; g++) {
      var bgGear = this.bgGears[g];
      drawGearShape(
        ctx,
        w * bgGear.rx,
        h * bgGear.ry,
        bgGear.r,
        bgGear.r * 0.76,
        bgGear.teeth,
        time * bgGear.speed,
        bgGear.color,
        null,
        bgGear.r * 0.25
      );
    }

    // 3. 舞い上がる光のダストパーティクル
    for (var m = 0; m < this.dustMotes.length; m++) {
      var dm = this.dustMotes[m];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(dm.x * w + Math.sin(time + dm.phase) * 8, dm.y * h, dm.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 盤面レイアウト計算
    var rows = grid.length;
    var cols = grid[0].length;
    var margin = 24;
    var cellSize = Math.floor(Math.min((w - margin * 2) / cols, (h - margin * 2) / rows));
    var boardW = cellSize * cols;
    var boardH = cellSize * rows;
    var offsetX = Math.floor((w - boardW) / 2);
    var offsetY = Math.floor((h - boardH) / 2);
    this.layout = { cellSize: cellSize, offsetX: offsetX, offsetY: offsetY, cols: cols, rows: rows };

    // 盤面全体の木枠ベース
    ctx.fillStyle = 'rgba(120, 53, 15, 0.22)';
    roundRectPath(ctx, offsetX - 10, offsetY - 6, boardW + 20, boardH + 20, 18);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    roundRectPath(ctx, offsetX - 8, offsetY - 8, boardW + 16, boardH + 16, 16);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    roundRectPath(ctx, offsetX - 4, offsetY - 4, boardW + 8, boardH + 8, 12);
    ctx.fill();

    // 5. タイル描画（床・ギミック・壁）
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var tx = offsetX + x * cellSize;
        var ty = offsetY + y * cellSize;
        var ch = grid[y].charAt ? grid[y].charAt(x) : grid[y][x];
        if (ch === '.') this.drawWoodTile(ctx, tx, ty, cellSize, (x + y) % 2 === 1);
        else if (ch === '#') this.drawWallTile(ctx, tx, ty, cellSize);
        else if (ch === 'O') this.drawHoleTile(ctx, tx, ty, cellSize);
        else if (ch === '^') this.drawSpikeTile(ctx, tx, ty, cellSize, time);
        else if (ch === 'B') this.drawBiscuitWall(ctx, tx, ty, cellSize);
        else if (ch === 'I') this.drawIronBlock(ctx, tx, ty, cellSize, false);
        else if (ch === 'F') this.drawIronBlock(ctx, tx, ty, cellSize, true);
        else if (ch === 'G') this.drawGoalTile(ctx, tx, ty, cellSize, time);
        else if (ch === 'U' || ch === 'R' || ch === 'D' || ch === 'L') this.drawConveyorTile(ctx, tx, ty, cellSize, ch, time);
        else if (ch === 'C') this.drawRotatePlate(ctx, tx, ty, cellSize, true, time);
        else if (ch === 'W') this.drawRotatePlate(ctx, tx, ty, cellSize, false, time);
        else if (ch === '1' || ch === '2' || ch === '3' || ch === '4') this.drawWarpTile(ctx, tx, ty, cellSize, ch, time);
        else this.drawWoodTile(ctx, tx, ty, cellSize, false);
      }
    }

    // 6. 黄金のギア（未回収なら描画）
    if (stage.gear && !params.gearCollected) {
      this.drawGoldenGear(ctx, stage.gear.x, stage.gear.y, time);
    }

    // 7. ネジ丸（主人公ロボット）描画
    var rx = params.robotX;
    var ry = params.robotY;
    var rcx = offsetX + (rx + 0.5) * cellSize;
    var rcy = offsetY + (ry + 0.5) * cellSize;
    this.drawNejimaru(ctx, rcx, rcy, cellSize * 0.92, {
      dir: params.robotDir,
      parts: params.parts,
      partLevels: params.partLevels,
      emotion: params.emotion,
      animProgress: params.animProgress,
      time: time
    });

    // 8. パーティクル描画
    this.drawParticles(ctx);

    ctx.restore();
  };

  /**
   * タイトル画面の背景：回転する大時計塔・噛み合う歯車・舞う光の粒子
   */
  Renderer.renderTitleBackdrop = function (canvas, time) {
    if (!canvas) return;
    var parent = canvas.parentElement;
    if (!parent) return;
    var cw = parent.clientWidth || 1024;
    var ch = parent.clientHeight || 768;
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var tw = Math.floor(cw * dpr);
    var th = Math.floor(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }

    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 夕暮れ〜黄金のおもちゃ工房グラデーション
    var bg = ctx.createRadialGradient(cw * 0.5, ch * 0.38, 40, cw * 0.5, ch * 0.5, Math.max(cw, ch) * 0.85);
    bg.addColorStop(0, '#fffbeb');
    bg.addColorStop(0.45, '#fde68a');
    bg.addColorStop(0.85, '#fdba74');
    bg.addColorStop(1, '#f59e0b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // 2. 放射状の光の筋（サンバースト）
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.42);
    ctx.rotate(time * 0.06);
    var rays = 14;
    for (var r = 0; r < rays; r++) {
      var a0 = (r / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(cw, ch), a0, a0 + Math.PI / rays);
      ctx.closePath();
      ctx.fillStyle = r % 2 === 0 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(254, 240, 138, 0.04)';
      ctx.fill();
    }
    ctx.restore();

    // 3. 中央奥の巨大時計文字盤シルエット
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.45);
    var clockR = Math.min(cw, ch) * 0.42;
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.15)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, clockR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, clockR * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    for (var m = 0; m < 12; m++) {
      var ang = (m / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * clockR * 0.88, Math.sin(ang) * clockR * 0.88);
      ctx.lineTo(Math.cos(ang) * clockR * 0.96, Math.sin(ang) * clockR * 0.96);
      ctx.stroke();
    }
    // 時計の長針・短針（カチコチ回転）
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.18)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(time * 0.4 - Math.PI / 2) * clockR * 0.72, Math.sin(time * 0.4 - Math.PI / 2) * clockR * 0.72);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(time * 0.08 - Math.PI / 2) * clockR * 0.48, Math.sin(time * 0.08 - Math.PI / 2) * clockR * 0.48);
    ctx.stroke();
    ctx.restore();

    // 4. 四隅＆周囲の噛み合う巨大歯車群
    var gearSpecs = [
      { x: cw * 0.08, y: ch * 0.16, r: 95, teeth: 14, spd: 0.25, col: 'rgba(180, 83, 9, 0.18)', str: 'rgba(120, 53, 15, 0.22)' },
      { x: cw * 0.19, y: ch * 0.28, r: 58, teeth: 9, spd: -0.39, col: 'rgba(217, 119, 6, 0.20)', str: 'rgba(146, 64, 14, 0.22)' },
      { x: cw * 0.91, y: ch * 0.20, r: 110, teeth: 16, spd: -0.22, col: 'rgba(180, 83, 9, 0.16)', str: 'rgba(120, 53, 15, 0.20)' },
      { x: cw * 0.81, y: ch * 0.34, r: 62, teeth: 10, spd: 0.35, col: 'rgba(245, 158, 11, 0.22)', str: 'rgba(180, 83, 9, 0.22)' },
      { x: cw * 0.11, y: ch * 0.86, r: 88, teeth: 12, spd: -0.28, col: 'rgba(180, 83, 9, 0.18)', str: 'rgba(120, 53, 15, 0.2)' },
      { x: cw * 0.89, y: ch * 0.84, r: 96, teeth: 14, spd: 0.24, col: 'rgba(217, 119, 6, 0.18)', str: 'rgba(146, 64, 14, 0.22)' }
    ];
    for (var g = 0; g < gearSpecs.length; g++) {
      var gs = gearSpecs[g];
      drawGearShape(ctx, gs.x, gs.y, gs.r, gs.r * 0.78, gs.teeth, time * gs.spd, gs.col, gs.str, gs.r * 0.26);
    }

    // 5. 舞い上がる光の粒＆小さな浮遊ギア
    for (var i = 0; i < 24; i++) {
      var px = ((i * 97 + time * (12 + (i % 5) * 3)) % (cw + 40)) - 20;
      var py = ch - (((i * 63 + time * (18 + (i % 4) * 6)) % (ch + 40)) - 20);
      var pulse = 0.45 + 0.55 * Math.sin(time * 2.5 + i);
      ctx.save();
      ctx.globalAlpha = 0.55 * pulse;
      if (i % 4 === 0) {
        drawGearShape(ctx, px, py, 9, 6.5, 6, time * 1.4 + i, '#fde047', '#b45309', 2.5);
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fef08a';
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + (i % 3) * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  /**
   * タイトル画面のヒーローライブデモ：木目ステージ上で動いてジャンプするネジ丸
   */
  Renderer.renderTitleStageDemo = function (canvas, parts, partLevels, time) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 工房ステージ背景
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#fffbeb');
    bg.addColorStop(0.65, '#fde68a');
    bg.addColorStop(1, '#fdba74');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    drawGearShape(ctx, w * 0.18, h * 0.22, 26, 20, 8, time * 0.7, 'rgba(217,119,6,0.2)', null, 7);
    drawGearShape(ctx, w * 0.84, h * 0.26, 22, 16, 7, -time * 0.9, 'rgba(234,88,12,0.18)', null, 6);

    // 積み木の床ステージ3マス
    var tileW = w * 0.26;
    var tileY = h * 0.72;
    var startX = w * 0.11;
    for (var tx = 0; tx < 3; tx++) {
      var bx = startX + tx * (tileW + 4);
      ctx.fillStyle = 'rgba(120, 53, 15, 0.2)';
      roundRectPath(ctx, bx + 2, tileY + 6, tileW, 28, 7);
      ctx.fill();

      var wg = ctx.createLinearGradient(bx, tileY, bx, tileY + 26);
      wg.addColorStop(0, tx % 2 === 0 ? '#fde68a' : '#fed7aa');
      wg.addColorStop(1, tx % 2 === 0 ? '#f59e0b' : '#fb923c');
      ctx.fillStyle = wg;
      roundRectPath(ctx, bx, tileY, tileW, 26, 7);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#92400e';
      ctx.stroke();
    }

    // 浮遊する黄金ギアアイコン
    var gearBob = Math.sin(time * 3.2) * 4;
    ctx.save();
    ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
    ctx.shadowBlur = 12;
    drawGearShape(ctx, w * 0.82, h * 0.56 + gearBob, 15, 11, 8, time * 1.6, '#fde047', '#92400e', 4.5);
    ctx.restore();

    // サイクルアニメーション：左右歩行＋ピョンとジャンプ＋喜び！
    var cycle = (time * 0.42) % 4;
    var rx = w * 0.5;
    var ry = h * 0.58;
    var dir = 1;
    var emotion = 'normal';
    var animP = 1;

    if (cycle < 1.2) {
      // 左から右へトコトコ移動
      var p1 = cycle / 1.2;
      rx = w * (0.28 + 0.36 * p1);
      ry = h * 0.58 - Math.abs(Math.sin(p1 * Math.PI * 3)) * 5;
      dir = 1;
    } else if (cycle < 2.0) {
      // スプリング・ジャンプ！
      var p2 = (cycle - 1.2) / 0.8;
      rx = w * 0.64;
      ry = h * 0.58 - Math.sin(p2 * Math.PI) * 32;
      dir = 1;
      emotion = 'jump';
      animP = p2;
    } else if (cycle < 3.2) {
      // 右から左へ戻る
      var p3 = (cycle - 2.0) / 1.2;
      rx = w * (0.64 - 0.36 * p3);
      ry = h * 0.58 - Math.abs(Math.sin(p3 * Math.PI * 3)) * 5;
      dir = 3;
      emotion = 'turbo';
    } else {
      // 正面を向いてにっこりハート＆キラキラ
      rx = w * 0.28;
      ry = h * 0.58;
      dir = 2;
      emotion = 'happy';
    }

    // タイトルでは装備パーツも日替わり/デモ表示（所持パーツが無い初期状態でもバネ・ドリルが見えるとワクワクする、持っていれば全装着）
    var demoParts = (parts && parts.length > 0) ? parts : ['spring', 'drill'];
    Renderer.prototype.drawNejimaru(ctx, rx, ry, Math.min(w, h) * 0.54, {
      dir: dir,
      parts: demoParts,
      partLevels: partLevels || {},
      emotion: emotion,
      animProgress: animP,
      time: time || 0
    });
  };

  /**
   * 図鑑・パーツ選択モーダル用のネジ丸ミニプレビュー描画
   */
  Renderer.renderPreview = function (canvas, parts, partLevels, time) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 温かい背景スポット
    var grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5);
    grad.addColorStop(0, '#fef9c3');
    grad.addColorStop(1, '#fde68a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    drawGearShape(ctx, w * 0.2, h * 0.24, 24, 18, 8, time * 0.5, 'rgba(217,119,6,0.16)', null, 6);
    drawGearShape(ctx, w * 0.82, h * 0.78, 28, 21, 9, -time * 0.4, 'rgba(217,119,6,0.16)', null, 7);

    Renderer.prototype.drawNejimaru(ctx, w * 0.5, h * 0.54, Math.min(w, h) * 0.78, {
      dir: 1,
      parts: parts || [],
      partLevels: partLevels || {},
      emotion: 'happy',
      time: time || 0
    });
  };

  root.BugSweeper = root.BugSweeper || {};
  root.BugSweeper.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
