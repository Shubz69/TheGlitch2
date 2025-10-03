import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Login.css";
import "../styles/SharedBackground.css";
import "../styles/GlitchBranding.css";
import { useAuth } from "../context/AuthContext";
import { RiTerminalBoxFill } from 'react-icons/ri';
import SharedBackground from '../components/SharedBackground';
import Api from '../services/Api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showMfaVerification, setShowMfaVerification] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [userId, setUserId] = useState('');
    const [countdown, setCountdown] = useState(30);
    const [canResendCode, setCanResendCode] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Lightning background effect
    const [lightningBolt, setLightningBolt] = useState(null);
    const [flashEffect, setFlashEffect] = useState(false);
    
    useEffect(() => {
        // Create lightning effect
        const createLightning = () => {
            const bolt = {
                id: Date.now(),
                x: Math.random() * 100,
                y: Math.random() * 100,
                intensity: Math.random() * 0.8 + 0.2,
                duration: Math.random() * 200 + 100
            };
            setLightningBolt(bolt);
            setFlashEffect(true);
            
            // Clear lightning after duration
            setTimeout(() => {
                setLightningBolt(null);
                setFlashEffect(false);
            }, bolt.duration);
        };

        // Create lightning bolts at random intervals
        const lightningInterval = setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                createLightning();
            }
        }, 2000);

        // Initial lightning
        setTimeout(createLightning, 1000);

        return () => clearInterval(lightningInterval);
    }, []);
    
    useEffect(() => {
        // Reset countdown timer if MFA verification is shown
        if (showMfaVerification) {
            let timer = countdown;
            const interval = setInterval(() => {
                if (timer > 0) {
                    timer -= 1;
                    setCountdown(timer);
                } else {
                    setCanResendCode(true);
                    clearInterval(interval);
                }
            }, 1000);
            
            return () => clearInterval(interval);
        }
    }, [showMfaVerification, countdown]);
    
    useEffect(() => {
        // Redirect if already authenticated
        if (isAuthenticated) {
            navigate('/'); // or navigate('/courses');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            console.log('Attempting login with:', email);
            
            // Use the auth context's login function directly
            const data = await login(email, password);
            
            console.log('Login response:', data);
            
            // Handle MFA required case
            if (data && data.status === "MFA_REQUIRED" && !data.mfaVerified) {
                console.log('MFA required, switching to MFA verification...');
                
                // Store email and userId for MFA verification
                localStorage.setItem('mfaEmail', email);
                localStorage.setItem('mfaUserId', data.id);
                
                // Show MFA verification directly in this component
                setUserId(data.id);
                setShowMfaVerification(true);
                setIsLoading(false);
                return;
            }
            
            // Success is handled by the useEffect that checks isAuthenticated
            setIsLoading(false);
        } catch (err) {
            console.error('Login error details:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
            setIsLoading(false);
        }
    };

    const handleVerifyMfa = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        if (!mfaCode || mfaCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            setIsLoading(false);
            return;
        }
        
        try {
            // Mock MFA verification for demo purposes
            const res = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: {
                            token: 'mock-mfa-token',
                            user: { id: userId, email: email }
                        }
                    });
                }, 1000);
            });
            
            // Process successful verification
            if (res.data && res.data.token) {
                localStorage.setItem("token", res.data.token);
                
                if (res.data.refreshToken) {
                    localStorage.setItem("refreshToken", res.data.refreshToken);
                }
                
                localStorage.setItem("mfaVerified", "true");
                
                // Use the login function to update context
                await login(
                    res.data.token,
                    res.data.role, 
                    {
                        id: res.data.id,
                        username: res.data.username,
                        email: res.data.email,
                        name: res.data.name,
                        avatar: res.data.avatar,
                    }
                );
                
                // Navigate to community
                navigate('/community');
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("MFA verification error:", err);
            setError(err.response?.data?.message || "Invalid code. Please try again.");
            setIsLoading(false);
        }
    };
    
    const handleResendCode = async () => {
        setError('');
        setIsLoading(true);
        
        try {
            // Mock MFA resend for demo purposes
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ data: { message: 'MFA code resent' } });
                }, 1000);
            });
            
            setCountdown(30);
            setCanResendCode(false);
            alert("Code resent to your email.");
            setIsLoading(false);
        } catch (err) {
            setError("Failed to resend code. Please try again.");
            setIsLoading(false);
        }
    };
    
    const returnToLogin = () => {
        setShowMfaVerification(false);
        setMfaCode('');
        setError('');
    };

    // Show MFA verification interface
    if (showMfaVerification) {
        return (
            <div className="login-container">
                <SharedBackground />
                <div className="lightning-background">
                    {lightningBolt && (
                        <div 
                            className="lightning-bolt"
                            style={{
                                left: `${lightningBolt.x}%`,
                                top: `${lightningBolt.y}%`,
                                opacity: lightningBolt.intensity,
                                animationDuration: `${lightningBolt.duration}ms`
                            }}
                        />
                    )}
                    {flashEffect && <div className="flash-overlay" />}
                </div>
                
                <div className="login-form-container">
                    <div className="brand-logo">
                        <div className="logo-icon">
                            <RiTerminalBoxFill />
                        </div>
                        <h1 className="brand-title glitch-brand" data-text="WHY THE GLITCH">WHY THE GLITCH</h1>
                    </div>
                    
                    <h2 className="glitch" data-text="MFA VERIFICATION">MFA VERIFICATION</h2>
                    <p className="mfa-info">Please enter the 6-digit code sent to your email.</p>
                    <p className="email-sent">Code sent to: {email}</p>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <form onSubmit={handleVerifyMfa}>
                        <div className="form-group">
                            <label htmlFor="mfa-code">Verification Code</label>
                            <div className="input-wrapper">
                                <input 
                                    type="text"
                                    id="mfa-code"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    maxLength={6}
                                    required
                                    placeholder="Enter 6-digit code"
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={isLoading || mfaCode.length !== 6}
                        >
                            {isLoading ? 'VERIFYING...' : 'VERIFY CODE'}
                        </button>
                        
                        <div className="mfa-actions">
                            <button
                                type="button"
                                className="resend-btn"
                                onClick={handleResendCode}
                                disabled={!canResendCode || isLoading}
                            >
                                {canResendCode ? 'Resend Code' : `Resend Code (${countdown}s)`}
                            </button>
                            
                            <button 
                                type="button"
                                className="back-btn"
                                onClick={returnToLogin}
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Regular login interface
    return (
        <div className="login-container">
            <SharedBackground />
            {/* Lightning Background */}
            <div className="lightning-background">
                {lightningBolt && (
                    <div 
                        className="lightning-bolt"
                        style={{
                            left: `${lightningBolt.x}%`,
                            top: `${lightningBolt.y}%`,
                            opacity: lightningBolt.intensity,
                            animationDuration: `${lightningBolt.duration}ms`
                        }}
                    />
                )}
                {flashEffect && <div className="flash-overlay" />}
            </div>
            
            <div className="login-form-container">
                <div className="brand-section">
                    <h1 className="brand-title glitch-brand" data-text="THE GLITCH">THE GLITCH</h1>
                    <p className="brand-subtitle">FUTURISTIC TRADING PLATFORM</p>
                </div>
                
                <div className="form-header">
                    <h2 className="login-title">SIGN IN</h2>
                    <p className="login-subtitle">Access your trading account</p>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input 
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="Enter your email"
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input 
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            className="form-input"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
                    </button>
                    
                    <Link to="/forgot-password" className="forgot-password">
                        Forgot Password?
                    </Link>
                </form>
                
                <div className="register-link">
                    <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
