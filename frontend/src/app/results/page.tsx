// src/app/results/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResultsTable } from '@/components/ResultsTable'
import { PortfolioChart } from '@/components/PortfolioChart'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface PortfolioData {
    tickers: string[]
    start_date: string
    end_date: string
    risk_tolerance: number
}

interface OptimizationResult {
    quantum_weights: number[]
    classical_weights: number[]
    quantum_return: number
    classical_return: number
    quantum_risk: number
    classical_risk: number
    quantum_sharpe: number
    classical_sharpe: number
    tickers: string[]
    improvement_percent: number
}

export default function ResultsPage() {
    const router = useRouter()
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
    const [results, setResults] = useState<OptimizationResult | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Get portfolio data from sessionStorage
        const storedData = sessionStorage.getItem('portfolioData')
        if (!storedData) {
            toast.error('No portfolio data found. Redirecting to input page.')
            router.push('/portfolio')
            return
        }

        try {
            const data: PortfolioData = JSON.parse(storedData)
            setPortfolioData(data)
            // Start optimization
            optimizePortfolio(data)
        } catch (e) {
            toast.error('Invalid portfolio data. Please try again.')
            router.push('/portfolio')
        }
    }, [router])

    const optimizePortfolio = async (data: PortfolioData) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await axios.post('/api/optimize', data)
            setResults(response.data)
            toast.success('Portfolio optimization completed!')

        } catch (error) {
            console.error('Optimization error:', error)
            let errorMessage = 'An unexpected error occurred during optimization.'
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data?.error || 'Optimization failed on the backend.'
            }
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOptimizeAgain = () => {
        router.push('/portfolio')
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                                <h2 className="text-2xl font-semibold mb-2">Optimizing Your Portfolio</h2>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Our quantum algorithms are running. This may take a moment.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-destructive">Optimization Failed</CardTitle>
                            <CardDescription>
                                An error occurred while optimizing your portfolio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
                                    {error}
                                </p>
                                <Button onClick={handleOptimizeAgain}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!results || !portfolioData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No results to display.</p>
                                <Button onClick={handleOptimizeAgain} className="mt-4">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Portfolio
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Optimization Results</h1>
                        <p className="text-muted-foreground">
                            Quantum vs. Classical portfolio optimization comparison.
                        </p>
                    </div>
                    <Button onClick={handleOptimizeAgain} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        New Optimization
                    </Button>
                </div>

                {/* Performance Summary */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Quantum Advantage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                +{results.improvement_percent.toFixed(2)}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sharpe ratio improvement over classical
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Quantum Expected Return</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(results.quantum_return * 100).toFixed(2)}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Annualized expected return
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Quantum Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(results.quantum_risk * 100).toFixed(2)}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Annualized volatility
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quantum Portfolio Allocation</CardTitle>
                            <CardDescription>
                                Optimized asset weights from quantum analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioChart data={results} type="allocation" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Comparison</CardTitle>
                            <CardDescription>
                                Risk-Return profile of quantum vs. classical.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioChart data={results} type="performance" />
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Results Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Comparison</CardTitle>
                        <CardDescription>
                            Complete breakdown of quantum vs. classical optimization results.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResultsTable results={results} />
                    </CardContent>
                </Card>

                {/* Portfolio Summary */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Input Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>Assets:</strong> {portfolioData.tickers.join(', ')}</p>
                                <p><strong>Analysis Period:</strong> {portfolioData.start_date} to {portfolioData.end_date}</p>
                            </div>
                            <div>
                                <p><strong>Risk Tolerance:</strong> {portfolioData.risk_tolerance.toFixed(2)}</p>
                                <p><strong>Sharpe Ratio (Quantum):</strong> {results.quantum_sharpe.toFixed(3)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}