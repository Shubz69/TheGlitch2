import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Courses.css';
import Api from '../services/Api';
import { FaBrain, FaDumbbell, FaShoppingCart, FaExchangeAlt, FaBitcoin, FaRobot, FaCode, FaInstagram, FaHome } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import BinaryBackground from '../components/BinaryBackground';

// Fallback API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://theglitch.world';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                console.log('Fetching courses from:', `${API_BASE_URL}/api/courses`);
                const response = await Api.getCourses();
                
                // Ensure response.data is an array and filter out invalid courses
                const coursesData = Array.isArray(response.data) 
                    ? response.data.filter(course => course && course.id && course.title)
                    : [];
                setCourses(coursesData);
                
                // Check if we're using mock data by examining the course IDs
                // The mock data uses IDs 1-8
                const isMockData = coursesData && 
                    coursesData.length === 8 && 
                    coursesData[0]?.id === 1 &&
                    coursesData[1]?.id === 2 &&
                    coursesData[2]?.id === 3 &&
                    coursesData[3]?.id === 4;
                
                setUsingMockData(isMockData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching courses:', error);
                // Set empty array to prevent map error
                setCourses([]);
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
            console.log("Starting course purchase for:", course.id, course.title);
            
            // Store the course ID for later use after payment completes
            localStorage.setItem("purchasedCourseId", course.id);
            localStorage.setItem("purchasedCourseTitle", course.title);
            
            // Check if the course is free
            if (course.price === 0) {
                console.log("Processing free course enrollment");
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
                    console.error('Error enrolling in free course:', error);
                    toast.error('Unable to enroll in course. Please try again.');
                    setProcessingPayment(false);
                }
                return;
            }
            
            // DIRECT STRIPE PAYMENT LINK APPROACH
            console.log("Using direct Stripe payment link");
            
            // Live Stripe payment link provided by the user
            const stripePaymentLink = "https://buy.stripe.com/14k6pTfh32W07zG9AK";
            
            // Open the payment link in a new tab
            window.open(stripePaymentLink, "_blank");
            
            // Reset the processing state
            setProcessingPayment(false);
            
        } catch (error) {
            console.error('Payment initiation error:', error);
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
                <BinaryBackground />
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
                <BinaryBackground />
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
            <BinaryBackground />
            <div className="courses-header">
                <h1 className="courses-title">COURSES</h1>
                <p>Expand your knowledge with our comprehensive trading courses</p>
            </div>
            
            {usingMockData && (
                <div className="mock-data-banner">
                    <p>Note: Displaying sample course data. The backend server may be unavailable.</p>
                </div>
            )}
            
            <div className="courses-grid">
                {Array.isArray(courses) && courses.length > 0 ? (
                    courses
                        .filter(course => course && course.id && course.title)
                        .map(course => (
                        <div className="course-card" key={course.id}>
                            <div className="course-image">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title || 'Course'} />
                                ) : (
                                    <div className="placeholder-image">{(course.title && course.title.length > 0) ? course.title.charAt(0).toUpperCase() : '?'}</div>
                                )}
                            </div>
                            <div className="course-info">
                                <h3>{(course.title || 'Unnamed Course').toUpperCase()}</h3>
                                <p className="course-description">{course.description || 'No description available'}</p>
                                <div className="course-cta">
                                    <span className="coming-soon-badge">
                                        COMING SOON
                                    </span>
                                    <button 
                                        className="enroll-button disabled"
                                        disabled={true}
                                    >
                                        <span>Buy Now</span>
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