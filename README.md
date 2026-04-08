# Black-Scholes Analytics

Black-Scholes options pricing with a FastAPI backend and a React + D3.js frontend.

The app calculates European call and put prices plus Delta, Gamma, Theta, Vega, and Rho, and renders a live surface chart.

---

## Project Layout

```text
bs-app/
├── main.py              # FastAPI backend
├── requirements.txt     # Python dependencies
├── package.json         # React frontend dependencies and scripts
├── public/
│   └── index.html       # React HTML entry point
└── src/
    ├── App.js           # Main UI
    ├── GreeksChart.js   # D3.js chart
    ├── ResultsTable.js  # Results table
    ├── index.js         # React bootstrap
    └── index.css        # Global styles
```

> The nested `black-scholes-ui/` folder was a duplicate scaffold and is no longer part of the canonical structure.

---

## Start

### Backend

Run from the project root:

```bash
cd /Users/shaunakkumar/Downloads/bs-app
python3 -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend endpoints:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/healthz`

### Frontend

Run from the same project root:

```bash
cd /Users/shaunakkumar/Downloads/bs-app
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

---

## API Endpoints

| Method | Path             | Description                              |
|--------|------------------|------------------------------------------|
| POST   | `/api/calculate` | Single-point Black-Scholes pricing      |
| GET    | `/api/surface`   | 100-point price/Greeks surface           |
| GET    | `/healthz`       | Health check                             |

### Example request

```json
{
  "S": 100,
  "K": 100,
  "T": 1.0,
  "r": 0.05,
  "v": 0.2,
  "q": 0.0
}
```

---

## Parameters

| Symbol | Meaning               | Example |
|--------|-----------------------|---------|
| S      | Spot price            | 100     |
| K      | Strike price          | 100     |
| T      | Time to maturity (yr) | 1.0     |
| r      | Risk-free rate        | 0.05    |
| v      | Volatility            | 0.20    |
| q      | Dividend yield        | 0.00    |

---

## Notes

- Use the project root as your working directory for both backend and frontend commands.
- `main.py` is the FastAPI entrypoint, so `uvicorn main:app ...` must be run from the root.
- The React app is defined at the root level in `package.json`, `public/`, and `src/`.
