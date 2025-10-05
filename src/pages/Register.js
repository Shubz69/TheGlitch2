import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Register.css";
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
        profilePicture: null,
        profileColor: '#6366F1'
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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB.');
                return;
            }
            
            setFormData(prev => ({ ...prev, profilePicture: file, profileColor: null }));
            setError('');
        }
    };

    const handleColorSelect = (color) => {
        setFormData(prev => ({ ...prev, profileColor: color, profilePicture: null }));
        setError('');
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
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('username', formData.username);
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            submitData.append('name', formData.name);
            
            if (formData.profilePicture) {
                submitData.append('profilePicture', formData.profilePicture);
            } else {
                submitData.append('profileColor', formData.profileColor);
            }

            await Api.register(submitData);

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

    const colorOptions = [
        { value: '#6366F1', name: 'Purple' },
        { value: '#8B5CF6', name: 'Violet' },
        { value: '#EC4899', name: 'Pink' },
        { value: '#EF4444', name: 'Red' },
        { value: '#F59E0B', name: 'Orange' },
        { value: '#10B981', name: 'Green' },
        { value: '#3B82F6', name: 'Blue' },
        { value: '#6B7280', name: 'Gray' }
    ];

    return (
        <div className="register-container">
            <div className="register-form-container">
                
                <div className="form-header">
                    <h2 className="register-title">SIGN UP</h2>
                    <p className="register-subtitle">Create your new account</p>
                </div>
                
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
                    
                    <div className="profile-picture-section">
                        <label className="form-label">Profile Picture</label>
                        
                        {/* Image Upload */}
                        <div className="image-upload-container">
                            <input
                                type="file"
                                id="profilePicture"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="profilePicture" className="upload-button">
                                <span className="upload-icon">📷</span>
                                Upload Photo
                            </label>
                        </div>

                        {/* Preview */}
                        {formData.profilePicture && (
                            <div className="image-preview">
                                <img 
                                    src={URL.createObjectURL(formData.profilePicture)} 
                                    alt="Profile preview" 
                                    className="preview-image"
                                />
                                <button 
                                    type="button" 
                                    className="remove-image"
                                    onClick={() => setFormData(prev => ({ ...prev, profilePicture: null }))}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Color Selection */}
                        <div className="color-selection">
                            <p className="color-label">Or choose a color:</p>
                            <div className="color-grid">
                                {colorOptions.map((color) => (
                                    <div
                                        key={color.value}
                                        className={`color-option ${formData.profileColor === color.value ? 'selected' : ''}`}
                                        style={{ backgroundColor: color.value }}
                                        onClick={() => handleColorSelect(color.value)}
                                        title={color.name}
                                    />
                                ))}
                            </div>
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
                    
                    <button type="submit" className="register-button" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
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
