# backend/app/main.py

import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
from typing import List, Dict
import warnings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sklearn.covariance import LedoitWolf

warnings.filterwarnings('ignore')

app = FastAPI(title="Quantum Portfolio Optimizer Engine")

origins = ["http://localhost:3000", "https://your-production-frontend-url.com"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- DATA MODELS ---
class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    risk_tolerance: float

class PortfolioAsset(BaseModel):
    ticker: str
    shares: float

class ExistingPortfolioRequest(BaseModel):
    assets: List[PortfolioAsset]
    start_date: str
    end_date: str
    risk_tolerance: float

# --- CORE OPTIMIZATION LOGIC ---

# --- NEW: Define a hard constraint for diversification ---
MAX_WEIGHT_PER_ASSET = 0.35 # No single stock can be more than 35% of the portfolio

def get_market_data(tickers, start, end):
    """Downloads historical and latest market data using robust estimators."""
    try:
        data = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)
        if data.empty:
            raise ValueError("No data downloaded. Check tickers and date range.")
        
        adj_close = data['Close'].dropna()
        if len(tickers) == 1:
            adj_close = pd.DataFrame({tickers[0]: adj_close})
            
        latest_prices = adj_close.iloc[-1]
        returns = adj_close.pct_change().dropna()
        
        if len(returns) < 30:
            raise ValueError("Need at least 30 days of valid market data for analysis.")

        mu_ewma = returns.ewm(span=180).mean().iloc[-1]
        mu = mu_ewma.values * 252

        lw = LedoitWolf()
        lw.fit(returns)
        sigma = lw.covariance_ * 252
            
        return mu, sigma, returns.columns.tolist(), latest_prices
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Market data error: {str(e)}")

def calculate_metrics(weights, mu, sigma):
    """Calculate portfolio metrics: return, risk, sharpe ratio."""
    weights = np.array(weights)
    ret = np.sum(mu * weights)
    risk = np.sqrt(np.dot(weights.T, np.dot(sigma, weights)))
    sharpe = ret / risk if risk > 0 else 0
    return ret, risk, sharpe

def classical_gmv_optimization(mu, sigma):
    """
    MODIFIED: This function now solves for the Global Minimum Variance (GMV) portfolio.
    It IGNORES expected returns ('mu') and focuses solely on minimizing risk.
    This is a more robust strategy than relying on noisy return forecasts.
    """
    n = len(mu)
    
    def portfolio_variance(weights, sigma):
        return calculate_metrics(weights, np.zeros(n), sigma)[1]**2 # Use zero returns to isolate variance

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    # --- NEW: Add the diversification constraint to the bounds ---
    bounds = tuple((0.0, MAX_WEIGHT_PER_ASSET) for _ in range(n))
    initial_weights = np.ones(n) / n
    
    result = minimize(portfolio_variance, initial_weights, args=(sigma,), method='SLSQP', bounds=bounds, constraints=constraints)
    
    return result.x if result.success else initial_weights

def quantum_inspired_optimization(mu, sigma, risk_tolerance):
    """
    MODIFIED: This heuristic still uses the user's risk tolerance but now operates
    with a penalty system to enforce the diversification constraint.
    """
    n = len(mu)
    best_weights = None
    best_score = -float('inf')

    for _ in range(2000): # Increased iterations for better search
        weights = np.random.random(n)
        weights /= np.sum(weights)
        
        # --- NEW: Penalize solutions that violate the diversification constraint ---
        # If any weight is over the max, apply a heavy penalty to the score.
        if np.any(weights > MAX_WEIGHT_PER_ASSET):
            penalty = 1e9 # A large number to ensure this solution is not chosen
        else:
            penalty = 0

        ret, risk, _ = calculate_metrics(weights, mu, sigma)
        
        score = (ret * risk_tolerance - risk * (1 - risk_tolerance)) - penalty
        
        if score > best_score:
            best_score = score
            best_weights = weights
            
    return best_weights if best_weights is not None else np.ones(n) / n

# --- API ENDPOINTS ---

