import React from 'react';

const formatNumber = (num) => {
    if (Math.abs(num) < 1e-4 && num !== 0) {
        return num.toExponential(2);
    }
    return num.toFixed(4);
};

export function VectorDisplay({ data, title }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="mt-2" style={{ padding: '0.75rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
            <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.map((val, index) => (
                    <span key={index} style={{ fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}>
                        {formatNumber(val)}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function MatrixDisplay({ data, headers, title }) {
    if (!data || data.length === 0 || data[0].length === 0) return null;

    return (
        <div className="mt-2" style={{ padding: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold text-muted-foreground mb-2" style={{ padding: '0 0.25rem' }}>{title}</p>
            <div className="table-wrapper">
                <table className="table" style={{ backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                    <thead className="table-header">
                        <tr className="table-row">
                            <th className="table-head"></th>
                            {headers.map(header => <th key={header} className="table-head text-center font-bold">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="table-row">
                                <td className="table-cell font-bold">{headers[rowIndex]}</td>
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="table-cell text-center" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {formatNumber(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}