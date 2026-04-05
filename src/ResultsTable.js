import React from "react";

const FMT = (n, d = 6) =>
  typeof n === "number" ? n.toFixed(d) : "—";

const GREEK_ROWS = [
  { key: "delta", label: "Delta (Δ)",      desc: "Price sensitivity to spot" },
  { key: "gamma", label: "Gamma (Γ)",      desc: "Delta sensitivity to spot" },
  { key: "theta", label: "Theta (Θ) /day", desc: "Time decay per calendar day" },
  { key: "vega",  label: "Vega (ν) /1%σ",  desc: "Sensitivity to 1% vol move" },
  { key: "rho",   label: "Rho (ρ) /1%r",   desc: "Sensitivity to 1% rate move" },
];

export default function ResultsTable({ result }) {
  const { call_price, put_price, d1, d2, call_greeks, put_greeks } = result;

  return (
    <div style={styles.wrapper}>
      <div style={styles.banner}>
        <PriceTile label="Call Price" value={call_price} accent="#34d399" />
        <PriceTile label="Put Price"  value={put_price}  accent="#f472b6" />
        <PriceTile label="d₁"        value={d1}         accent="#60a5fa" decimals={4} />
        <PriceTile label="d₂"        value={d2}         accent="#60a5fa" decimals={4} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: "left" }}>Greek</th>
              <th style={{ ...styles.th, color: "#34d399" }}>Call</th>
              <th style={{ ...styles.th, color: "#f472b6" }}>Put</th>
              <th style={{ ...styles.th, textAlign: "left", color: "#475569" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {GREEK_ROWS.map(({ key, label, desc }, i) => (
              <tr
                key={key}
                style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}
              >
                <td style={{ ...styles.td, fontWeight: 600, color: "#cbd5e1" }}>{label}</td>
                <td style={{ ...styles.td, textAlign: "center", fontFamily: "monospace", color: "#34d399" }}>
                  {FMT(call_greeks[key])}
                </td>
                <td style={{ ...styles.td, textAlign: "center", fontFamily: "monospace", color: "#f472b6" }}>
                  {FMT(put_greeks[key])}
                </td>
                <td style={{ ...styles.td, color: "#475569", fontSize: "0.78rem" }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceTile({ label, value, accent, decimals = 6 }) {
  return (
    <div style={{ ...styles.tile, borderColor: accent + "44" }}>
      <span style={styles.tileLabel}>{label}</span>
      <span style={{ ...styles.tileValue, color: accent }}>
        {typeof value === "number" ? value.toFixed(decimals) : "—"}
      </span>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", gap: "20px" },
  banner: { display: "flex", flexWrap: "wrap", gap: "12px" },
  tile: {
    flex: "1 1 140px",
    background: "#0f1117",
    border: "1px solid",
    borderRadius: "8px",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  tileLabel: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 },
  tileValue: { fontSize: "1.2rem", fontWeight: 700, fontFamily: "monospace" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" },
  th: {
    padding: "10px 14px",
    borderBottom: "1px solid #1e2535",
    textAlign: "center",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#94a3b8",
  },
  td: { padding: "10px 14px", borderBottom: "1px solid #0f1117" },
};
