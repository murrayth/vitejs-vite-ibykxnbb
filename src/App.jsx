import React, { useMemo, useState } from "react";
import "./styles.css";
import projectors from "./data/projectors.json";

import Header from "./components/Header";
import FiltersWizard from "./components/FiltersWizard";
import ResultsList from "./components/ResultsList";

import { computeResults } from "./utils/scoring";
import { exportSummary } from "./utils/exportSummary";
import { PLACEHOLDER_SVG } from "./utils/image";

/**
 * App.jsx
 * Purpose: Top-level component that:
 *  - Owns all state (filters, weights, step).
 *  - Runs the scoring pipeline to compute results.
 *  - Shows the hover zoom and score breakdown modals.
 *  - Passes data/functions to the Wizard and Results.
 */
export default function App() {
  // Simple stepper (1..8)
  const [step, setStep] = useState(1);

  // Filters (global state so Results recompute instantly)
  const [useCase, setUseCase] = useState("");
  const [distance, setDistance] = useState(3.5);
  const [screen, setScreen] = useState(120);
  const [ambient, setAmbient] = useState("");
  const [budget, setBudget] = useState(2000);
  const [aspectRatios, setAspectRatios] = useState([]);

  // Weights for scoring
  const [weights, setWeights] = useState({
    brightness: 1,
    noise: 1,
    throw: 1,
    value: 1,
  });

  // UI state for popups
  const [hoverImage, setHoverImage] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(null);

  // Build a single filters object
  const filters = {
    use_case: useCase,
    distance_m: Math.max(0.5, Math.min(20, distance)),
    screen_diagonal_in: screen,
    ambient,
    budget,
    aspect_ratios: aspectRatios,
  };

  // Compute top-10 results whenever inputs change
  const results = useMemo(
    () => computeResults(projectors, filters, weights),
    [filters, weights]
  );

  // Export button handler (opens print window to save as PDF)
  function handleExport() {
    exportSummary(results, filters);
  }

  return (
    <div className="App">
      <Header onStartGuide={() => setStep(1)} />

      <main className="pp-main">
        <div className="pp-pagehead">
          <div>
            <h1 className="pp-title">Projector Advisor</h1>
            <p className="pp-subtitle">
              Answer a few quick questions and we’ll show the best 10 matches.
            </p>
          </div>
          <div className="pp-stepper">
            <span className="pp-step-pill">Step {Math.min(step, 8)} / 8</span>
          </div>
        </div>

        {/* Wizard (steps 1–7) */}
        {step < 8 && (
          <FiltersWizard
            step={step}
            setStep={setStep}
            // filters
            useCase={useCase}
            setUseCase={setUseCase}
            distance={distance}
            setDistance={setDistance}
            screen={screen}
            setScreen={setScreen}
            ambient={ambient}
            setAmbient={setAmbient}
            budget={budget}
            setBudget={setBudget}
            aspectRatios={aspectRatios}
            setAspectRatios={setAspectRatios}
            // weights
            weights={weights}
            setWeights={setWeights}
          />
        )}

        {/* Results (step 8) */}
        {step === 8 && (
          <ResultsList
            results={results}
            filters={filters}
            onExport={handleExport}
            onHoverImage={setHoverImage}
            onShowBreakdown={setShowBreakdown}
          />
        )}
      </main>

      {/* Hover zoom popup */}
      {hoverImage && (
        <div className="hover-popup" onMouseLeave={() => setHoverImage(null)}>
          <img
            src={hoverImage || PLACEHOLDER_SVG}
            alt="Zoom"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_SVG;
            }}
          />
        </div>
      )}

      {/* Score breakdown modal */}
      {showBreakdown && (
        <div className="modal" onClick={() => setShowBreakdown(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Score Breakdown</h3>
            <pre>{JSON.stringify(showBreakdown, null, 2)}</pre>
            <button className="pp-btn" onClick={() => setShowBreakdown(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
