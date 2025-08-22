import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export function RecommendedTradesTable({ results }) {
    const trades = results.quantum_trades;
    return (
        <div className="table-wrapper">
            <table className="table">
                <thead className="table-header">
                    <tr className="table-row">
                        <th className="table-head">Asset</th>
                        <th className="table-head">Current Shares</th>
                        <th className="table-head">Optimized Shares</th>
                        <th className="table-head">Action</th>
                        <th className="table-head">Shares to Trade</th>
                    </tr>
                </thead>
                <tbody className="table-body">
                    {trades.map((trade) => {
                        const actionClass =
                            trade.action === 'BUY' ? 'badge-green'
                                : trade.action === 'SELL' ? 'badge-destructive'
                                    : 'badge-outline';

                        return (
                            <tr key={trade.ticker} className="table-row">
                                <td className="table-cell font-medium">{trade.ticker}</td>
                                <td className="table-cell">{trade.current_shares.toFixed(2)}</td>
                                <td className="table-cell">{trade.target_shares.toFixed(2)}</td>
                                <td className="table-cell">
                                    <span className={`badge ${actionClass}`}>
                                        {trade.action === 'BUY' && <ArrowUp className="mr-1" size={12} />}
                                        {trade.action === 'SELL' && <ArrowDown className="mr-1" size={12} />}
                                        {trade.action === 'HOLD' && <Minus className="mr-1" size={12} />}
                                        {trade.action}
                                    </span>
                                </td>
                                <td className="table-cell font-semibold">{trade.amount.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}