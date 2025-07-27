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

export async function POST(request: NextRequest) {
    try {
        const body: ExistingPortfolioRequest = await request.json()

        // --- Basic Validation ---
        if (!body.assets || body.assets.length < 2) {
            return NextResponse.json({ error: 'Please provide at least 2 assets to optimize.' }, { status: 400 })
        }
        if (!body.start_date || !body.end_date) {
            return NextResponse.json({ error: 'Start and end dates are required.' }, { status: 400 })
        }

        console.log('Forwarding request to optimize existing portfolio:', body)

        // Forward the validated request to the Python backend's new endpoint
        const response = await axios.post(`${BACKEND_URL}/optimize-existing`, body, {
            timeout: 120000, // 2-minute timeout
        })

        // Check if the backend returned a specific error
        if (response.data && response.data.error) {
            return NextResponse.json({ error: response.data.error }, { status: 400 })
        }

        return NextResponse.json(response.data)
    } catch (error) {
        console.error('API Route Error:', error)
        if (axios.isAxiosError(error)) {
            // Handle backend connection or timeout errors
            if (error.code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Backend service is unavailable.' }, { status: 503 })
            }
            if (error.response) {
                return NextResponse.json({ error: error.response.data.detail || 'Backend processing failed.' }, { status: error.response.status })
            }
        }
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 })
    }
}