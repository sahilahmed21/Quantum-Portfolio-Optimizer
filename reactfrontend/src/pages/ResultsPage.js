import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Bot, Repeat, AlertTriangle } from 'lucide-react';

import { optimizePortfolio } from '../api/optimize';
import { optimizeExistingPortfolio } from '../api/optimizeExisting';

import { ProcessTimeline, OPTIMIZATION_STEPS } from '../components/ProcessTimeline';
import { ResultsTable } from '../components/ResultsTable';
import { RecommendedTradesTable } from '../components/RecommendedTradesTable';
import { PortfolioChart } from '../components/PortfolioChart';

const ResultsPage = () => {
    const navigate = useNavigate();

    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [optimizationType, setOptimizationType] = useState(null);

    // Timeline state
    const [currentStep, setCurrentStep] = useState(1);
    const [errorStepId, setErrorStepId] = useState(null);
    const [calculationDetails, setCalculationDetails] = useState(null);

    useEffect(() => {
        const storedDataString = sessionStorage.getItem('portfolioData');
        const type = sessionStorage.getItem('optimizationType');

        if (!storedDataString || !type) {
            toast.error('No portfolio data found. Redirecting...');
            navigate('/portfolio');
            return;
        }

        const storedData = JSON.parse(storedDataString);
        setOptimizationType(type);

        const runOptimizationProcess = async () => {
            const stepDurations = [1000, 1500, 2000, 3000, 500];
            let step = 1;

            const intervalId = setInterval(() => {
                if (step < OPTIMIZATION_STEPS.length) {
                    step++;
                    setCurrentStep(step);
                } else {
                    clearInterval(intervalId);
                }
            }, stepDurations[step - 1]);

            try {
                const apiCall = type === 'new' ? optimizePortfolio : optimizeExistingPortfolio;
                const responseData = await apiCall(storedData);

                setResults(responseData);
                if (responseData.calculation_details) {
                    setCalculationDetails(responseData.calculation_details);
                }
                toast.success('Optimization Complete!');
            } catch (err) {
                setError(err.message || 'An unexpected error occurred.');
                setErrorStepId(step);
                toast.error(err.message);
            } finally {
                clearInterval(intervalId);
                setIsLoading(false);
                // On success, ensure all steps are marked as complete
                if (!error) {
                    setCurrentStep(OPTIMIZATION_STEPS.length + 1);
                }
            }
        };

        runOptimizationProcess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const timelineStatus = useMemo(() => {
        if (error) return 'error';
        if (isLoading) return 'in-progress';
        return 'completed';
    }, [isLoading, error]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="card flex flex-col items-center justify-center" style={{ minHeight: '500px' }}>
                    <div className="card-header text-center">
                        <h2 className="card-header-title">Calculating Optimal Portfolio...</h2>
                        <p className="card-header-description">Please wait while our algorithms analyze the data.</p>
                    </div>
                    <div className="card-content">
                        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                </div>
            );
        }
        if (error) {
            return (
                <div className="card flex flex-col items-center justify-center" style={{ minHeight: '500px' }}>
                    <div className="card-header text-center">
                        <h2 className="card-header-title flex items-center gap-2" style={{ color: 'var(--destructive)' }}><AlertTriangle /> Optimization Failed</h2>
                    </div>
                    <div className="card-content text-center">
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button onClick={() => navigate('/portfolio')} className="btn btn-outline"><ArrowLeft size={16} className="mr-2" /> Try Again</button>
                    </div>
                </div>
            );
        }
        if (results) {
            return optimizationType === 'new' ? <NewPortfolioView results={results} onNewOptimization={() => navigate('/portfolio')} /> : <ExistingPortfolioView results={results} onNewOptimization={() => navigate('/portfolio')} />;
        }
        return null;
    }

    return (
        <div className="container-fluid">
            <div className="results-grid">
                {/* Column 1: Timeline */}
                <div className="lg-sticky">
                    <ProcessTimeline
                        steps={OPTIMIZATION_STEPS}
                        currentStepId={currentStep}
                        status={timelineStatus}
                        errorStepId={errorStepId}
                        calculationDetails={calculationDetails}
                    />
                </div>

                {/* Column 2: Main Content */}
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// No changes needed for the View components below
const NewPortfolioView = ({ results, onNewOptimization }) => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">Optimization Results</h1>
                <p className="text-muted-foreground">Quantum vs. Classical portfolio comparison.</p>
            </div>
            <button onClick={onNewOptimization} className="btn btn-outline"><ArrowLeft size={16} className="mr-2" /> New Optimization</button>
        </div>
        <div className="grid md-grid-cols-3 gap-6">
            <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium flex items-center"><Bot className="mr-2" size={16} />Quantum Advantage</h3></div><div className="card-content"><div className="text-2xl font-bold" style={{ color: 'var(--green)' }}>+{results.improvement_percent.toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Sharpe ratio improvement</p></div></div>
            <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium">Quantum Expected Return</h3></div><div className="card-content"><div className="text-2xl font-bold">{(results.quantum_return * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Annualized expected return</p></div></div>
            <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium">Quantum Risk</h3></div><div className="card-content"><div className="text-2xl font-bold">{(results.quantum_risk * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Annualized volatility</p></div></div>
        </div>
        <div className="grid lg-grid-cols-2 gap-6">
            <div className="card"><div className="card-header"><h3 className="card-header-title">Quantum Portfolio Allocation</h3><p className="card-header-description">Optimized asset weights from quantum analysis.</p></div><div className="card-content"><PortfolioChart data={results} type="allocation" /></div></div>
            <div className="card"><div className="card-header"><h3 className="card-header-title">Performance Comparison</h3><p className="card-header-description">Risk-Return profile of quantum vs. classical.</p></div><div className="card-content"><PortfolioChart data={results} type="performance" /></div></div>
        </div>
        <div className="card"><div className="card-header"><h3 className="card-header-title">Detailed Comparison</h3><p className="card-header-description">Complete breakdown of quantum vs. classical optimization results.</p></div><div className="card-content"><ResultsTable results={results} /></div></div>
    </div>
);

const ExistingPortfolioView = ({ results, onNewOptimization }) => {
    const performanceChartData = {
        tickers: ["Current Portfolio", "Quantum Optimized"],
        classical_risk: results.current_portfolio_metrics.risk,
        classical_return: results.current_portfolio_metrics.return,
        quantum_risk: results.quantum_portfolio_metrics.risk,
        quantum_return: results.quantum_portfolio_metrics.return,
        quantum_weights: [], classical_weights: [],
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Rebalancing Plan</h1>
                    <p className="text-muted-foreground">Trade recommendations to align your current portfolio with the optimal quantum state.</p>
                </div>
                <button onClick={onNewOptimization} className="btn btn-outline"><ArrowLeft size={16} className="mr-2" /> New Optimization</button>
            </div>
            <div className="grid md-grid-cols-3 gap-6">
                <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium flex items-center"><Repeat className="mr-2" size={16} />Trades Recommended</h3></div><div className="card-content"><div className="text-2xl font-bold" style={{ color: 'var(--blue)' }}>{results.quantum_trades.filter(t => t.action !== 'HOLD').length}</div><p className="text-xs text-muted-foreground mt-1">Actions to reach quantum-optimized state</p></div></div>
                <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium">Optimized Return</h3></div><div className="card-content"><div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.return * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.return * 100).toFixed(2)}%</p></div></div>
                <div className="card"><div className="card-header pb-3"><h3 className="card-header-title text-sm font-medium">Optimized Risk</h3></div><div className="card-content"><div className="text-2xl font-bold">{(results.quantum_portfolio_metrics.risk * 100).toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">vs. current {(results.current_portfolio_metrics.risk * 100).toFixed(2)}%</p></div></div>
            </div>
            <div className="card"><div className="card-header"><h3 className="card-header-title">Recommended Trades (Quantum)</h3><p className="card-header-description">Execute these trades to rebalance your portfolio.</p></div><div className="card-content"><RecommendedTradesTable results={results} /></div></div>
            <div className="grid lg-grid-cols-2 gap-6">
                <div className="card"><div className="card-header"><h3 className="card-header-title">Performance Improvement</h3><p className="card-header-description">Comparison of your current portfolio vs. the optimized target.</p></div><div className="card-content"><PortfolioChart data={performanceChartData} type="performance" /></div></div>
            </div>
        </div>
    );
};

export default ResultsPage;