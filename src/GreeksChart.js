import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";

const METRICS = [
  {
    id: "price",
    label: "Option Price",
    callKey: "call_price",
    putKey:  "put_price",
    callColor: "#34d399",
    putColor:  "#f472b6",
    format: d3.format(".3f"),
  },
  {
    id: "delta",
    label: "Delta (Δ)",
    callKey: "call_delta",
    putKey:  "put_delta",
    callColor: "#60a5fa",
    putColor:  "#a78bfa",
    format: d3.format(".4f"),
  },
  {
    id: "gamma",
    label: "Gamma (Γ)",
    callKey: "gamma",
    putKey:  "gamma",
    callColor: "#fbbf24",
    putColor:  "#fbbf24",
    format: d3.format(".6f"),
  },
  {
    id: "theta",
    label: "Theta (Θ)",
    callKey: "call_theta",
    putKey:  "put_theta",
    callColor: "#fb923c",
    putColor:  "#f43f5e",
    format: d3.format(".6f"),
  },
  {
    id: "vega",
    label: "Vega (ν)",
    callKey: "vega",
    putKey:  "vega",
    callColor: "#38bdf8",
    putColor:  "#38bdf8",
    format: d3.format(".4f"),
  },
];

const MARGIN = { top: 20, right: 50, bottom: 50, left: 68 };
const HEIGHT  = 400;

