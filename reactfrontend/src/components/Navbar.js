import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const { pathname } = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/portfolio', label: 'Portfolio' },
        { href: '/results', label: 'Results' },
    ];

    // Close mobile menu on navigation
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <nav style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)', position: 'sticky', top: 0, zIndex: 50 }}>
            <div className="container">
                <div style={{ display: 'flex', height: '4rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: '2rem', height: '2rem', backgroundColor: 'var(--primary)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'var(--primary-foreground)', fontWeight: 'bold', fontSize: '0.875rem' }}>Q</span>
                        </div>
                        <span className="font-bold text-xl">QuantumPortfolio</span>
                    </Link>

                    <div className="flex items-center">
                        {/* Desktop Nav */}
                        <div style={{ display: 'none' }} className="md-grid-cols-2"> {/* Using a trick for media query */}
                            <div className="flex items-center gap-2">
                                {navItems.map((item) => (
                                    <Link key={item.href} to={item.href} style={{ textDecoration: 'none' }}>
                                        <button className={`btn ${pathname === item.href ? 'btn-secondary' : 'btn-ghost'}`}>
                                            {item.label}
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md-grid-cols-2" style={{ gridTemplateColumns: 'none' }}>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="py-4 space-y-2 md-grid-cols-2" style={{ gridTemplateColumns: 'none' }}>
                        {navItems.map((item) => (
                            <Link key={item.href} to={item.href} style={{ textDecoration: 'none' }}>
                                <button className={`btn w-full ${pathname === item.href ? 'btn-secondary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>
                                    {item.label}
                                </button>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}







