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

# Ensure your frontend URL is in this list for production
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

MAX_WEIGHT_PER_ASSET = 0.35 # Diversification constraint

def get_market_data(tickers, start, end):
    """Downloads historical and latest market data using robust estimators."""
    try:
        data = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)
        if data.empty:
            raise ValueError("No data downloaded. Check tickers and date range.")
        
        adj_close = data['Close'].dropna(how='all').ffill()
        if adj_close.isnull().values.any():
             raise ValueError("Data contains missing values after forward fill. Try a different date range or tickers.")

        if len(tickers) == 1:
            adj_close = pd.DataFrame({tickers[0]: adj_close})
            
        latest_prices = adj_close.iloc[-1]
        returns = adj_close.pct_change().dropna()
        
        if len(returns) < 30:
            raise ValueError("Need at least 30 days of valid market data for analysis.")

        mu_hist = returns.ewm(span=180).mean().iloc[-1] * 252
        mu_common = np.mean(mu_hist)
        delta = 0.5 
        mu = (1 - delta) * mu_hist + delta * mu_common

        lw = LedoitWolf()
        lw.fit(returns)
        sigma = lw.covariance_ * 252
            
        return mu.values, sigma, returns.columns.tolist(), latest_prices
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
    n = len(mu)
    def portfolio_variance(weights, sigma):
        return calculate_metrics(weights, np.zeros(n), sigma)[1]**2 
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = tuple((0.0, MAX_WEIGHT_PER_ASSET) for _ in range(n))
    initial_weights = np.ones(n) / n
    result = minimize(portfolio_variance, initial_weights, args=(sigma,), method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x if result.success else initial_weights

def quantum_inspired_optimization(mu, sigma, risk_tolerance):
    n = len(mu)
    best_weights = None
    best_score = -float('inf')
    for _ in range(2000): 
        weights = np.random.random(n)
        weights /= np.sum(weights)
        if np.any(weights > MAX_WEIGHT_PER_ASSET):
            penalty = 1e9
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
    mu, sigma, ordered_tickers, _ = get_market_data(request.tickers, request.start_date, request.end_date)
    
    classical_weights = classical_gmv_optimization(mu, sigma)
    quantum_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    c_ret, c_risk, c_sharpe = calculate_metrics(classical_weights, mu, sigma)
    q_ret, q_risk, q_sharpe = calculate_metrics(quantum_weights, mu, sigma)
    
    improvement = ((q_sharpe - c_sharpe) / abs(c_sharpe) * 100) if c_sharpe != 0 else 0
    
    calculation_details = {
        "tickers": ordered_tickers,
        "expected_returns": mu.tolist(),
        "covariance_matrix": sigma.tolist()
    }
    
    return {
        "tickers": ordered_tickers,
        "classical_weights": classical_weights.tolist(),
        "classical_return": c_ret, "classical_risk": c_risk, "classical_sharpe": c_sharpe,
        "quantum_weights": quantum_weights.tolist(),
        "quantum_return": q_ret, "quantum_risk": q_risk, "quantum_sharpe": q_sharpe,
        "improvement_percent": improvement,
        "calculation_details": calculation_details
    }

@app.post("/optimize-existing")
async def optimize_existing_portfolio(request: ExistingPortfolioRequest):
    tickers = [asset.ticker for asset in request.assets]
    current_shares_map = {asset.ticker: asset.shares for asset in request.assets}
    
    mu, sigma, ordered_tickers, latest_prices = get_market_data(tickers, request.start_date, request.end_date)
    
    current_shares = np.array([current_shares_map.get(ticker, 0) for ticker in ordered_tickers])
    
    # Ensure latest_prices is a pandas Series for proper alignment
    if not isinstance(latest_prices, pd.Series):
        latest_prices = pd.Series(latest_prices, index=ordered_tickers)

    current_values = current_shares * latest_prices.reindex(ordered_tickers).values
    total_portfolio_value = np.sum(current_values)
    
    if total_portfolio_value == 0:
        raise HTTPException(status_code=400, detail="Total portfolio value cannot be zero.")

    current_weights = current_values / total_portfolio_value
    
    current_ret, current_risk, current_sharpe = calculate_metrics(current_weights, mu, sigma)

    classical_target_weights = classical_gmv_optimization(mu, sigma)
    quantum_target_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
    
    c_ret, c_risk, c_sharpe = calculate_metrics(classical_target_weights, mu, sigma)
    q_ret, q_risk, q_sharpe = calculate_metrics(quantum_target_weights, mu, sigma)
    
    def calculate_trades(target_weights):
        trades = []
        target_values = target_weights * total_portfolio_value
        target_shares = target_values / latest_prices.reindex(ordered_tickers).values
        trade_amounts = target_shares - current_shares
        
        for i, ticker in enumerate(ordered_tickers):
            amount = trade_amounts[i]
            action = "HOLD"
            if amount > 0.01: action = "BUY"
            elif amount < -0.01: action = "SELL"
            trades.append({
                "ticker": ticker, "current_shares": float(current_shares[i]),
                "target_shares": float(target_shares[i]), "action": action,
                "amount": abs(float(amount))
            })
        return trades

    quantum_trades = calculate_trades(quantum_target_weights)
    classical_trades = calculate_trades(classical_target_weights)
    
    # --- NEW: ADD CALCULATION DETAILS TO RESPONSE ---
    calculation_details = {
        "tickers": ordered_tickers,
        "expected_returns": mu.tolist(),
        "covariance_matrix": sigma.tolist()
    }

    return {
        "quantum_trades": quantum_trades,
        "classical_trades": classical_trades,
        "current_portfolio_metrics": { "return": current_ret, "risk": current_risk, "sharpe": current_sharpe },
        "quantum_portfolio_metrics": { "return": q_ret, "risk": q_risk, "sharpe": q_sharpe },
        "classical_portfolio_metrics": { "return": c_ret, "risk": c_risk, "sharpe": c_sharpe },
        "calculation_details": calculation_details # Embed the new data object
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