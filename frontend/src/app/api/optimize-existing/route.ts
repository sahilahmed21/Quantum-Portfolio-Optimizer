// src/app/api/optimize-existing/route.ts

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Get the backend URL from environment variables, with a fallback for local development
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// --- Type Definitions ---
interface Asset {
    ticker: string
    shares: number
}

interface ExistingPortfolioRequest {
    assets: Asset[]
    start_date: string
    end_date: string
    risk_tolerance: number
}

// Define the expected response structure from the backend for this specific endpoint
interface Trade {
    ticker: string;
    current_shares: number;
    target_shares: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
}

interface PortfolioMetrics {
    return: number;
    risk: number;
    sharpe: number;
}

interface ExistingPortfolioResponse {
    quantum_trades: Trade[];
    classical_trades: Trade[];
    current_portfolio_metrics: PortfolioMetrics;
    quantum_portfolio_metrics: PortfolioMetrics;
    classical_portfolio_metrics: PortfolioMetrics;
}


export async function POST(request: NextRequest) {
    try {
        const body: ExistingPortfolioRequest = await request.json()

        // --- Basic Validation ---
        if (!body.assets || !Array.isArray(body.assets) || body.assets.length < 2) {
            return NextResponse.json({ error: 'Please provide at least 2 assets to optimize.' }, { status: 400 })
        }
        if (!body.start_date || !body.end_date) {
            return NextResponse.json({ error: 'Start and end dates are required.' }, { status: 400 })
        }
        // You could add more detailed validation here as in the other route if needed

        console.log('Forwarding request to optimize existing portfolio:', body)

        // Forward the validated request to the Python backend's endpoint
        const response = await axios.post<ExistingPortfolioResponse>(`${BACKEND_URL}/optimize-existing`, body, {
            timeout: 120000, // 2-minute timeout
        })

        // Check if the backend returned a specific error within a valid response
        // Note: FastAPI often sends errors in `detail` for 4xx status codes, which is handled in the catch block.
        // This check is for cases where the backend returns a 200 OK with an error message in the body.
        if (response.data && 'error' in response.data) {
            return NextResponse.json({ error: (response.data as any).error }, { status: 400 })
        }

        return NextResponse.json(response.data)

    } catch (error) {
        console.error('API Route Error in /optimize-existing:', error)
        if (axios.isAxiosError(error)) {
            // Handle backend connection or timeout errors
            if (error.code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Backend service is unavailable.' }, { status: 503 })
            }
            // Handle errors returned from the backend API (e.g., validation errors)
            if (error.response) {
                console.error('Backend error response:', error.response.data);
                return NextResponse.json(
                    { error: error.response.data.detail || 'Backend processing failed.' },
                    { status: error.response.status }
                )
            }
            if (error.code === 'ECONNABORTED') {
                return NextResponse.json({ error: 'Optimization timeout. The request took too long.' }, { status: 408 });
            }
        }
        // Fallback for any other unexpected errors
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 })
    }
}
