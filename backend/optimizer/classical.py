import numpy as np
from scipy.optimize import minimize

def portfolio_variance(w: np.ndarray, sigma: np.ndarray) -> float:
    """Calculates the portfolio variance (risk)."""
    return np.sqrt(np.dot(w.T, np.dot(sigma, w)))

def run_classical_optimization(mu: np.ndarray, sigma: np.ndarray) -> dict:
    """
    Performs classical portfolio optimization to find the minimum variance portfolio.

    Args:
        mu: Array of expected returns for each asset.
        sigma: Covariance matrix of the assets.

    Returns:
        A dictionary containing the optimal weights, return, and risk.
    """
    n = len(mu)

    def objective(w):
        return np.dot(w.T, np.dot(sigma, w))

    # Constraint: sum of weights must be 1
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})
    # Bounds: weights must be between 0 and 1
    bounds = tuple((0, 1) for _ in range(n))
    # Initial guess: equal distribution
    w0 = np.ones(n) / n

    result = minimize(objective, w0, method='SLSQP', bounds=bounds, constraints=constraints)

    if not result.success:
        raise ValueError("Classical optimization failed to converge.")

    optimal_weights = result.x
    portfolio_return = np.sum(optimal_weights * mu)
    portfolio_risk = portfolio_variance(optimal_weights, sigma)

    return {
        "weights": optimal_weights.tolist(),
        "return": portfolio_return,
        "risk": portfolio_risk
    }