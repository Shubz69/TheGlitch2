import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/Chatbot";

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleStartTrading = () => {
        if (isAuthenticated) {
            navigate("/courses");
        } else {
            navigate("/register");
        }
    };

    const features = [
        {
            icon: "📊",
            title: "Advanced Analytics",
            description: "Comprehensive market analysis and trend prediction tools"
        },
        {
            icon: "🤖",
            title: "AI-Powered Trading",
            description: "Automated strategies that adapt to market conditions"
        },
        {
            icon: "🔒",
            title: "Secure Platform",
            description: "Bank-grade security with encrypted transactions"
        },
        {
            icon: "📈",
            title: "Real-time Data",
            description: "Live market data and instant trade execution"
        }
    ];

    const stats = [
        { number: "20,000+", label: "Active Users" },
        { number: "99%", label: "Success Rate" },
        { number: "247%", label: "Average ROI" },
        { number: "24/7", label: "Support" }
    ];

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            No more emotion. No more FOMO.<br />
                            Just AI driven results.
                        </h1>
                        <p className="hero-description">
                            TheGlitch is an industry leading provider of automatable trading strategies for retail traders.
                            Unlock market leading strategies used by over 20,000+ users worldwide.
                        </p>
                        <div className="hero-buttons">
                            <button className="btn-primary" onClick={handleStartTrading}>
                                Try risk free for 30 days
                            </button>
                            <button className="btn-secondary" onClick={() => navigate("/explore")}>
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Institutional-grade tools made for retail traders in every market.</h2>
                    <p className="section-subtitle">Used everyday by 6 & 7 figure futures, crypto, stock, forex traders.</p>
                    
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-number">{stat.number}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Start your success journey.</h2>
                        <p className="cta-description">Everyday retail traders finding their way to beat the market.</p>
                        <button className="btn-primary" onClick={handleStartTrading}>
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            <Chatbot />
        </div>
    );
};

export default Home;
