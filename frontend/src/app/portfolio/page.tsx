// src/app/portfolio/page.tsx
import { PortfolioForm } from '@/components/PortfolioForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PortfolioPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4">Portfolio Optimization</h1>
                    <p className="text-muted-foreground">
                        Enter your investment preferences and let our quantum algorithms find the optimal portfolio allocation.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio Configuration</CardTitle>
                        <CardDescription>
                            Specify your assets, time frame, and risk tolerance for optimization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PortfolioForm />
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>How to Use</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">1. Enter Stock Tickers</h4>
                            <p className="text-sm text-muted-foreground">
                                Add the stock symbols you want to include in your portfolio (e.g., AAPL, MSFT, GOOGL).
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">2. Set Time Frame</h4>
                            <p className="text-sm text-muted-foreground">
                                Choose the historical period for analysis. Longer periods provide more data but may be less relevant.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">3. Choose Risk Tolerance</h4>
                            <p className="text-sm text-muted-foreground">
                                Set your risk preference from 0 (conservative) to 1 (aggressive). This affects the risk-return balance.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}