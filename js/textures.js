// All surface textures are painted here, so 3D models and the materials section share them.

function sheet(size, paint) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  paint(c.getContext('2d'), size);
  return c;
}

const R = Math.random;

// Wool loops. Greys only: the material colour tints it.
export const boucle = () => sheet(1024, (ctx, S) => {
  ctx.fillStyle = '#9d9d9d';
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26000; i++) {
    const v = 70 + Math.floor(R() * 185);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = 1.5 + R() * 3.5;
    const r = 3 + R() * 7;
    const a = R() * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(R() * S, R() * S, r, a, a + 2 + R() * 3.5);
    ctx.stroke();
  }
});

// Flat linen weave, also grey
export const linen = () => sheet(1024, (ctx, S) => {
  ctx.fillStyle = '#c9c9c9';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 3) {
    const v = 170 + Math.floor(R() * 70);
    ctx.fillStyle = `rgba(${v},${v},${v},.5)`;
    ctx.fillRect(i, 0, 1.6, S);
    const w = 150 + Math.floor(R() * 80);
    ctx.fillStyle = `rgba(${w},${w},${w},.5)`;
    ctx.fillRect(0, i, S, 1.6);
  }
});

export const oak = (base = '#35271b', dark = '#150e09', light = '#6a5038') => sheet(1024, (ctx, S) => {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2400; i++) {
    ctx.strokeStyle = R() < 0.72 ? dark : light;
    ctx.globalAlpha = 0.08 + R() * 0.34;
    ctx.lineWidth = 0.6 + R() * 2.4;
    const x = R() * S;
    const y = R() * S;
    const len = 120 + R() * 500;
    const sway = (R() - 0.5) * 30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + sway, y + len * 0.3, x - sway, y + len * 0.6, x + sway * 0.5, y + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
});

export const travertine = () => sheet(1024, (ctx, S) => {
  ctx.fillStyle = '#d6cab5';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const y = R() * S;
    const h = 3 + R() * 36;
    ctx.fillStyle = R() < 0.5 ? '#bdab8d' : '#e6dcc9';
    ctx.globalAlpha = 0.14 + R() * 0.26;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= S; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.006 + i) * 12);
    for (let x = S; x >= 0; x -= 64) ctx.lineTo(x, y + h + Math.sin(x * 0.006 + i) * 12);
    ctx.fill();
  }
  // The stone's pits, stretched along its bands
  ctx.fillStyle = '#7c6c54';
  for (let i = 0; i < 1300; i++) {
    ctx.globalAlpha = 0.12 + R() * 0.4;
    ctx.beginPath();
    ctx.ellipse(R() * S, R() * S, 1 + R() * 11, 0.6 + R() * 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
});

export const limewash = () => sheet(1024, (ctx, S) => {
  ctx.fillStyle = '#c4b5a0';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    const x = R() * S;
    const y = R() * S;
    const r = 30 + R() * 130;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = R() < 0.5 ? '216,204,186' : '168,150,128';
    g.addColorStop(0, `rgba(${tone},.16)`);
    g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
});

// Oak boards laid along the room
export const planks = () => sheet(1024, (ctx, S) => {
  const grain = oak('#7a5a3c', '#4a3322', '#a07c58');
  const row = S / 6;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(0, i * row);
    ctx.rotate(0);
    ctx.drawImage(grain, R() * 300, R() * 300, 400, 400, 0, 0, S, row);
    ctx.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,235,200'},${R() * 0.1})`;
    ctx.fillRect(0, 0, S, row);
    ctx.fillStyle = '#20150d';
    ctx.fillRect(0, row - 2, S, 2);
    ctx.fillRect((i * 0.37 % 1) * S, 0, 2, row);
    ctx.restore();
  }
});

