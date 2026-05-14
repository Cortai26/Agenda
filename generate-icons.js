// generate-icons.js — gera todos os PNG da marca usando @resvg/resvg-js
// Uso: node generate-icons.js

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const RESVG_OPTS = {
  font: {
    loadSystemFonts: true,
    serifFamily: 'Georgia',
    sansSerifFamily: 'Segoe UI',
  },
  shapeRendering: 2,
  textRendering: 1,
  imageRendering: 0,
};

function renderPng(svgStr, size) {
  const resvg = new Resvg(svgStr, {
    ...RESVG_OPTS,
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

// SVG mark com inscrição (para ≥ 96px)
const markFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#E55A0C"/>
  <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
    x="92" y="148" font-size="184" text-anchor="middle">a</text>
  <text font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#E55A0C"
    x="100" y="119" font-size="9" text-anchor="middle" letter-spacing="3.6">JUL</text>
  <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#E55A0C"
    x="100" y="146" font-size="26" text-anchor="middle">11</text>
</svg>`;

// SVG mark sem inscrição (para < 96px — favicons)
const markSmall = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="36" fill="#E55A0C"/>
  <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
    x="92" y="152" font-size="184" text-anchor="middle">a</text>
</svg>`;

// SVG mark maskable — com padding 20% (safe-zone iOS/Android)
const markMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#E55A0C"/>
  <g transform="translate(20,20) scale(0.8)">
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
      x="92" y="148" font-size="184" text-anchor="middle">a</text>
    <text font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#E55A0C"
      x="100" y="119" font-size="9" text-anchor="middle" letter-spacing="3.6">JUL</text>
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#E55A0C"
      x="100" y="146" font-size="26" text-anchor="middle">11</text>
  </g>
</svg>`;

// OG image 1200x630
const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0E0E0F"/>
  <!-- Mark 400x400 centrado verticalmente à esquerda -->
  <g transform="translate(115,115)">
    <rect width="400" height="400" fill="#E55A0C"/>
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
      x="184" y="296" font-size="368" text-anchor="middle">a</text>
    <text font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#E55A0C"
      x="200" y="238" font-size="18" text-anchor="middle" letter-spacing="7.2">JUL</text>
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#E55A0C"
      x="200" y="292" font-size="52" text-anchor="middle">11</text>
  </g>
  <!-- Separador -->
  <rect x="580" y="140" width="1" height="350" fill="#F0EDE8" opacity="0.15"/>
  <!-- Wordmark -->
  <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
    x="620" y="360" font-size="120" letter-spacing="-1">agenda</text>
  <!-- Tagline -->
  <text font-family="'Segoe UI', Arial, sans-serif" fill="#A09890"
    x="622" y="410" font-size="26" letter-spacing="2">o tempo, com intenção</text>
</svg>`;

// OG quadrado 1200x1200
const ogSquare = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#0E0E0F"/>
  <g transform="translate(200,240)">
    <rect width="800" height="800" fill="#E55A0C"/>
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
      x="368" y="592" font-size="736" text-anchor="middle">a</text>
    <text font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#E55A0C"
      x="400" y="476" font-size="36" text-anchor="middle" letter-spacing="14.4">JUL</text>
    <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#E55A0C"
      x="400" y="584" font-size="104" text-anchor="middle">11</text>
  </g>
  <text font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#F0EDE8"
    x="600" y="1110" font-size="80" text-anchor="middle" letter-spacing="-1">agenda</text>
</svg>`;

const jobs = [
  // PWA icons (com inscrição)
  { svg: markFull,      size: 1024, out: 'icon-1024.png' },
  { svg: markFull,      size: 512,  out: 'icon-512.png' },
  { svg: markFull,      size: 192,  out: 'icon-192.png' },
  { svg: markFull,      size: 96,   out: 'icon-96.png' },
  // Maskable (safe-zone)
  { svg: markMaskable,  size: 512,  out: 'icon-512-maskable.png' },
  { svg: markMaskable,  size: 192,  out: 'icon-192-maskable.png' },
  // Apple Touch Icon
  { svg: markFull,      size: 180,  out: 'apple-touch-icon.png' },
  // Favicons pequenos (sem inscrição)
  { svg: markSmall,     size: 48,   out: 'favicon-48.png' },
  { svg: markSmall,     size: 32,   out: 'favicon-32.png' },
  { svg: markSmall,     size: 16,   out: 'favicon-16.png' },
  // favicon.png geral
  { svg: markFull,      size: 96,   out: 'favicon.png' },
  // OG images (em subpasta og/)
  { svg: ogImage,       size: 1200, out: 'og/og-image.png',  h: 630 },
  { svg: ogSquare,      size: 1200, out: 'og/og-square.png' },
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

(async () => {
  let ok = 0, fail = 0;
  for (const job of jobs) {
    try {
      const opts = {
        ...RESVG_OPTS,
        fitTo: job.h
          ? { mode: 'original' }
          : { mode: 'width', value: job.size },
      };
      // Para OG com dimensões específicas, usar zoom
      let svgStr = job.svg;
      if (job.h) {
        // Forçar dimensão via viewBox já definido no SVG
        opts.fitTo = { mode: 'width', value: job.size };
      }
      const resvg = new Resvg(svgStr, opts);
      const png = resvg.render().asPng();
      const outPath = path.join(__dirname, job.out);
      ensureDir(outPath);
      fs.writeFileSync(outPath, png);
      console.log(`✓ ${job.out} (${job.size}px)`);
      ok++;
    } catch (e) {
      console.error(`✗ ${job.out}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nPronto: ${ok} gerados, ${fail} falhas`);
})();
