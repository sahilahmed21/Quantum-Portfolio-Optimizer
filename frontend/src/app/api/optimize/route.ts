// src/app/api/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Define the backend URL (you'll need to update this when you deploy your backend)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// --- TYPE DEFINITIONS ---

interface PortfolioRequest {
    tickers: string[]
    start_date: string
    end_date: string
    risk_tolerance: number
    investment_amount?: number
}

interface CalculationDetails {
    tickers: string[];
    expected_returns: number[];
    covariance_matrix: number[][];
}

interface PortfolioDetail {
    ticker: string
    classical_weight: number
    quantum_weight: number
    classical_allocation: number
    quantum_allocation: number
    expected_annual_return: number
    annual_volatility: number
}

// This is the most up-to-date, comprehensive response format
interface RichOptimizationResponse {
    investment_amount: number
    risk_tolerance: number
    classical_portfolio: {
        tickers: string[]
        weights: number[]
        allocations: number[]
        expected_return: number
        risk: number
        sharpe_ratio: number
        expected_annual_profit: number
    }
    quantum_portfolio: {
        tickers: string[]
        weights: number[]
        allocations: number[]
        expected_return: number
        risk: number
        sharpe_ratio: number
        expected_annual_profit: number
    }
    performance_comparison: {
        improvement_percent: number
        additional_expected_profit: number
        risk_difference: number
    }
    portfolio_details: PortfolioDetail[]
    analysis_period: {
        start_date: string
        end_date: string
        total_trading_days: number
    }
    // Include the detailed calculation data
    calculation_details: CalculationDetails
}

// Type for the original, flatter backend response format
interface OldOptimizationResponse {
    tickers?: string[]
    classical_weights: number[]
    quantum_weights: number[]
    classical_return?: number
    quantum_return?: number
    classical_risk?: number
    quantum_risk?: number
    classical_sharpe?: number
    quantum_sharpe?: number
    improvement_percent?: number
    calculation_details?: CalculationDetails // It might also come with the old format
}

// A union type to handle any possible response from the backend
type BackendResponse = RichOptimizationResponse | OldOptimizationResponse;


