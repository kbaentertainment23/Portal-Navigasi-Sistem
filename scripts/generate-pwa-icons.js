import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrc32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcVal = crc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Pixel Data Generation
  const rowBytes = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * (isMaskable ? 0.48 : 0.42);
  const innerRadius = width * (isMaskable ? 0.40 : 0.36);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Colors
      // Primary Emerald: #065F46 -> (6, 95, 70)
      // Dark Emerald: #044E39 -> (4, 78, 57)
      // Accent Light Green / White
      
      let r = 6, g = 95, b = 70, a = 255;

      if (!isMaskable && dist > outerRadius) {
        // Transparent outer for non-maskable rounded icon
        r = 0; g = 0; b = 0; a = 0;
      } else {
        // Gradient background
        const t = (y / height);
        r = Math.round(6 * (1 - t) + 4 * t);
        g = Math.round(110 * (1 - t) + 70 * t);
        b = Math.round(80 * (1 - t) + 50 * t);

        // Draw Navigation / Portal Icon Emblem
        // Outer ring
        if (dist >= innerRadius * 0.85 && dist <= innerRadius * 0.98) {
          r = 52; g = 211; b = 153; // Emerald 400 accent
        }

        // Central Diamond / Compass Needle
        const ndx = Math.abs(dx) / (innerRadius * 0.55);
        const ndy = Math.abs(dy) / (innerRadius * 0.55);
        if (ndx + ndy <= 1.0) {
          if (dy < 0) {
            // Top needle - White
            r = 255; g = 255; b = 255;
          } else {
            // Bottom needle - Mint green
            r = 167; g = 243; b = 208;
          }
        }

        // Center Dot
        if (dist <= innerRadius * 0.15) {
          r = 6; g = 95; b = 70;
        }
      }

      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');

const targets = [
  { name: 'favicon-16x16.png', size: 16, maskable: false },
  { name: 'favicon-32x32.png', size: 32, maskable: false },
  { name: 'favicon.png', size: 192, maskable: false },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

for (const target of targets) {
  const filePath = path.join(publicDir, target.name);
  const pngBuffer = generatePng(target.size, target.size, target.maskable);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated ${target.name} (${target.size}x${target.size})`);
}
