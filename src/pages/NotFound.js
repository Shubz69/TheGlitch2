import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';
import '../styles/SharedBackground.css';
import SharedBackground from '../components/SharedBackground';

const NotFound = () => {
    const navigate = useNavigate();
    
    // Auto-redirect to courses page after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/courses');
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [navigate]);
    
    return (
        <div className="not-found-container">
            <SharedBackground />
            <div className="not-found-content">
                <div className="error-code">404</div>
                <div className="glitch-wrapper">
                    <div className="glitch" data-text="Redirecting...">Redirecting...</div>
                </div>
                
                <p className="error-message">
                    Taking you back to courses page in a few seconds...
                </p>
                
                <div className="portal-container">
                    <div className="portal-effect"></div>
                    <Link to="/courses" className="return-home-button">
                        Go to Courses
                    </Link>
                </div>
                
                <div className="stars"></div>
            </div>
        </div>
    );
};

export default NotFound;