export async function POST(request: NextRequest) {
    try {
        const body: PortfolioRequest = await request.json()

        // --- Enhanced Validation ---
        if (!body.tickers || !Array.isArray(body.tickers) || body.tickers.length === 0) {
            return NextResponse.json({ error: 'Tickers array is required and must not be empty' }, { status: 400 });
        }
        if (body.tickers.length < 2) {
            return NextResponse.json({ error: 'Please provide at least 2 tickers for optimization' }, { status: 400 });
        }
        if (body.tickers.length > 20) {
            return NextResponse.json({ error: 'Please provide no more than 20 tickers for optimal performance' }, { status: 400 });
        }
        if (!body.start_date || !body.end_date) {
            return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(body.start_date) || !dateRegex.test(body.end_date)) {
            return NextResponse.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
        }
        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);
        if (startDate >= endDate) {
            return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
        }
        if (endDate > new Date()) {
            return NextResponse.json({ error: 'End date cannot be in the future' }, { status: 400 });
        }
        const daysDifference = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        if (daysDifference < 30) {
            return NextResponse.json({ error: 'Analysis period must be at least 30 days' }, { status: 400 });
        }
        if (body.risk_tolerance === undefined || body.risk_tolerance < 0 || body.risk_tolerance > 1) {
            return NextResponse.json({ error: 'Risk tolerance must be between 0 (conservative) and 1 (aggressive)' }, { status: 400 });
        }
        if (body.investment_amount !== undefined && (body.investment_amount <= 0 || body.investment_amount > 10000000)) {
            return NextResponse.json({ error: 'Investment amount must be between $1 and $10,000,000' }, { status: 400 });
        }
        const tickerRegex = /^[A-Z]{1,5}$/;
        for (const ticker of body.tickers) {
            if (!tickerRegex.test(ticker.toUpperCase())) {
                return NextResponse.json({ error: `Invalid ticker symbol: ${ticker}. Use standard stock symbols (e.g., AAPL, MSFT)` }, { status: 400 });
            }
        }

        const requestData = {
            tickers: body.tickers.map(t => t.toUpperCase()),
            start_date: body.start_date,
            end_date: body.end_date,
            risk_tolerance: body.risk_tolerance,
            investment_amount: body.investment_amount || 100000 // Default $100k
        }

        console.log('Sending optimization request:', requestData)

        const response = await axios.post<BackendResponse>(`${BACKEND_URL}/optimize`, requestData, {
            timeout: 120000, // 2 minute timeout
            headers: { 'Content-Type': 'application/json' }
        })

        console.log('Backend response received. Transforming for client...');

        // --- Transformation Layer ---
        // This ensures the frontend always gets a consistent, rich data structure.

        const data = response.data;
        let transformedResponse: RichOptimizationResponse & OldOptimizationResponse; // Combine for full compatibility

        // Check if it's the new, rich format
        if ('quantum_portfolio' in data && 'classical_portfolio' in data) {
            transformedResponse = {
                ...(data as RichOptimizationResponse),
                // Add legacy fields for any components that might still use them
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
        // Check if it's the old, flat format
        else if ('quantum_weights' in data && 'classical_weights' in data) {
            const oldData = data as OldOptimizationResponse;
            const investment_amount = requestData.investment_amount;

            // Reconstruct the rich format from the old data
            transformedResponse = {
                investment_amount: investment_amount,
                risk_tolerance: requestData.risk_tolerance,
                classical_portfolio: {
                    tickers: oldData.tickers || requestData.tickers,
                    weights: oldData.classical_weights,
                    allocations: oldData.classical_weights.map((w: number) => w * investment_amount),
                    expected_return: oldData.classical_return || 0,
                    risk: oldData.classical_risk || 0,
                    sharpe_ratio: oldData.classical_sharpe || 0,
                    expected_annual_profit: (oldData.classical_return || 0) * investment_amount
                },
                quantum_portfolio: {
                    tickers: oldData.tickers || requestData.tickers,
                    weights: oldData.quantum_weights,
                    allocations: oldData.quantum_weights.map((w: number) => w * investment_amount),
                    expected_return: oldData.quantum_return || 0,
                    risk: oldData.quantum_risk || 0,
                    sharpe_ratio: oldData.quantum_sharpe || 0,
                    expected_annual_profit: (oldData.quantum_return || 0) * investment_amount
                },
                performance_comparison: {
                    improvement_percent: oldData.improvement_percent || 0,
                    additional_expected_profit: ((oldData.quantum_return || 0) - (oldData.classical_return || 0)) * investment_amount,
                    risk_difference: (oldData.quantum_risk || 0) - (oldData.classical_risk || 0)
                },
                portfolio_details: [], // Not available in old format
                analysis_period: { // Reconstruct from request
                    start_date: requestData.start_date,
                    end_date: requestData.end_date,
                    total_trading_days: 0 // Not available
                },
                calculation_details: oldData.calculation_details || { tickers: [], expected_returns: [], covariance_matrix: [] },
                // Add legacy fields
                tickers: oldData.tickers || requestData.tickers,
                classical_weights: oldData.classical_weights,
                quantum_weights: oldData.quantum_weights,
                classical_return: oldData.classical_return || 0,
                quantum_return: oldData.quantum_return || 0,
                classical_risk: oldData.classical_risk || 0,
                quantum_risk: oldData.quantum_risk || 0,
                classical_sharpe: oldData.classical_sharpe || 0,
                quantum_sharpe: oldData.quantum_sharpe || 0,
                improvement_percent: oldData.improvement_percent || 0,
            };
        } else {
            console.error('Invalid response structure from backend:', data);
            return NextResponse.json({ error: 'Invalid response structure from optimization engine.' }, { status: 500 });
        }

        console.log('Transformation complete. Sending data to client.');
        return NextResponse.json(transformedResponse);

    } catch (error) {
        console.error('API Route Error:', error);
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Backend service is unavailable.' }, { status: 503 });
            }
            if (error.response) {
                return NextResponse.json(
                    { error: error.response.data?.detail || error.response.data?.error || 'Backend optimization failed' },
                    { status: error.response.status }
                );
            }
            if (error.code === 'ECONNABORTED') {
                return NextResponse.json({ error: 'Optimization timeout. The request took too long.' }, { status: 408 });
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 })
        return NextResponse.json({
            message: 'Portfolio optimization API is running',
            backend_status: response.data,
            endpoints: { optimize: 'POST /api/optimize' }
        })
    } catch (error) {
        return NextResponse.json({
            message: 'Portfolio optimization API is running (frontend only)',
            backend_status: 'unavailable',
            error: 'Cannot connect to Python backend',
            endpoints: { optimize: 'POST /api/optimize' }
        }, { status: 503 })
    }
}
