#!/usr/bin/env node
// ProjectorPoint XML feed -> src/data/projectors.json (now with images[])
//
// Usage:
//   node scripts/pp-xml-to-json.mjs --file src/data/pp_feed.xml --out src/data/projectors.json --limit 80
//   node scripts/pp-xml-to-json.mjs --url "https://www.projectorpoint.co.uk/wp-content/uploads/woo-feed/google/xml/pp_feed1-4.xml" --out src/data/projectors.json --limit 80
//
// Requires: npm i fast-xml-parser

import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const INFILE = args.file || "src/data/pp_feed.xml";
const FEED_URL = args.url || null;
const OUT = args.out || "src/data/projectors.json";
const LIMIT = Number(args.limit || 0); // 0 = all

/* ---------- helpers ---------- */
const toNum = (v) => {
  if (v == null) return null;
  const m = String(v).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const moneyToNumber = (s) => {
  if (!s) return null;
  const cleaned = String(s).replace(/[^\d.,-]/g, "");
  const normalized = cleaned.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};
function mapResolutionToAspect(res) {
  if (!res) return null;
  const s = String(res).toLowerCase();
  if (/(3840x2160|4096x2160|2160p|4k)/.test(s)) return "16:9";
  if (/(1920x1080|1080p)/.test(s)) return "16:9";
  if (/(1280x720|720p)/.test(s)) return "16:9";
  if (/1920x1200/.test(s)) return "16:10";
  if (/1280x800/.test(s)) return "16:10";
  if (/1024x768/.test(s)) return "4:3";
  return null;
}
function extractFromText(txt) {
  const s = (txt || "").replace(/\s+/g, " ").trim();
  const brightness =
    toNum(s.match(/(\d[\d,\.]*)\s*(ansi\s*)?l(?:umens?|m)\b/i)?.[1]) ||
    toNum(s.match(/(\d[\d,\.]*)\s*ansi\b/i)?.[1]) || null;

  let resolution = null;
  if (/4k|3840x2160|2160p/i.test(s)) resolution = "3840x2160";
  else if (/1080p|1920x1080/i.test(s)) resolution = "1920x1080";
  else if (/1920x1200/i.test(s)) resolution = "1920x1200";
  else if (/1280x800/i.test(s)) resolution = "1280x800";
  else if (/1024x768/i.test(s)) resolution = "1024x768";

  let technology =
    /3lcd/i.test(s) ? "3LCD" :
    /dlp/i.test(s) ? "DLP" :
    /(^|[^3])lcd/i.test(s) ? "LCD" : null;

  let light_source =
    /laser/i.test(s) ? "Laser" :
    /\bled\b/i.test(s) ? "LED" :
    /(lamp|uhp)/i.test(s) ? "Lamp" : null;

  const noise_db = toNum(s.match(/(\d+(?:\.\d+)?)\s*dB\b/i)?.[1]) || null;

  let throw_ratio_min = null, throw_ratio_max = null;
  const tr1 = s.match(/throw\s*ratio[^0-9]*([\d.]+)\s*[-–to]\s*([\d.]+)/i);
  const tr2 = s.match(/\b([\d.]+)\s*:\s*1\b/i);
  if (tr1) {
    throw_ratio_min = toNum(tr1[1]);
    throw_ratio_max = toNum(tr1[2]);
  } else if (tr2) {
    throw_ratio_min = toNum(tr2[1]);
    throw_ratio_max = throw_ratio_min;
  }

  const ust = /\bust\b|\bultra[-\s]?short\b/i.test(s) || (throw_ratio_min != null && throw_ratio_min < 0.3);
  const short = ust || (throw_ratio_min != null && throw_ratio_min < 1.0) || /\bshort[-\s]?throw\b/i.test(s);
  const hdr = /hdr10?\b|hdr\b/i.test(s);

  return {
    brightness_lumens: brightness,
    resolution,
    technology,
    light_source,
    noise_db,
    throw_ratio_min,
    throw_ratio_max,
    short_throw: short && !ust ? true : ust ? false : null,
    ultra_short_throw: ust || null,
    hdr
  };
}

function pickImages(it) {
  const g = (k) => it[k] ?? it[`g:${k}`];
  const primary = g("image_link");
  const additional = g("additional_image_link");

  // Normalize into an array
  const out = [];
  if (primary) out.push(String(primary).trim());

  if (Array.isArray(additional)) {
    additional.forEach((x) => x && out.push(String(x).trim()));
  } else if (typeof additional === "string") {
    // Can be comma- or space-separated
    String(additional).split(/[,\s]+/).forEach((x) => x && out.push(x.trim()));
  }

  // De-duplicate & ensure https
  const uniq = Array.from(new Set(out))
    .map((u) => u.startsWith("//") ? "https:" + u : u);
  return uniq;
}

/* ---------- mapping ---------- */
function mapItem(it) {
  const g = (k) => it[k] ?? it[`g:${k}`];

  const title = it.title || g("title") || "";
  const description = it.description || g("description") || "";
  const brand = g("brand") || "";
  const mpn = g("mpn") || "";
  const id = g("id") || `${brand}-${mpn || title}`.trim();
  const link = g("link") || it.link || null;

  const price = moneyToNumber(g("sale_price") || g("price"));

  const images = pickImages(it);
  const image_url = images[0] || null;

  const parsed = extractFromText(`${title}\n${description}`);
  const aspectFromRes = mapResolutionToAspect(parsed.resolution);
  const native_aspect = aspectFromRes || "16:9";

  return {
    sku: String(id).slice(0, 80),
    brand: brand || null,
    model: mpn || title || null,
    price: price ?? null,

    technology: parsed.technology,
    light_source: parsed.light_source,
    brightness_lumens: parsed.brightness_lumens,
    resolution: parsed.resolution,
    native_aspect,

    throw_ratio_min: parsed.throw_ratio_min,
    throw_ratio_max: parsed.throw_ratio_max,
    noise_db: parsed.noise_db,
    hdr: parsed.hdr || null,
    gaming_input_lag_ms: null,

    short_throw: parsed.short_throw,
    ultra_short_throw: parsed.ultra_short_throw,

    pdp_url: link,
    image_url,
    images
  };
}

/* ---------- I/O ---------- */
async function readXmlText() {
  if (FEED_URL) {
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.error(`Fetch failed (${FEED_URL}): ${err.message}. Falling back to --file.`);
    }
  }
  console.log("Reading", INFILE);
  return fs.readFile(INFILE, "utf8");
}

async function run() {
  const xmlText = await readXmlText();
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: false });
  const xml = parser.parse(xmlText);

  const items = xml?.rss?.channel?.item || [];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No <item> nodes found in XML. Check your --file / --url input.");
  }

  const subset = LIMIT > 0 ? items.slice(0, LIMIT) : items;
  const mapped = subset.map(mapItem);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(mapped, null, 2));
  console.log(`✅ Wrote ${mapped.length} projectors → ${OUT}`);
}

run().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
