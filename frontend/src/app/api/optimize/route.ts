// src/app/api/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Define the backend URL (you'll need to update this when you deploy your backend)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// Type definitions for better type safety
interface PortfolioRequest {
    tickers: string[]
    start_date: string
    end_date: string
    risk_tolerance: number
    investment_amount?: number
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

interface OptimizationResponse {
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
}

// Add type for old backend response format
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
}

export async function POST(request: NextRequest) {
    try {
        const body: PortfolioRequest = await request.json()

        // Enhanced validation
        if (!body.tickers || !Array.isArray(body.tickers) || body.tickers.length === 0) {
            return NextResponse.json(
                { error: 'Tickers array is required and must not be empty' },
                { status: 400 }
            )
        }

        if (body.tickers.length < 2) {
            return NextResponse.json(
                { error: 'Please provide at least 2 tickers for optimization' },
                { status: 400 }
            )
        }

        if (body.tickers.length > 20) {
            return NextResponse.json(
                { error: 'Please provide no more than 20 tickers for optimal performance' },
                { status: 400 }
            )
        }

        if (!body.start_date || !body.end_date) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            )
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(body.start_date) || !dateRegex.test(body.end_date)) {
            return NextResponse.json(
                { error: 'Dates must be in YYYY-MM-DD format' },
                { status: 400 }
            )
        }

        // Validate date range
        const startDate = new Date(body.start_date)
        const endDate = new Date(body.end_date)
        const today = new Date()

        if (startDate >= endDate) {
            return NextResponse.json(
                { error: 'Start date must be before end date' },
                { status: 400 }
            )
        }

        if (endDate > today) {
            return NextResponse.json(
                { error: 'End date cannot be in the future' },
                { status: 400 }
            )
        }

        // Check for minimum analysis period (30 days)
        const daysDifference = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        if (daysDifference < 30) {
            return NextResponse.json(
                { error: 'Analysis period must be at least 30 days' },
                { status: 400 }
            )
        }

        if (body.risk_tolerance === undefined || body.risk_tolerance < 0 || body.risk_tolerance > 1) {
            return NextResponse.json(
                { error: 'Risk tolerance must be between 0 (very conservative) and 1 (very aggressive)' },
                { status: 400 }
            )
        }

        if (body.investment_amount !== undefined && (body.investment_amount <= 0 || body.investment_amount > 10000000)) {
            return NextResponse.json(
                { error: 'Investment amount must be between $1 and $10,000,000' },
                { status: 400 }
            )
        }

        // Validate ticker symbols (basic format check)
        const tickerRegex = /^[A-Z]{1,5}$/
        for (const ticker of body.tickers) {
            if (!tickerRegex.test(ticker.toUpperCase())) {
                return NextResponse.json(
                    { error: `Invalid ticker symbol: ${ticker}. Use standard stock symbols (e.g., AAPL, MSFT)` },
                    { status: 400 }
                )
            }
        }

        // Prepare request for backend
        const requestData = {
            tickers: body.tickers.map(t => t.toUpperCase()), // Ensure uppercase
            start_date: body.start_date,
            end_date: body.end_date,
            risk_tolerance: body.risk_tolerance,
            investment_amount: body.investment_amount || 100000 // Default $100k
        }

        console.log('Sending optimization request:', requestData)

        // Forward the request to the Python backend
        const response = await axios.post<OptimizationResponse>(`${BACKEND_URL}/optimize`, requestData, {
            timeout: 120000, // 2 minute timeout for quantum optimization
            headers: {
                'Content-Type': 'application/json',
            }
        })

        console.log('Backend response status:', response.status)
        console.log('Backend response keys:', Object.keys(response.data))

        // Check if the response contains an error
        if (response.data && 'error' in response.data) {
            console.error('Backend returned error:', response.data.error)
            return NextResponse.json(
                { error: response.data.error },
                { status: 400 }
            )
        }

        // Handle both old and new response formats
        let transformedResponse

        // Check if it's the new format (with nested portfolio objects)
        if (response.data.quantum_portfolio && response.data.classical_portfolio) {
            // New format
            transformedResponse = {
                ...response.data,
                // Legacy field mappings for existing frontend components
                quantum_weights: response.data.quantum_portfolio.weights || [],
                classical_weights: response.data.classical_portfolio.weights || [],
                quantum_return: response.data.quantum_portfolio.expected_return || 0,
                classical_return: response.data.classical_portfolio.expected_return || 0,
                quantum_risk: response.data.quantum_portfolio.risk || 0,
                classical_risk: response.data.classical_portfolio.risk || 0,
                quantum_sharpe: response.data.quantum_portfolio.sharpe_ratio || 0,
                classical_sharpe: response.data.classical_portfolio.sharpe_ratio || 0,
                tickers: response.data.quantum_portfolio.tickers || requestData.tickers,
                improvement_percent: response.data.performance_comparison?.improvement_percent || 0
            }
        } else if ((response.data as unknown as OldOptimizationResponse).quantum_weights && (response.data as unknown as OldOptimizationResponse).classical_weights) {
            // Old format - transform to new format
            const oldData = response.data as unknown as OldOptimizationResponse
            const investment_amount = requestData.investment_amount

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
                // Legacy mappings
                quantum_weights: oldData.quantum_weights,
                classical_weights: oldData.classical_weights,
                quantum_return: oldData.quantum_return || 0,
                classical_return: oldData.classical_return || 0,
                quantum_risk: oldData.quantum_risk || 0,
                classical_risk: oldData.classical_risk || 0,
                quantum_sharpe: oldData.quantum_sharpe || 0,
                classical_sharpe: oldData.classical_sharpe || 0,
                tickers: oldData.tickers || requestData.tickers,
                improvement_percent: oldData.improvement_percent || 0
            }
        } else {
            console.error('Invalid response structure:', response.data)
            return NextResponse.json(
                { error: 'Invalid response structure from backend optimization' },
                { status: 500 }
            )
        }

        console.log('Optimization completed successfully')
        return NextResponse.json(transformedResponse)

    } catch (error) {
        console.error('API Error:', error)

        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                return NextResponse.json(
                    { error: 'Backend service is unavailable. Please ensure the Python backend is running on port 8000.' },
                    { status: 503 }
                )
            }

            if (error.response) {
                console.error('Backend error response:', error.response.data)
                return NextResponse.json(
                    { error: error.response.data?.error || 'Backend optimization failed' },
                    { status: error.response.status }
                )
            }

            if (error.code === 'ECONNABORTED') {
                return NextResponse.json(
                    { error: 'Optimization timeout. The quantum algorithm is taking longer than expected. Please try with fewer assets or a shorter time period.' },
                    { status: 408 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Internal server error during portfolio optimization' },
            { status: 500 }
        )
    }
}

// Health check endpoint
export async function GET() {
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 })
        return NextResponse.json({
            message: 'Portfolio optimization API is running',
            backend_status: response.data,
            endpoints: {
                optimize: 'POST /api/optimize'
            }
        })
    } catch (error) {
        return NextResponse.json({
            message: 'Portfolio optimization API is running (frontend only)',
            backend_status: 'unavailable',
            error: 'Cannot connect to Python backend',
            endpoints: {
                optimize: 'POST /api/optimize'
            }
        }, { status: 503 })
    }
}