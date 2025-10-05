import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfileEdit.css";
import "../styles/SharedBackground.css";
import SharedBackground from '../components/SharedBackground';

const EditPassword = () => {
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSave = async (e) => {
        e.preventDefault();
        alert("Password updated!");
        navigate("/profile");
    };

    return (
        <div className="edit-container">
            <SharedBackground />
            <h2>Edit Password</h2>
            <form onSubmit={handleSave}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" required />
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default EditPassword;