/**
 * Umpire announcement post — mint / teal match-flyer style (single portrait).
 */

const W = 1080;
const H = 1350;

const GREEN = "#0d9488";
const GREEN_MID = "#14b8a6";
const GREEN_DARK = "#0f766e";
const GREEN_DEEP = "#115e59";
const GREEN_PALE = "#99f6e4";
const GOLD = "#d4af37";
const GOLD_LIGHT = "#f5e6a8";
const GOLD_DEEP = "#a16207";
const NAVY = "#0c1a2e";
const MUTED = "#5b6b7c";
const WHITE = "#ffffff";
const SAFE = 48;

function loadImage(src, { cors = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

async function loadLocalImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await loadImage(objectUrl);
      if (img.decode) await img.decode().catch(() => {});
      return img;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    try {
      return await loadImage(url, { cors: true });
    } catch {
      return null;
    }
  }
}

function coverImage(ctx, img, x, y, w, h, focusY = 0.2) {
  if (!img) return;
  const ir = img.width / img.height;
  const br = w / h;
  let dw;
  let dh;
  let dx;
  let dy;
  if (ir > br) {
    dh = h;
    dw = h * ir;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    dw = w;
    dh = w / ir;
    dx = x;
    dy = y - (dh - h) * focusY;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, maxSize, minSize = 16) {
  let size = maxSize;
  ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  }
  return size;
}

function drawPill(ctx, text, x, y, opts = {}) {
  const {
    bg = GREEN,
    color = WHITE,
    fontSize = 18,
    padX = 18,
    padY = 10,
    radius = 999,
  } = opts;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const h = fontSize + padY * 2;
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 1);
  return { w, h };
}

function drawDashedCircle(ctx, cx, cy, r, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function spacedText(ctx, text, cx, y, spacing, fillStyle) {
  ctx.font = "900 26px Arial Black, Arial, sans-serif";
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  let sx = cx - total / 2;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const ch of text) {
    const cw = ctx.measureText(ch).width;
    ctx.fillText(ch, sx + cw / 2, y);
    sx += cw + spacing;
  }
}

/**
 * @param {{ id: string, name: string, image: string, role?: string }} umpire
 * @param {{ index?: number, total?: number }} [meta]
 */
