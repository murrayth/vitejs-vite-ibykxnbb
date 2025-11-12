import React from "react";

/**
 * FiltersWizard.jsx
 *
 * Purpose:
 *   Provides the multi-step wizard for configuring projector preferences.
 *   Includes:
 *     1. Use case
 *     2. Throw distance
 *     3. Screen size (visual diagram with 16:9 dimensions)
 *     4. Ambient light
 *     5. Budget
 *     6. Aspect ratio preference
 *     7. Weighting importance
 *
 * Step 3 has been redesigned to:
 *   - Use a single "Diagonal" slider.
 *   - Display a 16:9 rectangle with dynamic width, height, and diagonal labels.
 *   - Show clear arrows and text for all three dimensions.
 */

// --- Constants and helpers ---
const AR_W = 16;
const AR_H = 9;
const DIAG_DEN = Math.sqrt(AR_W ** 2 + AR_H ** 2);
const KW = AR_W / DIAG_DEN; // width = diagonal * KW
const KH = AR_H / DIAG_DEN; // height = diagonal * KH

const inchesToCm = (inches) => inches * 2.54;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function FiltersWizard({
  step,
  setStep,
  useCase,
  setUseCase,
  distance,
  setDistance,
  screen,
  setScreen,
  ambient,
  setAmbient,
  budget,
  setBudget,
  aspectRatios,
  setAspectRatios,
  weights,
  setWeights,
}) {
  // Range for diagonal in inches
  const DIAG_MIN = 60;
  const DIAG_MAX = 400;

  // Derived dimensions (inches)
  const widthIn = screen * KW;
  const heightIn = screen * KH;

  // Formatters
  const fmtIn = (v) => `${Math.round(v)}″`;
  const fmtCm = (v) => `${Math.round(inchesToCm(v))} cm`;

  // Visual scaling
  const MAX_VIZ_WIDTH_PX = 420;
  const vizWidthPx = MAX_VIZ_WIDTH_PX;
  const vizHeightPx = Math.round(vizWidthPx * (AR_H / AR_W));
  const pad = 24;
  const W = vizWidthPx;
  const H = vizHeightPx;

  const onDiagonalChange = (val) => setScreen(clamp(val, DIAG_MIN, DIAG_MAX));

  return (
    <>
      {/* Step 1 — Use case */}
      {step === 1 && (
        <section className="pp-panel">
          <h3 className="pp-h3">What's your use case?</h3>
          <div className="pp-btnrow">
            {["home_cinema", "office", "classroom", "gaming"].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setUseCase(v);
                  setStep(2);
                }}
                className={`pp-chip ${useCase === v ? "is-active" : ""}`}
              >
                {v.replace("_", " ")}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 — Throw distance */}
      {step === 2 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Throw distance (m)</h3>
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            className="pp-range"
          />
          <p className="pp-muted">{clamp(distance, 0.5, 20).toFixed(1)} m</p>
          <div className="pp-row-right">
            <button className="pp-btn" onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 3 — Screen size (16:9) */}
      {step === 3 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Screen size (16:9)</h3>

          {/* Single diagonal slider */}
          <div className="pp-weight-row">
            <label className="pp-weight-label">Diagonal</label>
            <input
              type="range"
              min={DIAG_MIN}
              max={DIAG_MAX}
              step="1"
              value={screen}
              onChange={(e) => onDiagonalChange(parseFloat(e.target.value))}
              className="pp-range"
              aria-label="Screen diagonal in inches"
            />
            <p className="pp-muted">
              {fmtIn(screen)} ({fmtCm(screen)})
            </p>
          </div>

          {/* SVG Visualisation */}
          <div className="size-viz">
            <svg
              width={W + pad * 2 + 60}
              height={H + pad * 2 + 60}
              viewBox={`0 0 ${W + pad * 2 + 60} ${H + pad * 2 + 60}`}
              role="img"
              aria-label="Screen dimensions visualisation"
            >
              {/* Outer frame */}
              <rect
                x={pad - 6}
                y={pad - 6}
                width={W + 12}
                height={H + 12}
                fill="none"
                stroke="var(--line, #e5e7eb)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Screen */}
              <rect
                x={pad}
                y={pad}
                width={W}
                height={H}
                rx="6"
                fill="#f8fafc"
                stroke="#dbeafe"
              />

              {/* Diagonal */}
              <line
                x1={pad}
                y1={pad}
                x2={pad + W}
                y2={pad + H}
                stroke="#cbd5e1"
                strokeDasharray="6 6"
              />

              {/* Width dimension line (above) */}
              <line
                x1={pad}
                y1={pad - 14}
                x2={pad + W}
                y2={pad - 14}
                stroke="#475569"
                strokeWidth="1"
                markerStart="url(#arrowLeft)"
                markerEnd="url(#arrowRight)"
              />
              <text
                x={pad + W / 2}
                y={pad - 20}
                textAnchor="middle"
                className="size-viz-text-strong"
              >
                ↔ W: {fmtIn(widthIn)} ({fmtCm(widthIn)})
              </text>

              {/* Height dimension line (right, horizontal text) */}
              <line
                x1={pad + W + 14}
                y1={pad}
                x2={pad + W + 14}
                y2={pad + H}
                stroke="#475569"
                strokeWidth="1"
                markerStart="url(#arrowUp)"
                markerEnd="url(#arrowDown)"
              />
              <text
                x={pad + W + 30}
                y={pad + H / 2 + 4}
                className="size-viz-text-strong"
              >
                ↕ H: {fmtIn(heightIn)} ({fmtCm(heightIn)})
              </text>

              {/* Diagonal label */}
              <text
                x={pad + W * 0.58}
                y={pad + H * 0.55}
                className="size-viz-text-strong"
              >
                D: {fmtIn(screen)} ({fmtCm(screen)})
              </text>

              {/* Arrowhead markers */}
              <defs>
                <marker
                  id="arrowLeft"
                  markerWidth="6"
                  markerHeight="6"
                  refX="0"
                  refY="3"
                  orient="auto"
                >
                  <path d="M6,0 L0,3 L6,6" fill="#475569" />
                </marker>
                <marker
                  id="arrowRight"
                  markerWidth="6"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6" fill="#475569" />
                </marker>
                <marker
                  id="arrowUp"
                  markerWidth="6"
                  markerHeight="6"
                  refX="3"
                  refY="0"
                  orient="auto"
                >
                  <path d="M0,6 L3,0 L6,6" fill="#475569" />
                </marker>
                <marker
                  id="arrowDown"
                  markerWidth="6"
                  markerHeight="6"
                  refX="3"
                  refY="6"
                  orient="auto"
                >
                  <path d="M0,0 L3,6 L6,0" fill="#475569" />
                </marker>
              </defs>
            </svg>
          </div>

          <div className="pp-row-right">
            <button className="pp-btn" onClick={() => setStep(4)}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 4 — Ambient light */}
      {step === 4 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Ambient light</h3>
          <div className="pp-btnrow">
            {["dark", "dim", "bright"].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setAmbient(v);
                  setStep(5);
                }}
                className={`pp-chip ${ambient === v ? "is-active" : ""}`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 5 — Budget */}
      {step === 5 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Budget (£)</h3>
          <input
            type="range"
            min="400"
            max="20000"
            step="100"
            value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value))}
            className="pp-range"
          />
          <p className="pp-muted">£{Math.round(budget).toLocaleString()}</p>
          <div className="pp-row-right">
            <button className="pp-btn" onClick={() => setStep(6)}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 6 — Aspect ratios */}
      {step === 6 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Preferred aspect ratios</h3>
          <div className="pp-checks">
            {["16:9", "16:10", "4:3"].map((ratio) => (
              <label key={ratio} className="pp-check">
                <input
                  type="checkbox"
                  checked={aspectRatios.includes(ratio)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setAspectRatios([...aspectRatios, ratio]);
                    else
                      setAspectRatios(
                        aspectRatios.filter((r) => r !== ratio)
                      );
                  }}
                />
                {ratio}
              </label>
            ))}
          </div>
          <div className="pp-row-right">
            <button className="pp-btn" onClick={() => setStep(7)}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 7 — Weighting */}
      {step === 7 && (
        <section className="pp-panel">
          <h3 className="pp-h3">Weight the importance</h3>
          {Object.keys(weights).map((key) => (
            <div key={key} className="pp-weight-row">
              <label className="pp-weight-label">{key}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={weights[key]}
                onChange={(e) =>
                  setWeights({ ...weights, [key]: parseFloat(e.target.value) })
                }
                className="pp-range"
              />
            </div>
          ))}
          <div className="pp-row-right">
            <button
              className="pp-btn pp-btn-primary"
              onClick={() => setStep(8)}
            >
              Show results
            </button>
          </div>
        </section>
      )}
    </>
  );
}