@app.post("/optimize")
async def optimize_portfolio(request: PortfolioRequest):
    """Endpoint for creating a new optimized portfolio from a list of tickers."""
    mu, sigma, ordered_tickers, _ = get_market_data(request.tickers, request.start_date, request.end_date)
    
    # --- UPDATED: Call the new GMV classical optimizer ---
    classical_weights = classical_gmv_optimization(mu, sigma)
    quantum_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    c_ret, c_risk, c_sharpe = calculate_metrics(classical_weights, mu, sigma)
    q_ret, q_risk, q_sharpe = calculate_metrics(quantum_weights, mu, sigma)
    
    improvement = ((q_sharpe - c_sharpe) / abs(c_sharpe) * 100) if c_sharpe != 0 else 0
    
    return {
        "tickers": ordered_tickers,
        "classical_weights": classical_weights.tolist(),
        "classical_return": c_ret, "classical_risk": c_risk, "classical_sharpe": c_sharpe,
        "quantum_weights": quantum_weights.tolist(),
        "quantum_return": q_ret, "quantum_risk": q_risk, "quantum_sharpe": q_sharpe,
        "improvement_percent": improvement
    }

@app.post("/optimize-existing")
async def optimize_existing_portfolio(request: ExistingPortfolioRequest):
    """Endpoint for optimizing a user's existing portfolio and recommending trades."""
    tickers = [asset.ticker for asset in request.assets]
    current_shares_map = {asset.ticker: asset.shares for asset in request.assets}
    
    mu, sigma, ordered_tickers, latest_prices = get_market_data(tickers, request.start_date, request.end_date)
    
    current_shares = np.array([current_shares_map.get(ticker, 0) for ticker in ordered_tickers])
    
    current_values = current_shares * latest_prices.reindex(ordered_tickers).values
    total_portfolio_value = np.sum(current_values)
    current_weights = current_values / total_portfolio_value if total_portfolio_value > 0 else np.zeros_like(current_shares)
    
    current_ret, current_risk, current_sharpe = calculate_metrics(current_weights, mu, sigma)

    # --- UPDATED: Call the new GMV classical optimizer ---
    classical_target_weights = classical_gmv_optimization(mu, sigma)
    quantum_target_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    c_ret, c_risk, c_sharpe = calculate_metrics(classical_target_weights, mu, sigma)
    q_ret, q_risk, q_sharpe = calculate_metrics(quantum_target_weights, mu, sigma)
    
    def calculate_trades(target_weights):
        trades = []
        if total_portfolio_value == 0: return trades
        
        target_values = target_weights * total_portfolio_value
        target_shares = target_values / latest_prices.reindex(ordered_tickers).values
        trade_amounts = target_shares - current_shares
        
        for i, ticker in enumerate(ordered_tickers):
            amount = trade_amounts[i]
            action = "HOLD"
            if amount > 0.01:
                action = "BUY"
            elif amount < -0.01:
                action = "SELL"

            trades.append({
                "ticker": ticker,
                "current_shares": float(current_shares[i]),
                "target_shares": float(target_shares[i]),
                "action": action,
                "amount": abs(float(amount))
            })
        return trades

    quantum_trades = calculate_trades(quantum_target_weights)
    classical_trades = calculate_trades(classical_target_weights)

    return {
        "quantum_trades": quantum_trades,
        "classical_trades": classical_trades,
        "current_portfolio_metrics": { "return": current_ret, "risk": current_risk, "sharpe": current_sharpe },
        "quantum_portfolio_metrics": { "return": q_ret, "risk": q_risk, "sharpe": q_sharpe },
        "classical_portfolio_metrics": { "return": c_ret, "risk": c_risk, "sharpe": c_sharpe }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
    # PS C:\personal stuff\WEB D\projects\Quantum Portfolio Optimizer\backend> wsl
    # root@LAPTOP-3JCHER86:/mnt/c/personal stuff/WEB D/projects/Quantum Portfolio Optimizer/backend# source venv/bin/activate
    # (venv) root@LAPTOP-3JCHER86:/mnt/c/personal stuff/WEB D/projects/Quantum Portfolio Optimizer/backend# uvicorn app.main:app --reload