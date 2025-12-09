// Seeds author images by attempting to fetch open-license portraits and falling back to a local placeholder.
// Sources:
// - Wikipedia REST API (page summary thumbnail)
// - Wikimedia Commons (via Wikipedia pageimage)
// Fallback:
// - Generate/ensure placeholder at /opt/data/meta/placeholders/author.webp

const fs = require('fs');
const path = require('path');
const axios = require('axios');
// Wikipedia/Wikidata often require a valid User-Agent; set one globally for our fetches
const http = axios.create({
  headers: {
    'User-Agent': 'Bookminder/1.0 (+https://example.com)'
  }
});
const Jimp = require('jimp');
const { db } = require('../database/database.js');
const { META_LIBRARY_DATA_PATH } = require('../utils/env.js');

// Ensure a directory exists
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Create a simple SVG placeholder silhouette and write as .webp (still SVG content; browsers will render .webp only if correct format).
// To avoid conversion complexity, we store an SVG file but name it .webp could be misleading. Prefer .png; we'll write a PNG placeholder using a tiny 1x1 transparent PNG if conversion not available.
// We'll write an SVG as .svg and a PNG as .png; authors_covers will reference .png.
function writePlaceholderIfMissing() {
  const placeholdersDir = path.join(META_LIBRARY_DATA_PATH, 'placeholders');
  ensureDirSync(placeholdersDir);
  const pngPath = path.join(placeholdersDir, 'author.png');
  if (!fs.existsSync(pngPath)) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#f4f4f5"/><circle cx="128" cy="96" r="48" fill="#444"/><path d="M32 240c0-53 43-80 96-80s96 27 96 80" fill="#444"/></svg>`;
    const svgPath = path.join(placeholdersDir, 'author.svg');
    fs.writeFileSync(svgPath, svg);
    // Also drop a small PNG placeholder (base64-encoded simple gray square)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAABq4r6EAAAACXBIWXMAAAsSAAALEgHS3X78AAABYUlEQVR4nO3RMQEAIAwEsXv/0ZKQ0t2wOQF3iQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBrg4gAAc9rB9wAAAAASUVORK5CYII=';
    fs.writeFileSync(pngPath, Buffer.from(pngBase64, 'base64'));
    console.log(`[seed-authors] Wrote placeholder at ${pngPath}`);
  }
  // Store cover_url relative to META root; base_path will be 'meta'
  return { placeholderRel: 'meta/placeholders/author.png', placeholderAbs: pngPath };
}

