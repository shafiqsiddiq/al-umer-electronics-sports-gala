/**
 * Group Top 4 post — 4 qualifier cards in one image (mint / green match-flyer style).
 */

const W = 1600;
const H = 1000;

const GREEN = "#22c55e";
const GREEN_MID = "#16a34a";
const GREEN_DEEP = "#15803d";
const GREEN_PALE = "#bbf7d0";
const TEAL = "#0d9488";
const NAVY = "#0f172a";
const MUTED = "#64748b";
const WHITE = "#ffffff";
const SAFE = 36;

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

async function loadProfileImage(url) {
  if (!url || typeof url !== "string") return null;
  const fromBlob = async (src) => {
    const res = await fetch(src);
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
  };
  try {
    return await fromBlob(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  } catch {
    /* continue */
  }
  try {
    return await loadImage(url, { cors: true });
  } catch {
    /* continue */
  }
  try {
    return await fromBlob(url);
  } catch {
    return null;
  }
}

function coverImage(ctx, img, x, y, w, h, focusY = 0.15) {
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

function fitText(ctx, text, maxWidth, maxSize, minSize = 12) {
  let size = maxSize;
  ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return ["TBD"];
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && line && lines[maxLines - 1] !== line) {
    let last = lines[maxLines - 1];
    while (last.length > 3 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines.slice(0, maxLines);
}

function drawPill(ctx, text, x, y, opts = {}) {
  const {
    bg = GREEN,
    color = WHITE,
    fontSize = 14,
    padX = 14,
    padY = 7,
  } = opts;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const h = fontSize + padY * 2;
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, 999);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 1);
}

function drawDashedCircle(ctx, cx, cy, r, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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

/**
 * @param {object} opts
 * @param {string} opts.group - "A" | "B" | "C"
 * @param {Array<{ name?: string, captain?: { name?: string, profilePictureUrl?: string } }>} opts.teams
 */
export async function generateTop4Post({ group = "A", teams = [] }) {
  const list = Array.isArray(teams) ? teams.slice(0, 4) : [];
  while (list.length < 4) list.push(null);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const [logo, ...photos] = await Promise.all([
    loadImage("/al_umer_electronics_logo_v2.png").catch(() =>
      loadImage("/al_umer_electronics_logo.png").catch(() => null)
    ),
    ...list.map((t) =>
      t ? loadProfileImage(t.captain?.profilePictureUrl || "") : Promise.resolve(null)
    ),
  ]);

  // Soft mint background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#ecfdf5");
  bg.addColorStop(0.45, "#f0fdf4");
  bg.addColorStop(1, "#ffffff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Outer frame
  ctx.strokeStyle = "rgba(34,197,94,0.35)";
  ctx.lineWidth = 4;
  roundRectPath(ctx, 16, 16, W - 32, H - 32, 36);
  ctx.stroke();

  // Left accent bar
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, "#86efac");
  bar.addColorStop(0.5, GREEN);
  bar.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 12, H);

  // Header
  let y = 44;
  if (logo) {
    const lw = 72;
    const lh = (logo.height / logo.width) * lw;
    roundRectPath(ctx, SAFE, y - 6, lw + 14, lh + 12, 14);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.drawImage(logo, SAFE + 7, y, lw, lh);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = "900 36px Arial Black, Impact, Arial, sans-serif";
  ctx.fillText(`Group ${group}  ·  Top 4`, SAFE + 100, y + 22);

  const qualifiedCount = list.filter(Boolean).length;
  drawPill(ctx, `${qualifiedCount}/4 qualified`, SAFE + 420, y + 22, {
    bg: GREEN_MID,
    color: WHITE,
    fontSize: 14,
    padX: 16,
    padY: 8,
  });

  ctx.fillStyle = MUTED;
  ctx.font = "600 15px Arial, sans-serif";
  ctx.fillText(
    "Round 2 winners advance straight to Top 16 — no Round 3.",
    SAFE + 100,
    y + 56
  );

  // Brand chip top-right
  ctx.textAlign = "right";
  ctx.fillStyle = TEAL;
  ctx.font = "900 14px Arial, sans-serif";
  ctx.fillText("AL UMER ELECTRONICS  ·  SPORTS GALA S3", W - SAFE, y + 28);

  // Cards row
  const cols = 4;
  const gap = 22;
  const gridTop = 140;
  const gridBottom = H - 48;
  const gridLeft = SAFE;
  const gridW = W - SAFE * 2;
  const cardW = (gridW - gap * (cols - 1)) / cols;
  const cardH = gridBottom - gridTop;

  for (let i = 0; i < cols; i++) {
    const team = list[i];
    const photo = photos[i];
    const cx0 = gridLeft + i * (cardW + gap);
    const cy0 = gridTop;
    const pcx = cx0 + cardW / 2;

    // Card
    ctx.save();
    ctx.shadowColor = "rgba(15,23,42,0.1)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    roundRectPath(ctx, cx0, cy0, cardW, cardH, 28);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(34,197,94,0.28)";
    ctx.lineWidth = 2;
    roundRectPath(ctx, cx0, cy0, cardW, cardH, 28);
    ctx.stroke();
    ctx.restore();

    // Soft green wash
    const wash = ctx.createRadialGradient(
      pcx,
      cy0 + 40,
      10,
      pcx,
      cy0 + 40,
      cardH * 0.55
    );
    wash.addColorStop(0, "rgba(34,197,94,0.12)");
    wash.addColorStop(1, "rgba(34,197,94,0)");
    roundRectPath(ctx, cx0, cy0, cardW, cardH, 28);
    ctx.fillStyle = wash;
    ctx.fill();

    // Rank
    ctx.beginPath();
    ctx.arc(cx0 + 28, cy0 + 28, 16, 0, Math.PI * 2);
    ctx.fillStyle = team ? GREEN : "#94a3b8";
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = "900 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`#${i + 1}`, cx0 + 28, cy0 + 29);

    // TOP 16 badge
    if (team) {
      drawPill(ctx, "TOP 16", cx0 + cardW - 48, cy0 + 28, {
        bg: NAVY,
        color: WHITE,
        fontSize: 11,
        padX: 12,
        padY: 6,
      });
    }

    if (!team) {
      ctx.fillStyle = MUTED;
      ctx.font = "900 14px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WAITING R2", pcx, cy0 + cardH / 2);
      continue;
    }

    // Brand label
    ctx.fillStyle = GREEN;
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AL UMER · GALA S3", pcx, cy0 + 58);

    // Team name (up to 2 lines)
    const teamName = String(team.name || "TBD").toUpperCase();
    const nameSize = fitText(ctx, teamName, cardW - 28, 22, 13);
    ctx.font = `900 ${nameSize}px Arial Black, Impact, Arial, sans-serif`;
    ctx.fillStyle = NAVY;
    const nameLines = wrapLines(ctx, teamName, cardW - 28, 2);
    nameLines.forEach((line, li) => {
      ctx.fillText(line, pcx, cy0 + 82 + li * (nameSize + 4));
    });

    // Large portrait
    const photoSize = Math.min(cardW * 0.64, cardH * 0.44);
    const pcy = cy0 + cardH * 0.48;

    drawDashedCircle(ctx, pcx, pcy, photoSize / 2 + 16, "rgba(34,197,94,0.35)", 2);
    drawDashedCircle(ctx, pcx, pcy, photoSize / 2 + 7, "rgba(22,163,74,0.45)", 1.5);

    const ringGrad = ctx.createLinearGradient(
      pcx - photoSize / 2,
      pcy - photoSize / 2,
      pcx + photoSize / 2,
      pcy + photoSize / 2
    );
    ringGrad.addColorStop(0, GREEN_PALE);
    ringGrad.addColorStop(0.5, GREEN);
    ringGrad.addColorStop(1, GREEN_MID);

    ctx.save();
    ctx.shadowColor = "rgba(34,197,94,0.35)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(pcx, pcy, photoSize / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = ringGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(pcx, pcy, photoSize / 2 + 2, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
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
        0.15
      );
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = "900 48px Arial Black, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", pcx, pcy);
    }
    ctx.restore();

    // QUALIFIED
    drawPill(ctx, "QUALIFIED", pcx, pcy + photoSize / 2 + 28, {
      bg: GREEN,
      color: WHITE,
      fontSize: 13,
      padX: 16,
      padY: 8,
    });

    // Captain
    const cap = String(team.captain?.name || "Captain TBA").toUpperCase();
    const capLabel = team.captain?.name ? `${cap} (C)` : cap;
    const capSize = fitText(ctx, capLabel, cardW - 24, 16, 11);
    ctx.fillStyle = NAVY;
    ctx.font = `900 ${capSize}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(capLabel, pcx, pcy + photoSize / 2 + 58);

    // Group badge
    drawPill(ctx, `GROUP ${group}`, pcx, cy0 + cardH - 36, {
      bg: "#ecfdf5",
      color: GREEN_DEEP,
      fontSize: 12,
      padX: 14,
      padY: 7,
    });
    // border on group pill
    {
      ctx.font = "bold 12px Arial, sans-serif";
      const tw = ctx.measureText(`GROUP ${group}`).width;
      const pw = tw + 28;
      const ph = 26;
      roundRectPath(ctx, pcx - pw / 2, cy0 + cardH - 36 - ph / 2, pw, ph, 999);
      ctx.strokeStyle = "rgba(34,197,94,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const filename = `group-${String(group).toLowerCase()}-top4.png`;
  const objectUrl = downloadBlob(blob, filename);
  return { filename, blob, url: objectUrl };
}
