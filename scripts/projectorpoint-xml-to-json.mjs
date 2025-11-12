#!/usr/bin/env node
// Convert ProjectorPoint XML feed -> src/data/projectors.json
// Run: node scripts/projectorpoint-xml-to-json.mjs --limit 80

import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://www.projectorpoint.co.uk/wp-content/uploads/woo-feed/google/xml/pp_feed1-4.xml";
const LIMIT = Number(process.argv.includes("--limit") ? process.argv[process.argv.indexOf("--limit")+1] : 0);
const OUT = "src/data/projectors.json";

// ---------- helpers ----------
const toNum = (v) => {
  if (v == null) return null;
  const m = String(v).replace(/,/g, "").match(/-?\\d+(\\.\\d+)?/);
  return m ? Number(m[0]) : null;
};
const moneyToNumber = (s) => {
  if (!s) return null;
  const n = String(s).match(/-?\\d+(\\.\\d+)?/);
  return n ? Number(n[0]) : null;
};

// Parse info from title/description
function extractFromText(txt) {
  const s = (txt || "").replace(/\\s+/g, " ").trim();
  const brightness = toNum(s.match(/(\\d[\\d,\\.]*)\\s*(ansi\\s*)?l(?:umens?|m)\\b/i)?.[1]) || null;
  let resolution = null;
  if (/4k|3840x2160|2160p/i.test(s)) resolution = "3840x2160";
  else if (/1080p|1920x1080/i.test(s)) resolution = "1920x1080";
  else if (/1280x800/i.test(s)) resolution = "1280x800";
  else if (/1024x768/i.test(s)) resolution = "1024x768";
  let technology = /3lcd/i.test(s) ? "3LCD" : /dlp/i.test(s) ? "DLP" : /lcd/i.test(s) ? "LCD" : null;
  let light_source = /laser/i.test(s) ? "Laser" : /led/i.test(s) ? "LED" : /lamp|uhp/i.test(s) ? "Lamp" : null;
  const noise_db = toNum(s.match(/(\\d+(?:\\.\\d+)?)\\s*dB/i)?.[1]);
  const tr = s.match(/throw\\s*ratio[^\\d]*(\\d+(?:\\.\\d+)?)\\s*[-–to]\\s*(\\d+(?:\\.\\d+)?)/i);
  const tr2 = s.match(/\\b(\\d+(?:\\.\\d+)?)\\s*:\\s*1\\b/i);
  let trMin=null,trMax=null;
  if (tr) { trMin=toNum(tr[1]); trMax=toNum(tr[2]); }
  else if (tr2) { trMin=toNum(tr2[1]); trMax=trMin; }
  const ultra_short_throw = /ust|ultra[-\\s]?short/i.test(s) || (trMin && trMin < 0.3);
  const short_throw = ultra_short_throw || (trMin && trMin < 1.0) || /short[-\\s]?throw/i.test(s);
  return { brightness_lumens: brightness, resolution, technology, light_source, noise_db, throw_ratio_min: trMin, throw_ratio_max: trMax, short_throw, ultra_short_throw };
}

function mapItem(it) {
  const g = (k) => it[k] ?? it[`g:${k}`];
  const title = it.title || g("title") || "";
  const description = it.description || g("description") || "";
  const brand = g("brand") || "";
  const mpn = g("mpn") || "";
  const id = g("id") || `${brand}-${mpn || title}`;
  const link = g("link") || null;
  const price = moneyToNumber(g("price") || g("sale_price"));
  const t = extractFromText(`${title} ${description}`);
  return {
    sku: id.slice(0,80),
    brand: brand || null,
    model: mpn || title || null,
    price,
    technology: t.technology,
    light_source: t.light_source,
    brightness_lumens: t.brightness_lumens,
    resolution: t.resolution,
    native_aspect: "16:9",
    throw_ratio_min: t.throw_ratio_min,
    throw_ratio_max: t.throw_ratio_max,
    noise_db: t.noise_db,
    hdr: /hdr/i.test(title+description),
    gaming_input_lag_ms: null,
    short_throw: t.short_throw,
    ultra_short_throw: t.ultra_short_throw,
    pdp_url: link
  };
}

async function run() {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error("HTTP "+res.status);
  const xmlText = await res.text();
  const parser = new XMLParser({ ignoreAttributes:false, removeNSPrefix:false });
  const xml = parser.parse(xmlText);
  const items = xml?.rss?.channel?.item || [];
  const mapped = (LIMIT ? items.slice(0, LIMIT) : items).map(mapItem);
  await fs.mkdir(path.dirname(OUT), { recursive:true });
  await fs.writeFile(OUT, JSON.stringify(mapped, null, 2));
  console.log("Wrote", mapped.length, "items →", OUT);
}

run().catch(e => console.error("ERROR:", e));
