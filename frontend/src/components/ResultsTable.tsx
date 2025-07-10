// src/components/ResultsTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

interface ResultsTableProps {
    results: OptimizationResult
}

export function ResultsTable({ results }: ResultsTableProps) {
    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`
    const formatWeight = (value: number) => `${(value * 100).toFixed(1)}%`

    return (
        <div className="space-y-6">
            {/* Portfolio Weights Table */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Portfolio Weights</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Quantum Weight</TableHead>
                            <TableHead>Classical Weight</TableHead>
                            <TableHead>Difference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.tickers.map((ticker, index) => {
                            const quantumWeight = results.quantum_weights[index]
                            const classicalWeight = results.classical_weights[index]
                            const difference = quantumWeight - classicalWeight

                            return (
                                <TableRow key={ticker}>
                                    <TableCell className="font-medium">{ticker}</TableCell>
                                    <TableCell>{formatWeight(quantumWeight)}</TableCell>
                                    <TableCell>{formatWeight(classicalWeight)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={difference > 0 ? "default" : difference < 0 ? "secondary" : "outline"}
                                            className="text-xs"
                                        >
                                            {difference > 0 ? "+" : ""}{formatWeight(difference)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Performance Metrics Table */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Quantum</TableHead>
                            <TableHead>Classical</TableHead>
                            <TableHead>Improvement</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Expected Return</TableCell>
                            <TableCell>{formatPercent(results.quantum_return)}</TableCell>
                            <TableCell>{formatPercent(results.classical_return)}</TableCell>
                            <TableCell>
                                <Badge variant={results.quantum_return > results.classical_return ? "default" : "secondary"}>
                                    {results.quantum_return > results.classical_return ? "+" : ""}
                                    {formatPercent(results.quantum_return - results.classical_return)}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="font-medium">Risk (Volatility)</TableCell>
                            <TableCell>{formatPercent(results.quantum_risk)}</TableCell>
                            <TableCell>{formatPercent(results.classical_risk)}</TableCell>
                            <TableCell>
                                <Badge variant={results.quantum_risk < results.classical_risk ? "default" : "secondary"}>
                                    {results.quantum_risk < results.classical_risk ? "" : "+"}
                                    {formatPercent(results.quantum_risk - results.classical_risk)}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="font-medium">Sharpe Ratio</TableCell>
                            <TableCell>{results.quantum_sharpe.toFixed(3)}</TableCell>
                            <TableCell>{results.classical_sharpe.toFixed(3)}</TableCell>
                            <TableCell>
                                <Badge variant={results.quantum_sharpe > results.classical_sharpe ? "default" : "secondary"}>
                                    {results.quantum_sharpe > results.classical_sharpe ? "+" : ""}
                                    {(results.quantum_sharpe - results.classical_sharpe).toFixed(3)}
                                </Badge>
                            </TableCell>
                        </TableRow>

                        <TableRow className="border-t-2">
                            <TableCell className="font-bold">Overall Improvement</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>
                                <Badge variant="default" className="text-sm">
                                    +{results.improvement_percent.toFixed(2)}%
                                </Badge>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Risk-Return Analysis */}
            <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Summary</h4>
                <div className="text-sm space-y-1">
                    <p>
                        <strong>Return Enhancement:</strong> Quantum optimization achieved {formatPercent(results.quantum_return)}
                        expected return vs {formatPercent(results.classical_return)} classical
                        ({results.quantum_return > results.classical_return ? "+" : ""}{formatPercent(results.quantum_return - results.classical_return)} improvement)
                    </p>
                    <p>
                        <strong>Risk Management:</strong> Quantum risk of {formatPercent(results.quantum_risk)}
                        vs classical risk of {formatPercent(results.classical_risk)}
                        ({results.quantum_risk < results.classical_risk ? "reduced" : "increased"} by {formatPercent(Math.abs(results.quantum_risk - results.classical_risk))})
                    </p>
                    <p>
                        <strong>Risk-Adjusted Performance:</strong> The quantum Sharpe ratio of {results.quantum_sharpe.toFixed(3)}
                        {results.quantum_sharpe > results.classical_sharpe ? "outperforms" : "underperforms"}
                        the classical ratio of {results.classical_sharpe.toFixed(3)}
                    </p>
                </div>
            </div>
        </div>
    )
}