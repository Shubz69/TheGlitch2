import React, { useState, useEffect } from 'react';
import '../styles/GlitchEffect.css';

const GlitchEffect = ({ onGlitchComplete }) => {
    const [glitchPhase, setGlitchPhase] = useState(0);
    const [showGlitch, setShowGlitch] = useState(true);

    useEffect(() => {
        const glitchSequence = [
            { delay: 1000, phase: 1 },
            { delay: 2000, phase: 2 },
            { delay: 3000, phase: 3 },
            { delay: 4000, phase: 4 },
            { delay: 5000, phase: 5 },
            { delay: 6000, phase: 6 }
        ];

        glitchSequence.forEach(({ delay, phase }) => {
            setTimeout(() => {
                setGlitchPhase(phase);
            }, delay);
        });

        // After glitch sequence, hide the glitch and show main content
        setTimeout(() => {
            setShowGlitch(false);
            if (onGlitchComplete) {
                onGlitchComplete();
            }
        }, 7000);
    }, [onGlitchComplete]);

    if (!showGlitch) return null;

    return (
        <div className="glitch-overlay">
            <div className="glitch-container">
                <div className={`glitch-text glitch-phase-${glitchPhase}`}>
                    <span className="glitch-main">THE GLITCH</span>
                    <span className="glitch-red">THE GLITCH</span>
                    <span className="glitch-blue">THE GLITCH</span>
                    <span className="glitch-green">THE GLITCH</span>
                </div>
                <div className="glitch-subtitle">
                    <span className="subtitle-main">SYSTEM INITIALIZATION</span>
                    <span className="subtitle-red">SYSTEM INITIALIZATION</span>
                    <span className="subtitle-blue">SYSTEM INITIALIZATION</span>
                </div>
                <div className="glitch-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(glitchPhase / 6) * 100}%` }}></div>
                    </div>
                    <div className="progress-text">LOADING... {Math.round((glitchPhase / 6) * 100)}%</div>
                </div>
            </div>
        </div>
    );
};

export default GlitchEffect; 