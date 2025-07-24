import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
from typing import List
import warnings
warnings.filterwarnings('ignore')

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simple Quantum Portfolio Optimizer")

origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    risk_tolerance: float
    investment_amount: float = 100000.0

def calculate_metrics(weights, mu, sigma):
    """Calculate portfolio metrics"""
    weights = np.array(weights)
    ret = np.sum(mu * weights)
    risk = np.sqrt(np.dot(weights.T, np.dot(sigma, weights)))
    sharpe = ret / risk if risk > 0 else 0
    return ret, risk, sharpe

def classical_optimization(mu, sigma, risk_tolerance):
    """Enhanced classical optimization with diversification"""
    n = len(mu)
    
    def objective(weights):
        ret, risk, sharpe = calculate_metrics(weights, mu, sigma)
        # Risk-adjusted return with diversification bonus
        diversification_bonus = -np.sum(weights**2) * 0.1  # Encourage diversification
        risk_penalty = (1 - risk_tolerance) * risk
        return -(ret - risk_penalty + diversification_bonus)
    
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = tuple((0.05, 0.4) for _ in range(n))  # 5% to 40% per asset
    
    best_weights = None
    best_sharpe = -float('inf')
    
    # Multiple random starts
    for _ in range(20):
        initial = np.random.dirichlet(np.ones(n))
        try:
            result = minimize(objective, initial, method='SLSQP', bounds=bounds, constraints=constraints)
            if result.success:
                _, _, sharpe = calculate_metrics(result.x, mu, sigma)
                if sharpe > best_sharpe:
                    best_sharpe = sharpe
                    best_weights = result.x
        except:
            continue
    
    return best_weights if best_weights is not None else np.ones(n) / n

def quantum_inspired_optimization(mu, sigma, risk_tolerance):
    """Quantum-inspired optimization that ensures diversification"""
    n = len(mu)
    
    # Quantum-inspired approach: Use multiple "quantum states" (random starting points)
    # with bias towards higher-return assets
    quantum_states = []
    
    # Create biased probability distributions based on expected returns
    normalized_returns = (mu - np.min(mu)) / (np.max(mu) - np.min(mu) + 1e-8)
    
    for trial in range(50):  # 50 "quantum measurements"
        # Quantum-inspired: bias towards higher returns with some randomness
        bias_strength = risk_tolerance  # Higher risk tolerance = more bias towards returns
        
        # Create quantum-inspired weights
        if trial < 25:
            # "Quantum superposition": blend uniform and return-biased distributions
            uniform_part = np.ones(n) / n
            return_biased_part = normalized_returns / np.sum(normalized_returns)
            quantum_weights = (1 - bias_strength) * uniform_part + bias_strength * return_biased_part
            
            # Add quantum "noise"
            noise = np.random.normal(0, 0.1, n)
            quantum_weights += noise
            quantum_weights = np.abs(quantum_weights)  # Ensure positive
            
        else:
            # Pure random "quantum measurements"
            quantum_weights = np.random.exponential(1 + normalized_returns, n)
        
        # Normalize and apply constraints
        quantum_weights = np.clip(quantum_weights, 0.02, 0.45)  # 2% to 45%
        quantum_weights = quantum_weights / np.sum(quantum_weights)
        
        quantum_states.append(quantum_weights)
    
    # Evaluate all quantum states and find the best one
    best_weights = None
    best_score = -float('inf')
    
    for weights in quantum_states:
        ret, risk, sharpe = calculate_metrics(weights, mu, sigma)
        
        # Comprehensive scoring function
        diversification_score = 1 - np.sum(weights**2)  # Higher is more diversified
        risk_adjusted_return = ret - (1 - risk_tolerance) * risk
        
        # Combined score
        score = sharpe + diversification_score * 0.5 + risk_adjusted_return * 0.3
        
        if score > best_score:
            best_score = score
            best_weights = weights
    
    return best_weights if best_weights is not None else np.ones(n) / n

@app.post("/optimize")
async def optimize_portfolio(request: PortfolioRequest):
    try:
        print(f"Optimizing portfolio for: {request.tickers}")
        
        # Download data
        tickers = [t.upper().strip() for t in request.tickers]
        data = yf.download(tickers, start=request.start_date, end=request.end_date, auto_adjust=True, progress=False)
        
        if len(tickers) == 1:
            adj_close = pd.DataFrame({tickers[0]: data['Close']})
        else:
            adj_close = data['Close'] if 'Close' in data.columns else data
        
        # Clean data
        adj_close = adj_close.dropna()
        if adj_close.empty:
            raise ValueError("No valid data found")
        
        returns = adj_close.pct_change().dropna()
        if len(returns) < 30:
            raise ValueError("Need at least 30 days of data")
        
        # Calculate metrics
        mu = returns.mean().values * 252  # Annualized returns
        sigma = returns.cov().values * 252  # Annualized covariance
        
        print(f"Expected returns: {mu}")
        print(f"Data shape: {returns.shape}")
        
        # Run optimizations
        classical_weights = classical_optimization(mu, sigma, request.risk_tolerance)
        quantum_weights = quantum_inspired_optimization(mu, sigma, request.risk_tolerance)
        
        print(f"Classical weights: {classical_weights}")
        print(f"Quantum weights: {quantum_weights}")
        
        # Calculate metrics
        c_ret, c_risk, c_sharpe = calculate_metrics(classical_weights, mu, sigma)
        q_ret, q_risk, q_sharpe = calculate_metrics(quantum_weights, mu, sigma)
        
        # Calculate improvement
        improvement = ((q_sharpe - c_sharpe) / abs(c_sharpe) * 100) if c_sharpe != 0 else 0
        
        print(f"Classical Sharpe: {c_sharpe}, Quantum Sharpe: {q_sharpe}")
        print(f"Improvement: {improvement}%")
        
        # Return in the format your frontend expects
        return {
            "tickers": tickers,
            "classical_weights": classical_weights.tolist(),
            "classical_return": float(c_ret),
            "classical_risk": float(c_risk),
            "classical_sharpe": float(c_sharpe),
            "quantum_weights": quantum_weights.tolist(),
            "quantum_return": float(q_ret),
            "quantum_risk": float(q_risk),
            "quantum_sharpe": float(q_sharpe),
            "improvement_percent": float(improvement)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)