from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import numpy as np
from scipy.stats import norm
from typing import List

app = FastAPI(title="Black-Scholes Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BSInput(BaseModel):
    S: float = Field(..., gt=0, description="Spot price")
    K: float = Field(..., gt=0, description="Strike price")
    T: float = Field(..., gt=0, description="Time to maturity (years)")
    r: float = Field(..., description="Risk-free rate (decimal)")
    v: float = Field(..., gt=0, description="Volatility (decimal)")
    q: float = Field(0.0, description="Continuous dividend yield (decimal)")

    @validator("v")
    def volatility_cap(cls, v):
        if v > 10:
            raise ValueError("Volatility > 1000% is likely a data error.")
        return v


class Greeks(BaseModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float


class BSResult(BaseModel):
    call_price: float
    put_price: float
    call_greeks: Greeks
    put_greeks: Greeks
    d1: float
    d2: float


class SurfacePoint(BaseModel):
    S: float
    call_price: float
    put_price: float
    call_delta: float
    put_delta: float
    gamma: float
    call_theta: float
    put_theta: float
    vega: float
    call_rho: float
    put_rho: float


def _d1_d2(S: float, K: float, T: float, r: float, v: float, q: float):
    d1 = (np.log(S / K) + (r - q + 0.5 * v ** 2) * T) / (v * np.sqrt(T))
    d2 = d1 - v * np.sqrt(T)
    return d1, d2


def _compute(S: float, K: float, T: float, r: float, v: float, q: float) -> dict:
    d1, d2 = _d1_d2(S, K, T, r, v, q)

    Nd1  = norm.cdf(d1)
    Nd2  = norm.cdf(d2)
    Nd1n = norm.cdf(-d1)
    Nd2n = norm.cdf(-d2)
    nd1  = norm.pdf(d1)

    disc_q = np.exp(-q * T)
    disc_r = np.exp(-r * T)
    sqrt_T = np.sqrt(T)

    call_price = S * disc_q * Nd1 - K * disc_r * Nd2
    put_price  = K * disc_r * Nd2n - S * disc_q * Nd1n

    # Delta
    call_delta = disc_q * Nd1
    put_delta  = disc_q * (Nd1 - 1)

    # Gamma (identical for call and put)
    gamma = (disc_q * nd1) / (S * v * sqrt_T)

    # Theta (per calendar day, /365)
    call_theta = (
        -(S * disc_q * nd1 * v) / (2 * sqrt_T)
        - r * K * disc_r * Nd2
        + q * S * disc_q * Nd1
    ) / 365.0

    put_theta = (
        -(S * disc_q * nd1 * v) / (2 * sqrt_T)
        + r * K * disc_r * Nd2n
        - q * S * disc_q * Nd1n
    ) / 365.0

    # Vega (per 1% move in vol, /100)
    vega = S * disc_q * nd1 * sqrt_T / 100.0

    # Rho (per 1% move in rate, /100)
    call_rho = K * T * disc_r * Nd2  / 100.0
    put_rho  = -K * T * disc_r * Nd2n / 100.0

    return {
        "call_price": round(call_price, 6),
        "put_price":  round(put_price, 6),
        "d1": round(d1, 6),
        "d2": round(d2, 6),
        "call_greeks": {
            "delta": round(call_delta, 6),
            "gamma": round(gamma, 6),
            "theta": round(call_theta, 6),
            "vega":  round(vega, 6),
            "rho":   round(call_rho, 6),
        },
        "put_greeks": {
            "delta": round(put_delta, 6),
            "gamma": round(gamma, 6),
            "theta": round(put_theta, 6),
            "vega":  round(vega, 6),
            "rho":   round(put_rho, 6),
        },
    }


@app.post("/api/calculate", response_model=BSResult)
def calculate(payload: BSInput) -> BSResult:
    try:
        result = _compute(payload.S, payload.K, payload.T, payload.r, payload.v, payload.q)
    except (ValueError, ZeroDivisionError, FloatingPointError) as e:
        raise HTTPException(status_code=422, detail=str(e))

    return BSResult(
        call_price=result["call_price"],
        put_price=result["put_price"],
        d1=result["d1"],
        d2=result["d2"],
        call_greeks=Greeks(**result["call_greeks"]),
        put_greeks=Greeks(**result["put_greeks"]),
    )


@app.get("/api/surface", response_model=List[SurfacePoint])
def surface(
    K: float = Query(..., gt=0),
    T: float = Query(..., gt=0),
    r: float = Query(...),
    v: float = Query(..., gt=0),
    q: float = Query(0.0),
    steps: int = Query(100, ge=10, le=500),
) -> List[SurfacePoint]:
    S_low  = K * 0.50
    S_high = K * 1.50
    spots  = np.linspace(S_low, S_high, steps)

    output: List[SurfacePoint] = []
    for S in spots:
        try:
            r_ = _compute(S, K, T, r, v, q)
            output.append(SurfacePoint(
                S=round(float(S), 4),
                call_price=r_["call_price"],
                put_price=r_["put_price"],
                call_delta=r_["call_greeks"]["delta"],
                put_delta=r_["put_greeks"]["delta"],
                gamma=r_["call_greeks"]["gamma"],
                call_theta=r_["call_greeks"]["theta"],
                put_theta=r_["put_greeks"]["theta"],
                vega=r_["call_greeks"]["vega"],
                call_rho=r_["call_greeks"]["rho"],
                put_rho=r_["put_greeks"]["rho"],
            ))
        except Exception:
            continue

    return output


@app.get("/healthz")
def health():
    return {"status": "ok"}
