import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Login.css";
import BinaryBackground from '../components/BinaryBackground';
import { useAuth } from "../context/AuthContext";

function SignUp() {
    const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password, confirmPassword } = formData;

        if (!email || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await register({ email, password });
            
            // If MFA is required, the register function will redirect to verify-mfa
            // Otherwise, redirect to community
            if (response && response.status !== "MFA_REQUIRED") {
                navigate("/community");
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError(error.message || "Unable to register. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <BinaryBackground />
            <div className="login-form-container">
                <div className="form-header">
                    <h2 className="login-title">SIGN UP</h2>
                    <p className="login-subtitle">Create your new account</p>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
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
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Create a password"
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
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            className="form-input"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
                    </button>
                </form>
                
                <div className="register-link">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
