// src/app/results/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Bot, Repeat, AlertTriangle } from 'lucide-react'

// Import all required components, including the new timeline
import { ProcessTimeline, OPTIMIZATION_STEPS, CalculationDetails } from '@/components/ProcessTimeline'
import { ResultsTable } from '@/components/ResultsTable'
import { RecommendedTradesTable } from '@/components/RecommendedTradesTable'
import { PortfolioChart } from '@/components/PortfolioChart'

// --- Type Definitions ---
interface PortfolioData {
    tickers?: string[];
    assets?: { ticker: string, shares: string }[];
    start_date: string;
    end_date: string;
    risk_tolerance: number;
}

// Error handling types
interface ApiError {
    response?: {
        data?: {
            error?: string;
        };
    };
}

// Helper function to extract error message
const extractErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as ApiError;
        return apiErr.response?.data?.error || 'An unexpected error occurred.';
    }
    return 'An unexpected error occurred.';
};

// This now includes the detailed calculation data
interface NewPortfolioResult {
    tickers: string[];
    classical_weights: number[];
    quantum_weights: number[];
    classical_return: number; classical_risk: number; classical_sharpe: number;
    quantum_return: number; quantum_risk: number; quantum_sharpe: number;
    improvement_percent: number;
    calculation_details: CalculationDetails; // The new rich data object
}

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

