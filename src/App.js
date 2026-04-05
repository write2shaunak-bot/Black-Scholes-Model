import React, { useState, useEffect, useCallback } from "react";
import ResultsTable from "./ResultsTable";
import GreeksChart from "./GreeksChart";

const API = "http://localhost:8000";

const DEFAULT = { S: 100, K: 100, T: 1, r: 0.05, v: 0.2, q: 0.0 };

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT);
  const [draft, setDraft]   = useState(DEFAULT);
  const [result, setResult] = useState(null);
  const [surface, setSurface] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

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
    let valid = true;
    for (const [k, v] of Object.entries(draft)) {
      const n = parseFloat(v);
      if (isNaN(n)) { valid = false; break; }
      parsed[k] = n;
    }
    if (valid) setInputs(parsed);
  };

  const fields = [
    { name: "S", label: "Spot (S)", step: "1" },
    { name: "K", label: "Strike (K)", step: "1" },
    { name: "T", label: "Time (T, yrs)", step: "0.01" },
    { name: "r", label: "Rate (r)", step: "0.001" },
    { name: "v", label: "Volatility (σ)", step: "0.01" },
    { name: "q", label: "Div Yield (q)", step: "0.001" },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Black‑Scholes Analytics</h1>
        <p style={styles.subtitle}>European Options · FastAPI + D3.js</p>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Parameters</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              {fields.map(({ name, label, step }) => (
                <label key={name} style={styles.fieldLabel}>
                  <span style={styles.labelText}>{label}</span>
                  <input
                    type="number"
                    name={name}
                    value={draft[name]}
                    onChange={handleChange}
                    step={step}
                    style={styles.input}
                  />
                </label>
              ))}
            </div>
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Calculating…" : "Calculate"}
            </button>
          </form>
          {error && <p style={styles.error}>⚠ {error}</p>}
        </section>

        {result && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Results · S = {inputs.S}</h2>
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
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#0f1117",
    minHeight: "100vh",
    color: "#e2e8f0",
  },
  header: {
    padding: "32px 40px 20px",
    borderBottom: "1px solid #1e2535",
    background: "linear-gradient(135deg, #0f1117 0%, #161b27 100%)",
  },
  title: { margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#f0f4ff", letterSpacing: "-0.5px" },
  subtitle: { margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" },
  main: { padding: "28px 40px", display: "flex", flexDirection: "column", gap: "24px" },
  card: {
    background: "#161b27",
    border: "1px solid #1e2535",
    borderRadius: "12px",
    padding: "24px 28px",
  },
  sectionTitle: { margin: "0 0 18px", fontSize: "1rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" },
  fieldLabel: { display: "flex", flexDirection: "column", gap: "5px" },
  labelText: { fontSize: "0.75rem", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    background: "#0f1117",
    border: "1px solid #2d3748",
    borderRadius: "6px",
    color: "#e2e8f0",
    padding: "8px 10px",
    fontSize: "0.95rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  btn: {
    alignSelf: "flex-start",
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding: "10px 28px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  error: { color: "#f87171", fontSize: "0.85rem", marginTop: "8px" },
};
