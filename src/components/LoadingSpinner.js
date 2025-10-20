import React from 'react';

// Clean LoadingSpinner component - inline styles to ensure no conflicts
const LoadingSpinner = () => {
    const loadingScreenStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-medium) 50%, var(--bg-dark) 100%)',
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
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: '0.8rem',
        userSelect: 'none',
        pointerEvents: 'none',
        opacity: 0.18
    };

    const contentStyle = {
        textAlign: 'center',
        zIndex: 2,
        position: 'relative'
    };

    const titleStyle = {
        fontSize: '4rem',
        fontWeight: '700',
        color: 'var(--primary)',
        marginBottom: '1rem',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    };

    const subtitleStyle = {
        fontSize: '1.5rem',
        color: 'var(--accent)',
        marginBottom: '3rem',
        fontWeight: '400',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        textShadow: 'none'
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
        height: '3px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
    };

    const barFillStyle = {
        height: '100%',
        background: 'var(--primary)',
        borderRadius: '3px',
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
                    <div style={textStyle}>SYSTEM INITIALIZING... <span style={{color: 'var(--primary)', fontWeight: '600'}}>38%</span></div>
                    <div style={barStyle}>
                        <div style={barFillStyle}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
