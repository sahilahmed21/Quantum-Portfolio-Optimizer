"use client";
import React from 'react';
import { PortfolioForm } from '../components/PortfolioForm';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PortfolioPage = () => {
    return (
        <div className="min-h-screen w-full bg-neutral-950 relative antialiased">
            <BackgroundBeams />
            <div className="relative z-10 container  -mt-32 px-4">
                <div style={{ maxWidth: '42rem', margin: 'auto' }}>
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
                            Portfolio Optimization
                        </h1>
                        <p className="text-neutral-400 text-lg">
                            Configure your investment preferences and optimize your portfolio allocation.
                        </p>
                    </div>

                    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-neutral-200">Portfolio Configuration</CardTitle>
                            <CardDescription className="text-neutral-400">
                                Specify your assets, time frame, and risk tolerance for optimization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PortfolioPage;