// Génère les icônes PNG de la PWA sans dépendance externe (zlib intégré).
// Design : fond arrondi #0b1120, anneau + « S » stylisé en #4f8cff.
// Lancer : node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const BG = [11, 17, 32]; // #0b1120
const FG = [79, 140, 255]; // #4f8cff

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function encodePNG(size, pixels) {
  // pixels : Uint8ClampedArray RGBA (size*size*4)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtre "none"
    pixels.copy
      ? pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
      : raw.set(pixels.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(size, maskable) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };

  const cx = size / 2;
  const cy = size / 2;
  // Coins arrondis (sauf maskable : plein bord pour la zone de sécurité).
  const radius = maskable ? 0 : size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (radius > 0) {
        const dx = Math.max(radius - x, x - (size - radius), 0);
        const dy = Math.max(radius - y, y - (size - radius), 0);
        if (dx * dx + dy * dy > radius * radius) continue;
      }
      set(x, y, BG);
    }
  }

  const stampR = size * 0.03;
  const stamp = (px0, py0) => {
    const r = Math.ceil(stampR);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= stampR * stampR) {
          set(Math.round(px0 + dx), Math.round(py0 + dy), FG);
        }
      }
    }
  };

  // Anneau
  const ring = size * 0.29;
  for (let a = 0; a < Math.PI * 2; a += 0.004) {
    stamp(cx + ring * Math.cos(a), cy + ring * Math.sin(a));
  }

  // « S » stylisé (une onde) + barre verticale du symbole dollar
  const L = size * 0.19;
  const A = size * 0.085;
  for (let t = 0; t <= 1; t += 0.004) {
    const y = cy - L + 2 * L * t;
    const x = cx + A * Math.sin(Math.PI * 2 * t);
    stamp(x, y);
  }
  for (let y = cy - L * 1.15; y <= cy + L * 1.15; y += 0.5) {
    stamp(cx, y);
  }

  return encodePNG(size, px);
}

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

for (const t of targets) {
  writeFileSync(join(OUT, t.name), draw(t.size, t.maskable));
  console.log('écrit', t.name);
}
