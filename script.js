// ════════════════════════════════════════════════════════════
// PALETTE
// ════════════════════════════════════════════════════════════
const COLORS = [
  '#e74c3c','#c0392b','#e67e22','#f39c12',
  '#f1c40f','#d4ac0d','#2ecc71','#27ae60',
  '#1abc9c','#3498db','#2980b9','#9b59b6',
  '#8e44ad','#e91e63','#ff5722','#795548',
  '#ffffff','#d0d0d0','#aaaaaa','#555555'
];

// Template fill for the paint canvas (neutral gray = unfilled region)
const GRAY = '#e0e0e0';

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let difficulty   = 'easy';
let activeColor  = '#e74c3c';
let eraserMode   = false;
let paintHistory  = [];  // snapshots of fillCtx (not the composite)
let paintCtx      = null;  // visible canvas ctx
let fillCtx       = null;  // offscreen fill layer
let outlineCanvas = null;  // offscreen outline layer (drawn once, never changed)
let refImageData  = null;  // colored reference pixel data (region map)
let peekMode      = false; // true while the user is peeking at the reference

// ════════════════════════════════════════════════════════════
// SCREEN HELPERS
// ════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ════════════════════════════════════════════════════════════
// MANDALA CONFIGS
// ════════════════════════════════════════════════════════════
const CFG = {
  easy: {
    sym: 6,
    palette: ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#e67e22'],
    rings: 3
  },
  medium: {
    sym: 8,
    palette: ['#e74c3c','#f39c12','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63'],
    rings: 4
  },
  hard: {
    sym: 12,
    palette: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#2980b9','#9b59b6','#e91e63','#ff5722'],
    rings: 5
  }
};

// ════════════════════════════════════════════════════════════
// MANDALA DRAWING
//
// colored = true        → colored reference (palette colors, dark bg)
// colored = GRAY string → template mode (gray fills, white bg) — initial paint layer
// colored = false       → outlines only (no fill, transparent bg) — static overlay
// skipBg  = true        → skip canvas clear + background fill
// ════════════════════════════════════════════════════════════
const SZ = 500, CX = 250, CY = 250, R = 220;

function drawMandala(ctx, diff, colored, skipBg) {
  const cfg = CFG[diff];
  const pal = cfg.palette;

  if (!skipBg) {
    ctx.clearRect(0, 0, SZ, SZ);
    if (colored === true) {
      const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R + 30);
      grad.addColorStop(0, '#1a1a3e');
      grad.addColorStop(1, '#0a0a1e');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, SZ, SZ);
  }

  ctx.save();
  ctx.translate(CX, CY);
  circle(ctx, 0, 0, R + 10, 'none',
    colored === true ? 'rgba(255,255,255,.08)' : '#bbb', 1.5);
  ctx.restore();

  for (let i = 0; i < cfg.sym; i++) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate((2 * Math.PI * i) / cfg.sym);
    drawSlice(ctx, diff, colored, pal);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(CX, CY);
  drawCenter(ctx, cfg, colored, pal);
  ctx.restore();
}

// Returns the fill for a shape given the current draw mode.
// colored=true  → palette color
// colored=GRAY  → neutral gray
// colored=false → 'none' (outline only)
function sf(colored, palColor) {
  return colored === true ? palColor : (colored || 'none');
}

function drawSlice(ctx, diff, colored, pal) {
  if (diff === 'easy')   drawEasySlice(ctx, colored, pal);
  if (diff === 'medium') drawMediumSlice(ctx, colored, pal);
  if (diff === 'hard')   drawHardSlice(ctx, colored, pal);
}

