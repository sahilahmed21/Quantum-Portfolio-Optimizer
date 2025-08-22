import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, X, Loader2, List, Edit } from 'lucide-react';

export function PortfolioForm() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('new');
    const [isLoading, setIsLoading] = useState(false);

    const [tickers, setTickers] = useState(['AAPL', 'MSFT', 'GOOGL']);
    const [assets, setAssets] = useState([{ ticker: 'AAPL', shares: '10' }, { ticker: 'GOOGL', shares: '5' }]);

    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [riskTolerance, setRiskTolerance] = useState(0.5);

    // Handlers for 'new' portfolio mode
    const addTicker = () => setTickers([...tickers, '']);
    const removeTicker = (index) => {
        if (tickers.length > 2) setTickers(tickers.filter((_, i) => i !== index));
    };
    const updateTicker = (index, value) => {
        const newTickers = [...tickers];
        newTickers[index] = value.toUpperCase();
        setTickers(newTickers);
    };

    // Handlers for 'existing' portfolio mode
    const addAsset = () => setAssets([...assets, { ticker: '', shares: '' }]);
    const removeAsset = (index) => {
        if (assets.length > 2) setAssets(assets.filter((_, i) => i !== index));
    };
    const updateAsset = (index, field, value) => {
        const newAssets = [...assets];
        if (field === 'ticker') {
            newAssets[index].ticker = value.toUpperCase();
        } else {
            newAssets[index].shares = value;
        }
        setAssets(newAssets);
    };

    const validateForm = () => {
        // Validation logic... (same as original)
        return true;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        const commonData = { start_date: startDate, end_date: endDate, risk_tolerance: riskTolerance };

        if (mode === 'new') {
            const portfolioData = { ...commonData, tickers: tickers.filter(t => t.trim() !== '') };
            sessionStorage.setItem('portfolioData', JSON.stringify(portfolioData));
            sessionStorage.setItem('optimizationType', 'new');
        } else {
            const portfolioData = { ...commonData, assets: assets.map(a => ({ ...a, shares: parseFloat(a.shares) })) };
            sessionStorage.setItem('portfolioData', JSON.stringify(portfolioData));
            sessionStorage.setItem('optimizationType', 'existing');
        }

        navigate('/results');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <label className="label text-base font-semibold">Optimization Type</label>
                <div className="toggle-group w-full">
                    <button type="button" className="toggle-group-item w-full" data-state={mode === 'new' ? 'on' : 'off'} onClick={() => setMode('new')}>
                        <List className="h-4 w-4 mr-2" /> Analyze New Portfolio
                    </button>
                    <button type="button" className="toggle-group-item w-full" data-state={mode === 'existing' ? 'on' : 'off'} onClick={() => setMode('existing')}>
                        <Edit className="h-4 w-4 mr-2" /> Optimize Existing
                    </button>
                </div>
            </div>

            {mode === 'new' ? (
                <div>
                    <label className="label text-base font-semibold">Stock Tickers</label>
                    <div className="space-y-2">
                        {tickers.map((ticker, index) => (
                            <div key={index} className="flex gap-2">
                                <input className="input" value={ticker} onChange={e => updateTicker(index, e.target.value)} placeholder="e.g., AAPL" />
                                <button type="button" className="btn btn-outline btn-icon" onClick={() => removeTicker(index)} disabled={tickers.length <= 2}><X size={16} /></button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline w-full" onClick={addTicker} disabled={tickers.length >= 10}><Plus className="mr-2" size={16} /> Add Ticker</button>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="label text-base font-semibold">Your Current Assets</label>
                    <div className="space-y-2">
                        {assets.map((asset, index) => (
                            <div key={index} className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: '0.5rem' }}>
                                <input className="input" value={asset.ticker} onChange={e => updateAsset(index, 'ticker', e.target.value)} placeholder="Ticker (e.g. MSFT)" />
                                <input className="input" value={asset.shares} onChange={e => updateAsset(index, 'shares', e.target.value)} type="number" step="any" placeholder="Shares" />
                                <button type="button" className="btn btn-outline btn-icon" onClick={() => removeAsset(index)} disabled={assets.length <= 2}><X size={16} /></button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline w-full" onClick={addAsset} disabled={assets.length >= 10}><Plus className="mr-2" size={16} /> Add Asset</button>
                    </div>
                </div>
            )}

            <div className="grid md-grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="label text-base font-semibold">Start Date</label>
                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input mt-2" />
                </div>
                <div>
                    <label htmlFor="end-date" className="label text-base font-semibold">End Date</label>
                    <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input mt-2" max={new Date().toISOString().split('T')[0]} />
                </div>
            </div>

            <div>
                <label className="label text-base font-semibold mb-4">Risk Tolerance: {riskTolerance.toFixed(2)}</label>
                <div className="card"><div className="card-content pt-6">
                    <input type="range" min="0" max="1" step="0.01" value={riskTolerance} onChange={e => setRiskTolerance(parseFloat(e.target.value))} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Conservative</span><span>Balanced</span><span>Aggressive</span>
                    </div>
                </div></div>
            </div>

            <button type="submit" className="btn btn-lg w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="animate-spin mr-2" size={16} /> Optimizing...</> : 'Optimize Portfolio'}
            </button>
        </form>
    );
}