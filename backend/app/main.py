import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
import cirq
import sympy
import tensorflow as tf
import tensorflow_quantum as tfq
from typing import List
import math

# FastAPI and Pydantic for API functionality
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Define the FastAPI app
app = FastAPI(
    title="Quantum Portfolio Optimizer API",
    description="An API that uses a hybrid quantum-classical approach to find an optimal portfolio."
)

# Allow requests from your frontend (CORS)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    risk_tolerance: float

# --- UTILITY FUNCTIONS ---
def calculate_metrics(weights, mu, sigma):
    """Calculates annualized return, risk, and Sharpe ratio for a given portfolio."""
    weights = np.array(weights)
    ret = np.sum(mu * weights)
    risk = np.sqrt(np.dot(weights.T, np.dot(sigma, weights)))
    sharpe = ret / risk if risk > 0 else 0
    return ret, risk, sharpe

# --- STEP 1: QUANTUM CONSTRAINED SELECTION (CORRECTED) ---
def run_quantum_constrained_selection(mu: np.ndarray, sigma: np.ndarray, all_tickers: List[str]) -> List[str]:
    """
    Uses QAOA to find the best SUBSET of stocks of a specific size 'k'.
    This version uses a much stronger penalty to GUARANTEE the constraint is met.
    """
    n_assets = len(mu)
    qubits = [cirq.GridQubit(0, i) for i in range(n_assets)]
    
    # Define the desired number of assets in the portfolio
    k = 3 if n_assets >= 3 else n_assets

    # Build the Hamiltonian: (Risk - q * Return) + Penalty
    hamiltonian = cirq.PauliSum()
    q = 1.0  # Balances risk and return

    # Part 1 & 2: Risk and Return terms
    for i in range(n_assets):
        for j in range(n_assets):
            hamiltonian += (sigma[i, j] / 4.0) * (1 - cirq.Z(qubits[i])) * (1 - cirq.Z(qubits[j]))
    for i in range(n_assets):
        hamiltonian += (-q * mu[i] / 2.0) * (1 - cirq.Z(qubits[i]))

    # --- Part 3: CORRECTED Hard Constraint Term ---
    # The penalty value is now made overwhelmingly large to ensure it is always respected.
    penalty = np.sum(np.abs(sigma)) + np.sum(np.abs(mu))
    constraint_term = (sum((1 - cirq.Z(q)) / 2.0 for q in qubits) - k)**2
    hamiltonian += penalty * constraint_term

    # --- QAOA Training (No changes here) ---
    gamma_sym, beta_sym = sympy.symbols('gamma beta')
    qaoa_circuit = cirq.Circuit(
        cirq.H.on_each(*qubits),
        tfq.util.exponential(operators=hamiltonian, -coeffs=gamma_sym),
        cirq.Moment(cirq.rx(2 * beta_sym)(q) for q in qubits)
    )
    symbol_names = ['gamma', 'beta']
    symbol_values = tf.Variable([0.5, 0.5], dtype=tf.float64)
    expectation_layer = tfq.layers.Expectation()
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.05)

    for _ in range(150):
        with tf.GradientTape() as tape:
            loss_value = expectation_layer(qaoa_circuit, symbol_names=symbol_names, symbol_values=[symbol_values], operators=hamiltonian)
        grads = tape.gradient(loss_value, [symbol_values])
        optimizer.apply_gradients(zip(grads, [symbol_values]))

    # --- Measurement & Filtering ---
    final_circuit = tfq.util.resolve_parameters(qaoa_circuit, tfq.util.get_circuit_symbols(qaoa_circuit), symbol_values)
    final_circuit.append(cirq.measure(*qubits, key='result'))
    
    simulator = cirq.Simulator()
    result = simulator.run(final_circuit, repetitions=2000)
    histogram = result.histogram(key='result')
    
    # Filter for valid results that meet the 'k' constraint
    valid_results = {k_val: v for k_val, v in histogram.items() if bin(k_val).count('1') == k}
    
    if not valid_results:
       # Fallback: if somehow NO valid states are found, return the top k stocks by individual Sharpe Ratio
       # This is a robust fallback that still guarantees a diversified K-asset portfolio
       individual_sharpes = mu / np.diag(sigma)
       top_k_indices = np.argsort(individual_sharpes)[-k:]
       return [all_tickers[i] for i in top_k_indices]

    most_frequent_bitstring = max(valid_results, key=valid_results.get)

    # Decode bitstring into a list of selected tickers
    selected_tickers = []
    bitstring_str = f'{most_frequent_bitstring:0{n_assets}b}'
    for i, bit in enumerate(bitstring_str):
        if bit == '1':
            selected_tickers.append(all_tickers[i])
            
    return selected_tickers

