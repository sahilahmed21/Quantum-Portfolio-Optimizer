// src/app/page.tsx
"use client";
import React from "react";
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SparklesCore } from "@/components/ui/sparkles";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { quantumFeatures } from "@/components/quantumfeatures";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 relative antialiased">
      <BackgroundBeams />

      {/* Hero Section with Sparkles */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen overflow-hidden">
        <div className="text-center py-20">
          <h1 className="md:text-7xl text-4xl lg:text-8xl font-bold text-center text-white relative z-20 mb-6">
            Quantum Portfolio
          </h1>
          <h1 className="md:text-7xl text-4xl lg:text-8xl font-bold text-center text-white relative z-20 mb-8">
            Optimizer
          </h1>


          <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto relative z-20 px-4">
            Modern portfolio optimization using quantum-inspired algorithms to help balance your investment portfolio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-20">
            <Link href="/portfolio">
              <Button size="lg" className="text-lg px-8 py-3 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 border-0">
                Get Started
              </Button>
            </Link>
            <Link href="https://github.com/sahilahmed21/Quantum-Portfolio-Optimizer" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-neutral-600 text-neutral-200 hover:bg-neutral-800">
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section with Hover Cards */}
      <section className="relative z-10 py-20 px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
          Why Choose Quantum Optimization?
        </h2>
        <p className="text-neutral-400 text-center mb-16 max-w-2xl mx-auto">
          Explore the key features of our portfolio optimization approach
        </p>
        <div className="max-w-6xl mx-auto">
          <HoverEffect items={quantumFeatures} />
        </div>
      </section>

      {/* How It Works Section with Canvas Reveal Effect */}
      <section className="relative z-10 py-20 px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
          How It Works
        </h2>
        <p className="text-neutral-400 text-center mb-16 max-w-2xl mx-auto">
          Simple steps to optimize your portfolio using quantum-inspired algorithms
        </p>
        <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-4 mx-auto max-w-7xl">
          <Card
            title="Input Your Assets"
            icon={<InputIcon />}
            description="Enter stock tickers and preferences"
            step="01"
          >
            <CanvasRevealEffect
              animationSpeed={5.1}
              containerClassName="bg-emerald-900"
            />
          </Card>

          <Card
            title="Quantum Analysis"
            icon={<QuantumIcon />}
            description="AI analyzes market correlations"
            step="02"
          >
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [236, 72, 153],
                [232, 121, 249],
              ]}
              dotSize={2}
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />
          </Card>

          <Card
            title="QAOA Optimization"
            icon={<OptimizeIcon />}
            description="Find optimal portfolio weights"
            step="03"
          >
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-sky-600"
              colors={[[125, 211, 252]]}
            />
          </Card>

          <Card
            title="View Results"
            icon={<ResultsIcon />}
            description="Get detailed analytics & insights"
            step="04"
          >
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-violet-600"
              colors={[[139, 92, 246]]}
            />
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
            Ready to Optimize Your Portfolio?
          </h2>
          <p className="text-xl text-neutral-400 mb-8">
            Try our quantum-inspired approach to portfolio optimization
          </p>
          <Link href="/portfolio">
            <Button size="lg" className="text-lg px-12 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 border-0">
              Start Optimizing Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

// // Feature data for hover cards
// export const quantumFeatures = [
//   {
//     title: "QAOA-Based Optimization",
//     description: "Implement quantum approximate optimization algorithms to explore portfolio weight combinations more efficiently than traditional methods.",
//     link: "#"
//   },
//   {
//     title: "Risk Analysis",
//     description: "Analyze portfolio risk through correlation matrices and volatility calculations to help with diversification decisions.",
//     link: "#"
//   },
//   {
//     title: "Market Data Integration",
//     description: "Connect to financial data sources to use current market information in the optimization process.",
//     link: "#"
//   },
//   {
//     title: "Modern Algorithms",
//     description: "Combine mathematical optimization techniques with contemporary approaches to portfolio balancing.",
//     link: "#"
//   },
//   {
//     title: "Secure Processing",
//     description: "Process your portfolio data securely without storing sensitive financial information permanently.",
//     link: "#"
//   },
//   {
//     title: "Multi-Asset Classes",
//     description: "Work with different types of investments including stocks, ETFs, and other financial instruments.",
//     link: "#"
//   }
// ];

// Card component for How It Works section
const Card = ({
  title,
  icon,
  children,
  description,
  step
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  description: string;
  step: string;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-neutral-800 group/canvas-card flex items-center justify-center max-w-sm w-full mx-auto p-6 relative h-[25rem] cursor-pointer"
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-neutral-400" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-neutral-400" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-neutral-400" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-neutral-400" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 text-center">
        <div className="group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-neutral-600 mb-2">{step}</span>
          {icon}
          <h3 className="text-white text-lg font-bold mt-4 mb-2">{title}</h3>
          <p className="text-neutral-400 text-sm">{description}</p>
        </div>
        <h2 className="text-white text-xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 font-bold group-hover/canvas-card:-translate-y-2 transition duration-200">
          {title}
        </h2>
      </div>
    </div>
  );
};

// Custom icons for the cards
const InputIcon = () => (
  <svg className="h-10 w-10 text-neutral-400 group-hover/canvas-card:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const QuantumIcon = () => (
  <svg className="h-10 w-10 text-neutral-400 group-hover/canvas-card:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const OptimizeIcon = () => (
  <svg className="h-10 w-10 text-neutral-400 group-hover/canvas-card:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ResultsIcon = () => (
  <svg className="h-10 w-10 text-neutral-400 group-hover/canvas-card:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};