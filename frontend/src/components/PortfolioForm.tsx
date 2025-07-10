// src/components/PortfolioForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioData {
    tickers: string[]
    start_date: string
    end_date: string
    risk_tolerance: number
}

export function PortfolioForm() {
    const router = useRouter()
    const [tickers, setTickers] = useState<string[]>(['AAPL', 'MSFT'])
    const [startDate, setStartDate] = useState('2023-01-01')
    const [endDate, setEndDate] = useState('2025-01-01')
    const [riskTolerance, setRiskTolerance] = useState([0.5])
    const [isLoading, setIsLoading] = useState(false)

    const addTicker = () => {
        setTickers([...tickers, ''])
    }

    const removeTicker = (index: number) => {
        if (tickers.length > 1) {
            setTickers(tickers.filter((_, i) => i !== index))
        }
    }

    const updateTicker = (index: number, value: string) => {
        const newTickers = [...tickers]
        newTickers[index] = value.toUpperCase()
        setTickers(newTickers)
    }

    const validateForm = (): boolean => {
        if (tickers.some(ticker => ticker.trim() === '')) {
            toast.error('Please fill in all ticker symbols')
            return false
        }

        if (tickers.length < 2) {
            toast.error('Please add at least 2 assets for optimization')
            return false
        }

        if (new Date(startDate) >= new Date(endDate)) {
            toast.error('Start date must be before end date')
            return false
        }

        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        if (new Date(startDate) > oneYearAgo) {
            toast.error('Start date should be at least 1 year ago for meaningful analysis')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        try {
            const portfolioData: PortfolioData = {
                tickers: tickers.filter(ticker => ticker.trim() !== ''),
                start_date: startDate,
                end_date: endDate,
                risk_tolerance: riskTolerance[0]
            }

            // Store data in sessionStorage for the results page
            sessionStorage.setItem('portfolioData', JSON.stringify(portfolioData))

            // Navigate to results page
            router.push('/results')

        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stock Tickers */}
            <div>
                <Label className="text-base font-semibold mb-4 block">Stock Tickers</Label>
                <div className="space-y-3">
                    {tickers.map((ticker, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={ticker}
                                onChange={(e) => updateTicker(index, e.target.value)}
                                placeholder="e.g., AAPL"
                                className="flex-1"
                                maxLength={10}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeTicker(index)}
                                disabled={tickers.length <= 1}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addTicker}
                        className="w-full"
                        disabled={tickers.length >= 10}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Ticker
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Add 2-10 stock tickers for optimization. Common examples: AAPL, MSFT, GOOGL, AMZN, TSLA
                </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start-date" className="text-base font-semibold">
                        Start Date
                    </Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate}
                        className="mt-2"
                    />
                </div>
                <div>
                    <Label htmlFor="end-date" className="text-base font-semibold">
                        End Date
                    </Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-2"
                    />
                </div>
            </div>

            {/* Risk Tolerance */}
            <div>
                <Label className="text-base font-semibold mb-4 block">
                    Risk Tolerance: {riskTolerance[0].toFixed(2)}
                </Label>
                <Card>
                    <CardContent className="pt-6">
                        <Slider
                            value={riskTolerance}
                            onValueChange={setRiskTolerance}
                            max={1}
                            min={0}
                            step={0.01}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>Conservative (0.0)</span>
                            <span>Balanced (0.5)</span>
                            <span>Aggressive (1.0)</span>
                        </div>
                    </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground mt-2">
                    Lower values prioritize risk reduction, higher values prioritize returns
                </p>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Optimizing Portfolio...
                    </>
                ) : (
                    'Optimize Portfolio'
                )}
            </Button>
        </form>
    )
}