async function fetchWikipediaThumbnail(authorName) {
  try {
    // 1) Use Wikipedia search to find best matching page title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(authorName)}&format=json&srlimit=1`;
    console.log(`[seed-authors] Wikipedia search: ${authorName} -> ${searchUrl}`);
  const searchResp = await http.get(searchUrl, { timeout: 12000 });
    const hits = (searchResp.data && searchResp.data.query && searchResp.data.query.search) || [];
    if (!hits.length) return null;
    const title = hits[0].title; // Best match title
    console.log(`[seed-authors] Wikipedia best title: ${title}`);

    // 2) Try REST summary for pageimage thumbnail
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    console.log(`[seed-authors] Wikipedia REST summary: ${summaryUrl}`);
  const { data: summary } = await http.get(summaryUrl, { timeout: 12000 });
    if (summary && summary.thumbnail && summary.thumbnail.source) {
      console.log(`[seed-authors] Wikipedia thumbnail found: ${summary.thumbnail.source}`);
      return summary.thumbnail.source;
    }

    // 3) If summary has wikibase_item, use Wikidata P18 (image)
    const wikibaseId = summary && summary.wikibase_item;
    if (wikibaseId) {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&property=P18&entity=${wikibaseId}&format=json`;
      console.log(`[seed-authors] Wikidata P18 query: ${wdUrl}`);
  const wdResp = await http.get(wdUrl, { timeout: 12000 });
      const claims = wdResp.data && wdResp.data.claims && wdResp.data.claims.P18;
      if (claims && claims.length) {
        const filename = claims[0].mainsnak.datavalue.value; // e.g., "File:Author Portrait.jpg"
        console.log(`[seed-authors] Wikidata P18 filename: ${filename}`);
        // Build Commons thumbnail URL (medium size)
        const commonsUrl = await commonsThumbFromFile(filename, 400);
        console.log(`[seed-authors] Commons thumbnail: ${commonsUrl || 'none'}`);
        if (commonsUrl) return commonsUrl;
      }
    }
    return null;
  } catch (e) {
    console.log(`[seed-authors] Fetch error for ${authorName}: ${e.message || e}`);
    return null;
  }
}

async function commonsThumbFromFile(fileName, width = 400) {
  try {
    // Resolve the full image info from Commons
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
  const resp = await http.get(api, { timeout: 12000 });
    const pages = resp.data && resp.data.query && resp.data.query.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const ii = page && page.imageinfo && page.imageinfo[0];
    const originalUrl = ii && ii.url;
    if (!originalUrl) return null;
    // Commons provides a standard thumb path under /thumb/.../<width>px-...
    // If original is already a thumb, use it; else construct a thumbnail URL:
    if (originalUrl.includes('/thumb/')) return originalUrl;
    // Construct thumbnail URL using standard scheme
    const lastSlash = originalUrl.lastIndexOf('/')
    const fileBase = originalUrl.substring(lastSlash + 1);
    const thumbUrl = `${originalUrl.replace('/wikipedia/commons/', '/wikipedia/commons/thumb/')}/${width}px-${fileBase}`;
    return thumbUrl;
  } catch {
    return null;
  }
}

async function downloadImage(url, outPath) {
  const resp = await http.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  fs.writeFileSync(outPath, resp.data);
}

function upsertAuthorCover(authorId, relCoverUrl, basePath) {
  // Use a manual upsert to avoid dependency on a UNIQUE constraint that may not exist yet in older DBs
  const select = `SELECT id FROM authors_covers WHERE author_id = ? LIMIT 1`;
  const row = db.prepare(select).get(authorId);
  if (row && row.id) {
    const update = `UPDATE authors_covers SET cover_url = ?, base_path = ? WHERE id = ?`;
    db.prepare(update).run(relCoverUrl, basePath, row.id);
  } else {
    const insert = `INSERT INTO authors_covers (author_id, cover_url, base_path) VALUES (?, ?, ?)`;
    db.prepare(insert).run(authorId, relCoverUrl, basePath);
  }
}

async function seedAuthorsImages() {
  const { placeholderRel } = writePlaceholderIfMissing();
  // Normalize existing cover_url values to include meta/ prefix
  try {
    db.prepare("UPDATE authors_covers SET cover_url = 'meta/' || cover_url WHERE cover_url NOT LIKE 'meta/%'").run();
  } catch (e) {
    console.log('[seed-authors] normalization step skipped:', e.message || e);
  }
  const authors = db.prepare('SELECT id, name FROM authors').all();
  console.log(`[seed-authors] Found ${authors.length} authors`);

  for (const a of authors) {
    const baseDir = path.join(META_LIBRARY_DATA_PATH, 'authors', String(a.id));
    ensureDirSync(baseDir);
  const photoAbs = path.join(baseDir, 'photo.jpg');

    let rel = null;
    try {
      const thumb = await fetchWikipediaThumbnail(a.name);
      if (thumb) {
        console.log(`[seed-authors] Downloading image: ${thumb}`);
        await downloadImage(thumb, photoAbs);
        // Relative to META root
  rel = `meta/authors/${a.id}/photo.jpg`;
        console.log(`[seed-authors] Saved Wikipedia image for ${a.name} -> ${rel}`);
      } else {
        // No thumbnail; try generating monogram image (only when truly missing)
        try {
          const initials = (a.name || '?')
            .split(/\s+/)
            .map(s => s[0] || '')
            .join('')
            .slice(0, 3)
            .toUpperCase();
          const img = new Jimp(256, 256, '#f4f4f5');
          const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
          // Draw initials centered
          img.print(font, 0, 96, { text: initials, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 256, 64);
          const outPng = path.join(baseDir, 'photo.png');
          await img.writeAsync(outPng);
          rel = `meta/authors/${a.id}/photo.png`;
          console.log(`[seed-authors] Generated monogram for ${a.name} -> ${rel}`);
        } catch (genErr) {
          rel = placeholderRel;
          console.log(`[seed-authors] No image for ${a.name}; using placeholder`);
        }
      }
    } catch (e) {
      // Any failure -> try monogram, else placeholder
      try {
        const initials = (a.name || '?')
          .split(/\s+/)
          .map(s => s[0] || '')
          .join('')
          .slice(0, 3)
          .toUpperCase();
        const img = new Jimp(256, 256, '#f4f4f5');
        const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        img.print(font, 0, 96, { text: initials, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 256, 64);
        const outPng = path.join(baseDir, 'photo.png');
        await img.writeAsync(outPng);
  rel = `meta/authors/${a.id}/photo.png`;
        console.log(`[seed-authors] Generated monogram for ${a.name} -> ${rel}`);
      } catch {
        rel = placeholderRel;
        console.log(`[seed-authors] Error for ${a.name}; using placeholder`);
      }
    }

  // base_path is 'meta' so client can resolve /assets/meta/<rel>
  upsertAuthorCover(a.id, rel, 'meta');
  }
  console.log('[seed-authors] Completed');
}

if (require.main === module) {
  seedAuthorsImages().catch(err => {
    console.error('[seed-authors] Failed', err);
    process.exit(1);
  });
}

module.exports = { seedAuthorsImages };
