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
    <div className="explore-page">
      <SharedBackground />
      {/* SVG Background Chart */}
      <svg className="chart-background" viewBox="0 0 100 100" preserveAspectRatio="none" ref={chartRef}>
        {/* Grid Lines */}
        {[...Array(20)].map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 5}
            x2="100"
            y2={i * 5}
            className="grid-line"
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 5}
            y1="0"
            x2={i * 5}
            y2="100"
            className="grid-line"
          />
        ))}
        
        {/* Support and Resistance Lines */}
        <line x1="0" y1="30" x2="100" y2="30" className="resistance-line" />
        <line x1="0" y1="70" x2="100" y2="70" className="support-line" />
        
        {/* Moving Average Line */}
        <path
          d="M0,55 L100,45"
          className="ma-line"
        />
        
        {/* Trend Line */}
        <path
          d={`M0,${dataPoints.length > 0 ? dataPoints[0].y : 50} ${dataPoints.map(p => `L${p.x},${p.y}`).join(' ')}`}
          className="trend-line"
        />
        
        {/* Data Points */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="0.4"
            className="data-point"
          />
        ))}
      </svg>

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
      <header className="explore-header">
        <h1 className="explore-title">
          WELCOME TO THE GLITCH
        </h1>
        <p className="explore-subtitle">
          Experience our <span className="highlight">AI-POWERED</span> trading platform with advanced predictive analytics, real-time market insights, and proprietary algorithms designed by elite quantitative analysts for serious investors.
        </p>
      </header>

      {/* Team Section */}
      <section className="team-section">
        <h2>OUR EXPERT TEAM</h2>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-member">
              <div className="member-image-container">
                <div className="member-image">
                  <div className="image-placeholder">{member.name.charAt(0)}</div>
                </div>
                <div className="expertise-tag">{member.expertise}</div>
              </div>
              <h3>{member.name}</h3>
              <p className="member-role">{member.role}</p>
              <p className="member-description">{member.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>TRADER TESTIMONIALS</h2>
        <div className="testimonial-container">
          <div className="testimonial-card">
            <div className="quote-mark">"</div>
            <p>
              The AI-powered predictive analytics have completely transformed my trading strategy. My win rate increased from 52% to 68% within the first month of using this platform.
            </p>
            <div className="testimonial-author">
              <span className="author-name">Michael T.</span>
              <span className="author-title">Professional Day Trader | 5+ years experience</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="quote-mark">"</div>
            <p>
              As an institutional portfolio manager, I need tools that can process vast amounts of market data quickly. This platform's risk models deliver insights that have helped me optimize several multi-million dollar portfolios.
            </p>
            <div className="testimonial-author">
              <span className="author-name">Sophia R.</span>
              <span className="author-title">Hedge Fund Analyst | AUM $150M+</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="quote-mark">"</div>
            <p>
              The community insights combined with AI-driven technical analysis create a powerful edge. I've reduced my research time by 70% while improving my position sizing and risk management tremendously.
            </p>
            <div className="testimonial-author">
              <span className="author-name">David K.</span>
              <span className="author-title">Swing Trader | Crypto Specialist</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="feature-highlights">
        <h2>PLATFORM FEATURES</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>AI Predictive Analytics</h3>
            <p>Proprietary machine learning algorithms that identify complex market patterns and predict price movements with up to 76% accuracy.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Automated Trading Systems</h3>
            <p>Deploy sophisticated trading algorithms with custom parameters that execute precisely when your conditions are met, with microsecond precision.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Real-time Alerts</h3>
            <p>Never miss a trading opportunity with customizable push notifications for price movements, technical indicators, and AI-detected patterns.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Enterprise Security</h3>
            <p>Military-grade encryption, multi-factor authentication, and 24/7 monitoring ensures your data and funds remain completely secure.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Advanced Charting</h3>
            <p>Professional-grade technical analysis tools with over 100+ indicators and drawing tools for precise market visualization.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Sentiment Analysis</h3>
            <p>Real-time processing of news, social media, and market data to gauge market sentiment and identify potential catalysts.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Explore;
