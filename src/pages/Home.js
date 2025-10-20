import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import Chatbot from '../components/Chatbot';

const Home = () => {
    return (
        <div className="home-container">
            {/* Professional Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-left">
                        <div className="hero-eyebrow">Professional Trading Platform</div>
                        <h1 className="hero-title">THE GLITCH</h1>
                        <p className="hero-subtitle">
                            Advanced algorithmic trading platform designed for serious traders. 
                            Experience institutional-grade tools with AI-powered analytics and 
                            real-time market intelligence.
                        </p>
                        <div className="hero-cta">
                            <Link to="/register" className="hero-btn-primary">
                                Start Trading
                            </Link>
                            <Link to="/explore" className="hero-btn-secondary">
                                View Platform
                            </Link>
                        </div>
                    </div>
                    <div className="hero-right">
                        <div className="hero-visual">
                            <div className="feature-grid">
                                <div className="feature-item">
                                    <div className="feature-icon">📊</div>
                                    <span>Analytics</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">💼</div>
                                    <span>Trading</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">🎯</div>
                                    <span>Strategy</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">📈</div>
                                    <span>Growth</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Professional Stats Section */}
            <section className="stats-section">
                <div className="stats-container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number">15K+</div>
                            <div className="stat-label">Active Traders</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">$5.2B</div>
                            <div className="stat-label">Volume Traded</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">99.9%</div>
                            <div className="stat-label">Uptime</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Professional Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <div className="features-header">
                        <h2 className="features-title">Professional Trading Solutions</h2>
                        <p className="features-subtitle">
                            Institutional-grade trading infrastructure with advanced analytics, 
                            risk management, and execution capabilities.
                        </p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-card-icon">📊</div>
                            <h3 className="feature-card-title">Advanced Analytics</h3>
                            <p className="feature-card-description">
                                Real-time market analysis with AI-powered insights, predictive modeling, 
                                and comprehensive risk assessment tools.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon">🔒</div>
                            <h3 className="feature-card-title">Enterprise Security</h3>
                            <p className="feature-card-description">
                                Bank-grade security infrastructure with multi-layer encryption, 
                                secure authentication, and compliance standards.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon">⚡</div>
                            <h3 className="feature-card-title">Ultra-Low Latency</h3>
                            <p className="feature-card-description">
                                Sub-millisecond execution with direct market access and 
                                co-location services for professional traders.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Professional CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to Trade Professionally?</h2>
                    <p className="cta-description">
                        Join THE GLITCH and access institutional-grade trading tools 
                        designed for serious traders and financial professionals.
                    </p>
                    <Link to="/register" className="cta-button">
                        Start Professional Trading
                    </Link>
                </div>
            </section>

            <Chatbot />
        </div>
    );
};

export default Home;