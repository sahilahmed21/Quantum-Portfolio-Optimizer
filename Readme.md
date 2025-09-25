# Quantum Portfolio Optimizer

A full‑stack application that compares a classical global minimum variance (GMV) optimizer against a quantum‑inspired optimizer to produce portfolio allocations, metrics, and trade recommendations. The project includes a FastAPI backend for data ingestion and optimization and a modern Next.js (App Router) frontend with polished UI built using shadcn/ui and Aceternity UI components.


## Highlights
- **Quantum vs Classical**: Side‑by‑side portfolio metrics (return, risk, Sharpe) for classical GMV and quantum‑inspired methods.
- **Two Workflows**:
  - Optimize a portfolio from selected tickers and a chosen date range.
  - Optimize an existing portfolio and get recommended BUY/SELL/HOLD trades to reach target weights.
- **Robust Estimation**: Uses Ledoit–Wolf shrinkage covariance and exponentially weighted mean returns.
- **Market Data**: Fetches historical prices with `yfinance`.
- **Beautiful UI**: Next.js 15 + React 19, shadcn/ui, and Aceternity UI effects (sparkles, canvas reveal, hover cards) for a premium UX.


## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Aceternity UI components, Framer Motion, Chart.js via `react-chartjs-2`.
- **Backend**: FastAPI, NumPy, SciPy, pandas, scikit‑learn (Ledoit–Wolf), yfinance, Uvicorn.
- **Optional/Included in requirements**: TensorFlow, Cirq, TensorFlow Quantum (not required to run current endpoints but pinned in `requirements.txt`).
- **Packaging/Dev**: Node 20+, Python 3.10+, pip/venv, Dockerfile for backend.


## Repository Structure
```
Quantum Portfolio Optimizer/
  backend/
    app/
      __init__.py
      main.py            # FastAPI app with /optimize and /optimize-existing
      optimizer.py       # (aux logic if used)
    requirements.txt
    Dockerfile
  frontend/
    src/
      app/               # Next.js App Router pages and API routes
        api/
          optimize/route.ts           # Proxy to backend /optimize
          optimize-existing/route.ts  # Proxy to backend /optimize-existing
        page.tsx          # Landing page with Aceternity UI effects
        portfolio/page.tsx
        results/page.tsx
      components/         # UI components (shadcn/ui, charts, tables)
      lib/
    package.json
  reactfrontend/          # Legacy React SPA (optional)
  Readme.md               # This file
```


## Prerequisites
- **Node**: v20 LTS recommended (Next 15 + React 19).
- **Python**: 3.10 (recommended) or 3.11. Windows users: WSL2 Ubuntu is recommended for scientific stack stability.
- **Git** and **PowerShell**/Terminal.


## Quick Start
### 1) Run the backend (FastAPI)
From the project root:
```bash
cd backend
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
# WSL/macOS/Linux
# source venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

# Run API (auto‑reload for dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API will be available at `http://localhost:8000`.
- Interactive docs: `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`.

CORS configuration is in `backend/app/main.py`. Update `origins` if you serve the frontend from a non‑default URL.

### 2) Run the frontend (Next.js)
Open a new terminal at project root:
```bash
cd frontend
npm install
npm run dev
```
- App runs at `http://localhost:3000` by default.
- The Next.js API routes in `src/app/api/*/route.ts` forward requests to the backend. If your backend runs on a different host/port, adjust the base URL inside those routes accordingly.

### Optional: Legacy React SPA
There is a legacy SPA under `reactfrontend/`. The primary UI is the Next.js app in `frontend/`. To try the legacy app:
```bash
cd reactfrontend
npm install
npm start
```


## What the Project Does
- Accepts user tickers and date range; downloads and cleans historical close prices.
- Computes exponentially weighted mean returns and Ledoit–Wolf covariance (annualized).
- Produces two sets of weights:
  - Classical GMV (variance minimization under weight and sum constraints).
  - Quantum‑inspired random search with diversification penalty.
- Calculates portfolio metrics (expected return, risk, Sharpe) for both.
- For existing portfolios, computes target shares and BUY/SELL/HOLD recommendations to reach target allocation.


## Backend API
Base URL: `http://localhost:8000`

### POST /optimize
Optimizes from scratch using tickers and a date range.

Request body:
```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "risk_tolerance": 0.6
}
```

Response (abridged):
```json
{
  "tickers": ["AAPL", "GOOGL", "MSFT"],
  "classical_weights": [0.33, 0.33, 0.34],
  "classical_return": 0.12,
  "classical_risk": 0.18,
  "classical_sharpe": 0.67,
  "quantum_weights": [0.30, 0.35, 0.35],
  "quantum_return": 0.14,
  "quantum_risk": 0.19,
  "quantum_sharpe": 0.74,
  "improvement_percent": 10.4,
  "calculation_details": {
    "tickers": ["AAPL", "GOOGL", "MSFT"],
    "expected_returns": [ ... ],
    "covariance_matrix": [ ... ]
  }
}
```

