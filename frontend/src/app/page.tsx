// src/app/page.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Quantum Portfolio Optimizer
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Harness the power of quantum computing to optimize your investment portfolio
          with advanced algorithms that outperform classical methods.
        </p>
        <Link href="/portfolio">
          <Button size="lg" className="text-lg px-8 py-3">
            Get Started
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Quantum Optimization?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Algorithms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Utilize quantum approximate optimization algorithms (QAOA) to find
                optimal portfolio weights with superior performance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sophisticated risk assessment using quantum-enhanced covariance
                matrix analysis for better diversification.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integration with live market data to ensure your optimization
                is based on the most current information available.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Input Assets</h3>
              <p className="text-sm text-muted-foreground">
                Enter your desired stock tickers and investment preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Quantum Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our quantum algorithms analyze market data and correlations
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Optimization</h3>
              <p className="text-sm text-muted-foreground">
                QAOA finds the optimal portfolio weights for maximum returns
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Results</h3>
              <p className="text-sm text-muted-foreground">
                View your optimized portfolio with detailed analytics
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}