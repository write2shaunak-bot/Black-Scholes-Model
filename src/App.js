import React, { useState, useEffect, useCallback } from "react";
import ResultsTable from "./ResultsTable";
import GreeksChart from "./GreeksChart";

const API = "http://localhost:8000";

const DEFAULT = { S: 100, K: 100, T: 1, r: 0.05, v: 0.2, q: 0.0 };

const FIELDS = [
  { name: "S", label: "Spot (S)",       step: "1",     min: "0.01" },
  { name: "K", label: "Strike (K)",     step: "1",     min: "0.01" },
  { name: "T", label: "Time (T, yrs)",  step: "0.01",  min: "0.01" },
  { name: "r", label: "Rate (r)",       step: "0.001" },
  { name: "v", label: "Volatility (σ)", step: "0.01",  min: "0.001" },
  { name: "q", label: "Div Yield (q)",  step: "0.001" },
];

export default function App() {
  const [inputs,  setInputs]  = useState(DEFAULT);
  const [draft,   setDraft]   = useState(DEFAULT);
  const [result,  setResult]  = useState(null);
  const [surface, setSurface] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const [calcRes, surfRes] = await Promise.all([
        fetch(`${API}/api/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }),
        fetch(
          `${API}/api/surface?K=${params.K}&T=${params.T}&r=${params.r}&v=${params.v}&q=${params.q}&steps=100`
        ),
      ]);

      if (!calcRes.ok) {
        const err = await calcRes.json();
        throw new Error(err.detail || "Calculation failed");
      }
      if (!surfRes.ok) throw new Error("Surface fetch failed");

      const [calcData, surfData] = await Promise.all([
        calcRes.json(),
        surfRes.json(),
      ]);

      setResult(calcData);
      setSurface(surfData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(inputs);
  }, [inputs, fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {};
    for (const [k, v] of Object.entries(draft)) {
      const n = parseFloat(v);
      if (isNaN(n)) return;
      parsed[k] = n;
    }
    setInputs(parsed);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.title}>Black‑Scholes Analytics</h1>
            <p style={styles.subtitle}>European Options Pricer · FastAPI + D3.js</p>
          </div>
          <span style={styles.badge}>v1.0</span>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Parameters</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              {FIELDS.map(({ name, label, step, min }) => (
                <label key={name} style={styles.fieldLabel}>
                  <span style={styles.labelText}>{label}</span>
                  <input
                    type="number"
                    name={name}
                    value={draft[name]}
                    onChange={handleChange}
                    step={step}
                    min={min}
                    style={styles.input}
                  />
                </label>
              ))}
            </div>
            <div style={styles.formFooter}>
              <button type="submit" style={loading ? { ...styles.btn, opacity: 0.6 } : styles.btn} disabled={loading}>
                {loading ? "Calculating…" : "Calculate"}
              </button>
              {!loading && !error && result && (
                <span style={styles.hint}>Results auto-update on submit</span>
              )}
            </div>
          </form>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </section>

        {result && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>
              Results
              <span style={styles.titleTag}>S = {inputs.S}</span>
            </h2>
            <ResultsTable result={result} />
          </section>
        )}

        {surface.length > 0 && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Surface Chart</h2>
            <GreeksChart data={surface} spotPrice={inputs.S} />
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        Black-Scholes Model · European Options · Prices &amp; Greeks computed server-side
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f1117",
    color: "#e2e8f0",
  },
  header: {
    padding: "28px clamp(16px, 5vw, 48px) 20px",
    borderBottom: "1px solid #1e2535",
    background: "linear-gradient(135deg, #0f1117 0%, #161b27 100%)",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(1.3rem, 4vw, 1.9rem)",
    fontWeight: 700,
    color: "#f0f4ff",
    letterSpacing: "-0.5px",
  },
  subtitle: { margin: "4px 0 0", fontSize: "0.85rem", color: "#475569" },
  badge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: "999px",
    background: "#1e2535",
    color: "#64748b",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  },
  main: {
    flex: 1,
    padding: "28px clamp(16px, 5vw, 48px)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  card: {
    background: "#161b27",
    border: "1px solid #1e2535",
    borderRadius: "14px",
    padding: "24px clamp(16px, 3vw, 32px)",
  },
  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleTag: {
    fontSize: "0.72rem",
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#1e2535",
    color: "#94a3b8",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "none",
  },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "14px",
  },
  fieldLabel: { display: "flex", flexDirection: "column", gap: "5px" },
  labelText: {
    fontSize: "0.7rem",
    color: "#475569",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  input: {
    background: "#0f1117",
    border: "1px solid #2d3748",
    borderRadius: "7px",
    color: "#e2e8f0",
    padding: "9px 12px",
    fontSize: "0.95rem",
    width: "100%",
    transition: "border-color 0.15s",
  },
  formFooter: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  btn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 28px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s, transform 0.1s",
    letterSpacing: "0.01em",
  },
  hint: { fontSize: "0.75rem", color: "#334155" },
  errorBox: {
    marginTop: "14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.85rem",
    color: "#f87171",
  },
  errorIcon: { flexShrink: 0, marginTop: "1px" },
  footer: {
    textAlign: "center",
    padding: "18px",
    fontSize: "0.72rem",
    color: "#1e2535",
    borderTop: "1px solid #1e2535",
  },
};
