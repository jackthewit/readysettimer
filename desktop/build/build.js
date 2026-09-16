// Copies the parent rstimer.kr static site into `desktop/app/`, stripping out
// online-only integrations (AdSense, Google Analytics, consent banner, SEO
// metadata) so the offline Electron app doesn't try to phone home on launch.
//
// Kept intentionally simple: string replacements over the read HTML. This
// leaves the source web files untouched — the desktop bundle is derived at
// build time, not maintained separately.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const WEB_ROOT = path.resolve(__dirname, '..', '..');          // rstimer worktree root
const OUT_DIR  = path.resolve(__dirname, '..', 'app');

// Only these files ship in the desktop bundle. Everything else on rstimer.kr
// (multi-language pillars, duration landings, guides, about/privacy/terms,
// share.js, consent.js, sitemap/robots/ads/llms.txt, OG image) is web-only.
const STATIC_FILES = [
  'index.html',
  'styles.css',
  'app.js',
  'i18n.js',
];

function stripHtml(src) {
  let s = src;

  // Remove entire <script> tags loading Google AdSense (single or multiline)
  // and Google Analytics / Tag Manager. Also the inline consent-mode block
  // that precedes them.
  const KILL_SCRIPT_PATTERNS = [
    // External loaders — allow both http(s):// and //cdn variants.
    /<script[^>]*src=["'][^"']*pagead2\.googlesyndication\.com[^"']*["'][^>]*><\/script>\s*/gi,
    /<script[^>]*src=["'][^"']*googletagmanager\.com[^"']*["'][^>]*><\/script>\s*/gi,
    // Inline consent-mode + gtag config blocks. `\s\S` matches newlines.
    /<script>[\s\S]*?gtag\('consent'[\s\S]*?<\/script>\s*/gi,
    /<script>[\s\S]*?gtag\('config'[\s\S]*?<\/script>\s*/gi,
    // Consent banner script tag (local file we don't ship).
    /<script[^>]*src=["'][^"']*consent\.js[^"']*["'][^>]*><\/script>\s*/gi,
    // The share.js / landing-timer.js helpers aren't shipped either.
    /<script[^>]*src=["'][^"']*share\.js[^"']*["'][^>]*><\/script>\s*/gi,
    /<script[^>]*src=["'][^"']*landing-timer\.js[^"']*["'][^>]*><\/script>\s*/gi,
  ];
  for (const pat of KILL_SCRIPT_PATTERNS) s = s.replace(pat, '');

  // Strip the SEO / verification / social meta blocks — irrelevant offline
  // and they carry the naver-site-verification token we don't want redistributing.
  const KILL_META_PATTERNS = [
    /<meta[^>]*name=["']naver-site-verification["'][^>]*>\s*/gi,
    /<meta[^>]*name=["']google-site-verification["'][^>]*>\s*/gi,
    /<meta[^>]*property=["']og:[^"']*["'][^>]*>\s*/gi,
    /<meta[^>]*name=["']twitter:[^"']*["'][^>]*>\s*/gi,
    /<link[^>]*rel=["']canonical["'][^>]*>\s*/gi,
    /<link[^>]*rel=["']alternate["'][^>]*hreflang=[^>]*>\s*/gi,
  ];
  for (const pat of KILL_META_PATTERNS) s = s.replace(pat, '');

  // JSON-LD schema.org blocks are pure SEO — remove.
  s = s.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

  // AdSense placeholder <ins> tags and the whole <aside class="ad-slot">.
  s = s.replace(/<ins[^>]*class=["'][^"']*adsbygoogle[^"']*["'][\s\S]*?<\/ins>\s*/gi, '');
  s = s.replace(/<aside[^>]*class=["'][^"']*ad-slot[^"']*["'][\s\S]*?<\/aside>\s*/gi, '');

  // SEO content blocks — the "인기 타이머 바로가기", 소개, 가이드 preview, 운영 원칙
  // sections that live below the fold on the web. They link to /1min.html,
  // /guides/*, /about.html, etc. that the desktop bundle doesn't ship. Cutting
  // the whole section is cleaner than trying to rewrite dozens of hrefs.
  s = s.replace(/<section[^>]*class=["'][^"']*seo-block[^"']*["'][\s\S]*?<\/section>\s*/gi, '');

  // Site footer — every link (Guides, About, Privacy, Terms, cookie settings,
  // GitHub) points either to files we don't ship or the online site.
  s = s.replace(/<footer[^>]*class=["'][^"']*site-foot[^"']*["'][\s\S]*?<\/footer>\s*/gi, '');

  // Any leftover absolute-root hrefs (e.g. embedded in the settings modal or
  // help text) — rewrite so the OS opens them at rstimer.kr in the user's own
  // browser, rather than 404ing inside the app on a file:// path.
  s = s.replace(/href=(["'])\/(?!\/)/g, 'href=$1https://rstimer.kr/');

  return s;
}

function copyStripped(filename) {
  const srcPath = path.join(WEB_ROOT, filename);
  const outPath = path.join(OUT_DIR, filename);
  const src = fs.readFileSync(srcPath, 'utf8');
  const out = filename.endsWith('.html') ? stripHtml(src) : src;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  const bytes = Buffer.byteLength(out);
  const delta = src.length - out.length;
  console.log(
    `  ${filename.padEnd(20)}  ${bytes.toString().padStart(7)}B` +
    (delta > 0 ? `  (-${delta} stripped)` : '')
  );
}

function main() {
  console.log(`Building desktop app bundle → ${path.relative(process.cwd(), OUT_DIR)}/`);

  // Fresh output each time so a removed source file doesn't linger.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const f of STATIC_FILES) copyStripped(f);

  console.log(`Done. ${STATIC_FILES.length} files.`);
}

main();
