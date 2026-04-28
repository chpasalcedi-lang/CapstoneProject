/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Modalscss/add_room_modal.css";

function EditRoomModal({ showModal, setShowModal, refreshData, roomData }) {
    const [values, setValues] = useState({
        id: "",
        room_name: "",
        room_number: "",
        room_price: "",
        room_image: "",
        room_type: "",
        room_status: "",
        room_label: ""
    });

    const getInitialValues = (data) => ({
        id: data.id || "",
        room_name: data.room_name || "",
        room_number: data.room_number || "",
        room_price: data.room_price || "",
        room_image: data.room_image || "",
        room_type: data.room_type || "",
        room_status: data.room_status || "",
        room_label: data.room_label || ""
    });

    useEffect(() => {
        if (roomData) {
            setValues(getInitialValues(roomData));
        }
    }, [roomData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValues((prev) => ({ ...prev, room_image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        const updateData = {
            room_name: values.room_name,
            room_number: values.room_number,
            room_price: values.room_price,
            room_image: values.room_image,
            room_type: values.room_type,
            room_status: values.room_status,
            room_label: values.room_label
        };
        
        console.log("Sending update for room:", values.id, updateData);
        
        axios.post(`http://localhost:3000/update_rooms/${values.id}`, updateData)
            .then((res) => {
                console.log("Updated:", res.data);
                alert("Room updated successfully!");
                setShowModal(false);
                if (typeof refreshData === 'function') {
                    refreshData();
                }
            })
            .catch((err) => {
                console.error("Error sa pag-update:", err.response?.data || err.message);
                alert("Error: " + (err.response?.data?.error || err.message));
            });
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className={(showModal ? "add-room modal-visible" : "add-room modal-hidden")} id="edit-modal">
            <div className="add-room-modal">
                <div className="add-room-modal-header">
                    <div>
                        <p className="add-room-modal-eyebrow">Edit Record</p>
                        <h2 className="add-room-modal-title">Update Room</h2>
                    </div>
                    <button className="add-room-modal-close" onClick={closeModal}>X</button>
                </div>

                <form className="add-room-modal-body" onSubmit={handleSubmit}>
                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Room Name</label>
                            <input type="text" name="room_name" required value={values.room_name}
                                onChange={(e) => setValues({ ...values, room_name: e.target.value })}
                                placeholder="e.g. Double/Family" />
                        </div>
                        <div className="add-room-form-group">
                            <label>Room Number</label>
                            <input type="number" name="room_number" required value={values.room_number}
                                onChange={(e) => setValues({ ...values, room_number: e.target.value })}
                                placeholder="e.g. 101" />
                        </div>
                    </div>

                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Price</label>
                            <input type="text" name="room_price" required value={values.room_price}
                                onChange={(e) => setValues({ ...values, room_price: e.target.value })}
                                placeholder="e.g. 5000" />
                        </div>
                        <div className="add-room-form-group">
                            <label>Image</label>
                            <input type="file" name="room_image"
                                onChange={handleImageChange} accept="image/*" />
                        </div>
                    </div>

                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Select Room Type</label>
                            <select name="room_type" required value={values.room_type}
                                onChange={(e) => setValues({ ...values, room_type: e.target.value })}>
                                <option value="">-- choose --</option>
                                <option value="family">Family</option>
                                <option value="double">Double</option>
                                <option value="event">Event</option>
                            </select>
                        </div>
                        <div className="add-room-form-group">
                            <label>Select Room Status</label>
                            <select name="room_status" required value={values.room_status}
                                onChange={(e) => setValues({ ...values, room_status: e.target.value })}>
                                <option value="">-- choose --</option>
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <div className="add-room-form-group">
                        <label>Room Label</label>
                        <textarea name="room_label" rows="3" required value={values.room_label}
                            onChange={(e) => setValues({ ...values, room_label: e.target.value })}
                            placeholder="..." />
                    </div>

                    <div className="add-room-modal-footer">
                        <button type="button" className="add-room-btn-cancel" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="add-room-btn-save">
                            Update Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditRoomModal;