import React from 'react';

const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;
const formatWeight = (value) => `${(value * 100).toFixed(1)}%`;

export function ResultsTable({ results }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Portfolio Weights</h3>
                <div className="table-wrapper">
                    <table className="table">
                        <thead className="table-header">
                            <tr className="table-row">
                                <th className="table-head">Asset</th>
                                <th className="table-head">Quantum Weight</th>
                                <th className="table-head">Classical Weight</th>
                                <th className="table-head">Difference</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {results.tickers.map((ticker, index) => {
                                const qWeight = results.quantum_weights[index];
                                const cWeight = results.classical_weights[index];
                                const diff = qWeight - cWeight;
                                return (
                                    <tr key={ticker} className="table-row">
                                        <td className="table-cell font-medium">{ticker}</td>
                                        <td className="table-cell">{formatWeight(qWeight)}</td>
                                        <td className="table-cell">{formatWeight(cWeight)}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${diff > 0 ? 'badge-green' : 'badge-secondary'}`}>
                                                {diff > 0 ? "+" : ""}{formatWeight(diff)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="table-wrapper">
                    <table className="table">
                        <thead className="table-header">
                            <tr className="table-row">
                                <th className="table-head">Metric</th>
                                <th className="table-head">Quantum</th>
                                <th className="table-head">Classical</th>
                                <th className="table-head">Improvement</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            <tr className="table-row">
                                <td className="table-cell font-medium">Expected Return</td>
                                <td className="table-cell">{formatPercent(results.quantum_return)}</td>
                                <td className="table-cell">{formatPercent(results.classical_return)}</td>
                                <td className="table-cell"><span className="badge badge-green">+{formatPercent(results.quantum_return - results.classical_return)}</span></td>
                            </tr>
                            <tr className="table-row">
                                <td className="table-cell font-medium">Risk (Volatility)</td>
                                <td className="table-cell">{formatPercent(results.quantum_risk)}</td>
                                <td className="table-cell">{formatPercent(results.classical_risk)}</td>
                                <td className="table-cell"><span className="badge badge-secondary">{formatPercent(results.quantum_risk - results.classical_risk)}</span></td>
                            </tr>
                            <tr className="table-row">
                                <td className="table-cell font-medium">Sharpe Ratio</td>
                                <td className="table-cell">{results.quantum_sharpe.toFixed(3)}</td>
                                <td className="table-cell">{results.classical_sharpe.toFixed(3)}</td>
                                <td className="table-cell"><span className="badge badge-green">+{(results.quantum_sharpe - results.classical_sharpe).toFixed(3)}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}