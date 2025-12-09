#!/usr/bin/env node

// Generate a new random Gutenberg demo dataset and assets.
// - Queries Gutendex (https://gutendex.com/) for books with EPUB and cover images
// - Downloads EPUBs and cover JPEGs; converts cover JPEGs to PNG
// - Writes JSON metadata under ./generated/: books.json, pubdates.json, publishers.json, summaries.json
// - Uses assets dir mapped in docker compose: ./assets -> /opt/demo-data
//
// After running this, createDemoData.js will automatically use ./generated JSONs
// and copy files from /opt/demo-data into /opt/data/* when seeding.

const path = require('path');
const fs = require('fs');
// Removed dependency on fs-extra for portability; implement minimal helpers with native fs
const axios = require('axios');
// Attempt to load Jimp; if not present, we'll fall back to placeholder PNG generation.
let Jimp = null;
try { Jimp = require('jimp'); } catch (e) { console.log('Jimp not found: using placeholder covers. To enable real cover conversion, install jimp.'); }

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'generated');
const ASSETS_DIR = path.resolve(process.env.DEMO_ASSETS_DIR || path.join(ROOT, 'assets'));

const DEFAULT_COUNT = parseInt(process.env.GUTENBERG_DEMO_COUNT || '200', 10);
const LANGUAGES = (process.env.GUTENBERG_LANGS || 'eng').split(',').map(s => s.trim()).filter(Boolean);
const VERBOSE = String(process.env.VERBOSE || '').toLowerCase() === '1' || String(process.env.VERBOSE || '').toLowerCase() === 'true';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

async function fetchGutendexPage(page, params = {}) {
  const base = 'https://gutendex.com/books/';
  const url = new URL(base);
  url.searchParams.set('page', String(page));
  if (LANGUAGES.length) url.searchParams.set('languages', LANGUAGES.join(','));
  url.searchParams.set('mime_type', 'application/epub+zip');
  // Leaving randomization to pagination; we will sample later
  const res = await axios.get(url.toString(), { timeout: 20000 });
  return res.data;
}

function pickBooks(raw) {
  // Filter for items that have epub and a cover jpeg
  return raw.results.filter(b => {
    const f = b.formats || {};
    return f['application/epub+zip'] && (f['image/jpeg'] || f['image/png']);
  });
}

function titleCase(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

function synthSummary(book) {
  const title = titleCase(book.title);
  const author = (book.authors && book.authors[0] && book.authors[0].name) || 'Unknown';
  const subjects = (book.subjects || []).slice(0, 3).map(s => s.replace('Subject:', '').trim());
  const subjLine = subjects.length ? `Themes include ${subjects.join(', ')}.` : '';
  const s1 = `${title} is a public-domain work by ${author}.`;
  const s2 = subjLine || `This edition is distributed by Project Gutenberg.`;
  const s3 = `This summary was automatically generated for demo purposes.`;
  return { summary: `${s1} ${s2}`, summary_extended: s3 };
}

function randomPubdate() {
  // 1850-01-01 to 1959-12-31
  const start = new Date('1850-01-01').getTime();
  const end = new Date('1959-12-31').getTime();
  const t = new Date(start + Math.random() * (end - start));
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function download(url, outFile) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000, maxRedirects: 3 });
  await ensureDir(path.dirname(outFile));
  fs.writeFileSync(outFile, res.data);
}

const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAZAAAACgCAIAAABtX0V/AAAACXBIWXMAAAsTAAALEwEAmpwYAAABbUlEQVR4nO3TsQ0AIBADwQn//5u3hA1BUy6Z1jv6AwAAAAAAAAAAAAD4bYcNAAAAAAAAAAAAAIC/B9EBAAAAAAAAAAAAAACAnwPR' +
  'AQAAAAAAAAAAAAAAgJ8D0QEAAAAAAAAAAAAAAICfA9EBAAAAAAAAAAAAAACAnwPR' +
  'AQAAAAAAAAAAAAAAgJ8D0QEAAAAAAAAAAAAAAICfA9EBAAAAAAAAAAAAAACAnwPR' +
  'AQAAAAAAAAAAAAAAgJ8D0QEAAAAAAAAAAAAAAICfA9EBAAAAAAAAAAAAAACAnwPR' +
  'AQAAAAAAAAAAAAAAgJ8D0QEAAAAAAAAAAAAAAICfA9EBAAAAAAAAAAAAAACAnwPR' +
  'AQAAAAAAAAAAAAAAgJ8D0QEAAAAAAAAAAAAAAICfA9EBAPC2A3xsWk0AAQAAAAASUVORK5CYII=';

