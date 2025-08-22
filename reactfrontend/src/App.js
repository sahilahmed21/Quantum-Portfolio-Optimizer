import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { Navbar } from './components/Navbar';
// import { Footer } from './components/Footer';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;