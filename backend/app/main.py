import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
import cirq
import sympy
import tensorflow as tf
import tensorflow_quantum as tfq
from typing import List

# NEW: FastAPI and Pydantic for API functionality
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# NEW: Define the FastAPI app
app = FastAPI()

# NEW: Allow requests from your frontend (CORS)
# This is crucial for connecting a frontend and backend on different domains.
origins = [
    "http://localhost:3000", # Your local frontend development server
    # Add your Vercel deployment URL here once you have it
    # "https://your-app.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: Define the structure of the incoming request data
class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    target_return: float

# --- Quantum Optimization Logic (largely unchanged) ---
def run_quantum_optimization(mu_quantum, sigma_quantum, num_assets_quantum=2):
    qubits = [cirq.GridQubit(0, i) for i in range(num_assets_quantum)]
    cost_hamiltonian = cirq.PauliSum()

    for i in range(num_assets_quantum):
        for j in range(num_assets_quantum):
            coeff = sigma_quantum[i, j] / 4.0
            cost_hamiltonian += coeff * (1 - cirq.Z(qubits[i])) * (1 - cirq.Z(qubits[j]))

    penalty = 10.0
    constraint_hamiltonian = (sum((1 - cirq.Z(q)) / 2.0 for q in qubits) - 1)**2
    cost_hamiltonian += penalty * constraint_hamiltonian

    def create_qaoa_circuit(gamma, beta):
        circuit = cirq.Circuit()
        circuit.append(cirq.H.on_each(*qubits))
        for term in cost_hamiltonian:
            qubits_in_term = list(term.qubits)
            coeff = term.coefficient.real
            if len(qubits_in_term) == 2:
                q1, q2 = qubits_in_term[0], qubits_in_term[1]
                circuit.append(cirq.ZZ(q1, q2)**(2 * coeff * gamma / np.pi))
            elif len(qubits_in_term) == 1:
                q1 = qubits_in_term[0]
                circuit.append(cirq.rz(2 * coeff * gamma)(q1))
        circuit.append(cirq.rx(2 * beta).on_each(*qubits))
        return circuit

    gamma_sym, beta_sym = sympy.symbols('gamma beta')
    qaoa_circuit_symbolic = create_qaoa_circuit(gamma_sym, beta_sym)
    symbol_names = ['gamma', 'beta']
    symbol_values = tf.Variable([0.5, 0.5], dtype=tf.float64)
    expectation_layer = tfq.layers.Expectation()
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.05)

    for i in range(100):
        with tf.GradientTape() as tape:
            loss_value = expectation_layer(qaoa_circuit_symbolic, symbol_names=symbol_names,
                                           symbol_values=[symbol_values], operators=[cost_hamiltonian])
        grads = tape.gradient(loss_value, [symbol_values])
        optimizer.apply_gradients(zip(grads, [symbol_values]))

    optimized_gamma, optimized_beta = symbol_values.numpy()
    optimized_circuit = create_qaoa_circuit(optimized_gamma, optimized_beta)
    measured_circuit = optimized_circuit + cirq.measure(*qubits, key='result')
    simulator = cirq.Simulator()
    result = simulator.run(measured_circuit, repetitions=1000)
    histogram = result.histogram(key='result')
    sorted_histogram = sorted(histogram.items(), key=lambda x: x[1], reverse=True)
    most_frequent_bitstring = sorted_histogram[0][0]
    
    weights_quantum = np.array([int(bit) for bit in f'{most_frequent_bitstring:0{num_assets_quantum}b}'])
    if np.sum(weights_quantum) > 0:
        weights_quantum = weights_quantum / np.sum(weights_quantum)

    return weights_quantum.tolist() # NEW: Return as a list for JSON

# --- Main Optimization Function (Refactored from main()) ---
def perform_optimization(tickers: List[str], start_date: str, end_date: str, target_return: float):
    # 1. Data Fetching
    data = yf.download(tickers, start=start_date, end=end_date, auto_adjust=False, progress=False)
    adj_close = data['Adj Close']
    returns = adj_close.pct_change().dropna()
    mu = returns.mean().values * 252
    sigma = returns.cov().values * np.sqrt(252)

    # 2. Classical Optimization
    def portfolio_variance(w, sigma):
        return np.sqrt(w.T @ sigma @ w)

    def optimize_portfolio(mu_local, sigma_local, target_return_local):
        n = len(mu_local)
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'eq', 'fun': lambda w: np.sum(w * mu_local) - target_return_local}
        ]
        bounds = [(0, 1) for _ in range(n)]
        result = minimize(portfolio_variance, np.ones(n)/n, args=(sigma_local,),
                          constraints=constraints, bounds=bounds)
        return result.x if result.success else np.zeros(n)

    weights_classical = optimize_portfolio(mu, sigma, target_return)
    
    # 3. Quantum Optimization (on the first 2 assets as before)
    num_assets_quantum = 2
    mu_quantum = mu[:num_assets_quantum]
    sigma_quantum = sigma[:num_assets_quantum, :num_assets_quantum]
    weights_quantum_subset = run_quantum_optimization(mu_quantum, sigma_quantum, num_assets_quantum)
    
    # Pad the quantum weights array to match the full number of tickers
    weights_quantum = np.zeros(len(tickers))
    weights_quantum[:num_assets_quantum] = weights_quantum_subset

    # 4. Calculate Efficient Frontier data points for the frontend to plot
    target_returns_plot = np.linspace(min(mu), max(mu), 50)
    risks_plot = [portfolio_variance(optimize_portfolio(mu, sigma, r), sigma) for r in target_returns_plot]

    # 5. Compile results into a dictionary for JSON response
    results = {
        "tickers": tickers,
        "classical": {
            "weights": weights_classical.tolist(),
            "return": np.sum(weights_classical * mu),
            "risk": portfolio_variance(weights_classical, sigma)
        },
        "quantum": {
            "weights": weights_quantum.tolist(),
            "return": np.sum(weights_quantum * mu),
            "risk": portfolio_variance(weights_quantum, sigma)
        },
        "efficientFrontier": {
            "risks": [r for r in risks_plot if r > 0], # Filter out failed optimizations
            "returns": [tr for r, tr in zip(risks_plot, target_returns_plot) if r > 0]
        }
    }
    return results

# NEW: Define the API endpoint that the frontend will call
@app.post("/optimize")
async def optimize_portfolio_endpoint(request: PortfolioRequest):
    """
    Receives portfolio data, runs classical and quantum optimizations,
    and returns the results.
    """
    results = perform_optimization(
        tickers=request.tickers,
        start_date=request.start_date,
        end_date=request.end_date,
        target_return=request.target_return
    )
    return results