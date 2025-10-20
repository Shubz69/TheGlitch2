import React, { useState, useEffect, useRef } from 'react';
import '../styles/Explore.css';
import '../styles/SharedBackground.css';
// Removed GlitchBranding.css for cleaner design
import SharedBackground from '../components/SharedBackground';

const Explore = () => {
  const [dataPoints, setDataPoints] = useState([]);
  const chartRef = useRef(null);
  
  // Stock ticker data
  const stockData = [
    { symbol: 'BTC', price: '41,225.78', change: '+3.6%', positive: true },
    { symbol: 'ETH', price: '2,482.15', change: '+5.2%', positive: true },
    { symbol: 'AAPL', price: '188.95', change: '-1.2%', positive: false },
    { symbol: 'MSFT', price: '399.25', change: '+2.1%', positive: true },
    { symbol: 'TSLA', price: '242.55', change: '+4.8%', positive: true },
    { symbol: 'NVDA', price: '624.78', change: '+2.7%', positive: true },
    { symbol: 'AMZN', price: '182.95', change: '-0.7%', positive: false },
    { symbol: 'GOOG', price: '165.30', change: '+1.3%', positive: true },
    { symbol: 'SPY', price: '490.15', change: '-0.4%', positive: false },
    { symbol: 'QQQ', price: '420.85', change: '+0.8%', positive: true }
  ];

  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Shubz',
      role: 'Lead Architect',
      expertise: 'AI Trading',
      description: 'Specializes in ML models for market prediction and algorithmic trading systems.'
    },
    {
      id: 2,
      name: 'Aaron',
      role: 'UI/UX Director',
      expertise: 'Trading UI',
      description: 'Creates intuitive interfaces for complex financial data visualization.'
    },
    {
      id: 3,
      name: 'Shaun',
      role: 'Quant Analyst',
      expertise: 'Risk Models',
      description: 'Develops proprietary risk assessment algorithms and portfolio optimization.'
    },
    {
      id: 4,
      name: 'Leonardo',
      role: 'Security Engineer',
      expertise: 'Blockchain',
      description: 'Implements cutting-edge security protocols and blockchain integration.'
    }
  ];

  // Generate random data points for background visualization
  useEffect(() => {
    const generateSmoothData = () => {
      const points = [];
      let y = 50;
      
      // Generate more points for a smoother line
      for (let i = 0; i < 50; i++) {
        // Create a smoother curve with smaller variations between points
        const nextY = y + (Math.random() * 6 - 3);
        y = Math.max(30, Math.min(70, nextY)); // Keep within bounds
        
        points.push({
          x: i * 2, // Spread points evenly
          y: y
        });
      }
      
      setDataPoints(points);
    };
    
    generateSmoothData();
    
    // Create blinking data points effect
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * dataPoints.length);
      if (chartRef.current && dataPoints.length > 0) {
        const dataPoint = chartRef.current.querySelectorAll('.data-point')[randomIndex];
        if (dataPoint) {
          dataPoint.classList.add('highlight-point');
          setTimeout(() => {
            dataPoint.classList.remove('highlight-point');
          }, 700);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [dataPoints.length]);

  return (
    <div className="explore-container">
      <SharedBackground />

      {/* Stock Ticker */}
      <div className="stock-ticker">
        <div className="ticker-wrap">
          <div className="ticker">
            {stockData.map((stock, index) => (
              <div key={index} className="ticker-item">
                <span className="stock-symbol">{stock.symbol}</span>
                <span className="stock-price">{stock.price}</span>
                <span className={`stock-change ${stock.positive ? 'positive' : 'negative'}`}>
                  {stock.change}
                </span>
              </div>
            ))}
            {/* Duplicate ticker items for seamless animation */}
            {stockData.map((stock, index) => (
              <div key={`dup-${index}`} className="ticker-item">
                <span className="stock-symbol">{stock.symbol}</span>
                <span className="stock-price">{stock.price}</span>
                <span className={`stock-change ${stock.positive ? 'positive' : 'negative'}`}>
                  {stock.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="explore-header">
        <h1 className="explore-title">
          WELCOME TO THE GLITCH
        </h1>
        <p className="explore-subtitle">
          Experience our <span className="highlight">AI-POWERED</span> trading platform with advanced predictive analytics, real-time market insights, and proprietary algorithms designed by elite quantitative analysts for serious investors.
        </p>
      </div>

      {/* Stock Ticker */}
      <div className="ticker-section">
        <div className="ticker-container">
          <h2 className="ticker-title">Live Market Data</h2>
          <div className="ticker-wrapper">
            {stockData.map((stock, index) => (
              <div key={index} className="ticker-item">
                <span className="ticker-symbol">{stock.symbol}</span>
                <span className={`ticker-price ${stock.positive ? 'up' : 'down'}`}>{stock.price}</span>
                <span className={`ticker-change ${stock.positive ? 'up' : 'down'}`}>
                  {stock.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-container">
          <div className="team-header">
            <h2 className="team-title">OUR EXPERT TEAM</h2>
            <p className="team-subtitle">Meet the professionals behind THE GLITCH platform</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-card">
                <div className="team-avatar">{member.name.charAt(0)}</div>
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-description">{member.description}</p>
                <div className="team-skills">
                  <span className="skill-tag">{member.expertise}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="services-section">
        <div className="services-container">
          <div className="services-header">
            <h2 className="services-title">PLATFORM FEATURES</h2>
            <p className="services-subtitle">Advanced tools for serious traders</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📊</div>
              <h3 className="service-title">AI Predictive Analytics</h3>
              <p className="service-description">Proprietary machine learning algorithms that identify complex market patterns and predict price movements with up to 76% accuracy.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🤖</div>
              <h3 className="service-title">Automated Trading Systems</h3>
              <p className="service-description">Deploy sophisticated trading algorithms with custom parameters that execute precisely when your conditions are met.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📱</div>
              <h3 className="service-title">Real-time Alerts</h3>
              <p className="service-description">Never miss a trading opportunity with customizable push notifications for price movements and technical indicators.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🔒</div>
              <h3 className="service-title">Enterprise Security</h3>
              <p className="service-description">Military-grade encryption, multi-factor authentication, and 24/7 monitoring ensures your data and funds remain secure.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📈</div>
              <h3 className="service-title">Advanced Charting</h3>
              <p className="service-description">Professional-grade technical analysis tools with over 100+ indicators and drawing tools for precise market visualization.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🧠</div>
              <h3 className="service-title">Sentiment Analysis</h3>
              <p className="service-description">Real-time processing of news, social media, and market data to gauge market sentiment and identify potential catalysts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Explore;
