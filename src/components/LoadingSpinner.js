import React from 'react';
import './LoadingSpinner.css';

// Clean LoadingSpinner component - no effects, Arial fonts
const LoadingSpinner = () => {
    return (
        <div className="loading-screen">
            {/* Clean background - no binary effects */}
            <div className="loading-background">
                {/* Removed binary digit effects for clean design */}
            </div>
            
            {/* Main content */}
            <div className="loading-content">
                <div className="loading-title">THE GLITCH</div>
                <div className="loading-subtitle">WEALTH REVOLUTION</div>
                
                {/* Loading progress */}
                <div className="loading-progress">
                    <div className="loading-text">SYSTEM INITIALIZING... <span className="loading-percentage">63%</span></div>
                    <div className="loading-bar">
                        <div className="loading-bar-fill"></div>
                    </div>
                </div>
            </div>
            
            {/* Removed pulsing rings for clean design */}
        </div>
    );
};

export default LoadingSpinner;
