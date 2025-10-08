import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/Login.css";
import "../styles/SharedBackground.css";
// Removed GlitchBranding.css for cleaner design
import infinityLogo from "../styles/assets/infinity-logo.png";
import SharedBackground from '../components/SharedBackground';

function SignUp() {
    const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate(); // initialize useNavigate hook

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

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error("Registration failed.");
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);

            // Redirect to community page or profile after successful sign-up
            navigate("/community"); // or use navigate('/profile');
        } catch (error) {
            console.error("Registration error:", error);
            setError("Unable to register. Please try again later.");
        }
    };

    return (
        <div className="login-container">
            <SharedBackground />
            <div className="login-box">
                <img src={infinityLogo} alt="Infinity AI Logo" className="login-logo" />
                <div className="brand-section">
                    <h1 className="brand-title">THE GLITCH</h1>
                    <p className="brand-subtitle">FUTURISTIC TRADING PLATFORM</p>
                </div>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn">Register</button>
                </form>

                <p style={{ color: '#ccc' }}>Already have an account?</p>
                <button className="register-btn" onClick={() => navigate("/login")}>Sign In</button>
            </div>
        </div>
    );
}

export default SignUp;
