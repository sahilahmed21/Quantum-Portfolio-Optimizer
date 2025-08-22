import React from 'react';
import { Pie, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const CHART_COLORS = ['#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#f97316', '#84cc16'];
const CLASSICAL_COLOR = '#6b7280';
const QUANTUM_COLOR = '#8b5cf6';


export function PortfolioChart({ data, type }) {
    if (type === 'allocation') {
        const chartData = {
            labels: data.tickers,
            datasets: [{
                label: 'Quantum Weights',
                data: data.quantum_weights.map(w => w * 100),
                backgroundColor: CHART_COLORS.slice(0, data.tickers.length),
                borderColor: 'var(--card)',
                borderWidth: 2,
            }],
        };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'var(--foreground)' } },
                title: { display: false },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${Number(c.raw).toFixed(1)}%` } }
            }
        };
        return <div style={{ height: '300px' }}><Pie data={chartData} options={options} /></div>;
    }

    if (type === 'performance') {
        const chartData = {
            datasets: [
                {
                    label: data.tickers[0] || 'Classical/Current', // Handle different labels
                    data: [{ x: data.classical_risk * 100, y: data.classical_return * 100 }],
                    backgroundColor: CLASSICAL_COLOR,
                    pointRadius: 8,
                    pointHoverRadius: 10
                },
                {
                    label: data.tickers[1] || 'Quantum',
                    data: [{ x: data.quantum_risk * 100, y: data.quantum_return * 100 }],
                    backgroundColor: QUANTUM_COLOR,
                    pointRadius: 8,
                    pointHoverRadius: 10
                },
            ],
        };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'var(--foreground)' } },
                title: { display: false },
                tooltip: { callbacks: { label: (c) => `${c.dataset.label}: Risk ${c.parsed.x.toFixed(2)}%, Return ${c.parsed.y.toFixed(2)}%` } }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Risk (Volatility %)', color: 'var(--muted-foreground)' },
                    ticks: { color: 'var(--muted-foreground)' },
                    grid: { color: 'var(--border)' }
                },
                y: {
                    title: { display: true, text: 'Expected Return (%)', color: 'var(--muted-foreground)' },
                    ticks: { color: 'var(--muted-foreground)' },
                    grid: { color: 'var(--border)' }
                }
            }
        };
        return <div style={{ height: '300px' }}><Scatter data={chartData} options={options} /></div>;
    }
    return null;
}