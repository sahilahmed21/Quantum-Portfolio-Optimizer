import React from 'react';
import { CheckCircle2, Loader2, XCircle, FileClock, BrainCircuit, TestTube2, Target } from 'lucide-react';
import { VectorDisplay, MatrixDisplay } from './DataDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const StatusIcon = ({ status, IconComponent }) => {
    if (status === 'in-progress') return <Loader2 size={20} className="animate-spin" style={{ color: 'var(--blue)' }} />;
    if (status === 'completed') return <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />;
    if (status === 'error') return <XCircle size={20} style={{ color: 'var(--red)' }} />;
    return <IconComponent size={20} className="text-muted-foreground" />;
};

const Accordion = ({ step, calculationDetails }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <>
            <button className="timeline-accordion-trigger" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? 'Hide Details' : 'Learn More'}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: '0.75rem' }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {step.renderDetails(calculationDetails)}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export function ProcessTimeline({ steps, currentStepId, status, errorStepId, calculationDetails }) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-header-title">Live Optimization Feed</h2>
                <p className="card-header-description">A real-time look at the computational process.</p>
            </div>
            <div className="card-content">
                <div className="timeline">
                    {steps.map((step) => {
                        const stepStatus =
                            status === 'error' && step.id === errorStepId ? 'error'
                                : step.id < currentStepId ? 'completed'
                                    : step.id === currentStepId && status !== 'completed' ? status
                                        : status === 'completed' ? 'completed'
                                            : 'pending';

                        // const showDetails = isCompleted && calculationDetails && (step.id === 2); // Only show details for step 2

                        return (
                            <div key={step.id} className="timeline-item" data-status={stepStatus}>
                                <div className="timeline-connector" />
                                <div className="timeline-icon-container">
                                    <StatusIcon status={stepStatus} IconComponent={step.icon} />
                                </div>
                                <div className="timeline-content">
                                    <p className="timeline-title">{step.title}</p>
                                    <p className="timeline-description">{step.description}</p>
                                    <Accordion step={step} calculationDetails={calculationDetails} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Data Constant (No Changes)
export const OPTIMIZATION_STEPS = [
    { id: 1, title: 'Fetching Market Data', description: 'Connecting to financial APIs...', icon: FileClock, renderDetails: () => (<div className="text-sm space-y-2 text-muted-foreground"><p><strong>What's happening:</strong> We are downloading daily historical stock prices for each selected ticker from the Yahoo Finance API.</p><p><strong>Why:</strong> This historical data is the foundation for all subsequent calculations. It allows us to understand how each asset has performed and behaved in the past.</p></div>) },
    { id: 2, title: 'Calculating Financial Metrics', description: 'Building predictive models...', icon: TestTube2, renderDetails: (details) => (<div className="text-sm space-y-2 text-muted-foreground"><p><strong>What's happening:</strong> We are computing two critical inputs from the historical data: the expected returns for each asset and their covariance matrix.</p><p><strong>Why:</strong> This is crucial for diversification.</p>{details && (<><VectorDisplay data={details.expected_returns} title="Expected Returns (μ)" /><MatrixDisplay data={details.covariance_matrix} headers={details.tickers} title="Covariance Matrix (Σ)" /></>)}</div>) },
    { id: 3, title: 'Running Classical Optimization', description: 'Finding the benchmark portfolio...', icon: Target, renderDetails: () => (<div className="text-sm space-y-2 text-muted-foreground"><p><strong>What's happening:</strong> A classical solver is finding the Global Minimum Variance (GMV) portfolio.</p><p><strong>Why:</strong> The GMV portfolio is the combination of assets with the lowest possible risk, serving as a robust benchmark.</p></div>) },
    { id: 4, title: 'Running Quantum-Inspired Optimization', description: 'Exploring thousands of possibilities...', icon: BrainCircuit, renderDetails: () => (<div className="text-sm space-y-2 text-muted-foreground"><p><strong>What's happening:</strong> A Quantum Approximate Optimization Algorithm (QAOA) inspired heuristic is evaluating thousands of portfolio combinations.</p><p><strong>Why:</strong> This algorithm seeks the best portfolio balancing risk and return according to your specific risk tolerance.</p></div>) },
    { id: 5, title: 'Finalizing Results', description: 'Preparing your results...', icon: CheckCircle2, renderDetails: () => (<div className="text-sm space-y-2 text-muted-foreground"><p><strong>What's happening:</strong> We are compiling the results, calculating performance metrics, and generating the data for the charts and tables.</p><p><strong>Why:</strong> This final step packages the complex output into a clear, human-readable format for comparison.</p></div>) },
];