import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Courses.css';
import '../styles/SharedBackground.css';
// Removed GlitchBranding.css for cleaner design
import Api from '../services/Api';
import { FaBrain, FaDumbbell, FaShoppingCart, FaExchangeAlt, FaBitcoin, FaRobot, FaCode, FaInstagram, FaHome } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import SharedBackground from '../components/SharedBackground';

// Fallback API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth(); // Get auth context without destructuring unused variables

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await Api.getCourses();
                setCourses(response.data);
                
                // Check if we're using mock data by examining the course IDs
                // The mock data uses IDs 1-8
                const isMockData = response.data && 
                    response.data.length === 8 && 
                    response.data[0]?.id === 1 &&
                    response.data[1]?.id === 2 &&
                    response.data[2]?.id === 3 &&
                    response.data[3]?.id === 4;
                
                setUsingMockData(isMockData);
                setLoading(false);
            } catch (error) {
                // Show a more user-friendly error message
                if (error.response && error.response.status === 403) {
                    setError('Authentication error. Please log in first or try again later.');
                } else {
                    setError('Failed to load courses. Please try again later.');
                }
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleCourseClick = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    const handleEnrollClick = async (course) => {
        try {
            setProcessingPayment(true);
            
            // Store the course ID for later use after payment completes
            localStorage.setItem("purchasedCourseId", course.id);
            localStorage.setItem("purchasedCourseTitle", course.title);
            
            // Check if the course is free
            if (course.price === 0) {
                try {
                    // For free courses, directly process the enrollment
                    const response = await axios.post(
                        `${API_BASE_URL}/api/payments/complete`,
                        { courseId: course.id },
                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );
                    
                    if (response.status === 200) {
                        toast.success(`Successfully enrolled in ${course.title}!`);
                        navigate('/payment-success');
                    } else {
                        throw new Error("Failed to enroll in course");
                    }
                } catch (error) {
                    toast.error('Unable to enroll in course. Please try again.');
                    setProcessingPayment(false);
                }
                return;
            }
            
            // DIRECT STRIPE PAYMENT LINK APPROACH
            
            // Live Stripe payment link provided by the user
            const stripePaymentLink = "https://buy.stripe.com/14k6pTfh32W07zG9AK";
            
            // Open the payment link in a new tab
            window.open(stripePaymentLink, "_blank");
            
            // Reset the processing state
            setProcessingPayment(false);
            
        } catch (error) {
            toast.error('Payment processing failed. Please try again.');
            setProcessingPayment(false);
        }
    };

    const getCourseIcon = (title) => {
        if (title.includes('Health') || title.includes('Fitness')) return <FaDumbbell />;
        if (title.includes('E-Commerce')) return <FaShoppingCart />;
        if (title.includes('Forex')) return <FaExchangeAlt />;
        if (title.includes('Crypto') || title.includes('Blockchain')) return <FaBitcoin />;
        if (title.includes('Algorithmic') || title.includes('FX')) return <FaRobot />;
        if (title.includes('Intelligent') || title.includes('Systems') || title.includes('Development')) return <FaCode />;
        if (title.includes('Social') || title.includes('Media')) return <FaInstagram />;
        if (title.includes('Real') || title.includes('Estate')) return <FaHome />;
        return <FaBrain />;
    };

    if (loading) {
        return (
            <div className="courses-container">
                <SharedBackground />
                <div className="stars"></div>
                <div className="courses-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="courses-container">
                <SharedBackground />
                <div className="stars"></div>
                <div className="courses-error">
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="courses-container">
            <SharedBackground />
            <div className="stars"></div>
            <div className="courses-header">
                <h1 className="glitch">COURSES</h1>
                <p>Expand your knowledge with our comprehensive trading courses</p>
            </div>
            
            {usingMockData && (
                <div className="mock-data-banner">
                    <p>Note: Displaying sample course data. The backend server may be unavailable.</p>
                </div>
            )}
            
            <div className="courses-grid">
                {courses.length > 0 ? (
                    courses.map(course => (
                        <div className="course-card" key={course.id}>
                            <div className="course-image">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} />
                                ) : (
                                    <div className="placeholder-image">{course.title.charAt(0)}</div>
                                )}
                            </div>
                            <div className="course-info">
                                <h3>{course.title.toUpperCase()}</h3>
                                <p className="course-description">{course.description}</p>
                                <div className="course-cta">
                                    <span className="price">
                                        {course.price === 0 ? 'Free' : `$${course.price}`}
                                    </span>
                                    <button 
                                        className="enroll-button"
                                        onClick={() => handleEnrollClick(course)}
                                        disabled={processingPayment}
                                    >
                                        <span>{processingPayment ? 'Processing...' : course.price === 0 ? 'Enroll Now' : 'Buy Now'}</span>
                                        <span className="button-glow"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-courses">
                        <h2>NO COURSES AVAILABLE</h2>
                        <p>Check back later for new course offerings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;