async function makePng(sourceBufOrUrl, outPng) {
  await ensureDir(path.dirname(outPng));
  if (!Jimp) {
    // Write placeholder
    fs.writeFileSync(outPng, Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64'));
    return;
  }
  try {
    let img;
    if (Buffer.isBuffer(sourceBufOrUrl)) img = await Jimp.read(sourceBufOrUrl);
    else {
      const res = await axios.get(sourceBufOrUrl, { responseType: 'arraybuffer', timeout: 20000 });
      img = await Jimp.read(Buffer.from(res.data));
    }
    await img.writeAsync(outPng);
  } catch (e) {
    console.log('Cover conversion failed, writing placeholder:', e.message);
    fs.writeFileSync(outPng, Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64'));
  }
}

async function main() {
  const startTs = Date.now();
  console.log('Generating Gutenberg demo dataset...');
  console.log(`[config] target=${DEFAULT_COUNT} languages=${LANGUAGES.join(',')} assets_dir=${ASSETS_DIR}`);
  await ensureDir(OUT_DIR);
  await ensureDir(ASSETS_DIR);

  const selected = [];
  let page = 1;
  let tries = 0;
  let pageFetched = 0;

  while (selected.length < DEFAULT_COUNT && tries < 200) {
    try {
      console.log(`[gutendex] fetching page=${page} selected=${selected.length}/${DEFAULT_COUNT}`);
      const data = await fetchGutendexPage(page);
      const picks = pickBooks(data);
      if (VERBOSE) console.log(`[gutendex] page=${page} results=${data.results?.length || 0} filtered=${picks.length}`);
      for (const b of picks) {
        if (selected.length >= DEFAULT_COUNT) break;
        // de-dup by id
        if (!selected.find(x => x.id === b.id)) selected.push(b);
      }
      page++;
      pageFetched++;
      console.log(`[gutendex] after page ${page-1}: selected=${selected.length}/${DEFAULT_COUNT}`);
      await sleep(200);
    } catch (e) {
      tries++;
      console.log(`[gutendex] page fetch failed (try=${tries}): ${e.message}`);
      await sleep(500);
    }
  }

  if (selected.length === 0) {
    console.error('No books selected from Gutendex. Aborting.');
    process.exit(1);
  }

  console.log(`Selected ${selected.length} books after ${pageFetched} pages.`);

  const booksJson = [];
  const pubdatesJson = {};
  const publishersJson = {};
  const summariesJson = {};

  let internalId = 1;
  let successCount = 0;
  let skipCount = 0;
  for (const bk of selected) {
    const gid = bk.id;
    const title = titleCase(bk.title);
    const authors = (bk.authors || []).map(a => a.name).filter(Boolean);
    const language = (bk.languages || [])[0] || 'eng';
    const epubUrl = bk.formats['application/epub+zip'];
    const coverUrl = bk.formats['image/jpeg'] || bk.formats['image/png'];

    const relDir = path.join('global', 'gutenberg', `pg${gid}`);
    const relBookPath = path.join(relDir, 'book.epub');
    const relCoverPath = path.join(relDir, 'cover.png');

    const absBookPath = path.join(ASSETS_DIR, relBookPath);
    const absCoverPath = path.join(ASSETS_DIR, relCoverPath);

    try {
      if (VERBOSE) console.log(`[download] #${gid} "${title}" -> epub,cover`);
      // Download EPUB
      await download(epubUrl, absBookPath);
      // Download cover and convert to PNG
  await makePng(coverUrl, absCoverPath);
    } catch (e) {
      // Skip this book if download fails
      console.warn(`[skip] #${gid} due to download error: ${e.message}`);
      skipCount++;
      continue;
    }

    const { summary, summary_extended } = synthSummary(bk);

    booksJson.push({
      internal_id: internalId,
      title,
      authors,
      book_path: relBookPath,
      has_cover: 1,
      cover_path: relCoverPath,
      language_name: language,
      format_name: 'epub'
    });
    pubdatesJson[internalId] = randomPubdate();
    publishersJson[internalId] = 'Project Gutenberg';
    summariesJson[internalId] = { title, author_name: authors[0] || 'Unknown', summary, summary_extended };

    internalId++;
    successCount++;
    if (successCount % 10 === 0) {
      console.log(`[progress] saved=${successCount} skipped=${skipCount} of target~${DEFAULT_COUNT}`);
    }
  }

  // Write JSON files
  await ensureDir(OUT_DIR);
  fs.writeFileSync(path.join(OUT_DIR, 'books.json'), JSON.stringify(booksJson, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'pubdates.json'), JSON.stringify(pubdatesJson, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'publishers.json'), JSON.stringify(publishersJson, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'summaries.json'), JSON.stringify(summariesJson, null, 2));
  const durSec = Math.round((Date.now() - startTs) / 1000);
  console.log(`[done] wrote=${booksJson.length} skipped=${skipCount} pages=${pageFetched} duration=${durSec}s`);
  console.log(`JSON: ${OUT_DIR}`);
  console.log(`Assets: ${ASSETS_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
