import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfileEdit.css";
import "../styles/SharedBackground.css";
import SharedBackground from '../components/SharedBackground';

const EditAddress = () => {
    const [address, setAddress] = useState("");
    const navigate = useNavigate();

    const handleSave = async (e) => {
        e.preventDefault();
        alert("Address updated!");
        navigate("/profile");
    };

    return (
        <div className="edit-container">
            <SharedBackground />
            <h2>Edit Address</h2>
            <form onSubmit={handleSave}>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter home address" required />
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default EditAddress;