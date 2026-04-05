# Black-Scholes Analytics

A full-stack Black-Scholes options pricing engine — FastAPI backend with a React + D3.js frontend.

Compute European option prices and all five Greeks (Δ, Γ, Θ, ν, ρ) with an interactive surface chart.

---

## Project Structure

```
Black-Scholes-Model/
├── main.py              # FastAPI backend (pricing engine)
├── requirements.txt     # Python dependencies
├── package.json         # React frontend dependencies
├── public/
│   └── index.html       # HTML entry point
└── src/
    ├── index.js         # React entry point
    ├── index.css        # Global styles
    ├── App.js           # Main layout & form
    ├── ResultsTable.js  # Greeks & price display
    └── GreeksChart.js   # D3.js interactive surface chart
```

---

## Quick Start

### 1 · Backend (FastAPI)

```bash
# From the project root
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API base: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/healthz`

### 2 · Frontend (React)

```bash
# From the project root
npm install
npm start
```

App opens at `http://localhost:3000`

> **Note:** The frontend proxies requests to the backend on port 8000.  
> Make sure the backend is running before opening the UI.

---

## API Reference

| Method | Path            | Description                                     |
|--------|-----------------|-------------------------------------------------|
| POST   | `/api/calculate` | Single-point BS price + all Greeks             |
| GET    | `/api/surface`   | Multi-point surface across ±50% spot range     |
| GET    | `/healthz`       | Health check → `{"status": "ok"}`              |

### POST `/api/calculate`

**Request body:**

```json
{
  "S": 100,
  "K": 100,
  "T": 1.0,
  "r": 0.05,
  "v": 0.20,
  "q": 0.00
}
```

**Response:**

```json
{
  "call_price": 10.4506,
  "put_price":  5.5735,
  "d1": 0.35,
  "d2": 0.15,
  "call_greeks": { "delta": 0.6368, "gamma": 0.0187, "theta": -0.0178, "vega": 0.3752, "rho": 0.5323 },
  "put_greeks":  { "delta": -0.3632, "gamma": 0.0187, "theta": -0.0128, "vega": 0.3752, "rho": -0.4144 }
}
```

### GET `/api/surface`

Query parameters: `K`, `T`, `r`, `v`, `q`, `steps` (default 100, max 500).

Returns an array of `SurfacePoint` objects spanning `[K × 0.5, K × 1.5]`.

---

## Parameters

| Symbol | Description            | Constraints      | Example |
|--------|------------------------|------------------|---------|
| S      | Spot price             | > 0              | 100     |
| K      | Strike price           | > 0              | 100     |
| T      | Time to maturity (yr)  | > 0              | 1.0     |
| r      | Risk-free rate         | decimal          | 0.05    |
| v (σ)  | Implied volatility     | 0 < v ≤ 10       | 0.20    |
| q      | Continuous div. yield  | decimal          | 0.00    |

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Python · FastAPI · SciPy · NumPy    |
| Frontend | React 18 · D3.js v7                 |
| Protocol | REST / JSON                         |

