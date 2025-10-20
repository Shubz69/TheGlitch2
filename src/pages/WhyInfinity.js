import React, { useEffect, useState, useRef } from "react";
import "../styles/WhyInfinity.css";
import { FaChartLine, FaGraduationCap, FaArrowRight, FaUsers, FaLock } from "react-icons/fa";
// Unused icons commented out to fix ESLint warnings
// import { FaRobot, FaGlobe, FaServer, FaShieldAlt, FaMobileAlt } from "react-icons/fa";
// import { HiChip, HiLightningBolt } from "react-icons/hi";
import { BiCodeAlt } from 'react-icons/bi';
import { RiStockLine } from 'react-icons/ri';
import { FaRocket, FaChartPie } from 'react-icons/fa';

const WhyInfinity = () => {
    const [visibleSections, setVisibleSections] = useState({
        intro: false,
        chart: false,
        features: false,
    });
    
    const sectionRefs = useRef({
        paragraphSections: [],
        featureBoxes: [],
        chartVisual: null,
        additionalFeatures: null,
        featureCards: []
    });

    // Updated stock data for ticker with more realistic values
    const stockData = [
        { symbol: 'AAPL', price: '192.53', change: '+2.38', isUp: true },
        { symbol: 'MSFT', price: '426.74', change: '-1.28', isUp: false },
        { symbol: 'GOOGL', price: '183.42', change: '+3.71', isUp: true },
        { symbol: 'AMZN', price: '186.93', change: '+1.26', isUp: true },
        { symbol: 'TSLA', price: '244.18', change: '-5.32', isUp: false },
        { symbol: 'META', price: '484.32', change: '+2.95', isUp: true },
        { symbol: 'NVDA', price: '947.52', change: '+18.67', isUp: true },
        { symbol: 'JPM', price: '201.37', change: '-0.84', isUp: false },
        { symbol: 'V', price: '285.16', change: '+1.24', isUp: true },
        { symbol: 'NFLX', price: '651.42', change: '-3.18', isUp: false },
        { symbol: 'AMD', price: '158.73', change: '+4.26', isUp: true },
        { symbol: 'COIN', price: '216.84', change: '+12.37', isUp: true },
        { symbol: 'ETH', price: '3472.16', change: '+105.21', isUp: true },
        { symbol: 'BTC', price: '64238.75', change: '-342.59', isUp: false }
    ];

    // Enhanced SVG paths for feature boxes with more complex patterns
    // Commented out unused variable to fix ESLint warning
    // const featureChartPaths = [
    //     'M0,40 Q10,10 20,30 T40,20 T60,40 T80,30 T100,40 T120,20 T140,40 T160,10 T180,30 T200,40',
    //     'M0,30 C10,10 20,50 30,30 S50,10 70,30 S90,50 110,30 S130,10 150,30 S170,50 190,30 S210,10 230,30',
    //     'M0,30 L10,10 L20,25 L30,5 L40,40 L50,15 L60,35 L70,25 L80,40 L90,20 L100,30 L110,10 L120,35 L130,15 L140,45 L150,25 L160,40 L170,15 L180,35 L190,25 L200,30'
    // ];
    
    // Scroll animations
    useEffect(() => {
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.dataset.sectionId;
                    if (id) {
                        setVisibleSections(prev => ({
                            ...prev,
                            [id]: true
                        }));
                    }
                }
            });
        };

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        // Observe paragraph sections
        sectionRefs.current.paragraphSections.forEach((section, index) => {
            if (section) {
                section.dataset.sectionId = `section-${index + 1}`;
                observer.observe(section);
            }
        });
        
        // Observe feature boxes
        sectionRefs.current.featureBoxes.forEach((box, index) => {
            if (box) {
                box.dataset.sectionId = `feature-${index}`;
                observer.observe(box);
            }
        });

        // Observe chart visual
        if (sectionRefs.current.chartVisual) {
            sectionRefs.current.chartVisual.dataset.sectionId = 'chart-visual';
            observer.observe(sectionRefs.current.chartVisual);
        }
        
        // Observe additional features section
        if (sectionRefs.current.additionalFeatures) {
            sectionRefs.current.additionalFeatures.dataset.sectionId = 'additional-features';
            observer.observe(sectionRefs.current.additionalFeatures);
        }
        
        // Observe feature cards
        sectionRefs.current.featureCards.forEach((card, index) => {
            if (card) {
                card.dataset.sectionId = `feature-card-${index}`;
                observer.observe(card);
            }
        });

        return () => observer.disconnect();
    }, []);
    
    // 3D grid effect with improved animation
    useEffect(() => {
        const grid = document.querySelector('.grid-3d');
        if (!grid) return;

        for (let i = 0; i < 15; i++) {
            const gridLine = document.createElement('div');
            gridLine.className = 'grid-line';
            gridLine.style.setProperty('--delay', i * 0.4);
            gridLine.style.top = `${i * 7}%`;
            grid.appendChild(gridLine);
        }

        return () => {
            while (grid && grid.firstChild) {
                grid.removeChild(grid.firstChild);
            }
        };
    }, []);

    // Matrix-like particle effect
    useEffect(() => {
        const canvas = document.getElementById('matrixCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        
        const characters = "01010101";
        const columns = canvas.width / 20;
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '15px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        }
        
        const interval = setInterval(draw, 70);
        
        return () => clearInterval(interval);
    }, []);

    // Render chart background with more complex pattern
    const renderChartBg = () => (
        <div className="chart-bg">
            <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <path 
                    className="chart-line" 
                    d="M0,600 C100,580 200,620 300,580 C400,540 500,600 600,550 C700,500 800,650 900,600 C1000,550 1100,570 1200,540" 
                    stroke="#fff" 
                />
                <path 
                    className="chart-line" 
                    d="M0,500 C100,480 200,520 300,490 C400,460 500,510 600,470 C700,430 800,550 900,500 C1000,450 1100,470 1200,430" 
                    stroke="#ccc" 
                    style={{ animationDelay: '0.5s' }}
                />
            </svg>
        </div>
    );

    // Enhanced feature charts with gradients
    const renderFeatureChart = (index) => {
        const paths = [
            "M0,50 C10,30 20,40 30,35 C40,30 50,40 60,35 C70,30 80,45 90,40 C100,35 110,30 120,25",
            "M0,40 C10,45 20,25 30,40 C40,55 50,35 60,40 C70,45 80,20 90,35 C100,50 110,30 120,35",
            "M0,30 C10,40 20,30 30,20 C40,10 50,30 60,25 C70,20 80,35 90,30 C100,25 110,40 120,35"
        ];
        
        return (
            <div className="card-chart">
                <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="100%" stopColor="#ccc" />
                        </linearGradient>
                    </defs>
                    <path d={paths[index % paths.length]} stroke={`url(#gradient-${index})`} />
                </svg>
            </div>
        );
    };

    // Render candlestick chart with improved visuals
    const renderCandlestickChart = () => {
        return (
            <div 
                className={`candlestick-chart ${visibleSections['chart-visual'] ? 'fade-in-right' : ''}`}
                ref={el => sectionRefs.current.chartVisual = el}
            >
                <div className="chart-grid"></div>
                {renderTradingDashboard()}
                <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    {/* Price line */}
                    <path 
                        d="M0,150 C50,140 100,160 150,130 C200,100 250,110 300,90 C350,70 400,120 450,100 C500,80 550,60 600,70 C650,80 700,110 750,90 C800,70 850,120 900,100 C950,80 1000,90 1000,90" 
                        stroke="#ccc" 
                        strokeWidth="2" 
                        fill="none" 
                    />
                    
                    {/* Moving average line */}
                    <path 
                        d="M0,160 C50,155 100,150 150,140 C200,130 250,125 300,115 C350,105 400,110 450,105 C500,100 550,95 600,100 C650,105 700,110 750,105 C800,100 850,105 900,100 C950,95 1000,90 1000,90" 
                        stroke="#fff" 
                        strokeWidth="2" 
                        strokeDasharray="5,5" 
                        fill="none" 
                    />
                    
                    {/* Candlesticks */}
                    {Array(20).fill().map((_, i) => {
                        const x = i * 50;
                        const isUp = Math.random() > 0.5;
                        const height = Math.random() * 40 + 20;
                        const y = Math.random() * 60 + 100;
                        const wickHeight = Math.random() * 30 + 10;
                        
                        return (
                            <g key={i}>
                                <line 
                                    x1={x + 23} 
                                    y1={y - wickHeight / 2} 
                                    x2={x + 23} 
                                    y2={y + (isUp ? height : 0) + wickHeight / 2} 
                                    stroke={isUp ? "#fff" : "#666"} 
                                    strokeWidth="1" 
                                />
                                <rect 
                                    x={x + 15} 
                                    y={isUp ? y : y - height} 
                                    width="16" 
                                    height={height} 
                                    fill={isUp ? "#fff" : "#666"} 
                                    fillOpacity="0.8" 
                                />
                            </g>
                        );
                    })}
                    
                    {/* Volume bars */}
                    {Array(20).fill().map((_, i) => {
                        const x = i * 50;
                        const isUp = Math.random() > 0.5;
                        const height = Math.random() * 30 + 5;
                        
                        return (
                            <rect 
                                key={`vol-${i}`}
                                x={x + 15} 
                                y={270 - height} 
                                width="16" 
                                height={height} 
                                fill={isUp ? "rgba(255, 255, 255, 0.3)" : "rgba(102, 102, 102, 0.3)"} 
                            />
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Render trading dashboard elements
    const renderTradingDashboard = () => {
        // Generate buy orders (green)
        const buyOrders = Array(5).fill().map((_, i) => ({
            price: (68000 - (i * 50 + Math.random() * 20)).toFixed(2),
            volume: (Math.random() * 1.5 + 0.2).toFixed(2),
            volumePercentage: Math.random() * 80 + 20
        }));
        
        // Generate sell orders (red)
        const sellOrders = Array(5).fill().map((_, i) => ({
            price: (68100 + (i * 50 + Math.random() * 20)).toFixed(2),
            volume: (Math.random() * 1.5 + 0.2).toFixed(2),
            volumePercentage: Math.random() * 80 + 20
        })).reverse();
        
        return (
            <div className="trading-elements">
                <div className="trading-element">
                    <div className="element-header">
                        <span>Order Book</span>
                        <span className="element-tag">BTC/USD</span>
                    </div>
                    <div className="order-rows">
                        {sellOrders.map((order, i) => (
                            <div className="order-row" key={`sell-${i}`}>
                                <div className="price down">{order.price}</div>
                                <div className="volume-bar">
                                    <div 
                                        className="volume-fill sell" 
                                        style={{ width: `${order.volumePercentage}%` }}
                                    ></div>
                                </div>
                                <div className="volume">{order.volume}</div>
                            </div>
                        ))}
                    </div>
                    <div className="spread">Spread: 87.24 (0.13%)</div>
                    <div className="order-rows">
                        {buyOrders.map((order, i) => (
                            <div className="order-row" key={`buy-${i}`}>
                                <div className="price up">{order.price}</div>
                                <div className="volume-bar">
                                    <div 
                                        className="volume-fill buy" 
                                        style={{ width: `${order.volumePercentage}%` }}
                                    ></div>
                                </div>
                                <div className="volume">{order.volume}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="why-container">
            <canvas id="matrixCanvas" className="matrix-background"></canvas>
            {renderChartBg()}
            
            {/* Floating elements with enhanced SVGs */}
            <div className="floating-element el1">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <path d="M50,10 L90,50 L50,90 L10,50 Z" stroke="#fff" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="floating-element el2">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#ccc" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="floating-element el3">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <path d="M20,20 L80,20 L80,80 L20,80 Z" stroke="#fff" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="content-wrapper">
                {/* Logo with enhanced glitch animation */}
                <div className="why-logo">
                    <div className="logo-glow"></div>
                    <div className="glitch-logo-container">
                        <h1 className="text-logo">Why The Glitch</h1>
                        <div className="glitch-particles"></div>
                    </div>
                </div>
                
                {/* Stock Ticker with real-time feel */}
                <div className="ticker-container">
                    <div className="ticker">
                        {stockData.concat(stockData).map((stock, index) => (
                            <div key={`${stock.symbol}-${index}`} className="ticker-item">
                                <span className="ticker-symbol">{stock.symbol}</span>
                                <span className="ticker-price">{stock.price}</span>
                                <span className={`ticker-change ${stock.isUp ? 'ticker-up' : 'ticker-down'}`}>
                                    {stock.isUp ? "▲" : "▼"} {stock.change}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="content-grid symmetrical-grid">
                    <div className="why-content symmetrical-left">
                        <div className={`paragraph-section ${visibleSections['section-1'] ? 'fade-in-up' : ''}`}
                            ref={el => sectionRefs.current.paragraphSections[0] = el}
                        >
                            <p className="why-paragraph">
                                The Glitch represents the future of trading technology, combining cutting-edge 
                                algorithms with a revolutionary user experience. Our platform breaks the conventional 
                                barriers of trading platforms, offering an intuitive interface that adapts to your trading style.
                            </p>
                            <p className="why-paragraph">
                                Experience the power of our advanced trading simulator, where you can test strategies 
                                in real-time market conditions without risk. Learn from professional traders who have mastered 
                                the art of navigating volatile markets across forex, stocks, and cryptocurrencies.
                            </p>
                        </div>
                        <div className={`paragraph-section ${visibleSections['section-2'] ? 'fade-in-up' : ''}`}
                            ref={el => sectionRefs.current.paragraphSections[1] = el}
                        >
                            <p className="why-paragraph">
                                Join our community of forward-thinking traders where innovation meets execution. 
                                Share strategies, collaborate on market analysis, and stay ahead of market trends with 
                                our real-time updates and expert insights.
                            </p>
                            <div className="btn-container">
                                <button className="start-btn">
                                    Initialize Trading <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="symmetrical-right">
                        <div className="feature-cards-grid">
                            <div className={`feature-box ${visibleSections['feature-0'] ? 'fade-in-up' : ''}`}
                                style={{ transitionDelay: '100ms' }}
                                ref={el => sectionRefs.current.featureBoxes[0] = el}
                            >
                                <div className="feature-icon">
                                    <FaChartLine />
                                </div>
                                <h3 className="feature-title">Advanced Analytics</h3>
                                <p className="feature-description">
                                    Real-time market data and powerful technical analysis tools to make informed trading decisions.
                                </p>
                                {renderFeatureChart(0)}
                            </div>
                            <div className={`feature-box ${visibleSections['feature-1'] ? 'fade-in-up' : ''}`}
                                style={{ transitionDelay: '200ms' }}
                                ref={el => sectionRefs.current.featureBoxes[1] = el}
                            >
                                <div className="feature-icon">
                                    <FaGraduationCap />
                                </div>
                                <h3 className="feature-title">Expert Education</h3>
                                <p className="feature-description">
                                    Comprehensive courses from beginner to advanced, taught by professional traders.
                                </p>
                                {renderFeatureChart(1)}
                            </div>
                            <div className={`feature-box ${visibleSections['feature-2'] ? 'fade-in-up' : ''}`}
                                style={{ transitionDelay: '300ms' }}
                                ref={el => sectionRefs.current.featureBoxes[2] = el}
                            >
                                <div className="feature-icon">
                                    <FaUsers />
                                </div>
                                <h3 className="feature-title">Community Support</h3>
                                <p className="feature-description">
                                    Connect with fellow traders, share strategies, and grow together in our active community.
                                </p>
                                {renderFeatureChart(2)}
                            </div>
                            {/* Add a fourth card for symmetry, or leave blank for now */}
                        </div>
                    </div>
                </div>
                
                <div 
                    className={`additional-features ${visibleSections['additional-features'] ? 'fade-in-up' : ''}`}
                    ref={el => sectionRefs.current.additionalFeatures = el}
                >
                    <h2 className="section-heading">Exclusive Platform Features</h2>
                    
                    <div className="features-grid">
                        <div 
                            className={`feature-card ${visibleSections['feature-card-0'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '150ms' }}
                            ref={el => sectionRefs.current.featureCards[0] = el}
                        >
                            <div className="feature-card-icon">
                                <RiStockLine />
                            </div>
                            <h3>Trading Simulator</h3>
                            <p>
                                Practice trading in a risk-free environment with real market conditions and historical data to perfect your strategies before trading with real capital.
                            </p>
                        </div>
                        
                        <div 
                            className={`feature-card ${visibleSections['feature-card-1'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '300ms' }}
                            ref={el => sectionRefs.current.featureCards[1] = el}
                        >
                            <div className="feature-card-icon">
                                <FaLock />
                            </div>
                            <h3>Secure Platform</h3>
                            <p>
                                Industry-leading security protocols including two-factor authentication, encryption, and regular security audits to keep your account and data safe.
                            </p>
                        </div>
                        
                        <div 
                            className={`feature-card ${visibleSections['feature-card-2'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '450ms' }}
                            ref={el => sectionRefs.current.featureCards[2] = el}
                        >
                            <div className="feature-card-icon">
                                <BiCodeAlt />
                            </div>
                            <h3>Trading Algorithms</h3>
                            <p>
                                Create and deploy custom trading strategies with our easy-to-use algorithm builder, allowing for automated trading based on your specific criteria.
                            </p>
                        </div>
                        
                        <div 
                            className={`feature-card ${visibleSections['feature-card-3'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '600ms' }}
                            ref={el => sectionRefs.current.featureCards[3] = el}
                        >
                            <div className="feature-card-icon">
                                <FaRocket />
                            </div>
                            <h3>Performance Tracking</h3>
                            <p>
                                Comprehensive analytics to track your trading performance, identify strengths and weaknesses, and continuously improve your trading outcomes.
                            </p>
                        </div>
                        
                        <div 
                            className={`feature-card ${visibleSections['feature-card-4'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '750ms' }}
                            ref={el => sectionRefs.current.featureCards[4] = el}
                        >
                            <div className="feature-card-icon">
                                <FaChartPie />
                            </div>
                            <h3>Portfolio Management</h3>
                            <p>
                                Advanced risk management tools to optimize your portfolio allocation and monitor all your investments across different asset classes in one place.
                            </p>
                        </div>
                        
                        <div 
                            className={`feature-card ${visibleSections['feature-card-5'] ? 'fade-in-up' : ''}`} 
                            style={{ transitionDelay: '900ms' }}
                            ref={el => sectionRefs.current.featureCards[5] = el}
                        >
                            <div className="feature-card-icon">
                                <FaUsers />
                            </div>
                            <h3>Social Trading</h3>
                            <p>
                                Follow and copy successful traders' strategies or share your own expertise with our community to earn additional income while helping others succeed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhyInfinity;