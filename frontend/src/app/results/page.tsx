// src/app/results/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Bot, Target, Repeat } from 'lucide-react'

// Import all required components
import { ResultsTable } from '@/components/ResultsTable'
import { RecommendedTradesTable } from '@/components/RecommendedTradesTable'
import { PortfolioChart } from '@/components/PortfolioChart'

// --- Type Definitions ---
// For storing the user's initial input
interface PortfolioData {
    tickers?: string[]; // For 'new' mode
    assets?: { ticker: string, shares: string }[]; // For 'existing' mode
    start_date: string;
    end_date: string;
    risk_tolerance: number;
}

// For the 'new' portfolio optimization result
interface NewPortfolioResult {
    tickers: string[];
    classical_weights: number[];
    quantum_weights: number[];
    classical_return: number; classical_risk: number; classical_sharpe: number;
    quantum_return: number; quantum_risk: number; quantum_sharpe: number;
    improvement_percent: number;
}

// For the 'existing' portfolio optimization result
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
interface ExistingPortfolioResult {
    quantum_trades: Trade[];
    classical_trades: Trade[];
    current_portfolio_metrics: PortfolioMetrics;
    quantum_portfolio_metrics: PortfolioMetrics;
    classical_portfolio_metrics: PortfolioMetrics;
}

export default function ResultsPage() {
    const router = useRouter()
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [results, setResults] = useState<NewPortfolioResult | ExistingPortfolioResult | null>(null)
    const [optimizationType, setOptimizationType] = useState<'new' | 'existing' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const storedDataString = sessionStorage.getItem('portfolioData')
        const type = sessionStorage.getItem('optimizationType') as 'new' | 'existing' | null

        if (!storedDataString || !type) {
            toast.error('No portfolio data found. Redirecting...')
            router.push('/portfolio')
            return
        }

        const storedData: PortfolioData = JSON.parse(storedDataString);
        setPortfolioData(storedData); // Save for summary card
        setOptimizationType(type);

        const endpoint = type === 'new' ? '/api/optimize' : '/api/optimize-existing'

        const optimizePortfolio = async () => {
            try {
                const response = await axios.post(endpoint, storedData)
                setResults(response.data)
                toast.success('Optimization Complete!')
            } catch (err: any) {
                const errorMessage = err.response?.data?.error || 'An unexpected error occurred.'
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }
        optimizePortfolio()
    }, [router])

    const handleGoBack = () => router.push('/portfolio')

    // --- Loading and Error States ---
    if (isLoading) { /* ... (same as your original) ... */ }
    if (error) { /* ... (same as your original) ... */ }
    if (!results || !portfolioData) { /* ... (same as your original) ... */ }

    // --- Conditional Rendering for 'NEW' vs 'EXISTING' ---
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {optimizationType === 'new' ? (
                    portfolioData && results ? (
                        <NewPortfolioView
                            results={results as NewPortfolioResult}
                            portfolioData={portfolioData as PortfolioData}
                            onNewOptimization={handleGoBack}
                        />
                    ) : null
                ) : (
                    portfolioData && results ? (
                        <ExistingPortfolioView
                            results={results as ExistingPortfolioResult}
                            portfolioData={portfolioData as PortfolioData}
                            onNewOptimization={handleGoBack}
                        />
                    ) : null
                )}
            </div>
        </div>
    )
}

