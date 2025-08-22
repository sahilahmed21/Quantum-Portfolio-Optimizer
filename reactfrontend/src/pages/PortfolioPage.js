import React from 'react';
import { PortfolioForm } from '../components/PortfolioForm';

const PortfolioPage = () => {
    return (
        <div className="container py-8">
            <div style={{ maxWidth: '42rem', margin: 'auto' }}>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4">Portfolio Optimization</h1>
                    <p className="text-muted-foreground">
                        Enter your investment preferences and let our quantum algorithms find the optimal portfolio allocation.
                    </p>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-header-title">Portfolio Configuration</h2>
                        <p className="card-header-description">
                            Specify your assets, time frame, and risk tolerance for optimization.
                        </p>
                    </div>
                    <div className="card-content">
                        <PortfolioForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioPage;