import React, { useState, useEffect, useRef } from 'react';
import '../styles/LightningEffect.css';
import '../styles/GlitchBranding.css';

const LightningEffect = ({ onLightningComplete }) => {
    const [lightningPhase, setLightningPhase] = useState(0);
    const [showLightning, setShowLightning] = useState(true);
    const [textVisible, setTextVisible] = useState(false);
    const canvasRef = useRef(null);

    // Matrix-like particle effect - same as all other pages
    useEffect(() => {
        const canvas = canvasRef.current;
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

    useEffect(() => {
        const lightningSequence = [
            { delay: 500, phase: 1 },
            { delay: 1000, phase: 2 },
            { delay: 1500, phase: 3 },
            { delay: 2000, phase: 4 },
            { delay: 2500, phase: 5 },
            { delay: 3000, phase: 6 },
            { delay: 3500, phase: 7 },
            { delay: 4000, phase: 8 }
        ];

        // Start lightning sequence
        lightningSequence.forEach(({ delay, phase }) => {
            setTimeout(() => {
                setLightningPhase(phase);
            }, delay);
        });

        // Show text after first lightning
        setTimeout(() => {
            setTextVisible(true);
        }, 800);

        // Complete lightning effect and show main content
        setTimeout(() => {
            setShowLightning(false);
            if (onLightningComplete) {
                onLightningComplete();
            }
        }, 5000);
    }, [onLightningComplete]);

    if (!showLightning) return null;

    return (
        <div className="lightning-overlay">
            <div className="lightning-container">
                {/* Matrix Background - same as all other pages */}
                <canvas ref={canvasRef} className="matrix-background"></canvas>
                
                {/* Background elements - same as home page */}
                <div className="grid-pattern"></div>
                <div className="floating-particles"></div>
                
                {/* Lightning bolts */}
                <div className={`lightning-bolt bolt-1 lightning-phase-${lightningPhase}`}></div>
                <div className={`lightning-bolt bolt-2 lightning-phase-${lightningPhase}`}></div>
                <div className={`lightning-bolt bolt-3 lightning-phase-${lightningPhase}`}></div>
                <div className={`lightning-bolt bolt-4 lightning-phase-${lightningPhase}`}></div>

                {/* Brand text */}
                <div className={`brand-text ${textVisible ? 'visible' : ''}`}>
                    <h1 className="brand-title glitch-brand" data-text="THE GLITCH">THE GLITCH</h1>
                    <div className="brand-subtitle">FUTURISTIC TRADING PLATFORM</div>
                </div>

                {/* Lightning flash effect */}
                <div className={`lightning-flash lightning-phase-${lightningPhase}`}></div>

                {/* Progress indicator */}
                <div className="lightning-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(lightningPhase / 8) * 100}%` }}></div>
                    </div>
                    <div className="progress-text">SYSTEM INITIALIZING... {Math.round((lightningPhase / 8) * 100)}%</div>
                </div>
            </div>
        </div>
    );
};

export default LightningEffect; 