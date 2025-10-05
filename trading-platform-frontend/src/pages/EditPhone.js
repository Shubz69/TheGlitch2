import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfileEdit.css";
import "../styles/SharedBackground.css";
import SharedBackground from '../components/SharedBackground';

const EditPhone = () => {
    const [phone, setPhone] = useState("");
    const navigate = useNavigate();

    const handleSave = async (e) => {
        e.preventDefault();
        alert("Phone number updated!");
        navigate("/profile");
    };

    return (
        <div className="edit-container">
            <SharedBackground />
            <h2>Edit Phone Number</h2>
            <form onSubmit={handleSave}>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" required />
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default EditPhone;