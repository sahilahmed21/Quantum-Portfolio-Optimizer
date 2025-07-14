from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np

# Import the refactored optimization functions
from optimizer.classical import run_classical_optimization
from optimizer.quantum import run_quantum_optimization

# --- API Definition ---
app = FastAPI(
    title="Quantum Portfolio Optimizer API",
    description="An API that uses classical and quantum (QAOA) methods for portfolio optimization.",
    version="1.0.0",
)

# --- Pydantic Data Models for Request and Response ---
class PortfolioInput(BaseModel):
    mu: list[float] = Field(..., example=[0.01915, 0.06221], description="List of expected returns for each asset.")
    sigma: list[list[float]] = Field(..., example=[[1.4021, 1.4867], [1.4867, 2.0643]], description="Covariance matrix for the assets.")

    class Config:
        schema_extra = {
            "example": {
                "mu": [0.01915195, 0.06221088],
                "sigma": [[1.40210046, 1.48675601], [1.48675601, 2.06431832]]
            }
        }

class OptimizationResult(BaseModel):
    weights: list[float]
    # Use an alias because 'return' is a reserved keyword in Python
    portfolio_return: float = Field(..., alias="return")
    risk: float

class QuantumExtras(OptimizationResult):
    optimized_gamma: float
    optimized_beta: float

class ApiResponse(BaseModel):
    classical: OptimizationResult
    quantum: QuantumExtras


# --- API Endpoints ---
@app.get("/", summary="Health Check")
def read_root():
    """A simple health check endpoint to confirm the server is running."""
    return {"status": "ok", "message": "Welcome to the Quantum Portfolio Optimizer API"}

@app.post("/optimize", response_model=ApiResponse, summary="Run Portfolio Optimization")
def optimize_portfolio(data: PortfolioInput):
    """
    Accepts portfolio data (expected returns and covariance matrix) and returns
    the optimized asset allocation using both classical and quantum algorithms.
    
    **Note:** The quantum optimization is computationally intensive and may take
    a moment to complete.
    """
    try:
        mu_np = np.array(data.mu)
        sigma_np = np.array(data.sigma)

        if mu_np.shape[0] != sigma_np.shape[0] or sigma_np.shape[0] != sigma_np.shape[1]:
            raise HTTPException(status_code=400, detail="Dimension mismatch between mu and sigma.")
        
        # Run Classical Optimization
        classical_results = run_classical_optimization(mu_np, sigma_np)

        # Run Quantum Optimization
        # For a real production app, this should be offloaded to a background worker (e.g., Celery, ARQ)
        # to avoid blocking the server. For this example, we run it directly.
        quantum_results = run_quantum_optimization(mu_np, sigma_np)

        return {"classical": classical_results, "quantum": quantum_results}

    except ValueError as e:
        # Catches convergence errors from the optimizer
        raise HTTPException(status_code=500, detail=f"An optimization error occurred: {str(e)}")
    except Exception as e:
        # Generic error handler
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")