// ── EASY ────────────────────────────────────────────────────
function drawEasySlice(ctx, c, pal) {
  const stroke = c === true ? 'rgba(0,0,0,.25)' : '#333';
  const lw     = c === true ? 1 : 1.5;

  petal(ctx, 0, 0, R * .65, R * .22, sf(c, pal[0]), stroke, lw);
  petal(ctx, R * .1, 0, R * .42, R * .14, sf(c, pal[1]), stroke, lw);
  circle(ctx, R * .67, 0, R * .055, sf(c, pal[2]), stroke, lw);
  arc(ctx, 0, 0, R * .25, -Math.PI / 6, Math.PI / 6, sf(c, pal[3]), stroke, c === true ? 9 : 7);
}

// ── MEDIUM ───────────────────────────────────────────────────
function drawMediumSlice(ctx, c, pal) {
  const stroke = c === true ? 'rgba(0,0,0,.25)' : '#333';
  const lw     = c === true ? 1 : 1.5;

  petal(ctx, 0, 0, R * .72, R * .2, sf(c, pal[0]), stroke, lw);
  petal(ctx, R * .08, 0, R * .52, R * .13, sf(c, pal[1]), stroke, lw);
  diamond(ctx, R * .73, 0, R * .06, R * .04, sf(c, pal[2]), stroke, lw);
  circle(ctx, R * .48, 0, R * .045, sf(c, pal[3]), stroke, lw);
  arc(ctx, 0, 0, R * .22, -Math.PI / 8, Math.PI / 8, sf(c, pal[4]), stroke, c === true ? 11 : 8);
  arc(ctx, 0, 0, R * .37, -Math.PI / 9, Math.PI / 9, sf(c, pal[5]), stroke, c === true ? 6 : 5);
  ctx.save();
  ctx.rotate(Math.PI / 8);
  petal(ctx, R * .32, 0, R * .16, R * .07, sf(c, pal[6 % pal.length]), stroke, lw);
  ctx.restore();
}

// ── HARD ─────────────────────────────────────────────────────
function drawHardSlice(ctx, c, pal) {
  const stroke = c === true ? 'rgba(0,0,0,.22)' : '#333';
  const lw     = c === true ? 1 : 1.5;

  petal(ctx, 0, 0, R * .82, R * .18, sf(c, pal[0]), stroke, lw);
  petal(ctx, R * .1, 0, R * .6, R * .11, sf(c, pal[1]), stroke, lw);
  petal(ctx, R * .22, 0, R * .35, R * .08, sf(c, pal[2]), stroke, lw);
  star(ctx, R * .84, 0, R * .055, R * .025, 4, sf(c, pal[3]), stroke, lw);
  diamond(ctx, R * .62, 0, R * .05, R * .03, sf(c, pal[4]), stroke, lw);
  triangle(ctx, R * .48, 0, R * .055, sf(c, pal[5]), stroke, lw);
  arc(ctx, 0, 0, R * .18, -Math.PI / 12, Math.PI / 12, sf(c, pal[6]), stroke, c === true ? 12 : 9);
  arc(ctx, 0, 0, R * .30, -Math.PI / 13, Math.PI / 13, sf(c, pal[7]), stroke, c === true ? 7 : 5);
  // Outer arc: was lw=4/3 (only ~2px fill) — increased to 14/12 so the band is visible
  arc(ctx, 0, 0, R * .88, -Math.PI / 14, Math.PI / 14, sf(c, pal[8 % pal.length]), stroke, c === true ? 14 : 12);
  ctx.save();
  ctx.rotate(Math.PI / 12);
  circle(ctx, R * .45, 0, R * .04, sf(c, pal[9 % pal.length]), stroke, lw);
  ctx.restore();
}

// ── CENTER ───────────────────────────────────────────────────
function drawCenter(ctx, cfg, c, pal) {
  const rings  = cfg.rings;
  const stroke = c === true ? 'rgba(0,0,0,.2)' : '#333';
  for (let r = rings; r >= 1; r--) {
    const rad = (R * .22) * r / rings;
    circle(ctx, 0, 0, rad, sf(c, pal[r % pal.length]), stroke, c === true ? 1 : 1.5);
  }
  circle(ctx, 0, 0, R * .03, c === true ? '#fff' : (c || 'none'), stroke, 2);
}

