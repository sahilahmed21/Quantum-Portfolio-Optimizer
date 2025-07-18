import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
import cirq
import sympy
import tensorflow as tf
import tensorflow_quantum as tfq

# --- Classical Optimization Logic ---
def portfolio_variance(weights, sigma):
    return np.sqrt(np.dot(weights.T, np.dot(sigma, weights)))

def classic_optimize_portfolio(mu, sigma):
    n = len(mu)
    def objective(weights):
        return np.dot(weights.T, np.dot(sigma, weights))
    
    constraints = ({'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1})
    bounds = tuple((0, 1) for _ in range(n))
    initial_weights = np.ones(n) / n
    
    result = minimize(objective, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    
    if result.success:
        return result.x
    else:
        # Fallback if optimization fails
        return initial_weights

# --- Quantum Optimization Logic ---
def quantum_optimize_portfolio(mu_quantum, sigma_quantum, num_assets_quantum=2):
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

    for _ in range(100):
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
    most_frequent_bitstring = max(histogram, key=histogram.get)
    
    weights_quantum = np.array([int(bit) for bit in f'{most_frequent_bitstring:0{num_assets_quantum}b}'])
    if np.sum(weights_quantum) > 0:
        weights_quantum = weights_quantum / np.sum(weights_quantum)
        
    return weights_quantum

# --- Main Orchestration Function ---
def run_optimization(tickers: list[str]):
    # 1. Data Fetching
    data = yf.download(tickers, start="2023-01-01", end="2023-12-31", auto_adjust=False, progress=False)
    adj_close = data['Adj Close']
    returns = adj_close.pct_change().dropna()
    mu = returns.mean().values * 252
    sigma = returns.cov().values * np.sqrt(252)

    # 2. Classical Optimization
    weights_classical = classic_optimize_portfolio(mu, sigma)
    return_classical = np.sum(weights_classical * mu)
    risk_classical = portfolio_variance(weights_classical, sigma)

    # 3. Quantum Optimization (on first 2 assets)
    num_assets_quantum = 2
    mu_quantum = mu[:num_assets_quantum]
    sigma_quantum = sigma[:num_assets_quantum, :num_assets_quantum]
    weights_quantum_subset = quantum_optimize_portfolio(mu_quantum, sigma_quantum, num_assets_quantum)
    
    # Pad quantum weights to full portfolio size
    weights_quantum = np.zeros(len(tickers))
    weights_quantum[:num_assets_quantum] = weights_quantum_subset
    
    return_quantum = np.sum(weights_quantum * mu)
    risk_quantum = portfolio_variance(weights_quantum, sigma)
    
    # 4. Format Results
    results = {
        "tickers": tickers,
        "classical": {
            "weights": weights_classical.tolist(),
            "return": return_classical,
            "risk": risk_classical,
        },
        "quantum": {
            "weights": weights_quantum.tolist(),
            "return": return_quantum,
            "risk": risk_quantum,
            "info": f"QAOA performed on the first {num_assets_quantum} assets: {', '.join(tickers[:num_assets_quantum])}"
        }
    }
    return results