import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
from scipy.optimize import minimize
import cirq
import sympy
import tensorflow as tf
import tensorflow_quantum as tfq

def run_quantum_optimization(mu_quantum, sigma_quantum, num_assets_quantum=2):
    """
    Performs Quantum Portfolio Optimization using QAOA for a 2-asset portfolio.

    Args:
        mu_quantum (np.ndarray): Array of expected returns for the quantum subset.
        sigma_quantum (np.ndarray): Covariance matrix for the quantum subset.
        num_assets_quantum (int): The number of assets (qubits) in the quantum simulation.
    """
    print("--- 2. Quantum Optimization (QAOA) ---")

    # Each asset is represented by a qubit.
    qubits = [cirq.GridQubit(0, i) for i in range(num_assets_quantum)]

    # QUBO Formulation of the cost function (Hamiltonian)
    # The goal is to find the ground state of this Hamiltonian.
    cost_hamiltonian = cirq.PauliSum()

    # Add variance terms to the Hamiltonian
    for i in range(num_assets_quantum):
        for j in range(num_assets_quantum):
            coeff = sigma_quantum[i, j] / 4.0
            cost_hamiltonian += coeff * (1 - cirq.Z(qubits[i])) * (1 - cirq.Z(qubits[j]))

    # Add a penalty for violating the sum(weights) = 1 constraint.
    penalty = 10.0
    constraint_hamiltonian = (sum((1 - cirq.Z(q)) / 2.0 for q in qubits) - 1)**2
    cost_hamiltonian += penalty * constraint_hamiltonian

    # QAOA Circuit Builder
    def create_qaoa_circuit(gamma, beta):
        circuit = cirq.Circuit()
        # Start in a superposition of all states.
        circuit.append(cirq.H.on_each(*qubits))
        # Apply the cost layer.
        for term in cost_hamiltonian:
            qubits_in_term = list(term.qubits)
            coeff = term.coefficient.real
            if len(qubits_in_term) == 2:
                q1, q2 = qubits_in_term[0], qubits_in_term[1]
                circuit.append(cirq.ZZ(q1, q2)**(2 * coeff * gamma / np.pi))
            elif len(qubits_in_term) == 1:
                q1 = qubits_in_term[0]
                circuit.append(cirq.rz(2 * coeff * gamma)(q1))
        # Apply the mixer layer.
        circuit.append(cirq.rx(2 * beta).on_each(*qubits))
        return circuit

    # Optimize QAOA parameters (gamma, beta) using TensorFlow Quantum
    gamma_sym, beta_sym = sympy.symbols('gamma beta')
    qaoa_circuit_symbolic = create_qaoa_circuit(gamma_sym, beta_sym)
    symbol_names = ['gamma', 'beta']
    symbol_values = tf.Variable([0.5, 0.5], dtype=tf.float64)
    expectation_layer = tfq.layers.Expectation()
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.05)

    print("\nOptimizing QAOA parameters...")
    for i in range(100):
        with tf.GradientTape() as tape:
            loss_value = expectation_layer(qaoa_circuit_symbolic, symbol_names=symbol_names,
                                           symbol_values=[symbol_values], operators=[cost_hamiltonian])
        grads = tape.gradient(loss_value, [symbol_values])
        optimizer.apply_gradients(zip(grads, [symbol_values]))
        if (i + 1) % 20 == 0:
            print(f"Step {i+1}, Loss: {loss_value.numpy()[0][0]:.4f}")

    optimized_gamma, optimized_beta = symbol_values.numpy()
    print(f"\nOptimized QAOA Parameters:\ngamma = {optimized_gamma:.4f}\nbeta  = {optimized_beta:.4f}\n")

    # Simulate the optimized circuit and find the most likely outcome
    optimized_circuit = create_qaoa_circuit(optimized_gamma, optimized_beta)
    measured_circuit = optimized_circuit + cirq.measure(*qubits, key='result')
    simulator = cirq.Simulator()
    result = simulator.run(measured_circuit, repetitions=1000)
    histogram = result.histogram(key='result')
    sorted_histogram = sorted(histogram.items(), key=lambda x: x[1], reverse=True)

    print("QAOA Simulation Results (Top 5):")
    for i, (bitstring, count) in enumerate(sorted_histogram[:5]):
        print(f"  {i+1}. Bitstring: {bitstring:0{num_assets_quantum}b}, Count: {count}")

    # Convert the most frequent bitstring result to portfolio weights
    most_frequent_bitstring = sorted_histogram[0][0]
    weights_quantum = np.array([int(bit) for bit in f'{most_frequent_bitstring:0{num_assets_quantum}b}'])
    if np.sum(weights_quantum) > 0:
        weights_quantum = weights_quantum / np.sum(weights_quantum)

    # Calculate and display the results for the quantum-optimized portfolio
    return_quantum = np.sum(weights_quantum * mu_quantum)
    risk_quantum = np.sqrt(weights_quantum.T @ sigma_quantum @ weights_quantum)

    print(f"\nMost frequent bitstring: {most_frequent_bitstring:0{num_assets_quantum}b}")
    print(f"Optimal Weights (Quantum): {weights_quantum}")
    print(f"Portfolio Return (Quantum): {return_quantum:.6f}")
    print(f"Portfolio Risk (Quantum): {risk_quantum:.6f}\n")

