import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Register.css";
import "../styles/SharedBackground.css";
import "../styles/GlitchBranding.css";
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
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const navigate = useNavigate();
    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter username"
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter email"
                                className="form-input"
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter full name"
                                className="form-input"
                            />
                        </div>
                        
                    </div>
                    
                    <div className="avatar-selection">
                        <label className="form-label">Choose Avatar</label>
                        <div className="avatar-grid">
                            {avatarOptions.map((option) => (
                                <div 
                                    key={option.value}
                                    className={`avatar-option ${formData.avatar === option.value ? 'selected' : ''}`}
                                    onClick={() => handleInputChange({ target: { name: 'avatar', value: option.value } })}
                                >
                                    <img 
                                        src={`/avatars/${option.value}`} 
                                        alt={option.label}
                                        onError={(e) => {
                                            e.target.src = '/avatars/avatar_ai.png';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter password"
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                placeholder="Confirm password"
                                className="form-input"
                            />
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
