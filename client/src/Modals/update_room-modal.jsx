import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "../Modalscss/edit_room_modal.css";

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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        axios.post(`http://localhost:3001/update_rooms/${values.id}`, updateData)
            .then((res) => {
                console.log("Updated:", res.data);
                Swal.fire({ icon: 'success', title: 'Saved', text: 'Room updated successfully!' });
                setShowModal(false);
                if (typeof refreshData === 'function') refreshData();
            })
            .catch((err) => {
                console.error("Error sa pag-update:", err.response?.data || err.message);
                Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || err.message });
            });
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className={showModal ? "edit-room modal-visible" : "edit-room modal-hidden"} id="edit-modal">
            <div className="edit-room-container">
                <div className="edit-room-form-card">
                    <div className="edit-room-modal-header">
                        <h2 className="edit-room-modal-title">Update Room</h2>
                        <button className="edit-room-modal-close" type="button" onClick={closeModal}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="edit-room-modal-body">
                        <form id="edit-room-form" onSubmit={handleSubmit}>
                            <div className="edit-room-form-row">
                                <div className="edit-room-form-group">
                                    <label>Room Name</label>
                                    <input type="text" name="room_name" required value={values.room_name}
                                        onChange={(e) => setValues({ ...values, room_name: e.target.value })}
                                        placeholder="e.g. Double/Family" />
                                </div>
                                <div className="edit-room-form-group">
                                    <label>Room Number</label>
                                    <input type="number" name="room_number" required value={values.room_number}
                                        onChange={(e) => setValues({ ...values, room_number: e.target.value })}
                                        placeholder="e.g. 101" />
                                </div>
                            </div>
                            <div className="edit-room-form-row">
                                <div className="edit-room-form-group">
                                    <label>Price</label>
                                    <input type="text" name="room_price" required value={values.room_price}
                                        onChange={(e) => setValues({ ...values, room_price: e.target.value })}
                                        placeholder="e.g. 5000" />
                                </div>
                                <div className="edit-room-form-group">
                                    <label>Image</label>
                                    <input type="file" name="room_image"
                                        onChange={handleImageChange} accept="image/*" />
                                </div>
                            </div>
                            <div className="edit-room-form-row">
                                <div className="edit-room-form-group">
                                    <label>Room Type</label>
                                    <select name="room_type" required value={values.room_type}
                                        onChange={(e) => setValues({ ...values, room_type: e.target.value })}>
                                        <option value="">-- choose --</option>
                                        <option value="family">Family</option>
                                        <option value="double">Double</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>
                                <div className="edit-room-form-group">
                                    <label>Room Status</label>
                                    <select name="room_status" required value={values.room_status}
                                        onChange={(e) => setValues({ ...values, room_status: e.target.value })}>
                                        <option value="">-- choose --</option>
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="edit-room-form-group">
                                <label>Room Label</label>
                                <textarea name="room_label" rows="3" required value={values.room_label} onChange={(e) => setValues({ ...values, room_label: e.target.value })} placeholder="..." />
                            </div>
                        </form>
                    </div>
                    <div className="edit-room-modal-footer">
                        <button type="button" className="edit-room-btn-cancel" onClick={closeModal}>Cancel</button>
                        <button type="submit" form="edit-room-form" className="edit-room-btn-save">Update Room</button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EditRoomModal;