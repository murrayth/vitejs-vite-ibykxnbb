/**
 * scoring.js
 * Purpose: All projector-scoring logic in one place.
 *  - widthFromDiagonal
 *  - scoreProjector (subscores + total)
 *  - whyRecommend (human-readable reason)
 *  - computeResults (map + sort + top-10 + attach why)
 */

 export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function widthFromDiagonal(diagonalIn, aspect) {
  const parts = String(aspect || "16:9").split(":");
  const w = Number(parts[0]) || 16;
  const h = Number(parts[1]) || 9;
  const ratio = w / h;
  const height = diagonalIn / Math.sqrt(1 + ratio * ratio);
  return height * ratio * 0.0254; // metres
}

export function scoreProjector(p, f, w) {
  const subs = { brightness: 0, throw: 0, noise: 0, value: 0 };

  // Brightness: scale to 6000 lm ~= 100%
  if (p.brightness_lumens) {
    subs.brightness = Math.min(100, (p.brightness_lumens / 6000) * 100) * w.brightness;
  }

  // Noise: lower is better (approx)
  if (p.noise_db) {
    subs.noise = Math.max(0, 100 - p.noise_db * 2) * w.noise;
  }

  // Value: cheaper vs budget is better (simple heuristic)
  if (p.price && f.budget) {
    subs.value = Math.max(0, 100 - (p.price / f.budget) * 100) * w.value;
  }

  // Throw fit: full credit if your distance/width fits the projector's throw window
  if (p.throw_ratio_min && p.throw_ratio_max && f.distance_m && f.screen_diagonal_in) {
    const widthM = widthFromDiagonal(f.screen_diagonal_in, p.native_aspect || "16:9");
    const ratio = f.distance_m / widthM;
    if (ratio >= p.throw_ratio_min && ratio <= p.throw_ratio_max) subs.throw = 100 * w.throw;
  }

  // Weighted average (cap at 100)
  const total = Math.min(
    100,
    (subs.brightness + subs.throw + subs.noise + subs.value) /
      (w.brightness + w.throw + w.noise + w.value)
  );

  return { total, subs };
}

export function whyRecommend(p, f, breakdown) {
  const bits = [];
  const haveThrow =
    p.throw_ratio_min != null &&
    p.throw_ratio_max != null &&
    f.screen_diagonal_in &&
    f.distance_m;

  if (haveThrow) {
    const widthM = widthFromDiagonal(f.screen_diagonal_in, p.native_aspect || "16:9");
    const ratio = f.distance_m / widthM;
    if (ratio >= p.throw_ratio_min && ratio <= p.throw_ratio_max) {
      bits.push(
        "fits your " +
          f.distance_m.toFixed(1) +
          " m throw for ~" +
          Math.round(f.screen_diagonal_in) +
          "\""
      );
    }
  }

  if (f.ambient) {
    const approxFL = (p.brightness_lumens ? p.brightness_lumens : 0) / 100;
    const target = f.ambient === "dark" ? 12 : f.ambient === "dim" ? 24 : 48;
    if (approxFL >= target) bits.push("bright enough for " + f.ambient + " room");
    else bits.push("may be dim in " + f.ambient + " room");
  }

  if (p.light_source === "Laser") bits.push("low-maintenance laser");
  if (p.noise_db != null && p.noise_db <= 28) bits.push("quiet operation");
  if (p.price && p.brightness_lumens && p.price / p.brightness_lumens < 1) bits.push("strong value");

  // Deduplicate + trim to 3 bullets
  const seen = new Set();
  const final = bits
    .filter(Boolean)
    .map((x) => x.toLowerCase())
    .filter((x) => {
      if (seen.has(x)) return false;
      seen.add(x);
      return true;
    })
    .slice(0, 3);

  if (!final.length) return "Best overall fit for your settings.";
  const first = final[0];
  const rest = final.slice(1);
  return rest.length ? "Best match: " + first + "; " + rest.join("; ") + "." : "Best match: " + first + ".";
}

/**
 * computeResults
 * Purpose: Produce the final array used by ResultsList:
 *  - attach score + subs + human 'why'
 *  - sort descending
 *  - take top 10
 */
export function computeResults(projectors, filters, weights) {
  return projectors
    .map((p) => {
      const s = scoreProjector(p, filters, weights);
      return {
        ...p,
        score: s.total,
        breakdown: { ...s, why: whyRecommend(p, filters, s) },
      };
    })
    .filter((p) => !isNaN(p.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
