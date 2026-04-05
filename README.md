# Black-Scholes Analytics

A full-stack Black-Scholes options calculator with FastAPI backend and React + D3.js frontend.

## Project Structure

```
bs-app/
├── main.py          # FastAPI backend
├── requirements.txt # Python dependencies
└── src/
    ├── App.js           # Main React container
    ├── ResultsTable.js  # Greeks & price display table
    └── GreeksChart.js   # D3.js multi-line surface chart
```

## Backend Setup

```bash
# Install dependencies
pip install fastapi uvicorn scipy numpy

# Run the server (port 8000)
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000
Swagger docs at:    http://localhost:8000/docs

## Frontend Setup

Place the three `src/` files into a React project created via:

```bash
npx create-react-app black-scholes-ui
cd black-scholes-ui
npm install d3
```

Replace `src/App.js` and add `src/ResultsTable.js` and `src/GreeksChart.js`, then:

```bash
npm start
```

Frontend will run at: http://localhost:3000

## API Endpoints

| Method | Path             | Description                                      |
|--------|------------------|--------------------------------------------------|
| POST   | /api/calculate   | Single-point BS price + all Greeks              |
| GET    | /api/surface     | 100-point surface across spot range ±50% of K  |
| GET    | /healthz         | Health check                                    |

## Parameters

| Symbol | Meaning               | Example |
|--------|-----------------------|---------|
| S      | Spot price            | 100     |
| K      | Strike price          | 100     |
| T      | Time to maturity (yr) | 1.0     |
| r      | Risk-free rate        | 0.05    |
| v      | Volatility (σ)        | 0.20    |
| q      | Dividend yield        | 0.00    |
