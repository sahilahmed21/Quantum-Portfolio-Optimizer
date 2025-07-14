import cirq
import numpy as np
import sympy
import tensorflow as tf
import tensorflow_quantum as tfq

def portfolio_variance(w: np.ndarray, sigma: np.ndarray) -> float:
    """Helper function to calculate portfolio variance (risk)."""
    return np.sqrt(np.dot(w.T, np.dot(sigma, w)))

def create_qaoa_circuit(qubits, cost_hamiltonian, gamma, beta):
    """Builds the QAOA circuit with symbolic parameters."""
    circuit = cirq.Circuit()
    circuit.append(cirq.H.on_each(*qubits))
    
    # Cost Hamiltonian Layer
    for term in cost_hamiltonian:
        qubits_in_term = list(term.qubits)
        coeff = term.coefficient.real
        if len(qubits_in_term) == 2:
            q1, q2 = qubits_in_term[0], qubits_in_term[1]
            circuit.append(cirq.ZZ(q1, q2)**(2 * coeff * gamma / np.pi))
        elif len(qubits_in_term) == 1:
            q1 = qubits_in_term[0]
            circuit.append(cirq.rz(2 * coeff * gamma)(q1))
            
    # Mixer Hamiltonian Layer
    circuit.append(cirq.rx(2 * beta).on_each(*qubits))
    return circuit

def run_quantum_optimization(mu: np.ndarray, sigma: np.ndarray, steps: int = 100, repetitions: int = 1000) -> dict:
    """
    Performs quantum portfolio optimization using QAOA.

    Args:
        mu: Array of expected returns for each asset.
        sigma: Covariance matrix of the assets.
        steps: Number of optimization steps for training the QAOA parameters.
        repetitions: Number of times to run the final quantum circuit to get statistics.

    Returns:
        A dictionary containing the optimal weights, return, and risk from QAOA.
    """
    num_assets = len(mu)
    qubits = [cirq.GridQubit(0, i) for i in range(num_assets)]

    # 1. Define the Cost Hamiltonian from the problem
    cost_hamiltonian = cirq.PauliSum()
    for i in range(num_assets):
        for j in range(num_assets):
            coeff = sigma[i, j] / 4.0
            cost_hamiltonian += coeff * (1 - cirq.Z(qubits[i])) * (1 - cirq.Z(qubits[j]))
    
    # Add a penalty for solutions that don't select any assets
    penalty = 10.0
    constraint_hamiltonian = (sum((1 - cirq.Z(q)) / 2.0 for q in qubits) - 1)**2
    cost_hamiltonian += penalty * constraint_hamiltonian

    # 2. Create the symbolic QAOA circuit
    gamma_sym, beta_sym = sympy.symbols('gamma beta')
    qaoa_circuit_symbolic = create_qaoa_circuit(qubits, cost_hamiltonian, gamma_sym, beta_sym)

    # 3. Train the QAOA parameters using TensorFlow Quantum
    symbol_names = ['gamma', 'beta']
    symbol_values = tf.Variable([0.5, 0.5], dtype=tf.float64)
    expectation_layer = tfq.layers.Expectation()
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.05)

    for i in range(steps):
        with tf.GradientTape() as tape:
            loss_value = expectation_layer(
                qaoa_circuit_symbolic,
                symbol_names=symbol_names,
                symbol_values=[symbol_values],
                operators=[cost_hamiltonian]
            )
        grads = tape.gradient(loss_value, [symbol_values])
        optimizer.apply_gradients(zip(grads, [symbol_values]))
    
    optimized_gamma, optimized_beta = symbol_values.numpy()

    # 4. Execute the optimized circuit and get results
    optimized_circuit = create_qaoa_circuit(qubits, cost_hamiltonian, optimized_gamma, optimized_beta)
    measured_circuit = optimized_circuit + cirq.measure(*qubits, key='result')
    
    simulator = cirq.Simulator()
    result = simulator.run(measured_circuit, repetitions=repetitions)
    histogram = result.histogram(key='result')

    # 5. Interpret the results
    most_frequent_bitstring = max(histogram, key=histogram.get)
    weights_quantum = np.array([int(bit) for bit in f'{most_frequent_bitstring:0{num_assets}b}'])
    
    # Normalize weights to sum to 1
    if np.sum(weights_quantum) > 0:
        weights_quantum = weights_quantum / np.sum(weights_quantum)

    portfolio_return = np.sum(weights_quantum * mu)
    portfolio_risk = portfolio_variance(weights_quantum, sigma)

    return {
        "weights": weights_quantum.tolist(),
        "return": portfolio_return,
        "risk": portfolio_risk,
        "optimized_gamma": optimized_gamma,
        "optimized_beta": optimized_beta
    }