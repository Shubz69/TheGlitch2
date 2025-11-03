import React, { useEffect, useState } from 'react';
import '../styles/MyCourses.css';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import BinaryBackground from '../components/BinaryBackground';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [userRole, setUserRole] = useState('');
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // Stock ticker data matching the image
    const stockData = [
        { symbol: 'ETH', price: '$2,865.92', change: '+1.8%', isUp: true },
        { symbol: 'AAPL', price: '$187.45', change: '-0.6%', isUp: false },
        { symbol: 'MSFT', price: '$402.17', change: '+1.2%', isUp: true },
        { symbol: 'TSLA', price: '$248.38', change: '-1.4%', isUp: false },
        { symbol: 'AMZN', price: '$182.79', change: '+0.9%', isUp: true },
        { symbol: 'NVDA', price: '$924.67', change: '+3.1%', isUp: true },
        { symbol: 'GOOG', price: '$175.63', change: '+0.5%', isUp: true },
        { symbol: 'META', price: '$481.12', change: '+1.7%', isUp: true },
        { symbol: 'JPM', price: '$197.24', change: '-0.3%', isUp: false },
    ];
    
    useEffect(() => {
        // Get user data from stored user object instead of separate localStorage items
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            setUserRole(user.role);
            setUserData(user);
            fetchCourses(user.id, user.role);
        } else {
            setError('User not authenticated');
            setLoading(false);
        }
    }, []);

    const fetchCourses = async (userId, role) => {
        if (!userId) {
            setError('User ID not available');
            setLoading(false);
            return;
        }

        // Hard-coded list of all courses matching the image
        const allCourses = [
            { id: 1, name: "Intro to Trading", description: "Learn the basics of trading.", courseId: "intro-to-trading" },
            { id: 2, name: "Technical Analysis", description: "Understand charts and indicators.", courseId: "technical-analysis" },
            { id: 3, name: "Fundamental Analysis", description: "Dive into financial statements.", courseId: "fundamental-analysis" },
            { id: 4, name: "Crypto Trading", description: "Learn to trade crypto assets.", courseId: "crypto-trading" },
            { id: 5, name: "Day Trading", description: "Master intraday trading strategies.", courseId: "day-trading" },
            { id: 6, name: "Swing Trading", description: "Profit from market swings.", courseId: "swing-trading" },
            { id: 7, name: "Trading Psychology", description: "Control your emotions while trading.", courseId: "trading-psychology" },
            { id: 8, name: "Risk Management", description: "Minimize losses and manage risk.", courseId: "risk-management" },
            { id: 9, name: "Trading Plan", description: "Develop your personalized strategy.", courseId: "trading-plan" }
        ];
        
        // If user is admin, immediately set all courses and return
        if (role === "ADMIN") {
            setCourses(allCourses);
            setLoading(false);
            return;
        }
        
        // Mock course data based on database dump when server is down
        const getMockCourses = (role) => {
            // Based on database data, user 14 has purchased courses 1, 2, 3, 5
            if (role === "ADMIN") {
                return allCourses; // Admin sees all courses
            } else if (role === "PREMIUM") {
                // In real app, we'd query user_courses table
                // Using the data from the DB dump - user 14 has courses 1, 2, 3, 5
                return allCourses.filter(course => [1, 2, 3, 5].includes(course.id));
            } else {
                // FREE users see no courses
                return [];
            }
        };
        
        try {
            // For now, use mock data
            const mockCourses = getMockCourses(role);
            setCourses(mockCourses);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses. Please try again.');
            setLoading(false);
        }
    };

    const navigateToCourse = (courseId) => {
        // Navigate to the specific course page
        navigate(`/courses/${courseId}`);
    };

    if (loading) {
        return (
            <div className="my-courses-container">
                <BinaryBackground />
                <div className="page-header">
                    <h1 className="page-title">
                        {userRole === "ADMIN" ? "ALL COURSES" : "MY COURSES"}
                    </h1>
                </div>
                <div className="loading-spinner">
                    <div className="loading-text">Loading courses...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-courses-container">
            <BinaryBackground />
            <div className="page-header">
                <h1 className="page-title">
                    {userRole === "ADMIN" ? "ALL COURSES" : "MY COURSES"}
                </h1>
            </div>
            
            {/* Stock Ticker */}
            <div className="ticker-container">
                <div className="ticker">
                    {stockData.map((stock, index) => (
                        <div className="ticker-item" key={index}>
                            <strong>{stock.symbol}</strong>
                            <span className="ticker-price">{stock.price}</span>
                            <span className={stock.isUp ? "ticker-up" : "ticker-down"}>
                                {stock.change}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    {error.includes('backend server') && (
                        <div className="server-help">
                            <p>To fix this issue:</p>
                            <ol>
                                <li>Make sure the backend server is running</li>
                                <li>Check that it's available at theglitch.world</li>
                                <li>Verify there are no network issues</li>
                            </ol>
                        </div>
                    )}
                </div>
            )}
            
            <div className="courses-grid">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="course-card">
                            <div className="course-content">
                                <h3 className="course-title">{course.name}</h3>
                                <p className="course-description">{course.description}</p>
                                <button 
                                    className="course-button" 
                                    onClick={() => navigateToCourse(course.courseId)}
                                >
                                    <span>Go to Course</span>
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-courses-message">
                        <p>
                            {userRole === "FREE" 
                                ? "You need to upgrade to Premium to access courses." 
                                : "No courses available."}
                        </p>
                    </div>
                )}
            </div>
            
            {userRole === "FREE" && (
                <div className="upgrade-container">
                    <h3>Want access to premium courses?</h3>
                    <p>Upgrade your account to unlock all trading courses and premium features. Start mastering the markets today with our expert-led trading curriculum.</p>
                    <button className="upgrade-btn">Upgrade to Premium</button>
                </div>
            )}
        </div>
    );
};

export default MyCourses;
