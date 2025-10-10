import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Login.css";
import "../styles/SharedBackground.css";
import { RiTerminalBoxFill } from 'react-icons/ri';
import SharedBackground from '../components/SharedBackground';
import Api from '../services/Api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: email input, 2: code verification, 3: new password
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSendResetEmail = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // Call the API service to send password reset email
            const success = await Api.sendPasswordResetEmail(email);
            
            if (success) {
                setSuccess('Password reset email sent! Please check your inbox.');
                setStep(2);
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } catch (err) {
            setError('Failed to send reset email. Please try again.');
        }
        
        setIsLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Mock verification - in real implementation, verify the code with backend
            if (resetCode.length === 6) {
                setSuccess('Code verified successfully!');
                setStep(3);
            } else {
                setError('Please enter a valid 6-digit code.');
            }
        } catch (err) {
            setError('Invalid code. Please try again.');
        }
        
        setIsLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            // Call the API service to reset password
            const success = await Api.resetPassword(resetCode, newPassword);
            
            if (success) {
                setSuccess('Password reset successfully! You can now login with your new password.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        }
        
        setIsLoading(false);
    };

    const renderStep1 = () => (
        <div className="login-form-container">
            <div className="brand-logo">
                <div className="logo-icon">
                    <RiTerminalBoxFill />
                </div>
                <h1 className="brand-title">THE GLITCH</h1>
            </div>
            
            <div className="form-header">
                <h2 className="login-title">RESET PASSWORD</h2>
                <p className="login-subtitle">Enter your email to receive reset instructions</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSendResetEmail}>
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
                
                <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'SENDING...' : 'SEND RESET EMAIL'}
                </button>
            </form>
            
            <div className="register-link">
                <p>Remember your password? <Link to="/login">Back to Login</Link></p>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="login-form-container">
            <div className="brand-logo">
                <div className="logo-icon">
                    <RiTerminalBoxFill />
                </div>
                <h1 className="brand-title">THE GLITCH</h1>
            </div>
            
            <div className="form-header">
                <h2 className="login-title">VERIFY CODE</h2>
                <p className="login-subtitle">Enter the 6-digit code sent to your email</p>
                <p className="email-sent">Code sent to: {email}</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                    <label htmlFor="reset-code" className="form-label">Verification Code</label>
                    <input 
                        type="text"
                        id="reset-code"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit code"
                        className="form-input"
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading || resetCode.length !== 6}
                >
                    {isLoading ? 'VERIFYING...' : 'VERIFY CODE'}
                </button>
            </form>
            
            <div className="register-link">
                <p>Didn't receive the code? <button type="button" onClick={() => setStep(1)} className="link-button">Resend Email</button></p>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="login-form-container">
            <div className="brand-logo">
                <div className="logo-icon">
                    <RiTerminalBoxFill />
                </div>
                <h1 className="brand-title">THE GLITCH</h1>
            </div>
            
            <div className="form-header">
                <h2 className="login-title">NEW PASSWORD</h2>
                <p className="login-subtitle">Enter your new password</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleResetPassword}>
                <div className="form-group">
                    <label htmlFor="new-password" className="form-label">New Password</label>
                    <input 
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                    <input 
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        className="form-input"
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
                </button>
            </form>
            
            <div className="register-link">
                <p>Remember your password? <Link to="/login">Back to Login</Link></p>
            </div>
        </div>
    );

    return (
        <div className="login-container">
            <SharedBackground />
            
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>
    );
};

export default ForgotPassword;
