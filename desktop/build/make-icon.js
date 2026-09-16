// Generates build/icon.png (1024×1024) from an inline SVG that matches the
// web favicon. electron-builder derives .icns/.ico from this single PNG.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const OUT = path.join(__dirname, 'icon.png');

// Match the web favicon shape/colors, but on a rounded dark tile so the
// mark reads clearly at OS icon sizes (Dock, Taskbar, Alt-Tab, DMG).
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#0d1524"/>
      <stop offset="100%" stop-color="#050810"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#4a9df1"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" rx="200" ry="200" fill="url(#tile)"/>
  <circle cx="512" cy="560" r="336" fill="none" stroke="url(#mark)" stroke-width="80"/>
  <path d="M512 336 v220 l128 78" stroke="url(#mark)" stroke-width="80" stroke-linecap="round" fill="none"/>
  <rect x="428" y="140" width="168" height="88" rx="28" ry="28" fill="url(#mark)"/>
</svg>`;

async function main() {
  await sharp(Buffer.from(SVG))
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  const size = fs.statSync(OUT).size;
  console.log(`Wrote ${path.relative(process.cwd(), OUT)}  (${(size / 1024).toFixed(1)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