def main():
    """
    Main function to drive the portfolio optimization process.
    """
    # --- 1. Data Fetching and Classical Optimization ---
    print("--- 1. Data Fetching and Classical Optimization ---")
    tickers = ["AAPL", "MSFT", "GOOGL", "AMZN"]
    data = yf.download(tickers, start="2023-01-01", end="2023-12-31", auto_adjust=False, progress=False)
    adj_close = data['Adj Close']

    # Calculate returns, expected returns (mu), and covariance (sigma)
    returns = adj_close.pct_change().dropna()
    mu = returns.mean().values * 252  # Annualized returns
    sigma = returns.cov().values * np.sqrt(252)  # Annualized covariance matrix

    # Classical Optimization
    def portfolio_variance(w, sigma):
        return np.sqrt(w.T @ sigma @ w)

    def optimize_portfolio(mu, sigma, target_return):
        n = len(mu)
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'eq', 'fun': lambda w: np.sum(w * mu) - target_return}
        ]
        bounds = [(0, 1) for _ in range(n)]
        result = minimize(portfolio_variance, np.ones(n)/n, args=(sigma,),
                          constraints=constraints, bounds=bounds)
        return result.x if result.success else np.zeros(n)

    # Set a feasible target return and find the optimal classical weights
    target_return = np.mean(mu)
    weights_classical = optimize_portfolio(mu, sigma, target_return)

    # Output classical results
    print("\nFull Portfolio Tickers:", tickers)
    print("Optimal Weights (Classical):", weights_classical)
    print("Portfolio Return (Classical):", np.sum(weights_classical * mu))
    print("Portfolio Risk (Classical):", portfolio_variance(weights_classical, sigma))

    # --- Prepare data for Quantum Section ---
    mu_quantum = mu[:2]
    sigma_quantum = sigma[:2, :2]

    print("\n-----------------------------------------------------")
    print("\nQuantum Subset Tickers:", tickers[:2])
    print("Quantum Expected Returns (mu_quantum):", mu_quantum)
    print("Quantum Covariance Matrix (sigma_quantum):\n", sigma_quantum)

    # Run the Quantum Optimization on the subset of data
    run_quantum_optimization(mu_quantum, sigma_quantum)

    # --- 3. Plot Efficient Frontier for the Full Classical Portfolio ---
    print("--- 3. Plotting Classical Efficient Frontier ---")
    target_returns = np.linspace(min(mu), max(mu), 50)
    risks = [portfolio_variance(optimize_portfolio(mu, sigma, r), sigma) for r in target_returns]

    plt.figure(figsize=(10, 6))
    plt.plot(risks, target_returns, label='Efficient Frontier')
    plt.scatter(portfolio_variance(weights_classical, sigma), target_return,
                color='red', zorder=5, label='Optimal Portfolio (Classical)')
    plt.xlabel('Portfolio Standard Deviation (Risk)')
    plt.ylabel('Expected Return')
    plt.title('Efficient Frontier for Full Classical Portfolio')
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig('efficient_frontier.png')

if __name__ == '__main__':
    main()