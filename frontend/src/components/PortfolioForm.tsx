'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Plus, X, Loader2, List, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Types for form data
type OptimizationMode = 'new' | 'existing'
interface Asset {
    ticker: string
    shares: string
}
interface NewPortfolioData {
    tickers: string[]
    start_date: string
    end_date: string
    risk_tolerance: number
}
interface ExistingPortfolioData {
    assets: Asset[]
    start_date: string
    end_date: string
    risk_tolerance: number
}

export function PortfolioForm() {
    const router = useRouter()
    const [mode, setMode] = useState<OptimizationMode>('new')
    const [isLoading, setIsLoading] = useState(false)

    // State for 'new' portfolio mode
    const [tickers, setTickers] = useState<string[]>(['AAPL', 'MSFT'])

    // State for 'existing' portfolio mode
    const [assets, setAssets] = useState<Asset[]>([
        { ticker: 'AAPL', shares: '10' },
        { ticker: 'GOOGL', shares: '5' },
    ])

    // Common state
    const [startDate, setStartDate] = useState('2024-01-01')
    const [endDate, setEndDate] = useState('2025-01-01')
    const [riskTolerance, setRiskTolerance] = useState([0.5])

    // --- Handlers for 'existing' portfolio mode ---
    const addAsset = () => setAssets([...assets, { ticker: '', shares: '' }])
    const removeAsset = (index: number) => {
        if (assets.length > 1) setAssets(assets.filter((_, i) => i !== index))
    }
    const updateAsset = (index: number, field: 'ticker' | 'shares', value: string) => {
        const newAssets = [...assets]
        if (field === 'ticker') {
            newAssets[index].ticker = value.toUpperCase()
        } else {
            newAssets[index].shares = value
        }
        setAssets(newAssets)
    }

    // --- Handlers for 'new' portfolio mode ---
    const addTicker = () => setTickers([...tickers, ''])
    const removeTicker = (index: number) => {
        if (tickers.length > 2) setTickers(tickers.filter((_, i) => i !== index))
    }
    const updateTicker = (index: number, value: string) => {
        const newTickers = [...tickers]
        newTickers[index] = value.toUpperCase()
        setTickers(newTickers)
    }

    // --- Validation and Submission ---
    const validateForm = (): boolean => {
        if (mode === 'new') {
            if (tickers.some(t => t.trim() === '')) {
                toast.error('Please fill in all ticker symbols.')
                return false
            }
            if (tickers.length < 2) {
                toast.error('Please provide at least 2 tickers.')
                return false
            }
        } else { // mode === 'existing'
            if (assets.some(a => a.ticker.trim() === '' || a.shares.trim() === '')) {
                toast.error('Please fill in all asset tickers and shares.')
                return false
            }
            if (assets.some(a => isNaN(parseFloat(a.shares)) || parseFloat(a.shares) <= 0)) {
                toast.error('Shares must be a positive number.')
                return false
            }
            if (assets.length < 2) {
                toast.error('Please provide at least 2 assets to optimize.')
                return false
            }
        }
        // Common validation
        if (new Date(startDate) >= new Date(endDate)) {
            toast.error('Start date must be before end date.')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)

        // Store data in sessionStorage for the results page
        if (mode === 'new') {
            const portfolioData: NewPortfolioData = {
                tickers: tickers.filter(t => t.trim() !== ''),
                start_date: startDate,
                end_date: endDate,
                risk_tolerance: riskTolerance[0],
            }
            sessionStorage.setItem('portfolioData', JSON.stringify(portfolioData))
            sessionStorage.setItem('optimizationType', 'new')
        } else { // mode === 'existing'
            const portfolioData: ExistingPortfolioData = {
                assets: assets.map(a => ({ ...a, shares: parseFloat(a.shares).toString() })),
                start_date: startDate,
                end_date: endDate,
                risk_tolerance: riskTolerance[0],
            }
            sessionStorage.setItem('portfolioData', JSON.stringify(portfolioData))
            sessionStorage.setItem('optimizationType', 'existing')
        }

        // Navigate to results page
        router.push('/results')
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <Label className="text-base font-semibold mb-3 block">Optimization Type</Label>
                <ToggleGroup type="single" value={mode} onValueChange={(value: OptimizationMode) => value && setMode(value)} className="w-full">
                    <ToggleGroupItem value="new" className="w-1/2" aria-label="Analyze New Portfolio">
                        <List className="h-4 w-4 mr-2" />
                        Analyze New Portfolio
                    </ToggleGroupItem>
                    <ToggleGroupItem value="existing" className="w-1/2" aria-label="Optimize Existing Portfolio">
                        <Edit className="h-4 w-4 mr-2" />
                        Optimize Existing
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {mode === 'new' ? (
                <div>
                    <Label className="text-base font-semibold mb-4 block">Stock Tickers</Label>
                    <div className="space-y-3">
                        {tickers.map((ticker, index) => (
                            <div key={index} className="flex gap-2">
                                <Input value={ticker} onChange={e => updateTicker(index, e.target.value)} placeholder="e.g., AAPL" />
                                <Button type="button" variant="outline" size="icon" onClick={() => removeTicker(index)} disabled={tickers.length <= 2}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addTicker} className="w-full" disabled={tickers.length >= 10}>
                            <Plus className="h-4 w-4 mr-2" /> Add Ticker
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <Label className="text-base font-semibold mb-4 block">Your Current Assets</Label>
                    <div className="space-y-3">
                        {assets.map((asset, index) => (
                            <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
                                <Input value={asset.ticker} onChange={e => updateAsset(index, 'ticker', e.target.value)} placeholder="Ticker (e.g. MSFT)" />
                                <Input value={asset.shares} onChange={e => updateAsset(index, 'shares', e.target.value)} type="number" step="any" placeholder="Shares" />
                                <Button type="button" variant="outline" size="icon" onClick={() => removeAsset(index)} disabled={assets.length <= 2}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addAsset} className="w-full" disabled={assets.length >= 10}>
                            <Plus className="h-4 w-4 mr-2" /> Add Asset
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start-date" className="text-base font-semibold">Start Date</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-2" />
                </div>
                <div>
                    <Label htmlFor="end-date" className="text-base font-semibold">End Date</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-2" max={new Date().toISOString().split('T')[0]} />
                </div>
            </div>

            <div>
                <Label className="text-base font-semibold mb-4 block">Risk Tolerance: {riskTolerance[0].toFixed(2)}</Label>
                <Card><CardContent className="pt-6">
                    <Slider value={riskTolerance} onValueChange={setRiskTolerance} max={1} min={0} step={0.01} />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Conservative</span><span>Balanced</span><span>Aggressive</span>
                    </div>
                </CardContent></Card>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</> : 'Optimize Portfolio'}
            </Button>
        </form>
    )
}