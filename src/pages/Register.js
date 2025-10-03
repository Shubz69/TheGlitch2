import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Register.css";
import "../styles/SharedBackground.css";
import "../styles/GlitchBranding.css";
import { FaUser, FaEnvelope, FaLock, FaUserCircle } from 'react-icons/fa';
import SharedBackground from '../components/SharedBackground';
import Api from '../services/Api';
// Import avatar images
// import avatar1 from '../../public/avatars/avatar_ai.png';
// import avatar2 from '../../public/avatars/avatar_money.png';
// import avatar3 from '../../public/avatars/avatar_tech.png';
// import avatar4 from '../../public/avatars/avatar_trading.png';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        avatar: 'avatar_ai.png'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const checkPasswordStrength = (password) => {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const length = password.length;

        let strength = 0;
        if (hasLower) strength++;
        if (hasUpper) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;
        if (length >= 8) strength++;

        if (strength < 2) setPasswordStrength('weak');
        else if (strength < 4) setPasswordStrength('medium');
        else if (strength < 5) setPasswordStrength('strong');
        else setPasswordStrength('very-strong');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!acceptedTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setIsLoading(true);

        try {
            const response = await Api.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                avatar: formData.avatar
            });

            // Registration successful - user is automatically logged in
            alert('Registration successful! You are now logged in.');
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const avatarOptions = [
        { value: 'avatar_ai.png', label: 'AI Avatar' },
        { value: 'avatar_money.png', label: 'Money Avatar' },
        { value: 'avatar_tech.png', label: 'Tech Avatar' },
        { value: 'avatar_trading.png', label: 'Trading Avatar' }
    ];

    return (
        <div className="register-container">
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
            
            <div className="register-form-container">
                <div className="brand-section">
                    <h1 className="brand-title glitch-brand" data-text="THE GLITCH">THE GLITCH</h1>
                    <p className="brand-subtitle">FUTURISTIC TRADING PLATFORM</p>
                </div>
                
                <h2 className="glitch glitch-brand" data-text="SIGN UP">SIGN UP</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter username"
                                />
                                <FaUser className="input-icon" />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter email"
                                />
                                <FaEnvelope className="input-icon" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter full name"
                                />
                                <FaUserCircle className="input-icon" />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="avatar">Avatar</label>
                            <select
                                id="avatar"
                                name="avatar"
                                value={formData.avatar}
                                onChange={handleInputChange}
                                className="avatar-dropdown"
                            >
                                {avatarOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="avatar-preview">
                        <img 
                            src={`/avatars/${formData.avatar}`} 
                            alt="Selected Avatar" 
                            className="avatar-img"
                            onError={(e) => {
                                e.target.src = '/avatars/avatar_ai.png';
                            }}
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onFocus={() => setShowPasswordRequirements(true)}
                                    onBlur={() => setShowPasswordRequirements(false)}
                                    required
                                    placeholder="Enter password"
                                />
                                <FaLock className="input-icon" />
                            </div>
                            {showPasswordRequirements && (
                                <div className="password-requirements">
                                    <ul className="requirements-list">
                                        <li>At least 8 characters</li>
                                        <li>One uppercase letter</li>
                                        <li>One lowercase letter</li>
                                        <li>One number</li>
                                        <li>One special character</li>
                                    </ul>
                                </div>
                            )}
                            <div className="password-strength">
                                <div className={`strength-meter ${passwordStrength}`}></div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Confirm password"
                                />
                                <FaLock className="input-icon" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="terms-checkbox">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                        />
                        <label htmlFor="terms">
                            I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                        </label>
                    </div>
                    
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                </form>
                
                <div className="login-link">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
