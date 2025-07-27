'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Trade {
    ticker: string
    current_shares: number
    target_shares: number
    action: 'BUY' | 'SELL' | 'HOLD'
    amount: number
}

interface TradesResult {
    quantum_trades: Trade[]
    classical_trades: Trade[]
}

interface RecommendedTradesTableProps {
    results: TradesResult
}

export function RecommendedTradesTable({ results }: RecommendedTradesTableProps) {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Quantum-Optimized Trades</h3>
                <p className="text-sm text-muted-foreground mb-4">Recommended actions to rebalance your portfolio to the quantum-optimized state.</p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Current Shares</TableHead>
                            <TableHead>Optimized Shares</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Shares to Trade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.quantum_trades.map((trade) => (
                            <TableRow key={trade.ticker}>
                                <TableCell className="font-medium">{trade.ticker}</TableCell>
                                <TableCell>{trade.current_shares.toFixed(2)}</TableCell>
                                <TableCell>{trade.target_shares.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={trade.action === 'BUY' ? 'default' : trade.action === 'SELL' ? 'destructive' : 'outline'}>
                                        {trade.action === 'BUY' && <ArrowUp className="h-3 w-3 mr-1" />}
                                        {trade.action === 'SELL' && <ArrowDown className="h-3 w-3 mr-1" />}
                                        {trade.action === 'HOLD' && <Minus className="h-3 w-3 mr-1" />}
                                        {trade.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>{trade.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}