// ════════════════════════════════════════════════════════════
// SHAPE PRIMITIVES
// ════════════════════════════════════════════════════════════
function applyStyle(ctx, fill, stroke, lw) {
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  if (fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}

function petal(ctx, x, y, length, width, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + length * .4, -(width), x + length * .7, -(width * .8), x + length, y);
  ctx.bezierCurveTo(x + length * .7, (width * .8), x + length * .4, (width), x, y);
  ctx.closePath();
  applyStyle(ctx, fill, stroke, lw);
}

function circle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  applyStyle(ctx, fill, stroke, lw);
}

function diamond(ctx, x, y, hw, hh, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.closePath();
  applyStyle(ctx, fill, stroke, lw);
}

function triangle(ctx, x, y, size, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * .866, y + size * .5);
  ctx.lineTo(x - size * .866, y + size * .5);
  ctx.closePath();
  applyStyle(ctx, fill, stroke, lw);
}

function star(ctx, x, y, outerR, innerR, points, fill, stroke, lw) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    i === 0 ? ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
             : ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
  }
  ctx.closePath();
  applyStyle(ctx, fill, stroke, lw);
}

// arc always draws a closed band shape in all modes
function arc(ctx, x, y, r, startA, endA, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, startA, endA);
  ctx.arc(x, y, r - lw * .5, endA, startA, true);
  ctx.closePath();
  if (fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ════════════════════════════════════════════════════════════
// GAME FLOW
// ════════════════════════════════════════════════════════════
function startGame(diff) {
  difficulty = diff;

  // Build colored reference once — used as region map by refFill
  const tmp = document.createElement('canvas');
  tmp.width = SZ; tmp.height = SZ;
  drawMandala(tmp.getContext('2d'), diff, true);
  refImageData = tmp.getContext('2d').getImageData(0, 0, SZ, SZ).data;

  drawMandala(document.getElementById('refCanvas').getContext('2d'), diff, true);
  showScreen('refScreen');
}

function showPaint() {
  const panel = document.getElementById('swatches');
  panel.innerHTML = '';
  COLORS.forEach(col => {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (col === activeColor ? ' active' : '');
    sw.style.cssText = `background:${col};margin-bottom:4px;`;
    sw.onclick = () => pickColor(col, sw);
    panel.appendChild(sw);
  });
  updateRing();

  eraserMode = false;
  document.getElementById('eraserBtn').classList.remove('active');

  showScreen('paintScreen');
  setupPainting();
}

function pickColor(col, swEl) {
  activeColor = col;
  eraserMode = false;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  swEl.classList.add('active');
  document.getElementById('eraserBtn').classList.remove('active');
  updateRing();
}

function toggleEraser() {
  eraserMode = !eraserMode;
  document.getElementById('eraserBtn').classList.toggle('active', eraserMode);
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  updateRing();
}

function updateRing() {
  document.getElementById('colorRing').style.background = eraserMode ? GRAY : activeColor;
}

function showFinish() {
  const src = document.getElementById('paintCanvas');
  const dst = document.getElementById('finishCanvas');
  dst.getContext('2d').drawImage(src, 0, 0);
  showScreen('finishScreen');

  const pct = checkAccuracy();
  const el  = document.getElementById('accuracyScore');
  el.textContent = pct + '%';
  el.style.color  = pct >= 75 ? '#4ade80' : pct >= 45 ? '#facc15' : '#f87171';
}

function checkAccuracy() {
  if (!fillCtx) return 0;
  const pal    = CFG[difficulty].palette;
  const palRGB = pal.map(h => hexToRgba(h));

  const tmp = document.createElement('canvas');
  tmp.width = SZ; tmp.height = SZ;
  drawMandala(tmp.getContext('2d'), difficulty, true);
  const ref = tmp.getContext('2d').getImageData(0, 0, SZ, SZ).data;
  // Use fill canvas (no outline strokes) for clean comparison
  const usr = fillCtx.getImageData(0, 0, SZ, SZ).data;

  function nearest(r, g, b) {
    let best = 0, bestD = Infinity;
    for (let p = 0; p < palRGB.length; p++) {
      const d = Math.abs(r - palRGB[p][0]) + Math.abs(g - palRGB[p][1]) + Math.abs(b - palRGB[p][2]);
      if (d < bestD) { bestD = d; best = p; }
    }
    return { idx: best, dist: bestD };
  }

  let total = 0, correct = 0;
  for (let i = 0; i < ref.length; i += 4) {
    const rr = ref[i], rg = ref[i+1], rb = ref[i+2];
    if (rr < 60 && rg < 60) continue;          // skip dark background
    const refM = nearest(rr, rg, rb);
    if (refM.dist > 80) continue;               // skip stroke/anti-alias pixels
    total++;
    const usrM = nearest(usr[i], usr[i+1], usr[i+2]);
    if (refM.idx === usrM.idx && usrM.dist < 80) correct++;
  }
  return total > 0 ? Math.round(correct / total * 100) : 0;
}

function saveMandala() {
  const a = document.createElement('a');
  a.download = 'my-mandala.png';
  a.href = document.getElementById('finishCanvas').toDataURL();
  a.click();
}

// ════════════════════════════════════════════════════════════
// PAINTING — TWO-CANVAS ARCHITECTURE
//
// fillCtx      : offscreen fill layer (gray template → user colors)
// outlineCanvas: offscreen, drawn ONCE and never changed
// paintCtx     : visible canvas = composite(fill + outlines)
//
// This prevents outline accumulation: outlines are composited from a fixed
// layer, so repeated clicks never darken or duplicate the strokes.
// ════════════════════════════════════════════════════════════
// Builds the static outline canvas.
// Petal/arc strokes that pass through the center ring area are erased (destination-out)
// and only the center ring circle outlines are redrawn, exactly like the colored reference
// where center ring fills cover petal ends.
function buildOutlineCanvas(diff) {
  const cfg  = CFG[diff];
  const oc   = document.createElement('canvas');
  oc.width = SZ; oc.height = SZ;
  const ctx  = oc.getContext('2d');

  // Draw all shape outlines on transparent background
  drawMandala(ctx, diff, false, true);

  // Erase everything inside the center ring area to remove petal/arc lines crossing it
  const centerR = R * .22 + 3; // outer ring radius + small buffer
  ctx.save();
  ctx.translate(CX, CY);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, centerR, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();

  // Restore normal blending and redraw only the center ring outlines
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(CX, CY);
  drawCenter(ctx, cfg, false, cfg.palette);
  ctx.restore();

  return oc;
}

function togglePeek() {
  peekMode = !peekMode;
  const btn = document.getElementById('peekBtn');
  if (peekMode) {
    btn.textContent = 'Hide';
    btn.classList.replace('btn-ghost', 'btn-gold');
    // Draw the colored reference directly onto the paint canvas
    paintCtx.drawImage(document.getElementById('refCanvas'), 0, 0);
  } else {
    btn.textContent = 'Show';
    btn.classList.replace('btn-gold', 'btn-ghost');
    composite();
  }
}

function setupPainting() {
  peekMode = false;
  paintHistory = [];

  // 1. Static outline layer — built with center-ring masking
  outlineCanvas = buildOutlineCanvas(difficulty);

  // 2. Fill layer (white bg + gray template fills)
  const fillEl = document.createElement('canvas');
  fillEl.width = SZ; fillEl.height = SZ;
  fillCtx = fillEl.getContext('2d');
  drawMandala(fillCtx, difficulty, GRAY); // template: same z-order as reference

  // 3. Visible canvas
  const canvas = document.getElementById('paintCanvas');
  const fresh  = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(fresh, canvas);
  paintCtx = fresh.getContext('2d');
  composite();

  fresh.addEventListener('click', e => {
    if (peekMode) { togglePeek(); return; }
    const rect = fresh.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (SZ / rect.width));
    const y = Math.round((e.clientY - rect.top)  * (SZ / rect.height));
    const col = eraserMode ? GRAY : activeColor;
    const snap = fillCtx.getImageData(0, 0, SZ, SZ);
    if (refFill(fillCtx, x, y, col)) {
      paintHistory.push(snap); // save BEFORE state only if something changed
      composite();
    }
  });
}

