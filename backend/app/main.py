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

warnings.filterwarnings('ignore')

app = FastAPI(title="Quantum Portfolio Optimizer Engine")

origins = ["http://localhost:3000", "https://your-production-frontend-url.com"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- DATA MODELS ---

# For creating a new portfolio
class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    risk_tolerance: float

# For optimizing an existing portfolio
class PortfolioAsset(BaseModel):
    ticker: str
    shares: float

class ExistingPortfolioRequest(BaseModel):
    assets: List[PortfolioAsset]
    start_date: str
    end_date: str
    risk_tolerance: float

# --- CORE OPTIMIZATION LOGIC ---

def get_market_data(tickers, start, end):
    """Downloads historical and latest market data."""
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
            
        mu = returns.mean().values * 252
        sigma = returns.cov().values * 252
        
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

def classical_optimization(mu, sigma, risk_tolerance):
    """Classical portfolio optimization using SciPy."""
    n = len(mu)
    
    def objective(weights):
        ret, risk, _ = calculate_metrics(weights, mu, sigma)
        # Objective: Maximize return and minimize risk based on tolerance
        return - (ret * risk_tolerance - risk * (1 - risk_tolerance))

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = tuple((0.0, 1.0) for _ in range(n))
    initial_weights = np.ones(n) / n
    
    result = minimize(objective, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    
    return result.x if result.success else initial_weights

def quantum_inspired_optimization(mu, sigma, risk_tolerance):
    """Quantum-inspired heuristic optimization."""
    n = len(mu)
    best_weights = None
    best_score = -float('inf')

    # Generate 100 candidate portfolios ("quantum states")
    for _ in range(100):
        # Create random weights and normalize them
        weights = np.random.random(n)
        weights /= np.sum(weights)
        
        ret, risk, sharpe = calculate_metrics(weights, mu, sigma)
        
        # Scoring function balances sharpe ratio and risk tolerance
        score = sharpe * risk_tolerance - risk * (1 - risk_tolerance)
        
        if score > best_score:
            best_score = score
            best_weights = weights
            
    return best_weights if best_weights is not None else np.ones(n) / n

# --- API ENDPOINTS ---

@app.post("/optimize")
async def optimize_portfolio(request: PortfolioRequest):
    """Endpoint for creating a new optimized portfolio from a list of tickers."""
    mu, sigma, ordered_tickers, _ = get_market_data(request.tickers, request.start_date, request.end_date)
    
    # Run optimizations
    classical_weights = classical_optimization(mu, sigma, request.risk_tolerance)
    quantum_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    # Calculate metrics for both portfolios
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
    
    # Ensure current shares map is correctly ordered
    current_shares = np.array([current_shares_map[ticker] for ticker in ordered_tickers])
    
    # Calculate current portfolio's total value and weights
    current_values = current_shares * latest_prices.values
    total_portfolio_value = np.sum(current_values)
    current_weights = current_values / total_portfolio_value
    
    # Calculate metrics for the user's CURRENT portfolio
    current_ret, current_risk, current_sharpe = calculate_metrics(current_weights, mu, sigma)

    # Run optimizations to get TARGET weights
    classical_target_weights = classical_optimization(mu, sigma, request.risk_tolerance)
    quantum_target_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    # Calculate metrics for the TARGET portfolios
    c_ret, c_risk, c_sharpe = calculate_metrics(classical_target_weights, mu, sigma)
    q_ret, q_risk, q_sharpe = calculate_metrics(quantum_target_weights, mu, sigma)
    
    # --- Calculate Trades ---
    def calculate_trades(target_weights):
        trades = []
        target_values = target_weights * total_portfolio_value
        target_shares = target_values / latest_prices.values
        trade_amounts = target_shares - current_shares
        
        for i, ticker in enumerate(ordered_tickers):
            amount = trade_amounts[i]
            action = "HOLD"
            if amount > 0.01: # Threshold to avoid tiny trades
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