// src/components/PortfolioChart.tsx
'use client'

import { useEffect, useRef } from 'react'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
} from 'chart.js'
import { Pie, Scatter, Bar } from 'react-chartjs-2'

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title
)

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

interface PortfolioChartProps {
    data: OptimizationResult
    type: 'allocation' | 'performance'
}

export function PortfolioChart({ data, type }: PortfolioChartProps) {
    const chartRef = useRef<any>(null)

    // Define consistent colors for assets
    const getColors = (count: number) => {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
        ]
        return colors.slice(0, count)
    }

    if (type === 'allocation') {
        // Pie chart comparing quantum vs classical weights
        const colors = getColors(data.tickers.length)

        const quantumData = {
            labels: data.tickers,
            datasets: [
                {
                    label: 'Quantum Weights',
                    data: data.quantum_weights.map(w => w * 100),
                    backgroundColor: colors.map(color => color + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                },
            ],
        }

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                },
                title: {
                    display: true,
                    text: 'Quantum Optimized Portfolio Allocation',
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`
                        }
                    }
                }
            },
        }

        return (
            <div className="h-64">
                <Pie ref={chartRef} data={quantumData} options={options} />
            </div>
        )
    }

    if (type === 'performance') {
        // Scatter plot showing risk-return comparison
        const scatterData = {
            datasets: [
                {
                    label: 'Quantum Optimization',
                    data: [{
                        x: data.quantum_risk * 100,
                        y: data.quantum_return * 100,
                    }],
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                },
                {
                    label: 'Classical Optimization',
                    data: [{
                        x: data.classical_risk * 100,
                        y: data.classical_return * 100,
                    }],
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                },
            ],
        }

        const scatterOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                },
                title: {
                    display: true,
                    text: 'Risk-Return Comparison',
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            return `${context.dataset.label}: Risk ${context.parsed.x.toFixed(2)}%, Return ${context.parsed.y.toFixed(2)}%`
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Risk (Volatility %)',
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Expected Return (%)',
                    },
                },
            },
        }

        return (
            <div className="h-64">
                <Scatter ref={chartRef} data={scatterData} options={scatterOptions} />
            </div>
        )
    }

    // Default: Bar chart comparing weights
    const colors = getColors(data.tickers.length)

    const barData = {
        labels: data.tickers,
        datasets: [
            {
                label: 'Quantum Weights',
                data: data.quantum_weights.map(w => w * 100),
                backgroundColor: colors.map(color => color + '80'),
                borderColor: colors,
                borderWidth: 1,
            },
            {
                label: 'Classical Weights',
                data: data.classical_weights.map(w => w * 100),
                backgroundColor: colors.map(color => color + '40'),
                borderColor: colors.map(color => color + '80'),
                borderWidth: 1,
            },
        ],
    }

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            title: {
                display: true,
                text: 'Weight Comparison',
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Weight (%)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Assets',
                },
            },
        },
    }

    return (
        <div className="h-64">
            <Bar ref={chartRef} data={barData} options={barOptions} />
        </div>
    )
}