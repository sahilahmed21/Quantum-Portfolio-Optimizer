// src/app/api/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Define the backend URL (you'll need to update this when you deploy your backend)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate the request body
        if (!body.tickers || !Array.isArray(body.tickers) || body.tickers.length === 0) {
            return NextResponse.json(
                { error: 'Tickers array is required' },
                { status: 400 }
            )
        }

        if (!body.start_date || !body.end_date) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            )
        }

        if (body.risk_tolerance === undefined || body.risk_tolerance < 0 || body.risk_tolerance > 1) {
            return NextResponse.json(
                { error: 'Risk tolerance must be between 0 and 1' },
                { status: 400 }
            )
        }

        // Forward the request to the Python backend
        const response = await axios.post(`${BACKEND_URL}/optimize`, {
            tickers: body.tickers,
            start_date: body.start_date,
            end_date: body.end_date,
            risk_tolerance: body.risk_tolerance
        }, {
            timeout: 60000, // 60 second timeout for quantum optimization
            headers: {
                'Content-Type': 'application/json',
            }
        })

        // Return the response from the backend
        return NextResponse.json(response.data)

    } catch (error) {
        console.error('API Error:', error)

        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                return NextResponse.json(
                    { error: 'Backend service is unavailable. Please try again later.' },
                    { status: 503 }
                )
            }

            if (error.response) {
                return NextResponse.json(
                    { error: error.response.data?.error || 'Backend error occurred' },
                    { status: error.response.status }
                )
            }

            if (error.code === 'ECONNABORTED') {
                return NextResponse.json(
                    { error: 'Request timeout. Optimization is taking too long.' },
                    { status: 408 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// For development: Mock response when backend is not available
export async function GET() {
    return NextResponse.json({
        message: 'Portfolio optimization API is running',
        endpoints: {
            optimize: 'POST /api/optimize'
        }
    })
}