// Composites fill layer + static outline layer onto the visible canvas.
function composite() {
  paintCtx.clearRect(0, 0, SZ, SZ);
  paintCtx.drawImage(fillCtx.canvas, 0, 0);
  paintCtx.drawImage(outlineCanvas, 0, 0);
}

// Fills the reference region at (sx,sy) using palette-nearest-color matching.
// Returns true if anything was painted, false if click was on background/same color.
function refFill(ctx, sx, sy, fillHex) {
  const ref = refImageData;
  if (!ref) return false;

  const si   = (sy * SZ + sx) * 4;
  const refR = ref[si], refG = ref[si+1], refB = ref[si+2];
  if (refR < 60 && refG < 60) return false; // clicked on background

  // Identify which palette region the clicked pixel belongs to
  const pal    = CFG[difficulty].palette;
  const palRGB = pal.map(h => hexToRgba(h));

  let seedIdx = 0, seedDist = Infinity;
  for (let p = 0; p < palRGB.length; p++) {
    const d = Math.abs(refR - palRGB[p][0]) + Math.abs(refG - palRGB[p][1]) + Math.abs(refB - palRGB[p][2]);
    if (d < seedDist) { seedDist = d; seedIdx = p; }
  }
  // Reject clicks on non-palette pixels (e.g., white center dot, anti-alias bg edges)
  if (seedDist > 150) return false;

  const img = ctx.getImageData(0, 0, SZ, SZ);
  const d   = img.data;
  const [fr, fg, fb] = hexToRgba(fillHex);

  // Already this color — nothing to do
  if (d[si] === fr && d[si+1] === fg && d[si+2] === fb) return false;

  // Flood fill: expands while reference pixels map to the same palette region
  const stack = [sx + sy * SZ];
  const vis   = new Uint8Array(SZ * SZ);
  let painted = false;

  while (stack.length) {
    const pos = stack.pop();
    const x   = pos % SZ, y = (pos / SZ) | 0;
    if (x < 0 || x >= SZ || y < 0 || y >= SZ || vis[pos]) continue;
    vis[pos] = 1;

    const ri = pos * 4;
    const rr = ref[ri], rg = ref[ri+1], rb = ref[ri+2];

    // Skip background pixels
    if (rr < 60 && rg < 60) continue;

    // Check if this pixel maps to the same palette region as the seed
    let nearestIdx = 0, nearestDist = Infinity;
    for (let p = 0; p < palRGB.length; p++) {
      const dist = Math.abs(rr - palRGB[p][0]) + Math.abs(rg - palRGB[p][1]) + Math.abs(rb - palRGB[p][2]);
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = p; }
    }
    // Skip non-palette pixels (white center dot, anti-alias bg edges)
    if (nearestDist > 150) continue;
    if (nearestIdx !== seedIdx) continue; // different region — stop expanding

    d[ri] = fr; d[ri+1] = fg; d[ri+2] = fb; d[ri+3] = 255;
    painted = true;
    stack.push(pos+1, pos-1, pos+SZ, pos-SZ);
  }

  if (painted) ctx.putImageData(img, 0, 0);
  return painted;
}

function undo() {
  if (!fillCtx || paintHistory.length === 0) return;
  fillCtx.putImageData(paintHistory.pop(), 0, 0);
  composite();
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }
});

function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1,3), 16),
    parseInt(hex.slice(3,5), 16),
    parseInt(hex.slice(5,7), 16),
    255
  ];
}
