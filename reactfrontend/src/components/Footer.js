import React from 'react';
import { Github, Mail, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            <div className="container py-8">
                <div className="card">
                    <div className="card-content">
                        <div className="grid md-grid-cols-4 gap-8">
                            <div>
                                <h3 className="font-semibold mb-3">Quantum Portfolio</h3>
                                <p className="text-sm text-muted-foreground">
                                    Advanced portfolio optimization using quantum computing technology.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-3">Quick Links</h4>
                                <div className="space-y-2">
                                    <Link to="/" className="text-sm text-muted-foreground" style={{ display: 'block', textDecoration: 'none' }}>Home</Link>
                                    <Link to="/portfolio" className="text-sm text-muted-foreground" style={{ display: 'block', textDecoration: 'none' }}>Portfolio</Link>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-3">Resources</h4>
                                <p className="text-sm text-muted-foreground">Docs and API info here.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-3">Connect</h4>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline btn-icon"><Github size={16} /></button>
                                    <button className="btn btn-outline btn-icon"><Mail size={16} /></button>
                                    <button className="btn btn-outline btn-icon"><FileText size={16} /></button>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }} className="text-center text-sm text-muted-foreground">
                            <p>&copy; 2025 Quantum Portfolio Optimizer. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}