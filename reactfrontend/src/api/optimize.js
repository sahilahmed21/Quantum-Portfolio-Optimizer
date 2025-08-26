import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000' || 'http://f1quantumpfopt.dev.ryzeai.ai';

export const optimizePortfolio = async (portfolioRequest) => {
    try {
        // Validation Layer (can be expanded)
        if (!portfolioRequest.tickers || portfolioRequest.tickers.length < 2) {
            throw new Error("Please provide at least 2 tickers.");
        }
        if (new Date(portfolioRequest.start_date) >= new Date(portfolioRequest.end_date)) {
            throw new Error("Start date must be before end date.");
        }

        const requestData = {
            tickers: portfolioRequest.tickers.map(t => t.toUpperCase()),
            start_date: portfolioRequest.start_date,
            end_date: portfolioRequest.end_date,
            risk_tolerance: portfolioRequest.risk_tolerance,
            investment_amount: portfolioRequest.investment_amount || 100000
        };

        console.log('Sending optimization request:', requestData);

        const response = await axios.post(`${BACKEND_URL}/optimize`, requestData, {
            timeout: 120000, // 2 minute timeout
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Backend response received. Transforming for client...');
        return transformResponse(response.data, requestData);

    } catch (error) {
        console.error('API Call Error:', error);
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Backend service is unavailable.');
            }
            if (error.response) {
                throw new Error(error.response.data?.detail || error.response.data?.error || 'Backend optimization failed');
            }
            if (error.code === 'ECONNABORTED') {
                throw new Error('Optimization timeout. The request took too long.');
            }
        }
        throw new Error(error.message || 'An internal server error occurred.');
    }
};

// This transformation logic ensures the frontend always gets a consistent data structure.
const transformResponse = (data, requestData) => {
    // If it's already the rich, nested format, add legacy flat fields for component compatibility.
    if ('quantum_portfolio' in data && 'classical_portfolio' in data) {
        return {
            ...data, // contains nested quantum_portfolio, classical_portfolio etc.
            // Add legacy fields
            tickers: data.quantum_portfolio.tickers,
            classical_weights: data.classical_portfolio.weights,
            quantum_weights: data.quantum_portfolio.weights,
            classical_return: data.classical_portfolio.expected_return,
            quantum_return: data.quantum_portfolio.expected_return,
            classical_risk: data.classical_portfolio.risk,
            quantum_risk: data.quantum_portfolio.risk,
            classical_sharpe: data.classical_portfolio.sharpe_ratio,
            quantum_sharpe: data.quantum_portfolio.sharpe_ratio,
            improvement_percent: data.performance_comparison.improvement_percent,
        };
    }

    // If it's the old, flat format, build the rich format from it.
    if ('quantum_weights' in data && 'classical_weights' in data) {
        const investment_amount = requestData.investment_amount;
        return {
            investment_amount: investment_amount,
            risk_tolerance: requestData.risk_tolerance,
            classical_portfolio: {
                tickers: data.tickers || requestData.tickers,
                weights: data.classical_weights,
                allocations: data.classical_weights.map(w => w * investment_amount),
                expected_return: data.classical_return || 0,
                risk: data.classical_risk || 0,
                sharpe_ratio: data.classical_sharpe || 0,
                expected_annual_profit: (data.classical_return || 0) * investment_amount
            },
            quantum_portfolio: {
                tickers: data.tickers || requestData.tickers,
                weights: data.quantum_weights,
                allocations: data.quantum_weights.map(w => w * investment_amount),
                expected_return: data.quantum_return || 0,
                risk: data.quantum_risk || 0,
                sharpe_ratio: data.quantum_sharpe || 0,
                expected_annual_profit: (data.quantum_return || 0) * investment_amount
            },
            // Include legacy fields
            tickers: data.tickers || requestData.tickers,
            classical_weights: data.classical_weights,
            quantum_weights: data.quantum_weights,
            classical_return: data.classical_return || 0,
            quantum_return: data.quantum_return || 0,
            classical_risk: data.classical_risk || 0,
            quantum_risk: data.quantum_risk || 0,
            classical_sharpe: data.classical_sharpe || 0,
            quantum_sharpe: data.quantum_sharpe || 0,
            improvement_percent: data.improvement_percent || 0,
            calculation_details: data.calculation_details || { tickers: [], expected_returns: [], covariance_matrix: [] },
        };
    }

    throw new Error('Invalid response structure from optimization engine.');
};