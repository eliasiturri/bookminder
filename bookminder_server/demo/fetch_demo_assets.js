#!/usr/bin/env node

// Fetches demo EPUBs and cover images from Project Gutenberg into a local assets directory.
// It uses bookminder_server/demo/books.json and libraryNames.json as the source of truth for
// file locations. It will create files/folders under DEST_DIR (default: ./bookminder_server/demo/assets)
// that match the expected book_path/cover_path, and will generate library cover images as PNGs.

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const axios = require('axios');
const Jimp = require('jimp');

const ROOT = path.resolve(__dirname);

const DEST_DIR = path.resolve(process.env.DEMO_ASSETS_DIR || path.join(ROOT, 'assets'));

const books = require('./books.json');
const libraryNames = require('./libraryNames.json');

async function ensureDir(p) {
  await fse.mkdirp(p);
}

async function downloadToFile(url, filePath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, maxRedirects: 3 });
    await ensureDir(path.dirname(filePath));
    await fse.writeFile(filePath, response.data);
    return true;
  } catch (e) {
    return false;
  }
}

function extractGutenbergIdFromBookPath(bookPath) {
  // bookPath example: global/demo/pg17104-images.epub/pg17104-images.epub
  const m = bookPath.match(/pg(\d+)/);
  return m ? m[1] : null;
}

async function fetchEpubForId(gid, destFile) {
  const candidates = [
    `https://www.gutenberg.org/ebooks/${gid}.epub.images`,
    `https://www.gutenberg.org/ebooks/${gid}.epub.noimages`,
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}-images.epub`,
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.epub`,
  ];
  for (const url of candidates) {
    const ok = await downloadToFile(url, destFile);
    if (ok) return true;
  }
  return false;
}

async function fetchCoverForId(gid, destPngFile) {
  // Try Gutenberg hosted covers
  const coverCandidates = [
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.cover.medium.jpg`,
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.cover.small.jpg`,
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.cover.medium.png`,
  ];
  let jpgBuf = null;
  for (const url of coverCandidates) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, maxRedirects: 3 });
      jpgBuf = Buffer.from(res.data);
      break;
    } catch (e) {
      // try next
    }
  }
  try {
    await ensureDir(path.dirname(destPngFile));
    if (jpgBuf) {
      // Convert to PNG using Jimp
      const img = await Jimp.read(jpgBuf);
      await img.writeAsync(destPngFile);
      return true;
    } else {
      // Fallback: Generate a simple placeholder PNG
      const img = new Jimp({ width: 480, height: 720, color: 0x333333ff });
      const white = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
      const title = `Gutenberg #${gid}`;
      img.print(white, 20, 20, { text: title, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, 440, 680);
      await img.writeAsync(destPngFile);
      return true;
    }
  } catch (e) {
    return false;
  }
}

async function fetchBooksAssets() {
  let success = 0, fail = 0;
  for (const book of books) {
    const gid = extractGutenbergIdFromBookPath(book.book_path);
    if (!gid) {
      console.warn(`Skipping book without Gutenberg ID: ${book.title}`);
      fail++;
      continue;
    }

    const srcBookFullPath = path.join(DEST_DIR, book.book_path);
    const srcCoverFullPath = path.join(DEST_DIR, book.cover_path);

    const bookDir = path.dirname(srcBookFullPath);
    await ensureDir(bookDir);

    // Fetch EPUB
    const epubOk = fs.existsSync(srcBookFullPath) || await fetchEpubForId(gid, srcBookFullPath);
    // Fetch cover (always write PNG named as in JSON)
    const coverOk = fs.existsSync(srcCoverFullPath) || await fetchCoverForId(gid, srcCoverFullPath);

    if (epubOk && coverOk) success++; else fail++;
  }
  return { success, fail };
}

async function ensureLibraryCovers() {
  // We will (re)generate PNG covers in the given paths from libraryNames.json
  const libs = [
    ...(libraryNames.global || []),
    ...(libraryNames.user || []),
  ];

  for (const lib of libs) {
    const coverPath = lib.libraryCover;
    const ext = path.extname(coverPath).toLowerCase();
    const outPath = path.join(DEST_DIR, coverPath.replace('/opt/demo-data/', ''));
    await ensureDir(path.dirname(outPath));

    try {
      if (ext !== '.png') {
        // We still generate a PNG but keep the path as-is; to avoid content-type mismatch
        // downstream, prefer updating libraryNames.json to .png extensions.
        // For now, we write PNG even if the file extension isn't .png.
      }
      const img = new Jimp({ width: 800, height: 500, color: 0x222222ff });
      const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const fontSub = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
      img.print(fontTitle, 24, 24, lib.name, 752);
      img.print(fontSub, 24, 72, lib.description || '', 752);
      await img.writeAsync(outPath);
    } catch(e) {
      console.warn('Failed to create library cover', outPath, e.message);
    }
  }
}

(async () => {
  console.log('Writing demo assets to', DEST_DIR);
  await ensureDir(DEST_DIR);
  const { success, fail } = await fetchBooksAssets();
  console.log(`Books assets done. success=${success} fail=${fail}`);
  await ensureLibraryCovers();
  console.log('Library covers ensured.');
})();
