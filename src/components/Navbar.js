import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";
import "../styles/UserDropdown.css";
import { FaUserCircle, FaSignOutAlt, FaBook, FaTrophy, FaCog, FaHeadset, FaBars, FaTimes, FaEnvelope } from 'react-icons/fa';
import Messages from './Messages';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleMessages = () => {
        setMessagesOpen(!messagesOpen);
        setDropdownOpen(false);
    };

    // Load unread count from localStorage
    useEffect(() => {
        if (user?.id) {
            const savedMessages = localStorage.getItem(`messages_${user.id}`);
            if (savedMessages) {
                const messages = JSON.parse(savedMessages);
                const unread = messages.filter(msg => !msg.read && msg.sender !== 'user').length;
                setUnreadCount(unread);
            }
        }
    }, [user?.id]);

    // Listen for storage changes to update unread count
    useEffect(() => {
        const handleStorageChange = () => {
            if (user?.id) {
                const savedMessages = localStorage.getItem(`messages_${user.id}`);
                if (savedMessages) {
                    const messages = JSON.parse(savedMessages);
                    const unread = messages.filter(msg => !msg.read && msg.sender !== 'user').length;
                    setUnreadCount(unread);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user?.id]);

    return (
        <nav className="navbar">
            <div className="logo-container">
                <Link to="/" className="logo-link">
                    <span className="logo">THE GLITCH</span>
                </Link>
            </div>

            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            <ul className={`nav-links ${mobileMenuOpen ? 'show' : ''}`}>
                <li><Link to="/">Home</Link></li>
                {user && <li><Link to="/community">Community</Link></li>}
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/explore">Explore</Link></li>
                <li><Link to="/why-glitch">Why Glitch</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                {user && <li><Link to="/leaderboard">Leaderboard</Link></li>}
                {user?.role?.toUpperCase() === "ADMIN" && (
                    <>
                        <li><Link to="/admin">Admin Panel</Link></li>
                        <li><Link to="/admin/messages"><FaHeadset className="dropdown-icon" /> Contact Submissions</Link></li>
                    </>
                )}
            </ul>

            <div className="nav-buttons">
                {!user ? (
                    <>
                        <button className="sign-in" onClick={() => window.location.href='/login'}>Sign In</button>
                        <button className="start-trading" onClick={() => window.location.href='/register'}>Start Trading</button>
                    </>
                ) : (
                    <div className="user-profile">
                        <button className="messages-btn" onClick={toggleMessages}>
                            <FaEnvelope />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </button>
                        <div className="user-icon" onClick={toggleDropdown}>
                            <FaUserCircle />
                        </div>
                        {dropdownOpen && (
                            <div className="user-dropdown">
                                <p>{user.email}</p>
                                <button onClick={toggleMessages} className="dropdown-item">
                                    <FaEnvelope className="dropdown-icon" /> Messages
                                    {unreadCount > 0 && <span className="dropdown-badge">{unreadCount}</span>}
                                </button>
                                <Link to="/profile" className="dropdown-item">
                                    <FaUserCircle className="dropdown-icon" /> Profile
                                </Link>
                                <Link to="/my-courses" className="dropdown-item">
                                    <FaBook className="dropdown-icon" /> My Courses
                                </Link>

                                <Link to="/leaderboard" className="dropdown-item">
                                    <FaTrophy className="dropdown-icon" /> Leaderboard
                                </Link>
                                {user?.role?.toUpperCase() === "ADMIN" && (
                                    <Link to="/admin" className="dropdown-item">
                                        <FaCog className="dropdown-icon" /> Admin Panel
                                    </Link>
                                )}
                                <button onClick={logout} className="dropdown-item">
                                    <FaSignOutAlt className="dropdown-icon" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <button className="mobile-menu-close" onClick={toggleMobileMenu}>
                    <FaTimes />
                </button>
                <ul className="mobile-nav-links">
                    <li><Link to="/" onClick={toggleMobileMenu}>Home</Link></li>
                    {user && <li><Link to="/community" onClick={toggleMobileMenu}>Community</Link></li>}
                    <li><Link to="/courses" onClick={toggleMobileMenu}>Courses</Link></li>
                    <li><Link to="/explore" onClick={toggleMobileMenu}>Explore</Link></li>
                    <li><Link to="/why-glitch" onClick={toggleMobileMenu}>Why Glitch</Link></li>
                    <li><Link to="/contact" onClick={toggleMobileMenu}>Contact Us</Link></li>
                    {user && <li><Link to="/leaderboard" onClick={toggleMobileMenu}>Leaderboard</Link></li>}
                    {user?.role?.toUpperCase() === "ADMIN" && (
                        <>
                            <li><Link to="/admin" onClick={toggleMobileMenu}>Admin Panel</Link></li>
                            <li><Link to="/admin/messages" onClick={toggleMobileMenu}><FaHeadset className="dropdown-icon" /> Contact Submissions</Link></li>
                        </>
                    )}
                </ul>
                <div className="mobile-buttons">
                    {!user ? (
                        <>
                            <button className="mobile-sign-in" onClick={() => window.location.href='/login'}>Sign In</button>
                            <button className="mobile-start-trading" onClick={() => window.location.href='/register'}>Start Trading</button>
                        </>
                    ) : (
                        <button onClick={logout} className="mobile-sign-in">
                            <FaSignOutAlt className="dropdown-icon" /> Logout
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Component */}
            {user && (
                <Messages 
                    isOpen={messagesOpen} 
                    onClose={() => setMessagesOpen(false)} 
                    user={user} 
                />
            )}
        </nav>
    );
};

export default Navbar;