// --- Component for NEW Portfolio Results View ---
const NewPortfolioView = ({ results, portfolioData, onNewOptimization }: { results: NewPortfolioResult, portfolioData: PortfolioData, onNewOptimization: () => void }) => (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">Optimization Results</h1>
                <p className="text-muted-foreground">Quantum vs. Classical portfolio optimization comparison.</p>
            </div>
            <Button onClick={onNewOptimization} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> New Optimization</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center"><Bot className="mr-2 h-4 w-4" />Quantum Advantage</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">+{results.improvement_percent.toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Sharpe ratio improvement over classical</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Quantum Expected Return</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(results.quantum_return * 100).toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Annualized expected return</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Quantum Risk</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(results.quantum_risk * 100).toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Annualized volatility</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Quantum Portfolio Allocation</CardTitle><CardDescription>Optimized asset weights from quantum analysis.</CardDescription></CardHeader>
                <CardContent><PortfolioChart data={results} type="allocation" /></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Performance Comparison</CardTitle><CardDescription>Risk-Return profile of quantum vs. classical.</CardDescription></CardHeader>
                <CardContent><PortfolioChart data={results} type="performance" /></CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Detailed Comparison</CardTitle><CardDescription>Complete breakdown of quantum vs. classical optimization results.</CardDescription></CardHeader>
            <CardContent><ResultsTable results={results} /></CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Input Summary</CardTitle></CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><strong>Assets:</strong> {portfolioData.tickers?.join(', ')}</p>
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
);

// --- Component for EXISTING Portfolio Results View ---
const ExistingPortfolioView = ({ results, portfolioData, onNewOptimization }: { results: ExistingPortfolioResult, portfolioData: PortfolioData, onNewOptimization: () => void }) => {

    // Adapt data for the performance chart: "Classical" will represent "Current"
    const performanceChartData: NewPortfolioResult = {
        tickers: ["Current Portfolio", "Quantum Optimized"],
        classical_weights: [], quantum_weights: [], improvement_percent: 0,
        classical_return: results.current_portfolio_metrics.return,
        classical_risk: results.current_portfolio_metrics.risk,
        classical_sharpe: results.current_portfolio_metrics.sharpe,
        quantum_return: results.quantum_portfolio_metrics.return,
        quantum_risk: results.quantum_portfolio_metrics.risk,
        quantum_sharpe: results.quantum_portfolio_metrics.sharpe
    };

    // Adapt data for the allocation pie chart
    const totalTargetValue = results.quantum_trades.reduce((sum, trade) => sum + (trade.target_shares * (trade.current_shares > 0 ? trade.amount / trade.target_shares : 1)), 0);
    const allocationChartData: NewPortfolioResult = {
        tickers: results.quantum_trades.map(t => t.ticker),
        quantum_weights: results.quantum_trades.map(trade => (trade.target_shares * (trade.current_shares > 0 ? trade.amount / trade.target_shares : 1)) / totalTargetValue),
        classical_weights: [], classical_return: 0, classical_risk: 0, classical_sharpe: 0, quantum_return: 0, quantum_risk: 0, quantum_sharpe: 0, improvement_percent: 0,
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Rebalancing Plan</h1>
                    <p className="text-muted-foreground">Trade recommendations to align your current portfolio with the optimal quantum state.</p>
                </div>
                <Button onClick={onNewOptimization} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> New Optimization</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center"><Repeat className="mr-2 h-4 w-4" />Trades Recommended</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{results.quantum_trades.filter(t => t.action !== 'HOLD').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Actions to reach quantum-optimized state</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Optimized Return</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.return * 100).toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.return * 100).toFixed(2)}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Optimized Risk</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.risk * 100).toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.risk * 100).toFixed(2)}%</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Recommended Trades (Quantum)</CardTitle><CardDescription>Execute these trades to rebalance your portfolio.</CardDescription></CardHeader>
                <CardContent><RecommendedTradesTable results={results} /></CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Target Portfolio Allocation</CardTitle><CardDescription>The ideal asset allocation after rebalancing.</CardDescription></CardHeader>
                    <CardContent><PortfolioChart data={allocationChartData} type="allocation" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Performance Improvement</CardTitle><CardDescription>Comparison of your current portfolio vs. the optimized target.</CardDescription></CardHeader>
                    <CardContent><PortfolioChart data={performanceChartData} type="performance" /></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Input Summary</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>Your Assets:</strong></p>
                            <ul className="list-disc list-inside">
                                {portfolioData.assets?.map(a => <li key={a.ticker}>{a.ticker}: {a.shares} shares</li>)}
                            </ul>
                        </div>
                        <div>
                            <p><strong>Analysis Period:</strong> {portfolioData.start_date} to {portfolioData.end_date}</p>
                            <p><strong>Risk Tolerance:</strong> {portfolioData.risk_tolerance.toFixed(2)}</p>
                            <p><strong>Optimized Sharpe Ratio:</strong> {results.quantum_portfolio_metrics.sharpe.toFixed(3)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};