// --- Main Page Component ---
export default function ResultsPage() {
    const router = useRouter()

    // State for data and UI control
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [results, setResults] = useState<NewPortfolioResult | ExistingPortfolioResult | null>(null)
    const [optimizationType, setOptimizationType] = useState<'new' | 'existing' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // State for the process timeline
    const [currentStep, setCurrentStep] = useState(1);
    const [errorStepId, setErrorStepId] = useState<number | null>(null);
    const [calculationDetails, setCalculationDetails] = useState<CalculationDetails | null>(null);

    useEffect(() => {
        const storedDataString = sessionStorage.getItem('portfolioData')
        const type = sessionStorage.getItem('optimizationType') as 'new' | 'existing' | null

        if (!storedDataString || !type) {
            toast.error('No portfolio data found. Redirecting...')
            router.push('/portfolio')
            return
        }

        const storedData: PortfolioData = JSON.parse(storedDataString);
        setPortfolioData(storedData);
        setOptimizationType(type);

        const endpoint = type === 'new' ? '/api/optimize' : '/api/optimize-existing'

        const runOptimizationProcess = async () => {
            // Simulate the steps for a better UX
            const stepDurations = [1000, 1500, 2000, 3000, 500];
            let step = 1;

            const intervalId = setInterval(() => {
                if (isLoading) { // Only advance steps while loading
                    step++;
                    if (step <= OPTIMIZATION_STEPS.length) {
                        setCurrentStep(step);
                    } else {
                        clearInterval(intervalId);
                    }
                } else {
                    clearInterval(intervalId);
                }
            }, stepDurations[step - 1]);

            try {
                const response = await axios.post(endpoint, storedData)

                // The API route now standardizes the response, so we can treat it consistently.
                const newResults = response.data as NewPortfolioResult;

                if (type === 'new') {
                    setResults(newResults);
                    // Store the detailed calculation data for the timeline
                    setCalculationDetails(newResults.calculation_details);
                } else {
                    setResults(response.data as ExistingPortfolioResult);
                }
                toast.success('Optimization Complete!')
            } catch (err: unknown) {
                const errorMessage = extractErrorMessage(err);
                setError(errorMessage)
                setErrorStepId(step); // Mark the current step as the one that failed
                toast.error(errorMessage)
            } finally {
                clearInterval(intervalId);
                setIsLoading(false)
                // On successful completion, ensure the final step is marked as 'completed'
                if (!error) {
                    setCurrentStep(OPTIMIZATION_STEPS.length + 1); // Go past the final step to ensure it's marked done
                }
            }
        }

        runOptimizationProcess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Use empty dependency array to run only once on mount

    const timelineStatus = useMemo(() => {
        if (error) return 'error';
        if (isLoading) return 'in-progress';
        return 'completed';
    }, [isLoading, error]);


    // Don't render anything until portfolio data is loaded to prevent flicker
    if (!portfolioData) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="w-full px-4 py-8"> {/* full width */}
            <div className="grid lg:grid-cols-3 gap-8 items-start"> {/* 3 cols: 1/3 + 2/3 */}

                {/* Left Column: Process Timeline (1/3) */}
                <div className="lg:col-span-1 lg:sticky lg:top-8">
                    <ProcessTimeline
                        steps={OPTIMIZATION_STEPS}
                        currentStepId={currentStep}
                        status={timelineStatus}
                        errorStepId={errorStepId}
                        calculationDetails={calculationDetails}
                    />
                </div>

                {/* Right Column: Results (2/3) */}
                <div className="lg:col-span-2">
                    {isLoading && (
                        <Card className="flex flex-col items-center justify-center min-h-[500px]">
                            <CardHeader>
                                <CardTitle className="text-center">Calculating Optimal Portfolio...</CardTitle>
                                <CardDescription>Please wait while our algorithms analyze the data.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </CardContent>
                        </Card>
                    )}
                    {error && (
                        <Card className="flex flex-col items-center justify-center min-h-[500px]">
                            <CardHeader>
                                <CardTitle className="text-center text-destructive flex items-center gap-2">
                                    <AlertTriangle /> Optimization Failed
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <Button onClick={() => router.push('/portfolio')} variant="outline">
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {!isLoading && !error && results && (
                        optimizationType === 'new' ? (
                            <NewPortfolioView
                                results={results as NewPortfolioResult}
                                onNewOptimization={() => router.push('/portfolio')}
                            />
                        ) : (
                            <ExistingPortfolioView
                                results={results as ExistingPortfolioResult}
                                onNewOptimization={() => router.push('/portfolio')}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    )

}


// --- Sub-components for Results Display (No changes needed) ---
const NewPortfolioView = ({ results, onNewOptimization }: { results: NewPortfolioResult, onNewOptimization: () => void }) => (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">Optimization Results</h1>
                <p className="text-muted-foreground">Quantum vs. Classical portfolio comparison.</p>
            </div>
            <Button onClick={onNewOptimization} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> New Optimization</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center"><Bot className="mr-2 h-4 w-4" />Quantum Advantage</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{results.improvement_percent.toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Sharpe ratio improvement over classical</p></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Quantum Expected Return</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(results.quantum_return * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Annualized expected return</p></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Quantum Risk</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(results.quantum_risk * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Annualized volatility</p></CardContent></Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle>Quantum Portfolio Allocation</CardTitle><CardDescription>Optimized asset weights from quantum analysis.</CardDescription></CardHeader><CardContent><PortfolioChart data={results} type="allocation" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Performance Comparison</CardTitle><CardDescription>Risk-Return profile of quantum vs. classical.</CardDescription></CardHeader><CardContent><PortfolioChart data={results} type="performance" /></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Detailed Comparison</CardTitle><CardDescription>Complete breakdown of quantum vs. classical optimization results.</CardDescription></CardHeader><CardContent><ResultsTable results={results} /></CardContent></Card>
    </div>
);
const ExistingPortfolioView = ({ results, onNewOptimization }: { results: ExistingPortfolioResult, onNewOptimization: () => void }) => {

    const performanceChartData: NewPortfolioResult = {
        tickers: ["Current Portfolio", "Quantum Optimized"],
        classical_weights: [], quantum_weights: [], improvement_percent: 0,
        classical_return: results.current_portfolio_metrics.return,
        classical_risk: results.current_portfolio_metrics.risk,
        classical_sharpe: results.current_portfolio_metrics.sharpe,
        quantum_return: results.quantum_portfolio_metrics.return,
        quantum_risk: results.quantum_portfolio_metrics.risk,
        quantum_sharpe: results.quantum_portfolio_metrics.sharpe,
        calculation_details: { tickers: [], expected_returns: [], covariance_matrix: [] }
    };

    const totalTargetValue = results.quantum_trades.reduce((sum, trade) => sum + (trade.target_shares * (trade.current_shares > 0 ? trade.amount / trade.target_shares : 1)), 0);
    const allocationChartData: NewPortfolioResult = {
        tickers: results.quantum_trades.map(t => t.ticker),
        quantum_weights: results.quantum_trades.map(trade => (trade.target_shares * (trade.current_shares > 0 ? trade.amount / trade.target_shares : 1)) / totalTargetValue),
        classical_weights: [], classical_return: 0, classical_risk: 0, classical_sharpe: 0, quantum_return: 0, quantum_risk: 0, quantum_sharpe: 0, improvement_percent: 0,
        calculation_details: { tickers: [], expected_returns: [], covariance_matrix: [] }
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
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center"><Repeat className="mr-2 h-4 w-4" />Trades Recommended</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{results.quantum_trades.filter(t => t.action !== 'HOLD').length}</div><p className="text-xs text-muted-foreground mt-1">Actions to reach quantum-optimized state</p></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Optimized Return</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.return * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.return * 100).toFixed(2)}%</p></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Optimized Risk</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.risk * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.risk * 100).toFixed(2)}%</p></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle>Recommended Trades (Quantum)</CardTitle><CardDescription>Execute these trades to rebalance your portfolio.</CardDescription></CardHeader><CardContent><RecommendedTradesTable results={results} /></CardContent></Card>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Target Portfolio Allocation</CardTitle><CardDescription>The ideal asset allocation after rebalancing.</CardDescription></CardHeader><CardContent><PortfolioChart data={allocationChartData} type="allocation" /></CardContent></Card>
                <Card><CardHeader><CardTitle>Performance Improvement</CardTitle><CardDescription>Comparison of your current portfolio vs. the optimized target.</CardDescription></CardHeader><CardContent><PortfolioChart data={performanceChartData} type="performance" /></CardContent></Card>
            </div>
        </div>
    );
};
