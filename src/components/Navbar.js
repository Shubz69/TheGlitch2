import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";
import "../styles/UserDropdown.css";
import { FaUserCircle, FaSignOutAlt, FaBook, FaTrophy, FaCog, FaHeadset, FaBars, FaTimes, FaUser } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className="navbar algopro-style">
            <div className="navbar-container">
                <div className="logo-container">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon">TG</div>
                        <span className="logo-text">THE GLITCH</span>
                    </Link>
                </div>

                <div className="nav-links-container">
                    <ul className="nav-links">
                        <li><Link to="/">HOME</Link></li>
                        <li><Link to="/courses">COURSES</Link></li>
                        <li><Link to="/explore">EXPLORE</Link></li>
                        <li><Link to="/why-glitch">WHY GLITCH</Link></li>
                        <li><Link to="/contact">CONTACT</Link></li>
                        {user && <li><Link to="/community">COMMUNITY</Link></li>}
                        {user?.role?.toUpperCase() === "ADMIN" && (
                            <li><Link to="/admin">ADMIN</Link></li>
                        )}
                    </ul>
                </div>

                <div className="nav-actions">
                    {!user ? (
                        <>
                            <Link to="/login" className="account-btn">
                                <FaUser className="btn-icon" />
                                ACCOUNT
                            </Link>
                            <button className="menu-toggle" onClick={toggleMobileMenu}>
                                <FaBars />
                            </button>
                        </>
                    ) : (
                        <div className="user-profile">
                            <div className="user-icon" onClick={toggleDropdown}>
                                <FaUserCircle />
                            </div>
                            {dropdownOpen && (
                                <div className="user-dropdown">
                                    <p>{user.email}</p>
                                    <Link to="/profile" className="dropdown-item">
                                        <FaUserCircle className="dropdown-icon" /> Profile
                                    </Link>
                                    {user?.role?.toUpperCase() === "ADMIN" ? (
                                        <Link to="/admin/inbox" className="dropdown-item">
                                            <FaHeadset className="dropdown-icon" /> Messages
                                        </Link>
                                    ) : (
                                        <Link to="/support" className="dropdown-item">
                                            <FaHeadset className="dropdown-icon" /> Messages
                                        </Link>
                                    )}
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
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <button className="mobile-menu-close" onClick={toggleMobileMenu}>
                    <FaTimes />
                </button>
                <ul className="mobile-nav-links">
                    <li><Link to="/" onClick={toggleMobileMenu}>HOME</Link></li>
                    <li><Link to="/courses" onClick={toggleMobileMenu}>COURSES</Link></li>
                    <li><Link to="/explore" onClick={toggleMobileMenu}>EXPLORE</Link></li>
                    <li><Link to="/why-glitch" onClick={toggleMobileMenu}>WHY GLITCH</Link></li>
                    <li><Link to="/contact" onClick={toggleMobileMenu}>CONTACT</Link></li>
                    {user && <li><Link to="/community" onClick={toggleMobileMenu}>COMMUNITY</Link></li>}
                    {user?.role?.toUpperCase() === "ADMIN" && (
                        <li><Link to="/admin" onClick={toggleMobileMenu}>ADMIN</Link></li>
                    )}
                </ul>
                <div className="mobile-buttons">
                    {!user ? (
                        <>
                            <Link to="/login" className="mobile-sign-in" onClick={toggleMobileMenu}>SIGN IN</Link>
                            <Link to="/register" className="mobile-start-trading" onClick={toggleMobileMenu}>START TRADING</Link>
                        </>
                    ) : (
                        <button onClick={logout} className="mobile-sign-in">
                            <FaSignOutAlt className="dropdown-icon" /> LOGOUT
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
