import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-title">THE GLITCH</div>
                <div className="loading-subtitle">Loading...</div>
                
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
