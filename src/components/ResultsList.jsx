import React from "react";
import { pickImageUrl, PLACEHOLDER_SVG, seemsUrl } from "../utils/image";

/**
 * ResultsList.jsx
 * Purpose: Renders the top-10 scored projectors as cards.
 *  - Shows image with hover zoom trigger.
 *  - Displays meta and mini stacked score bar.
 *  - Has an "Export summary (PDF)" button.
 *  - NEW: If user provided throw distance, show min–max image width at that distance
 *         using the definition: imageWidth = throwDistance * throwRatio.
 */

function fmtMeters(n, dp = 2) {
  if (n == null || isNaN(n)) return "—";
  return `${Number(n).toFixed(dp)} m`;
}

export default function ResultsList({
  results,
  filters,
  onExport,
  onHoverImage,
  onShowBreakdown,
}) {
  const userDistanceM = Number(filters?.distance_m) || null;

  return (
    <section className="pp-results-wrap">
      <div className="pp-results-head" style={{ alignItems: "center", gap: 8 }}>
        <h2 className="pp-h2" style={{ marginRight: "auto" }}>
          Top matches
        </h2>
        <span className="pp-muted">Showing up to 10 results</span>
        <button className="pp-btn" onClick={onExport} title="Export summary to PDF">
          Export summary (PDF)
        </button>
      </div>

      <div className="results">
        {results.map((p, i) => {
          const rawUrl = pickImageUrl(p);
          const imgSrc = seemsUrl(rawUrl) ? rawUrl : PLACEHOLDER_SVG;

          // --- NEW: compute width range at the user's distance (per your definition)
          // Only if we have distance + both throw ratios.
          let widthRangeLabel = null;
          if (
            userDistanceM &&
            p.throw_ratio_min != null &&
            p.throw_ratio_max != null &&
            !isNaN(p.throw_ratio_min) &&
            !isNaN(p.throw_ratio_max)
          ) {
            const minW = userDistanceM * Number(p.throw_ratio_min);
            const maxW = userDistanceM * Number(p.throw_ratio_max);
            widthRangeLabel = `At ${userDistanceM.toFixed(1)} m throw: ${fmtMeters(
              minW
            )} – ${fmtMeters(maxW)} image width`;
          }

          return (
            <article key={p.model + i} className="card">
              {/* Position number separate from model name */}
              <div className="rank">#{i + 1}</div>

              <div
                className="image"
                onMouseEnter={() => onHoverImage(seemsUrl(rawUrl) ? rawUrl : null)}
                onMouseLeave={() => onHoverImage(null)}
              >
                <img
                  src={imgSrc}
                  alt={p.model}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_SVG;
                  }}
                />
              </div>

              <h4 className="pp-card-title">
                {(p.brand || "—") + " " + (p.model || "")}
              </h4>

              <div className="meta">
                £{p.price ? Number(p.price).toLocaleString() : "TBC"} •{" "}
                {p.technology || "—"} • {p.brightness_lumens || "—"} lm
              </div>

              {/* --- NEW: width-at-distance label (only shown when we can compute it) --- */}
              {widthRangeLabel && (
                <div className="pp-muted" style={{ marginTop: 4 }}>
                  {widthRangeLabel}
                </div>
              )}

              {/* Stacked score bar + button to open breakdown modal */}
              <div className="score">
                <div className="scorebar" aria-hidden="true">
                  <div
                    className="scorebar-seg brightness"
                    style={{ width: (p.breakdown.subs.brightness || 0) + "%" }}
                  />
                  <div
                    className="scorebar-seg throw"
                    style={{ width: (p.breakdown.subs.throw || 0) + "%" }}
                  />
                  <div
                    className="scorebar-seg noise"
                    style={{ width: (p.breakdown.subs.noise || 0) + "%" }}
                  />
                  <div
                    className="scorebar-seg value"
                    style={{ width: (p.breakdown.subs.value || 0) + "%" }}
                  />
                </div>
                <button
                  className="small"
                  onClick={() => onShowBreakdown(p.breakdown)}
                  title="Explain score"
                >
                  ?
                </button>
                <span className="pp-score-num">{Math.round(p.score)}%</span>
              </div>

              <p className="desc">{p.breakdown.why}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
