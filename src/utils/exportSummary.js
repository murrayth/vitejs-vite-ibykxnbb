import { seemsUrl, pickImageUrl } from "./image";

/**
 * exportSummary.js
 * Purpose: Build a clean HTML document in a new window and call print().
 *  - Includes inputs summary (with inches + cm)
 *  - Includes a table of top matches with thumbnails
 *  - Adds a simple footer with company info
 */

function toFixedSafe(n, d) {
  if (typeof n !== "number") return "—";
  try {
    return n.toFixed(d);
  } catch {
    return String(n);
  }
}

function safeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeAttr(s) {
  if (s == null) return "";
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function exportSummary(results, filters) {
  const now = new Date();
  const screenIn = Math.round(filters.screen_diagonal_in || 0);
  const screenCm = Math.round(screenIn * 2.54);
  const distM = (filters.distance_m || 0).toFixed(1);

  let html = "";
  html += "<!doctype html><html><head><meta charset='utf-8'>";
  html += "<title>Projector Advisor — Summary</title>";
  html += "<style>";
  html += "html,body{margin:0;padding:0}";
  html += "body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111}";
  html += "h1{margin:0 0 6px} .muted{color:#555} .pill{display:inline-block;border:1px solid #ddd;border-radius:999px;padding:4px 10px;margin:0 6px 6px 0;font-size:12px}";
  html += "table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ddd;padding:8px;vertical-align:top;font-size:13px}";
  html += "th{background:#f5f7fb;text-align:left}";
  html += ".rank{font-weight:bold}";
  html += ".small{font-size:12px;color:#555}";
  html += ".mb8{margin-bottom:8px}";
  html += ".imgcell{width:84px}";
  html += ".imgcell img{width:80px;height:60px;object-fit:contain;background:#fafbfd;border:1px solid #eee;border-radius:6px}";
  html += ".tfoot{margin-top:18px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#374151;display:flex;gap:12px;align-items:center;justify-content:space-between}";
  html += ".brand{display:flex;align-items:center;gap:8px}";
  html += ".brand .dot{width:10px;height:10px;background:#1056d8;border-radius:50%}";
  html += "@media print {.no-print{display:none}}";
  html += "</style></head><body>";

  html += "<h1>Projector Advisor — Summary</h1>";
  html += "<div class='muted mb8'>Generated " + now.toLocaleString() + "</div>";

  // Inputs
  html += "<h2>Inputs</h2>";
  html += "<div class='pill'>Use case: " + (filters.use_case || "—") + "</div>";
  html += "<div class='pill'>Throw distance: " + distM + " m</div>";
  html += "<div class='pill'>Screen size (diagonal): " + screenIn + "\" (" + screenCm + " cm)</div>";
  html += "<div class='pill'>Ambient light: " + (filters.ambient || "—") + "</div>";
  html += "<div class='pill'>Budget: £" + (Math.round(filters.budget || 0)).toLocaleString() + "</div>";
  html += "<div class='pill'>Aspect ratios: " + ((filters.aspect_ratios && filters.aspect_ratios.length) ? filters.aspect_ratios.join(", ") : "any") + "</div>";

  // Results table
  html += "<h2>Top matches</h2>";
  html += "<table><thead><tr>";
  html += "<th>#</th><th class='imgcell'>Image</th><th>Model</th><th>Price</th><th>Tech</th><th>Brightness (lm)</th><th>Aspect</th><th>Throw ratio</th><th>Score</th><th>Why</th>";
  html += "</tr></thead><tbody>";

  results.forEach(function (p, i) {
    const price = p.price ? "£" + Number(p.price).toLocaleString() : "TBC";
    const model = (p.brand || "—") + " " + (p.model || "");
    const aspect = p.native_aspect || "—";
    const tr =
      p.throw_ratio_min != null && p.throw_ratio_max != null
        ? toFixedSafe(p.throw_ratio_min, 2) + "–" + toFixedSafe(p.throw_ratio_max, 2)
        : "—";
    const why = safeHtml(p.breakdown.why);
    const img = pickImageUrl(p);

    html += "<tr>";
    html += "<td class='rank'>" + (i + 1) + "</td>";
    if (seemsUrl(img)) {
      html +=
        "<td class='imgcell'><img referrerpolicy='no-referrer' crossorigin='anonymous' loading='lazy' src=\"" +
        safeAttr(img) +
        "\" alt=\"thumbnail\"></td>";
    } else {
      html += "<td class='imgcell'>—</td>";
    }
    html += "<td>" + safeHtml(model) + "</td>";
    html += "<td>" + price + "</td>";
    html += "<td>" + safeHtml(p.technology || "—") + "</td>";
    html += "<td>" + (p.brightness_lumens || "—") + "</td>";
    html += "<td>" + safeHtml(aspect) + "</td>";
    html += "<td>" + tr + "</td>";
    html += "<td>" + Math.round(p.score) + "%</td>";
    html += "<td><span class='small'>" + why + "</span></td>";
    html += "</tr>";
  });

  html += "</tbody></table>";

  // Footer
  html += "<div class='tfoot'>";
  html += "<div class='brand'><span class='dot'></span><strong>ProjectorPoint</strong></div>";
  html += "<div>www.projectorpoint.co.uk • +44 (0)20 3514 3180 • sales@projectorpoint.co.uk</div>";
  html += "<div>Unit 5, Trade City, Hayes, UB3 3NA</div>";
  html += "</div>";

  html += "</body></html>";

  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {}
    }, 300);
  }
}