export default function GreeksChart({ data, spotPrice }) {
  const svgRef     = useRef(null);
  const wrapRef    = useRef(null);
  const [metric, setMetric] = useState(METRICS[0]);
  const [width, setWidth]   = useState(800);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width || 800);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const buildChart = useCallback(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xDom = d3.extent(data, (d) => d.S);
    const xScale = d3.scaleLinear().domain(xDom).range([0, innerW]);

    const callVals = data.map((d) => d[metric.callKey]);
    const putVals  = metric.callKey === metric.putKey
      ? []
      : data.map((d) => d[metric.putKey]);
    const allVals  = [...callVals, ...putVals].filter((v) => v != null && isFinite(v));
    const [yMin, yMax] = d3.extent(allVals);
    const yPad   = Math.abs(yMax - yMin) * 0.08 || 0.01;
    const yScale = d3.scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([innerH, 0]);

    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat("")
          .ticks(6)
      )
      .call((axis) => {
        axis.select(".domain").remove();
        axis.selectAll("line")
          .attr("stroke", "#1e2535")
          .attr("stroke-dasharray", "3,4");
      });

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format(".0f")))
      .call((axis) => {
        axis.select(".domain").attr("stroke", "#2d3748");
        axis.selectAll("text").attr("fill", "#64748b").attr("font-size", "11px");
        axis.selectAll("line").attr("stroke", "#2d3748");
      });

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 42)
      .attr("fill", "#475569")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Spot Price (S)");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(metric.format))
      .call((axis) => {
        axis.select(".domain").attr("stroke", "#2d3748");
        axis.selectAll("text").attr("fill", "#64748b").attr("font-size", "11px");
        axis.selectAll("line").attr("stroke", "#2d3748");
      });

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -54)
      .attr("fill", "#475569")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(metric.label);

    const lineGen = (key, color) => {
      const path = g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr(
          "d",
          d3
            .line()
            .defined((d) => d[key] != null && isFinite(d[key]))
            .x((d) => xScale(d.S))
            .y((d) => yScale(d[key]))
        );

      const totalLen = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLen} ${totalLen}`)
        .attr("stroke-dashoffset", totalLen)
        .transition()
        .duration(700)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);
    };

    lineGen(metric.callKey, metric.callColor);
    if (metric.putKey !== metric.callKey) {
      lineGen(metric.putKey, metric.putColor);
    }

    if (spotPrice >= xDom[0] && spotPrice <= xDom[1]) {
      g.append("line")
        .attr("x1", xScale(spotPrice))
        .attr("x2", xScale(spotPrice))
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,4");

      g.append("text")
        .attr("x", xScale(spotPrice) + 5)
        .attr("y", 12)
        .attr("fill", "#f59e0b")
        .attr("font-size", "10px")
        .text(`S = ${spotPrice}`);
    }

    const bisect = d3.bisector((d) => d.S).left;

    const overlay = g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const vLine = g.append("line")
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0);

    overlay.on("mousemove", function (event) {
      const [mx] = d3.pointer(event);
      const xVal = xScale.invert(mx);
      const idx  = bisect(data, xVal, 1);
      const d0   = data[idx - 1];
      const d1b  = data[idx];
      const d    = d1b && Math.abs(xVal - d1b.S) < Math.abs(xVal - d0.S) ? d1b : d0;

      if (!d) return;
      const cx = xScale(d.S);

      vLine.attr("x1", cx).attr("x2", cx).attr("opacity", 1);

      const svgRect = svgRef.current.getBoundingClientRect();
      setTooltip({
        x: event.clientX - svgRect.left + MARGIN.left,
        y: event.clientY - svgRect.top,
        data: d,
      });
    });

    overlay.on("mouseleave", () => {
      vLine.attr("opacity", 0);
      setTooltip(null);
    });

    const legendItems =
      metric.callKey === metric.putKey
        ? [{ label: metric.label, color: metric.callColor }]
        : [
            { label: `Call ${metric.label}`, color: metric.callColor },
            { label: `Put ${metric.label}`,  color: metric.putColor },
          ];

    const legend = g.append("g").attr("transform", `translate(${innerW - 160}, 4)`);
    legendItems.forEach(({ label, color }, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("line")
        .attr("x1", 0).attr("x2", 22)
        .attr("y1", 7).attr("y2", 7)
        .attr("stroke", color)
        .attr("stroke-width", 2.5);
      row.append("text")
        .attr("x", 28).attr("y", 11)
        .attr("fill", "#94a3b8")
        .attr("font-size", "11px")
        .text(label);
    });
  }, [data, metric, width, innerW, innerH, spotPrice]);

  useEffect(() => {
    buildChart();
  }, [buildChart]);

  return (
    <div ref={wrapRef} style={styles.wrapper}>
      <div style={styles.controls}>
        <label style={styles.dropdownLabel}>
          <span style={styles.labelText}>Y-Axis Metric</span>
          <select
            value={metric.id}
            onChange={(e) => setMetric(METRICS.find((m) => m.id === e.target.value))}
            style={styles.select}
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
        <div style={styles.legend}>
          {metric.callKey !== metric.putKey ? (
            <>
              <Dot color={metric.callColor} label="Call" />
              <Dot color={metric.putColor}  label="Put" />
            </>
          ) : (
            <Dot color={metric.callColor} label={metric.label} />
          )}
          <Dot color="#f59e0b" label={`Spot = ${spotPrice}`} dashed />
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg ref={svgRef} style={{ display: "block", overflow: "visible" }} />
        {tooltip && (
          <Tooltip
            x={tooltip.x}
            y={tooltip.y}
            d={tooltip.data}
            metric={metric}
          />
        )}
      </div>
    </div>
  );
}

function Dot({ color, label, dashed }) {
  return (
    <span style={styles.legendItem}>
      <svg width="22" height="12">
        <line
          x1="0" y1="6" x2="22" y2="6"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "4,3" : undefined}
        />
      </svg>
      <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{label}</span>
    </span>
  );
}

function Tooltip({ x, y, d, metric }) {
  const fmt = metric.format;
  const lines = [
    { label: "Spot",           val: d3.format(".2f")(d.S) },
    { label: `Call ${metric.label}`, val: fmt(d[metric.callKey]) },
  ];
  if (metric.putKey !== metric.callKey) {
    lines.push({ label: `Put ${metric.label}`, val: fmt(d[metric.putKey]) });
  }

  return (
    <div
      style={{
        ...styles.tooltip,
        left: x + 14,
        top:  y - 10,
      }}
    >
      {lines.map(({ label, val }) => (
        <div key={label} style={styles.ttRow}>
          <span style={styles.ttLabel}>{label}</span>
          <span style={styles.ttVal}>{val}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", gap: "14px" },
  controls: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "20px" },
  dropdownLabel: { display: "flex", flexDirection: "column", gap: "4px" },
  labelText: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 },
  select: {
    background: "#0f1117",
    border: "1px solid #2d3748",
    borderRadius: "6px",
    color: "#e2e8f0",
    padding: "7px 12px",
    fontSize: "0.88rem",
    cursor: "pointer",
    outline: "none",
  },
  legend: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  tooltip: {
    position: "absolute",
    background: "#1e2535",
    border: "1px solid #2d3748",
    borderRadius: "7px",
    padding: "10px 14px",
    pointerEvents: "none",
    zIndex: 10,
    minWidth: "150px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
  },
  ttRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "2px 0" },
  ttLabel: { fontSize: "0.75rem", color: "#64748b" },
  ttVal: { fontSize: "0.8rem", fontFamily: "monospace", color: "#e2e8f0", fontWeight: 600 },
};
