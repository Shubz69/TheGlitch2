import React from 'react';

// Clean LoadingSpinner component - inline styles to ensure no conflicts
const LoadingSpinner = () => {
    const loadingScreenStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A2E 50%, #0F0F1E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
    };

    const binaryBackgroundStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.1
    };

    const binaryDigitStyle = {
        position: 'absolute',
        color: '#00BFFF',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: '0.8rem',
        userSelect: 'none',
        pointerEvents: 'none',
        opacity: 0.3
    };

    const contentStyle = {
        textAlign: 'center',
        zIndex: 2,
        position: 'relative'
    };

    const titleStyle = {
        fontSize: '4rem',
        fontWeight: '700',
        color: '#00BFFF',
        marginBottom: '1rem',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        letterSpacing: '2px',
        textShadow: '0 0 20px rgba(0, 191, 255, 0.8)',
        textTransform: 'uppercase'
    };

    const subtitleStyle = {
        fontSize: '1.5rem',
        color: '#87CEEB',
        marginBottom: '3rem',
        fontWeight: '400',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        textShadow: '0 0 15px rgba(135, 206, 235, 0.6)'
    };

    const progressStyle = {
        maxWidth: '400px',
        margin: '0 auto'
    };

    const textStyle = {
        fontSize: '1rem',
        color: '#FFFFFF',
        marginBottom: '1rem',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        letterSpacing: '1px',
        fontWeight: '400'
    };

    const barStyle = {
        width: '100%',
        height: '4px',
        background: 'rgba(0, 191, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
    };

    const barFillStyle = {
        height: '100%',
        background: 'linear-gradient(90deg, #00BFFF, #87CEEB)',
        borderRadius: '2px',
        width: '38%',
        position: 'relative'
    };

    return (
        <div style={loadingScreenStyle}>
            {/* Binary digits background */}
            <div style={binaryBackgroundStyle}>
                {Array.from({ length: 200 }, (_, i) => (
                    <div 
                        key={i} 
                        style={{
                            ...binaryDigitStyle,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    >
                        {Math.random() > 0.5 ? '1' : '0'}
                    </div>
                ))}
            </div>
            
            {/* Main content */}
            <div style={contentStyle}>
                <div style={titleStyle}>THE GLITCH</div>
                <div style={subtitleStyle}>WEALTH REVOLUTION</div>
                
                {/* Loading progress */}
                <div style={progressStyle}>
                    <div style={textStyle}>SYSTEM INITIALIZING... <span style={{color: '#00BFFF', fontWeight: '600'}}>38%</span></div>
                    <div style={barStyle}>
                        <div style={barFillStyle}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
