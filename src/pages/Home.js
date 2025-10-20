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
                        <div className="hero-eyebrow">Create Generational Wealth</div>
                        <h1 className="hero-title">THE GLITCH</h1>
                        <p className="hero-subtitle">
                            Break free from bad habits and make money work for you. Our platform provides 
                            multiple streams of knowledge across 8 powerful domains: Health & Fitness, 
                            E-Commerce, Forex, Crypto, Algorithmic Trading, Intelligent Systems Development, 
                            Social Media, and Real Estate.
                        </p>
                        <div className="hero-cta">
                            <Link to="/register" className="hero-btn-primary">
                                Start Building Wealth
                            </Link>
                            <Link to="/courses" className="hero-btn-secondary">
                                View Courses
                            </Link>
                        </div>
                    </div>
                    <div className="hero-right">
                        <div className="hero-visual">
                            <div className="feature-grid">
                                <div className="feature-item">
                                    <div className="feature-icon">💰</div>
                                    <span>Wealth Building</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">📈</div>
                                    <span>Multiple Streams</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">🎯</div>
                                    <span>Smart Habits</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">🚀</div>
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
                            <div className="stat-number">8</div>
                            <div className="stat-label">Wealth Domains</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">15+</div>
                            <div className="stat-label">Income Streams</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">247%</div>
                            <div className="stat-label">Average ROI</div>
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
                        <h2 className="features-title">Multiple Wealth Streams</h2>
                        <p className="features-subtitle">
                            Stop trading time for money. Learn how to make money work for you 
                            across multiple domains with our comprehensive knowledge base.
                        </p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-card-icon">🏠</div>
                            <h3 className="feature-card-title">Real Estate</h3>
                            <p className="feature-card-description">
                                Build passive income through property investment, rental income, 
                                and real estate development strategies.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon">💻</div>
                            <h3 className="feature-card-title">E-Commerce</h3>
                            <p className="feature-card-description">
                                Create online businesses and digital products that generate 
                                revenue while you sleep.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon">📊</div>
                            <h3 className="feature-card-title">Algorithmic Trading</h3>
                            <p className="feature-card-description">
                                Automated trading systems that work 24/7 to capture market 
                                opportunities and build wealth.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Professional CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to Build Generational Wealth?</h2>
                    <p className="cta-description">
                        Join THE GLITCH and learn how to create multiple income streams 
                        that work for you, not against you.
                    </p>
                    <Link to="/register" className="cta-button">
                        Start Your Wealth Journey
                    </Link>
                </div>
            </section>

            <Chatbot />
        </div>
    );
};

export default Home;