export async function generateUmpirePost(umpire, meta = {}) {
  const name = umpire?.name || "Umpire";
  const role = umpire?.role || "Official Umpire";
  const index = meta.index ?? 0;
  const total = meta.total ?? 6;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const [logo, photo] = await Promise.all([
    loadImage("/al_umer_electronics_logo_v2.png").catch(() =>
      loadImage("/al_umer_electronics_logo.png").catch(() => null)
    ),
    loadLocalImage(umpire?.image),
  ]);

  // Soft mint → cream wash (match flyer style)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#e6fffa");
  bg.addColorStop(0.28, "#f0fdfa");
  bg.addColorStop(0.55, "#fffef8");
  bg.addColorStop(1, "#f8fafc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W, 0, 20, W, 0, 420);
  glow.addColorStop(0, "rgba(212,175,55,0.18)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, GOLD);
  bar.addColorStop(0.35, GREEN);
  bar.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 14, H);

  ctx.save();
  ctx.globalAlpha = 0.2;
  for (let x = W - 280; x < W - 20; x += 14) {
    for (let y = 20; y < 220; y += 14) {
      const dist = Math.hypot(x - (W - 20), y - 20);
      if (dist > 200) continue;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = GREEN_DARK;
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(13,148,136,0.28)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 20, 20, W - 40, H - 40, 36);
  ctx.stroke();

  // Header chip
  drawPill(ctx, "UMPIRE PANEL", W / 2, 70, {
    bg: GREEN_DEEP,
    color: WHITE,
    fontSize: 18,
    padX: 28,
    padY: 12,
  });

  // Logo + brand
  let y = 120;
  if (logo) {
    const lw = 130;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
    y += lh + 22;
  }

  ctx.fillStyle = NAVY;
  ctx.font = "900 44px Arial Black, Impact, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS", W / 2, y);
  y += 44;

  const subGrad = ctx.createLinearGradient(0, y - 14, 0, y + 14);
  subGrad.addColorStop(0, "#34d399");
  subGrad.addColorStop(0.5, GREEN_MID);
  subGrad.addColorStop(1, GREEN_DEEP);
  spacedText(ctx, "SPORTS GALA S3", W / 2, y, 10, subGrad);
  y += 56;

  // Role label
  ctx.fillStyle = MUTED;
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillText(role.toUpperCase(), W / 2, y);

  // Portrait
  const photoSize = 420;
  const cx = W / 2;
  const photoCy = 640;

  drawDashedCircle(ctx, cx, photoCy, photoSize / 2 + 32, "rgba(13,148,136,0.3)", 2.5);
  drawDashedCircle(ctx, cx, photoCy, photoSize / 2 + 16, "rgba(212,175,55,0.4)", 1.8);

  const ringPad = 8;
  const outerR = photoSize / 2 + ringPad;
  const ringGrad = ctx.createLinearGradient(
    cx - outerR,
    photoCy - outerR,
    cx + outerR,
    photoCy + outerR
  );
  ringGrad.addColorStop(0, GREEN_PALE);
  ringGrad.addColorStop(0.45, GREEN);
  ringGrad.addColorStop(0.75, GOLD);
  ringGrad.addColorStop(1, GOLD_DEEP);

  ctx.save();
  ctx.shadowColor = "rgba(13,148,136,0.35)";
  ctx.shadowBlur = 32;
  ctx.beginPath();
  ctx.arc(cx, photoCy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, photoCy, photoSize / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = WHITE;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, photoCy, photoSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#e2e8f0";
  ctx.fill();
  ctx.clip();
  if (photo) {
    coverImage(
      ctx,
      photo,
      cx - photoSize / 2,
      photoCy - photoSize / 2,
      photoSize,
      photoSize,
      0.18
    );
  } else {
    ctx.fillStyle = MUTED;
    ctx.font = "900 80px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", cx, photoCy);
  }
  ctx.restore();

  // Name pill
  const nameY = photoCy + photoSize / 2 + 52;
  const nameUpper = String(name).toUpperCase();
  const nameSize = fitText(ctx, nameUpper, W - SAFE * 2 - 80, 28, 18);
  drawPill(ctx, nameUpper, cx, nameY, {
    bg: GREEN_DEEP,
    color: WHITE,
    fontSize: nameSize,
    padX: 36,
    padY: 14,
  });

  // Meta
  const metaY = nameY + 70;
  ctx.fillStyle = NAVY;
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Official Umpire  ·  ${index + 1} of ${total}`, W / 2, metaY);

  drawPill(ctx, "FAIR PLAY · RESPECT · UNITY", W / 2, metaY + 52, {
    bg: GREEN,
    color: WHITE,
    fontSize: 18,
    padX: 26,
    padY: 12,
  });

  ctx.fillStyle = GREEN;
  ctx.font = "bold 18px Arial, sans-serif";
  spacedText(ctx, "SEASON 3", W / 2, metaY + 110, 8, GREEN);

  // Footer plaque
  const fy = H - 130;
  roundRectPath(ctx, SAFE, fy, W - SAFE * 2, 78, 24);
  const footGrad = ctx.createLinearGradient(SAFE, fy, SAFE, fy + 78);
  footGrad.addColorStop(0, GOLD_LIGHT);
  footGrad.addColorStop(0.5, GOLD);
  footGrad.addColorStop(1, GOLD_DEEP);
  ctx.fillStyle = footGrad;
  ctx.fill();

  ctx.fillStyle = NAVY;
  ctx.font = "900 26px Arial Black, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS UMPIRE PANEL", W / 2, fy + 32);
  ctx.fillStyle = "rgba(12,26,46,0.72)";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Sports Gala Season 3", W / 2, fy + 58);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const safe = String(name)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);
  const filename = `umpire-${String(index + 1).padStart(2, "0")}-${safe || "panel"}.png`;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

  return { filename, blob, url: objectUrl };
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  return objectUrl;
}

function drawScalesIcon(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const cx = x + size / 2;
  const cy = y + size / 2;
  // beam
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.38, cy - size * 0.05);
  ctx.lineTo(cx + size * 0.38, cy - size * 0.05);
  ctx.stroke();
  // center post
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.28);
  ctx.lineTo(cx, cy + size * 0.32);
  ctx.stroke();
  // pans
  for (const side of [-1, 1]) {
    const px = cx + side * size * 0.32;
    ctx.beginPath();
    ctx.moveTo(px, cy - size * 0.05);
    ctx.lineTo(px, cy + size * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px - size * 0.14, cy + size * 0.08);
    ctx.quadraticCurveTo(px, cy + size * 0.22, px + size * 0.14, cy + size * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Full umpire panel poster — mint match-flyer theme, 3×2 with large portraits.
 * @param {Array<{ id: string, name: string, image: string, role?: string }>} umpires
 */
export async function generateUmpirePanelPost(umpires) {
  const list = Array.isArray(umpires) ? umpires.slice(0, 6) : [];
  if (!list.length) throw new Error("No umpires to render");

  const PW = 1080;
  const PH = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = PW;
  canvas.height = PH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const [logo, ...photos] = await Promise.all([
    loadImage("/al_umer_electronics_logo_v2.png").catch(() =>
      loadImage("/al_umer_electronics_logo.png").catch(() => null)
    ),
    ...list.map((u) => loadLocalImage(u.image)),
  ]);

  // Soft mint → cream (match flyer)
  const bg = ctx.createLinearGradient(0, 0, 0, PH);
  bg.addColorStop(0, "#e6fffa");
  bg.addColorStop(0.35, "#f0fdfa");
  bg.addColorStop(0.7, "#fffef8");
  bg.addColorStop(1, "#f8fafc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PW, PH);

  const glow = ctx.createRadialGradient(PW, 0, 20, PW, 0, 420);
  glow.addColorStop(0, "rgba(212,175,55,0.16)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, PW, PH);

  const bar = ctx.createLinearGradient(0, 0, 0, PH);
  bar.addColorStop(0, GOLD);
  bar.addColorStop(0.35, GREEN);
  bar.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 14, PH);

  ctx.strokeStyle = "rgba(13,148,136,0.22)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 18, 18, PW - 36, PH - 36, 32);
  ctx.stroke();

  // Header
  let y = 40;
  if (logo) {
    const lw = 100;
    const lh = (logo.height / logo.width) * lw;
    roundRectPath(ctx, (PW - lw) / 2 - 10, y - 8, lw + 20, lh + 16, 16);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.drawImage(logo, (PW - lw) / 2, y, lw, lh);
    y += lh + 20;
  }

  ctx.fillStyle = NAVY;
  ctx.font = "900 40px Arial Black, Impact, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS", PW / 2, y);
  y += 38;

  const subGrad = ctx.createLinearGradient(0, y - 12, 0, y + 12);
  subGrad.addColorStop(0, "#34d399");
  subGrad.addColorStop(0.5, GREEN_MID);
  subGrad.addColorStop(1, GREEN_DEEP);
  spacedText(ctx, "SPORTS GALA S3", PW / 2, y, 10, subGrad);
  y += 36;

  drawPill(ctx, "UMPIRE PANEL", PW / 2, y + 4, {
    bg: GREEN_DEEP,
    color: WHITE,
    fontSize: 16,
    padX: 24,
    padY: 10,
  });
  y += 40;

  // Grid 3×2 — taller cards, larger photos
  const cols = 3;
  const rows = 2;
  const gapX = 20;
  const gapY = 22;
  const marginX = 40;
  const gridTop = y;
  const gridBottom = PH - 48;
  const gridW = PW - marginX * 2;
  const gridH = gridBottom - gridTop;
  const cardW = (gridW - gapX * (cols - 1)) / cols;
  const cardH = (gridH - gapY * (rows - 1)) / rows;

  for (let i = 0; i < list.length; i++) {
    const umpire = list[i];
    const photo = photos[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx0 = marginX + col * (cardW + gapX);
    const cy0 = gridTop + row * (cardH + gapY);

    ctx.save();
    ctx.shadowColor = "rgba(15,118,110,0.12)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    roundRectPath(ctx, cx0, cy0, cardW, cardH, 26);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(16,185,129,0.28)";
    ctx.lineWidth = 2;
    roundRectPath(ctx, cx0, cy0, cardW, cardH, 26);
    ctx.stroke();
    ctx.restore();

    // Index
    ctx.beginPath();
    ctx.arc(cx0 + 24, cy0 + 24, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = "900 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1).padStart(2, "0"), cx0 + 24, cy0 + 25);

    drawScalesIcon(ctx, cx0 + cardW - 38, cy0 + 12, 24, GOLD_DEEP);

    // Larger photo (~74% of card width)
    const photoSize = Math.min(cardW * 0.74, cardH * 0.56);
    const pcx = cx0 + cardW / 2;
    const pcy = cy0 + cardH * 0.38;

    drawDashedCircle(ctx, pcx, pcy, photoSize / 2 + 18, "rgba(16,185,129,0.4)", 2);
    drawDashedCircle(ctx, pcx, pcy, photoSize / 2 + 8, "rgba(212,175,55,0.45)", 1.5);

    ctx.save();
    ctx.beginPath();
    ctx.arc(pcx, pcy, photoSize / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pcx, pcy, photoSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    ctx.clip();
    if (photo) {
      coverImage(
        ctx,
        photo,
        pcx - photoSize / 2,
        pcy - photoSize / 2,
        photoSize,
        photoSize,
        0.18
      );
    }
    ctx.restore();

    const nameY = pcy + photoSize / 2 + 30;
    ctx.fillStyle = NAVY;
    const nSize = fitText(ctx, umpire.name, cardW - 28, 24, 14);
    ctx.font = `900 ${nSize}px Arial Black, Impact, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(umpire.name, pcx, nameY);

    const role = (umpire.role || "Official Umpire").toUpperCase();
    drawPill(ctx, role, pcx, nameY + 32, {
      bg: GREEN_DEEP,
      color: WHITE,
      fontSize: 12,
      padX: 14,
      padY: 8,
    });
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const filename = "umpire-panel-sports-gala-s3.png";
  const objectUrl = downloadBlob(blob, filename);
  return { filename, blob, url: objectUrl };
}
