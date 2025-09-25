"use client";
import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

export default function Home() {
  const features = [
    {
      title: "Advanced Algorithms",
      description:
        "Utilize quantum approximate optimization algorithms (QAOA) to find optimal portfolio weights with superior performance.",
    },
    {
      title: "Risk Management",
      description:
        "Sophisticated risk assessment using quantum-enhanced covariance matrix analysis for better diversification and risk mitigation.",
    },
    {
      title: "Real-time Data",
      description:
        "Integration with live market data to ensure your optimization is based on the most current and accurate information available.",
    },
    {
      title: "Comparative Analysis",
      description: "Benchmark quantum-optimized portfolios against classical methods to clearly demonstrate the quantum advantage.",
    },
    {
      title: "Scalable Solutions",
      description: "Our infrastructure is designed to handle complex optimization problems, scaling with the number of assets and constraints.",
    },
    {
      title: "Intuitive Visualization",
      description: "Explore your portfolio's composition, expected returns, and risk metrics through clear and interactive charts.",
    },
  ];

  return (
    <main className="relative flex flex-col items-center justify-center antialiased">
      {/* Main container with background beams */}
      <div className="w-full bg-black/[0.96] relative flex flex-col items-center justify-center overflow-hidden">
        {/* Hero Section with Sparkles */}
        <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden rounded-md">
          <div className="w-full absolute inset-0 h-screen">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
          <div className="flex flex-col items-center relative z-20">
            <h1 className="md:text-7xl text-3xl lg:text-8xl font-bold text-center text-white">
              Quantum Portfolio Optimizer
            </h1>
            <p className="text-neutral-400 max-w-2xl mx-auto my-4 text-center text-lg">
              Harness the power of quantum computing to optimize your investment
              portfolio with advanced algorithms that outperform classical methods.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/portfolio">
                <Button size="lg" className="text-lg px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <a href="https://github.com/sahilahmed21/Quantum-Portfolio-Optimizer" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Features Section with Hover Effect */}
        <section className="py-20 w-full">
          <h2 className="text-4xl font-bold text-center mb-12 text-white relative z-20">
            Why Choose Quantum Optimization?
          </h2>
          <div className="max-w-5xl mx-auto px-8 relative z-20">
            <HoverEffect items={features} />
          </div>
        </section>

        {/* How It Works Section with Canvas Reveal Effect */}
        <section className="py-20 w-full">
          <h2 className="text-4xl font-bold text-center mb-16 text-white relative z-20">
            How It Works
          </h2>
          <div className="py-4 flex flex-col lg:flex-row items-center justify-center w-full gap-4 mx-auto px-8 relative z-20">
            <Card title="1. Input Assets" icon={<StepIcon />}>
              <CanvasRevealEffect
                animationSpeed={5.1}
                containerClassName="bg-emerald-900"
                dotSize={2}
              />
            </Card>
            <Card title="2. Quantum Analysis" icon={<StepIcon />}>
              <CanvasRevealEffect
                animationSpeed={3}
                containerClassName="bg-black"
                colors={[
                  [236, 72, 153],
                  [232, 121, 249],
                ]}
              />
            </Card>
            <Card title="3. Optimization" icon={<StepIcon />}>
              <CanvasRevealEffect
                animationSpeed={3}
                containerClassName="bg-sky-600"
                colors={[[125, 211, 252]]}
              />
            </Card>
            <Card title="4. View Results" icon={<StepIcon />}>
              <CanvasRevealEffect
                animationSpeed={4}
                containerClassName="bg-orange-800"
                colors={[[255, 165, 0]]}
              />
            </Card>
          </div>
        </section>

        <BackgroundBeams />
      </div>
    </main>
  );
}

// --- Helper Components for Canvas Reveal Effect ---

const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-white/[0.2] group/canvas-card flex items-center justify-center max-w-sm w-full mx-auto p-4 relative h-[30rem] lg:h-[35rem]"
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

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

      <div className="relative z-20">
        <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-white text-2xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 mt-4 font-bold group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200 text-center">
          {title}
        </h2>
      </div>
    </div>
  );
};

const StepIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-12 h-12 text-white"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
};


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