import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../styles/AdminUserList.css";
import "../styles/SharedBackground.css";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AdminApi from "../services/AdminApi";
import SharedBackground from '../components/SharedBackground';

const AdminUserList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const fetchUsers = useCallback(async () => {
        if (user?.role !== "ADMIN") return;
        setLoading(true);
        try {
            // Try using the AdminApi service
            try {
                const res = await AdminApi.getAllUsers();
                setUsers(res.data);
                setError(null);
            } catch (apiError) {
                console.error("API service method failed, using direct axios call:", apiError);
                
                // Fallback to direct axios call
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:8080/api/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(res.data);
                setError(null);
            }
        } catch (err) {
            console.error("All attempts to fetch users failed:", err);
            setError("Failed to fetch users. Please check your connection and try again.");
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const socket = new SockJS("http://localhost:8080/ws");
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                client.subscribe("/topic/online-users", (msg) => {
                    try {
                        const ids = JSON.parse(msg.body);
                        setOnlineUsers(ids);
                    } catch (e) {
                        console.error("Failed to parse online users WS:", e);
                    }
                });
            },
            reconnectDelay: 5000
        });

        client.activate();
        return () => client.deactivate();
    }, []);

    const deleteUser = async (userId) => {
        try {
            // Try using the AdminApi service
            try {
                await AdminApi.deleteUser(userId);
            } catch (apiError) {
                console.error("API service method failed, using direct fetch call:", apiError);
                
                // Fallback to direct fetch call
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                });
                
                if (!res.ok) {
                    throw new Error("Failed to delete user");
                }
            }
            
            // Refresh the user list
            await fetchUsers();
            setError(null);
        } catch (error) {
            console.error("All attempts to delete user failed:", error);
            setError("Failed to delete user. Please check your connection and try again.");
        }
    };

    const isUserOnline = (id) => onlineUsers.includes(id);

    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
    };

    const onlineCount = users.filter((u) => isUserOnline(u.id)).length;
    const offlineCount = users.length - onlineCount;

    if (user?.role !== "ADMIN") {
        return <h4 className="text-danger">Access Denied: Admins Only</h4>;
    }

    return (
        <div className="page-wrapper">
            <SharedBackground />
            <div className="container">
                <h2 className="gradient-text">REGISTERED USERS</h2>
                <p className="user-summary">
                    👥 Total: {users.length} | 🟢 Online: {onlineCount} | 🔴 Offline: {offlineCount}
                </p>

                {loading ? (
                    <p className="loading-text">Loading users...</p>
                ) : error ? (
                    <p className="error-text">{error}</p>
                ) : users.length === 0 ? (
                    <p className="no-users-text">No users found.</p>
                ) : (
                    <ul className="users-list">
                        {users.map((u) => (
                            <li
                                key={u.id}
                                className="user-item"
                            >
                                <div className="user-info">
                                    <span className="user-email">
                                        📧 <strong>{u.email}</strong> &nbsp;
                                        <span className="user-name">
                                            ({u.name || "No Name"})
                                        </span>
                                    </span>
                                    <br />
                                    <span className="user-details">
                                        🏷 Role: <span className={`user-role role-${u.role.toLowerCase()}`}>
                                            {u.role}
                                        </span>
                                        {" | 🕓 Joined: " + formatDate(u.createdAt)}
                                        {u.mfaEnabled && " | 🔒 MFA: Enabled"}
                                    </span>
                                </div>
                                <div className="user-actions">
                                    <span className={`user-status ${isUserOnline(u.id) ? 'online' : 'offline'}`}>
                                        {isUserOnline(u.id) ? '🟢 Online' : '🔴 Offline'}
                                    </span>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteUser(u.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AdminUserList;
