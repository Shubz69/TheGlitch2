import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/SharedBackground.css";
import "../styles/GlitchBranding.css";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/Chatbot";
import LightningEffect from "../components/LightningEffect";
import SharedBackground from "../components/SharedBackground";
import FancyAIHead from "../components/FancyAIHead";

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [showLightning, setShowLightning] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [aiHeadState, setAiHeadState] = useState('idle');
    const [currentFeature, setCurrentFeature] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 5500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % 4);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleLightningComplete = () => {
        setShowLightning(false);
        setShowContent(true);
    };

    const handleStartTrading = () => {
        if (isAuthenticated) {
            navigate("/dashboard");
        } else {
            navigate("/register");
        }
    };

    const handleAiHeadInteraction = (state) => {
        setAiHeadState(state);
        setTimeout(() => setAiHeadState('idle'), 4000);
    };

    const features = [
        {
            icon: "🧠",
            title: "Neural Intelligence",
            description: "Advanced AI algorithms that learn and adapt in real-time",
            color: "#1E90FF"
        },
        {
            icon: "⚡",
            title: "Quantum Speed",
            description: "Ultra-low latency execution with sub-millisecond response",
            color: "#00CED1"
        },
        {
            icon: "🔒",
            title: "Military Security",
            description: "Bank-grade encryption with blockchain verification",
            color: "#32CD32"
        },
        {
            icon: "📊",
            title: "Predictive Analytics",
            description: "Pattern recognition and trend prediction algorithms",
            color: "#FF69B4"
        }
    ];

    return (
        <div className="home-container">
            <SharedBackground />
            {showLightning && (
                <LightningEffect onLightningComplete={handleLightningComplete} />
            )}
            
            {showContent && (
                <>
                    {/* Floating Particles Background */}
                    <div className="floating-particles">
                        {[...Array(50)].map((_, i) => (
                            <div 
                                key={i} 
                                className="particle"
                                style={{
                                    '--delay': `${i * 0.1}s`,
                                    '--x': `${Math.random() * 100}%`,
                                    '--y': `${Math.random() * 100}%`
                                }}
                            />
                        ))}
                    </div>

                    {/* Main Hero Section */}
                    <section className="hero-section">
                        <div className="hero-background">
                            <div className="grid-overlay"></div>
                            <div className="energy-waves"></div>
                        </div>
                        
                        <div className="hero-content">
                            <div className="hero-left">
                                <div className="hero-badge">
                                    <div className="badge-glow"></div>
                                    <span className="badge-icon">⚡</span>
                                    <span className="badge-text">AI-POWERED TRADING</span>
                                </div>
                                
                                <h1 className="hero-title">
                                    <span className="title-line">WELCOME TO</span>
                                    <span className="title-highlight" data-text="THE GLITCH">THE GLITCH</span>
                                    <span className="title-line">PLATFORM</span>
                                </h1>
                                
                                <p className="hero-description">
                                    Experience the future of trading with our cutting-edge AI-powered platform. 
                                    <span className="highlight-text"> Neural networks</span> analyze markets in real-time, 
                                    <span className="highlight-text"> quantum algorithms</span> optimize strategies, 
                                    and <span className="highlight-text">predictive analytics</span> give you the edge.
                                </p>
                                
                                <div className="hero-actions">
                                    <button className="primary-button" onClick={handleStartTrading}>
                                        <span className="button-text">Start Trading</span>
                                        <div className="button-particles"></div>
                                        <div className="button-glow"></div>
                                    </button>
                                    <button className="secondary-button" onClick={() => navigate("/explore")}>
                                        <span className="button-text">Explore Features</span>
                                        <span className="button-arrow">→</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="hero-right">
                                <div className="ai-head-wrapper">
                                    <FancyAIHead 
                                        state={aiHeadState}
                                        onInteraction={handleAiHeadInteraction}
                                        mousePosition={mousePosition}
                                    />
                                </div>
                                
                                <div className="ai-controls">
                                    <button 
                                        className={`control-btn ${aiHeadState === 'thinking' ? 'active' : ''}`}
                                        onClick={() => handleAiHeadInteraction('thinking')}
                                    >
                                        <div className="control-icon">🧠</div>
                                        <span className="control-text">Think</span>
                                        <div className="control-glow"></div>
                                    </button>
                                    <button 
                                        className={`control-btn ${aiHeadState === 'analyzing' ? 'active' : ''}`}
                                        onClick={() => handleAiHeadInteraction('analyzing')}
                                    >
                                        <div className="control-icon">📊</div>
                                        <span className="control-text">Analyze</span>
                                        <div className="control-glow"></div>
                                    </button>
                                    <button 
                                        className={`control-btn ${aiHeadState === 'learning' ? 'active' : ''}`}
                                        onClick={() => handleAiHeadInteraction('learning')}
                                    >
                                        <div className="control-icon">⚡</div>
                                        <span className="control-text">Learn</span>
                                        <div className="control-glow"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Interactive Features Section */}
                    <section className="features-section">
                        <div className="features-container">
                            <div className="features-header">
                                <h2 className="section-title">Advanced Capabilities</h2>
                                <p className="section-subtitle">Discover what makes THE GLITCH the most advanced trading platform</p>
                            </div>
                            
                            <div className="features-showcase">
                                <div className="feature-display">
                                    <div className="feature-icon-large">
                                        <span>{features[currentFeature].icon}</span>
                                        <div className="icon-aura"></div>
                                    </div>
                                    <div className="feature-info">
                                        <h3 className="feature-title">{features[currentFeature].title}</h3>
                                        <p className="feature-description">{features[currentFeature].description}</p>
                                    </div>
                                </div>
                                
                                <div className="feature-indicators">
                                    {features.map((feature, index) => (
                                        <div 
                                            key={index}
                                            className={`feature-indicator ${index === currentFeature ? 'active' : ''}`}
                                            onClick={() => setCurrentFeature(index)}
                                        >
                                            <span className="indicator-icon">{feature.icon}</span>
                                            <span className="indicator-title">{feature.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stats Section */}
                    <section className="stats-section">
                        <div className="stats-container">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">⚡</div>
                                    <div className="stat-number">99.9%</div>
                                    <div className="stat-label">Uptime</div>
                                    <div className="stat-glow"></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🚀</div>
                                    <div className="stat-number">50ms</div>
                                    <div className="stat-label">Latency</div>
                                    <div className="stat-glow"></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🔒</div>
                                    <div className="stat-number">24/7</div>
                                    <div className="stat-label">Monitoring</div>
                                    <div className="stat-glow"></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🧠</div>
                                    <div className="stat-number">AI</div>
                                    <div className="stat-label">Powered</div>
                                    <div className="stat-glow"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="cta-section">
                        <div className="cta-container">
                            <div className="cta-content">
                                <h2 className="cta-title">Ready to Experience the Future?</h2>
                                <p className="cta-description">Join thousands of traders who trust THE GLITCH for their automated trading needs</p>
                                
                                <div className="cta-actions">
                                    <button className="cta-primary" onClick={handleStartTrading}>
                                        Get Started Now
                                        <div className="cta-glow"></div>
                                    </button>
                                    <button className="cta-secondary" onClick={() => navigate("/explore")}>
                                        Learn More
                                    </button>
                                </div>
                                
                                <div className="trust-indicators">
                                    <div className="trust-item">
                                        <span className="trust-icon">🔒</span>
                                        <span>Bank-Level Security</span>
                                    </div>
                                    <div className="trust-item">
                                        <span className="trust-icon">⚡</span>
                                        <span>Lightning Fast</span>
                                    </div>
                                    <div className="trust-item">
                                        <span className="trust-icon">🧠</span>
                                        <span>AI-Powered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
            <Chatbot />
        </div>
    );
};

export default Home;
