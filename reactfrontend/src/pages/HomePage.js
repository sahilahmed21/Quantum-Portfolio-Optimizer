import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="container py-8">
            <section className="text-center py-20">
                <h1 className="text-4xl md-grid-cols-2" style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    Quantum Portfolio Optimizer
                </h1>
                <p className="text-xl text-muted-foreground mb-8 mx-auto" style={{ maxWidth: '42rem' }}>
                    Harness the power of quantum computing to optimize your investment portfolio with advanced algorithms that outperform classical methods.
                </p>
                <Link to="/portfolio">
                    <button className="btn btn-lg">Get Started</button>
                </Link>
            </section>

            <section className="py-16">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Why Choose Quantum Optimization?
                </h2>
                <div className="grid md-grid-cols-3 gap-8">
                    <div className="card">
                        <div className="card-header"><h3 className="card-header-title">Advanced Algorithms</h3></div>
                        <div className="card-content"><p className="text-muted-foreground">Utilize quantum approximate optimization algorithms (QAOA) to find optimal portfolio weights with superior performance.</p></div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3 className="card-header-title">Risk Management</h3></div>
                        <div className="card-content"><p className="text-muted-foreground">Sophisticated risk assessment using quantum-enhanced covariance matrix analysis for better diversification.</p></div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3 className="card-header-title">Real-time Data</h3></div>
                        <div className="card-content"><p className="text-muted-foreground">Integration with live market data to ensure your optimization is based on the most current information available.</p></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;