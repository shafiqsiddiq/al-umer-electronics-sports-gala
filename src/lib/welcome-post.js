/**
 * Generate a welcome registration post for a team and download as PNG.
 * Canvas: 1080×1600 — tall portrait so nothing clips.
 */

const W = 1080;
const H = 1600;
const GOLD = "#d4af37";
const GOLD_LIGHT = "#f5e6a3";
const GREEN = "#1a9b4a";
const GREEN_DARK = "#0d5c2e";
const SAFE = 48; // edge padding so content never clips

function loadImage(src, { cors = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadProfileImage(url) {
  if (!url) return null;
  try {
    // Same-origin proxy avoids canvas CORS taint from Sanity CDN
    const proxy = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    return await loadImage(proxy);
  } catch {
    try {
      return await loadImage(url, { cors: true });
    } catch {
      return null;
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, maxSize, minSize = 28) {
  let size = maxSize;
  ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  }
  return size;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawConfetti(ctx) {
  const colors = [GOLD, GOLD_LIGHT, "#ffffff", "#2ecc71", "#f1c40f", "#ff6b6b", "#74b9ff"];
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * W;
    const y = Math.random() * (H * 0.42);
    const s = 4 + Math.random() * 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.5 + Math.random() * 0.4;
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    }
    ctx.restore();
  }
}

/** Firework burst — big celebration spark at (cx, cy) */
function drawFirework(ctx, cx, cy, radius = 70) {
  const colors = [GOLD, GOLD_LIGHT, "#ffffff", "#2ecc71", "#ffd700", "#ff6b6b"];
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const len = radius * (0.55 + (i % 3) * 0.15);
    const g = ctx.createLinearGradient(
      cx,
      cy,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    );
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.4, colors[i % colors.length]);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();

    // tip spark
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  // center glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  glow.addColorStop(0, "rgba(255,255,255,0.95)");
  glow.addColorStop(0.5, "rgba(245,230,163,0.7)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
}

/** Party popper aiming outward from side */
function drawPartyPopper(ctx, x, y, facingRight = true) {
  const dir = facingRight ? 1 : -1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.rotate(-0.35);

  // cone body
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(55, -22);
  ctx.lineTo(55, 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();

  // gold rim
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.ellipse(55, 0, 8, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // streamers shooting out
  const streamColors = [GOLD, "#ff6b6b", "#74b9ff", "#2ecc71", GOLD_LIGHT, "#ffffff"];
  for (let i = 0; i < 10; i++) {
    const angle = -0.9 + i * 0.2;
    const len = 55 + (i % 4) * 18;
    ctx.strokeStyle = streamColors[i % streamColors.length];
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(62, Math.sin(angle) * 8);
    ctx.quadraticCurveTo(
      62 + len * 0.45,
      Math.sin(angle) * 40,
      62 + len,
      Math.sin(angle * 1.2) * 55
    );
    ctx.stroke();

    // confetti bits on streamers
    ctx.fillStyle = streamColors[(i + 2) % streamColors.length];
    ctx.beginPath();
    ctx.arc(62 + len * 0.7, Math.sin(angle) * 35, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Balloon cluster */
function drawBalloons(ctx, x, y) {
  const balloons = [
    { dx: 0, dy: 0, color: "#e74c3c", size: 28 },
    { dx: 34, dy: 8, color: "#3498db", size: 24 },
    { dx: -30, dy: 12, color: GOLD, size: 26 },
  ];
  for (const b of balloons) {
    const bx = x + b.dx;
    const by = y + b.dy;
    // string
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + b.size);
    ctx.quadraticCurveTo(bx + 8, by + b.size + 40, bx - 4, by + b.size + 70);
    ctx.stroke();
    // balloon
    const g = ctx.createRadialGradient(bx - 6, by - 6, 4, bx, by, b.size);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, b.color);
    g.addColorStop(1, b.color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(bx, by, b.size * 0.78, b.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // knot
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(bx - 5, by + b.size - 2);
    ctx.lineTo(bx + 5, by + b.size - 2);
    ctx.lineTo(bx, by + b.size + 8);
    ctx.closePath();
    ctx.fill();
  }
}

/** Big celebration icons around the header / profile area */
function drawCelebrationIcons(ctx) {
  // Top corners (above banner)
  drawFirework(ctx, 95, 88, 78);
  drawFirework(ctx, W - 90, 95, 72);
  // Flanking profile
  drawPartyPopper(ctx, 55, 540, true);
  drawFirework(ctx, 100, 450, 48);
  drawPartyPopper(ctx, W - 55, 540, false);
  drawFirework(ctx, W - 100, 450, 52);
}

/** Balloons drawn beside the brand banner so they stay visible */
function drawBannerSideBalloons(ctx, bannerY, bannerH) {
  const midY = bannerY + bannerH / 2 - 10;
  drawBalloons(ctx, 58, midY);
  drawBalloons(ctx, W - 58, midY);
}

function drawStars(ctx, cx, y, count = 5, size = 10) {
  ctx.fillStyle = GOLD;
  const gap = 28;
  const startX = cx - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    const x = startX + i * gap;
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawRibbon(ctx, text, y) {
  const rw = Math.min(700, W - SAFE * 2 - 40);
  const rh = 54;
  const rx = (W - rw) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Ribbon body
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.moveTo(rx - 28, y);
  ctx.lineTo(rx, y - 4);
  ctx.lineTo(rx + rw, y - 4);
  ctx.lineTo(rx + rw + 28, y);
  ctx.lineTo(rx + rw, y + rh);
  ctx.lineTo(rx, y + rh);
  ctx.closePath();
  ctx.fill();

  // Gold edge
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, y + rh / 2 - 2);

  // Side stars
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "20px Arial";
  ctx.fillText("★", rx + 40, y + rh / 2 - 2);
  ctx.fillText("★", rx + rw - 40, y + rh / 2 - 2);
}

function drawCover(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    const scale = Math.max(size / img.width, size / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, GREEN_DARK);
    g.addColorStop(1, GREEN);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  // Gold ring
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/**
 * @param {{ name: string, captainName?: string, profilePictureUrl?: string, captain?: object }} team
 * @returns {Promise<{ filename: string, blob: Blob, url: string }>}
 */
export async function generateWelcomePost(team) {
  const teamName = (team.name || "TEAM").trim().toUpperCase();
  const captainName = (team.captainName || team.captain?.name || "—").trim().toUpperCase();
  const photoUrl = team.profilePictureUrl || team.captain?.profilePictureUrl || "";

  const [bg, trophy, logo, profile] = await Promise.all([
    loadImage("/cricket_stadium.png").catch(() =>
      loadImage("/cricket_stadium_desktop.png").catch(() => null)
    ),
    loadImage("/cricket_trophy.png").catch(() => null),
    loadImage("/al_umer_electronics_logo.png").catch(() => null),
    loadProfileImage(photoUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    const dw = bg.width * scale;
    const dh = bg.height * scale;
    ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a2f1a");
    g.addColorStop(0.5, "#14532d");
    g.addColorStop(1, "#052e16");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0.55)");
  overlay.addColorStop(0.35, "rgba(0,20,10,0.45)");
  overlay.addColorStop(0.7, "rgba(0,0,0,0.65)");
  overlay.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  drawConfetti(ctx);
  drawCelebrationIcons(ctx);

  // Trophy
  let cursorY = SAFE;
  if (trophy) {
    const tw = 120;
    const th = (trophy.height / trophy.width) * tw;
    ctx.drawImage(trophy, (W - tw) / 2, cursorY, tw, th);
    cursorY += th + 12;
  }

  // Brand banner — large, with side gutters for balloons
  const bannerH = 96;
  const bannerPadX = 118;
  roundRect(ctx, bannerPadX, cursorY, W - bannerPadX * 2, bannerH, 14);
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.stroke();
  roundRect(ctx, bannerPadX + 7, cursorY + 7, W - bannerPadX * 2 - 14, bannerH - 14, 10);
  ctx.strokeStyle = "rgba(212,175,55,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (logo) {
    ctx.drawImage(logo, bannerPadX + 18, cursorY + 14, 68, 68);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial Black, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS", W / 2 + (logo ? 16 : 0), cursorY + bannerH / 2);

  // Balloons on both sides of banner (drawn after so they stay visible)
  drawBannerSideBalloons(ctx, cursorY, bannerH);

  cursorY += bannerH + 30;
  ctx.fillStyle = "#2ecc71";
  ctx.font = "bold 32px Arial Black, Arial, sans-serif";
  ctx.fillText("SPORTS GALA – SEASON 3", W / 2, cursorY);
  cursorY += 30;
  drawStars(ctx, W / 2, cursorY, 5, 12);
  cursorY += 38;

  // Profile — large hero circle (fully inside canvas + gold ring)
  const photoSize = 420;
  const photoX = (W - photoSize) / 2;
  const photoY = cursorY + 8;
  drawCover(ctx, profile, photoX, photoY, photoSize);

  if (!profile) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 110px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(teamName.charAt(0) || "T", W / 2, photoY + photoSize / 2);
  }

  let y = photoY + photoSize + 72;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = GOLD;
  ctx.font = "900 58px Arial Black, Impact, Arial, sans-serif";
  ctx.fillText("WELCOME", W / 2, y);
  ctx.shadowBlur = 0;

  y += 58;
  const nameSize = fitText(ctx, teamName, W - SAFE * 2, 72, 32);
  ctx.font = `900 ${nameSize}px Arial Black, Impact, Arial, sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(teamName, W / 2 + 3, y + 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(teamName, W / 2, y);

  y += 36;
  drawRibbon(ctx, "OFFICIALLY REGISTERED TEAM", y);
  y += 80;

  const capW = Math.min(640, W - SAFE * 2);
  const capH = 60;
  const capX = (W - capW) / 2;
  roundRect(ctx, capX, y, capW, capH, 14);
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const capLabel = "CAPTAIN: ";
  let capFont = 24;
  ctx.font = `bold ${capFont}px Arial, sans-serif`;
  while (capFont > 14 && ctx.measureText(capLabel + captainName).width > capW - 40) {
    capFont -= 1;
    ctx.font = `bold ${capFont}px Arial, sans-serif`;
  }
  const labelW = ctx.measureText(capLabel).width;
  const nameW = ctx.measureText(captainName).width;
  const start = W / 2 - (labelW + nameW) / 2;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = GOLD;
  ctx.fillText(capLabel, start, y + capH / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(captainName, start + labelW, y + capH / 2);

  y += capH + 24;

  const msgW = W - SAFE * 2;
  const msgX = SAFE;
  const msgPad = 24;
  ctx.font = "21px Arial, sans-serif";
  const message = `We are delighted to welcome ${team.name || teamName} to AL Umer Electronics Sports Gala – Season 3. Wishing the team great success, sportsmanship, and an unforgettable tournament.`;
  const lines = wrapText(ctx, message, msgW - msgPad * 2);
  const msgH = lines.length * 30 + 84;

  roundRect(ctx, msgX, y, msgW, msgH, 16);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "21px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, y + msgPad + i * 30);
  });

  ctx.fillStyle = GOLD;
  ctx.font = "italic 700 28px Georgia, 'Times New Roman', serif";
  ctx.fillText("Best of luck!", W / 2, y + msgH - 40);

  y += msgH + 32;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = GREEN;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText("SEE YOU ON", W / 2, y);
  ctx.fillStyle = GOLD;
  ctx.font = "900 36px Arial Black, Arial, sans-serif";
  ctx.fillText("7TH AUGUST 2026", W / 2, y + 40);

  // Footer — always inside safe area
  const footerY = H - SAFE - 48;
  const fw = W - SAFE * 2 - 40;
  roundRect(ctx, (W - fw) / 2, footerY, fw, 40, 20);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS SPORTS GALA – SEASON 3", W / 2, footerY + 20);
  drawStars(ctx, W / 2, H - SAFE + 4, 5, 6);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const safeName = teamName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "team";
  const filename = `welcome-${safeName}.png`;
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