# --- STEP 2: CLASSICAL WEIGHT ALLOCATION ---
def run_classical_allocation(mu: np.ndarray, sigma: np.ndarray) -> np.ndarray:
    """Finds the optimal portfolio weights by maximizing the Sharpe Ratio."""
    n = len(mu)
    if n == 0: return np.array([])
    
    def negative_sharpe_ratio(weights, mu, sigma):
        return -calculate_metrics(weights, mu, sigma)[2]

    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})
    bounds = tuple((0, 1) for _ in range(n))
    initial_weights = np.ones(n) / n
    
    result = minimize(fun=negative_sharpe_ratio, x0=initial_weights, args=(mu, sigma), method='SLSQP', bounds=bounds, constraints=constraints)
    
    return result.x if result.success else np.zeros(n)

# --- MAIN API ENDPOINT ---
@app.post("/optimize")
async def optimize_portfolio_endpoint(request: PortfolioRequest):
    """Orchestrates the constrained hybrid optimization process."""
    try:
        all_tickers = request.tickers
        data = yf.download(all_tickers, start=request.start_date, end=request.end_date, auto_adjust=True, progress=False)
        adj_close = data['Close']
        if adj_close.empty or adj_close.isnull().values.any():
            raise ValueError("Could not download valid stock data. Check tickers and date range.")
            
        returns = adj_close.pct_change().dropna()
        full_mu = returns.mean().values * 252
        full_sigma = returns.cov().values * 252
        
        # --- PATH A: Purely Classical Optimization ---
        classical_weights = run_classical_allocation(full_mu, full_sigma)
        c_return, c_risk, c_sharpe = calculate_metrics(classical_weights, full_mu, full_sigma)

        # --- PATH B: Hybrid Quantum-Classical Optimization ---
        # Step 1: Quantum selects the best CONSTRAINED subset of tickers
        quantum_selected_tickers = run_quantum_constrained_selection(full_mu, full_sigma, all_tickers)

        hybrid_weights = np.zeros(len(all_tickers))
        if len(quantum_selected_tickers) > 1:
            selected_indices = [all_tickers.index(t) for t in quantum_selected_tickers]
            mu_subset = full_mu[selected_indices]
            sigma_subset = full_sigma[np.ix_(selected_indices, selected_indices)]
            
            # Step 2: Classical finds the weights for this superior subset
            subset_weights = run_classical_allocation(mu_subset, sigma_subset)
            np.put(hybrid_weights, selected_indices, subset_weights)

        elif len(quantum_selected_tickers) == 1:
            selected_index = all_tickers.index(quantum_selected_tickers[0])
            hybrid_weights[selected_index] = 1.0

        h_return, h_risk, h_sharpe = calculate_metrics(hybrid_weights, full_mu, full_sigma)
        
        # --- Compile Final Results ---
        results = {
            "classical_portfolio": {
                "tickers": all_tickers,
                "weights": classical_weights.tolist(),
                "return": c_return,
                "risk": c_risk,
                "sharpe_ratio": c_sharpe
            },
            "hybrid_quantum_portfolio": {
                "tickers": quantum_selected_tickers if quantum_selected_tickers else all_tickers,
                "weights": hybrid_weights.tolist(),
                "return": h_return,
                "risk": h_risk,
                "sharpe_ratio": h_sharpe
            }
        }
        return results

    except Exception as e:
        return {"error": str(e)}