### POST /optimize-existing
Optimizes an existing portfolio and returns trades.

Request body:
```json
{
  "assets": [
    { "ticker": "AAPL", "shares": 10 },
    { "ticker": "MSFT", "shares": 5 }
  ],
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "risk_tolerance": 0.6
}
```

Response (abridged):
```json
{
  "quantum_trades": [
    { "ticker": "AAPL", "current_shares": 10.0, "target_shares": 12.3, "action": "BUY", "amount": 2.3 }
  ],
  "classical_trades": [ ... ],
  "current_portfolio_metrics": { "return": 0.10, "risk": 0.20, "sharpe": 0.50 },
  "quantum_portfolio_metrics": { "return": 0.14, "risk": 0.19, "sharpe": 0.74 },
  "classical_portfolio_metrics": { "return": 0.12, "risk": 0.18, "sharpe": 0.67 },
  "calculation_details": { ... }
}
```

### GET /health
Simple health check: `{ "status": "healthy" }`.


## Frontend Overview (Next.js)
- Landing page (`frontend/src/app/page.tsx`) showcases features with Aceternity UI effects: sparkles, canvas reveal, and hover interactions.
- Portfolio input, results visualization, and tables under `frontend/src/app/portfolio` and `frontend/src/app/results`.
- Shared components live in `frontend/src/components` (forms, tables, charts, navbar, footer, etc.).
- shadcn/ui primitives available under `frontend/src/components/ui/*`.

Charts use Chart.js with `react-chartjs-2`. Animations use Framer Motion. State/data fetching may rely on built‑in Next.js route handlers under `src/app/api/*` which forward to the FastAPI backend.


## Configuration
- **CORS**: Update `origins` in `backend/app/main.py` for production domains.
- **Ports**: Backend 8000, Frontend 3000 (Next.js). Adjust as needed.
- **Backend URL in Next API routes**: If you change backend address, update the base URL inside `frontend/src/app/api/optimize/route.ts` and `frontend/src/app/api/optimize-existing/route.ts`.


## Running with Docker (Backend)
Build and run the backend container:
```bash
cd backend
# Build
docker build -t qpo-backend:latest .
# Run (maps 8000 -> 8000)
docker run --rm -p 8000:8000 qpo-backend:latest
```

You can then point the frontend to `http://localhost:8000`.


## Deployment Notes
- **Frontend (Next.js)**: Deploy easily to Vercel. Ensure API routes point to your public backend URL.
- **Backend (FastAPI)**: Deploy to your preferred platform (e.g., Fly.io, Render, Railway, Docker on a VPS). Use a production ASGI server (e.g., `uvicorn` behind `nginx`, or `gunicorn` with `uvicorn.workers.UvicornWorker`).
- **Environment**: Pin Python 3.10/3.11. Ensure system packages for scientific Python are present (BLAS/LAPACK).


## Troubleshooting
- **No data downloaded / Empty DataFrame**: Verify tickers and date range; yfinance requires market days. Ensure network is not blocking.
- **Need at least 30 days of valid market data**: Choose a longer date range.
- **CORS errors in browser**: Add your frontend origin to `origins` in `backend/app/main.py` and restart the backend.
- **Windows build issues for SciPy/NumPy**: Prefer WSL2 Ubuntu. Otherwise, ensure you use Python 3.10/3.11 and latest pip. Wheels are specified in `requirements.txt` to help.
- **Heavy optional dependencies**: `tensorflow`, `cirq`, and `tensorflow-quantum` are pinned but not required for current endpoints. If environment constraints apply, consider creating a lightweight environment and install only the necessary subset:
  ```bash
  pip install numpy==1.26.4 scipy==1.12.0 pandas==2.2.2 scikit-learn==1.4.2 fastapi==0.104.1 uvicorn==0.23.2 yfinance==0.2.65
  ```
  Note: Keep `requirements.txt` authoritative for production; the above is a dev convenience.


<!-- ## Acknowledgements
- **shadcn/ui** for accessible, composable UI primitives.
- **Aceternity UI** for delightful motion/visual components (sparkles, canvas reveal, hover effects).
- **FastAPI** for a great developer experience and auto‑docs.
- **yfinance** for easy market data access.
 -->

## License
This project is provided as‑is for educational and research purposes. Add your preferred license here (e.g., MIT) if you plan to distribute.
