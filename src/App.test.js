import React, { act } from "react";

jest.mock("d3", () => ({
  format: () => (value) => String(value),
}));

import { createRoot } from "react-dom/client";
import App from "./App";

function jsonResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

test("renders and fetches initial data", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const fetchMock = jest.fn((url) => {
    const u = String(url);
    if (u.includes("/api/calculate")) {
      return jsonResponse({
        call_price: 10.0,
        put_price: 9.5,
        d1: 0.1,
        d2: -0.1,
        call_greeks: { delta: 0.5, gamma: 0.01, theta: -0.02, vega: 0.03, rho: 0.04 },
        put_greeks: { delta: -0.5, gamma: 0.01, theta: -0.02, vega: 0.03, rho: -0.04 },
      });
    }
    if (u.includes("/api/surface")) {
      return jsonResponse([]);
    }
    return Promise.reject(new Error(`Unexpected fetch URL: ${u}`));
  });

  global.fetch = fetchMock;

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<App />);
  });
  await act(async () => {
    await Promise.resolve();
  });

  expect(container.textContent).toContain("Black");
  expect(container.textContent).toContain("Analytics");
  expect(fetchMock).toHaveBeenCalled();

  act(() => {
    root.unmount();
  });
  container.remove();
});
