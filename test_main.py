import math
import unittest

from pydantic import ValidationError

from main import BSInput, _compute, surface


class BlackScholesBackendTests(unittest.TestCase):
    def test_put_call_parity(self):
        params = dict(S=100.0, K=100.0, T=1.0, r=0.05, v=0.2, q=0.01)
        result = _compute(**params)

        call_price = float(result["call_price"])
        put_price = float(result["put_price"])

        lhs = call_price - put_price
        rhs = params["S"] * math.exp(-params["q"] * params["T"]) - params["K"] * math.exp(
            -params["r"] * params["T"]
        )

        self.assertAlmostEqual(lhs, rhs, places=5)

    def test_greeks_sanity(self):
        params = dict(S=120.0, K=100.0, T=0.75, r=0.02, v=0.35, q=0.0)
        result = _compute(**params)

        disc_q = math.exp(-params["q"] * params["T"])
        call = result["call_greeks"]
        put = result["put_greeks"]

        self.assertGreater(float(call["gamma"]), 0.0)
        self.assertAlmostEqual(float(call["gamma"]), float(put["gamma"]), places=6)

        self.assertGreater(float(call["vega"]), 0.0)
        self.assertAlmostEqual(float(call["vega"]), float(put["vega"]), places=6)

        self.assertGreaterEqual(float(call["delta"]), 0.0)
        self.assertLessEqual(float(call["delta"]), disc_q)
        self.assertGreaterEqual(float(put["delta"]), -disc_q)
        self.assertLessEqual(float(put["delta"]), 0.0)

        self.assertGreater(float(call["rho"]), 0.0)
        self.assertLess(float(put["rho"]), 0.0)

    def test_volatility_cap_validator(self):
        with self.assertRaises(ValidationError):
            BSInput(S=100, K=100, T=1.0, r=0.01, v=11.0, q=0.0)

    def test_surface_returns_requested_steps(self):
        points = surface(K=100.0, T=1.0, r=0.05, v=0.2, q=0.0, steps=100)
        self.assertEqual(len(points), 100)

        self.assertLess(points[0].S, points[-1].S)
        self.assertLess(points[0].call_price, points[-1].call_price)


if __name__ == "__main__":
    unittest.main()
