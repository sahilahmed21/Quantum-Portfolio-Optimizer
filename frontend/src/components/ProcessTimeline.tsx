// src/components/ProcessTimeline.tsx
import { CheckCircle2, Loader2, XCircle, FileClock, BrainCircuit, TestTube2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VectorDisplay, MatrixDisplay } from './DataDisplay';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPE DEFINITIONS ---

type Status = 'pending' | 'in-progress' | 'completed' | 'error';

export interface CalculationDetails {
    tickers: string[];
    expected_returns: number[];
    covariance_matrix: number[][];
}

interface Step {
    id: number;
    title: string;
    description: string;
    renderDetails: (details: CalculationDetails | null) => React.ReactNode;
    icon: React.ElementType;
}

interface ProcessTimelineProps {
    steps: Step[];
    currentStepId: number;
    status: Status;
    errorStepId?: number | null;
    calculationDetails?: CalculationDetails | null;
}

// --- HELPER COMPONENTS ---

const StatusIcon = ({
    status,
    IconComponent,
}: {
    status: Status;
    IconComponent: React.ElementType<any>;
}) => {
    if (status === 'in-progress') return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
    if (status === 'completed') return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    if (status === 'error') return <XCircle className="h-6 w-6 text-red-500" />;
    return <IconComponent className="h-6 w-6 text-muted-foreground" />; // ✅ now works
};

// --- MAIN COMPONENT ---

export function ProcessTimeline({ steps, currentStepId, status, errorStepId, calculationDetails }: ProcessTimelineProps) {
    return (
        <Card className="overflow-hidden shadow-lg border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">Live Optimization Feed</CardTitle>
                <CardDescription>A real-time look at the computational process.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="relative pl-10">
                    {/* Vertical Line with Gradient */}
                    <div className="absolute left-5 top-0 h-full w-1 bg-gradient-to-b from-blue-200 via-green-200 to-transparent rounded-full" />

                    {steps.map((step, index) => {
                        const stepStatus: Status =
                            status === 'error' && step.id === errorStepId ? 'error'
                                : step.id < currentStepId ? 'completed'
                                    : step.id === currentStepId && status !== 'completed' ? status
                                        : status === 'completed' ? 'completed'
                                            : 'pending';

                        const isCompleted = stepStatus === 'completed';
                        const showDetails = isCompleted && calculationDetails;

                        return (
                            <motion.div
                                key={step.id}
                                className="relative pb-10"
                                initial={{ opacity: 0.6, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                            >
                                {/* Dot */}
                                <div className="absolute left-[-1.6rem] top-0">
                                    <motion.div
                                        className={cn(
                                            'z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 bg-background',
                                            stepStatus === 'in-progress' && 'border-blue-500 shadow-2xl shadow-blue-500/30',
                                            stepStatus === 'completed' && 'border-green-500 shadow-2xl shadow-green-500/30',
                                            stepStatus === 'error' && 'border-red-500 shadow-2xl shadow-red-500/30',
                                            stepStatus === 'pending' && 'border-border'
                                        )}
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: index * 0.2 }}
                                    >
                                        <StatusIcon status={stepStatus} IconComponent={step.icon} />
                                    </motion.div>
                                </div>

                                <div className="pl-6 pt-1">
                                    <p className="text-lg font-bold text-foreground">{step.title}</p>
                                    <p className="text-md text-muted-foreground mb-2">{step.description}</p>

                                    <AnimatePresence>
                                        {showDetails && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <Accordion type="single" collapsible className="w-full bg-muted/50 rounded-lg px-3 mt-2">
                                                    <AccordionItem value={`item-${step.id}`} className="border-none">
                                                        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2 font-semibold">
                                                            Learn More
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-4">
                                                            {step.renderDetails(calculationDetails)}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// --- DATA CONSTANT ---

export const OPTIMIZATION_STEPS: Step[] = [
    {
        id: 1,
        title: 'Fetching Market Data',
        description: 'Connecting to financial APIs...',
        icon: FileClock,
        renderDetails: () => (
            <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>What&apos;s happening:</strong> We are downloading daily historical stock prices for each selected ticker from the Yahoo Finance API.</p>
                <p><strong>Why:</strong> This historical data is the foundation for all subsequent calculations. It allows us to understand how each asset has performed and behaved in the past.</p>
            </div>
        ),
    },
    {
        id: 2,
        title: 'Calculating Financial Metrics',
        description: 'Building predictive models...',
        icon: TestTube2,
        renderDetails: (details) => (
            <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>What&apos;s happening:</strong> We are computing two critical inputs from the historical data: the expected returns for each asset and their covariance matrix.</p>
                <p><strong>Why:</strong> Expected returns (μ) estimate future performance, while the covariance matrix (Σ) measures how assets move in relation to each other. A positive covariance means they tend to move together; negative means they move opposite. This is crucial for diversification.</p>
                {details && (
                    <>
                        <VectorDisplay data={details.expected_returns} title="Shrunken Expected Returns (μ)" />
                        <MatrixDisplay data={details.covariance_matrix} headers={details.tickers} title="Ledoit-Wolf Covariance Matrix (Σ)" />
                    </>
                )}
            </div>
        ),
    },
    {
        id: 3,
        title: 'Running Classical Optimization',
        description: 'Finding the benchmark portfolio...',
        icon: Target,
        renderDetails: () => (
            <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>What&apos;s happening:</strong> A classical solver (SciPy&apos;s SLSQP) is running to find the Global Minimum Variance (GMV) portfolio.</p>
                <p><strong>Why:</strong> The GMV portfolio is the combination of assets that has the lowest possible risk (volatility). It serves as a robust, conservative benchmark against which we can compare our quantum-inspired solution.</p>
            </div>
        ),
    },
    {
        id: 4,
        title: 'Running Quantum-Inspired Optimization',
        description: 'Exploring thousands of possibilities...',
        icon: BrainCircuit,
        renderDetails: () => (
            <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>What&apos;s happening:</strong> We are simulating a Quantum Approximate Optimization Algorithm (QAOA) inspired heuristic. It rapidly evaluates thousands of potential portfolio combinations.</p>
                <p><strong>Why:</strong> Unlike the classical method that just minimizes risk, this algorithm seeks the best possible portfolio that balances risk and return according to your specific risk tolerance. It&apos;s designed to navigate complex relationships between assets that classical methods might miss.</p>
            </div>
        ),
    },
    {
        id: 5,
        title: 'Finalizing Results',
        description: 'Preparing your results...',
        icon: CheckCircle2,
        renderDetails: () => (
            <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>What&apos;s happening:</strong> Both optimization processes are complete. We are now compiling the results, calculating performance metrics, and generating the data for the charts and tables.</p>
                <p><strong>Why:</strong> This final step packages the complex output into a clear, human-readable format, allowing you to easily compare the classical and quantum-inspired strategies.</p>
            </div>
        ),
    },
];
