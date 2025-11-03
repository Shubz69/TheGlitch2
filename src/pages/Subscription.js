import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BinaryBackground from '../components/BinaryBackground';
import '../styles/Subscription.css';

const Subscription = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        // Check if user already has active subscription
        const subscriptionStatus = localStorage.getItem('hasActiveSubscription');
        const subscriptionExpiry = localStorage.getItem('subscriptionExpiry');
        
        if (subscriptionStatus === 'true') {
            const expiryDate = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
            if (expiryDate && expiryDate > new Date()) {
                // Has active subscription - redirect to community
                navigate('/community');
                return;
            }
        }
        
        // If new signup, automatically grant first month free
        const isNewSignup = localStorage.getItem('newSignup') === 'true';
        const pendingSubscription = localStorage.getItem('pendingSubscription') === 'true';
        
        if (isNewSignup || pendingSubscription) {
            // Set first month free subscription
            const freeTrialExpiry = new Date();
            freeTrialExpiry.setMonth(freeTrialExpiry.getMonth() + 1);
            localStorage.setItem('hasActiveSubscription', 'true');
            localStorage.setItem('subscriptionExpiry', freeTrialExpiry.toISOString());
            localStorage.setItem('subscriptionType', 'free_trial');
            localStorage.setItem('newSignup', 'false');
            localStorage.setItem('pendingSubscription', 'false');
            
            // Redirect to community after setting free trial
            setTimeout(() => {
                navigate('/community');
            }, 500);
            return;
        }
    }, [isAuthenticated, navigate]);

    const handleSubscribe = async () => {
        setLoading(true);
        setError('');

        try {
            // For now, if backend API is not available, activate free trial directly
            // In production, this should call the backend Stripe API
            try {
                // Try backend API first
                const response = await fetch('https://www.theglitch.world/api/stripe/create-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        priceId: 'price_monthly_subscription',
                        trialPeriodDays: 30 // First month free
                    })
                });

                if (response.ok) {
                    const { sessionId, url } = await response.json();
                    if (url) {
                        // Redirect to Stripe Checkout
                        window.location.href = url;
                        return;
                    }
                }
            } catch (apiError) {
                console.warn('Backend subscription API unavailable, activating free trial directly:', apiError);
            }
            
            // Fallback: Activate free trial directly (for development/testing)
            // Set subscription as active with 30-day free trial
            localStorage.setItem('hasActiveSubscription', 'true');
            localStorage.setItem('subscriptionStatus', 'active');
            localStorage.removeItem('pendingSubscription');
            localStorage.removeItem('subscriptionSkipped');
            
            // Set expiry date (30 days from now for free trial)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            localStorage.setItem('subscriptionExpiry', expiryDate.toISOString());
            
            // Redirect to community
            navigate('/community');
            
        } catch (err) {
            console.error('Subscription error:', err);
            setError('Failed to start subscription process. Please try again or contact support.');
            setLoading(false);
        }
    };

    const handleSkipForNow = () => {
        // Allow them to browse but block community access
        // Don't remove pendingSubscription flag so they're reminded on next login
        localStorage.setItem('subscriptionSkipped', 'true');
        navigate('/courses');
    };
    
    // Handle successful subscription (called from payment success page or webhook)
    useEffect(() => {
        // Check if coming from payment success
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment_success') === 'true') {
            // Mark subscription as active
            localStorage.setItem('hasActiveSubscription', 'true');
            localStorage.removeItem('pendingSubscription');
            localStorage.removeItem('subscriptionSkipped');
            
            // Set subscription expiry (30 days from now for free trial, then monthly)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            localStorage.setItem('subscriptionExpiry', expiryDate.toISOString());
            
            // Redirect to community
            setTimeout(() => {
                navigate('/community');
            }, 2000);
        }
    }, [navigate]);

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="subscription-container">
            <BinaryBackground />
            <div className="subscription-card">
                <div className="subscription-header">
                    <h1>🔒 COMMUNITY ACCESS REQUIRED</h1>
                    <p className="subscription-subtitle">Unlock the full THE GLITCH experience</p>
                </div>

                <div className="subscription-content">
                    <div className="subscription-benefits">
                        <h2>What You Get:</h2>
                        <ul>
                            <li>✅ Access to all community channels</li>
                            <li>✅ Real-time trading discussions</li>
                            <li>✅ Connect with expert traders</li>
                            <li>✅ Share strategies and insights</li>
                            <li>✅ Premium course discussions</li>
                            <li>✅ Exclusive VIP content</li>
                        </ul>
                    </div>

                    <div className="subscription-pricing">
                        <div className="pricing-highlight">
                            <span className="pricing-label">First Month</span>
                            <span className="pricing-amount">FREE</span>
                        </div>
                        <div className="pricing-regular">
                            <span className="pricing-label">Then</span>
                            <span className="pricing-amount">£99/month</span>
                        </div>
                        <p className="pricing-note">Cancel anytime • No hidden fees</p>
                    </div>
                </div>

                {error && <div className="subscription-error">{error}</div>}

                <div className="subscription-actions">
                    <button 
                        className="subscribe-button"
                        onClick={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? 'PROCESSING...' : 'START FREE TRIAL'}
                    </button>
                    <button 
                        className="skip-button"
                        onClick={handleSkipForNow}
                    >
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
