import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import "../Modalscss/walkin_reservation_modal.css";


function AdminWalkinModal( { show, onClose }) {
    const initialValues = {
    last_name: "",
    first_name: "",
    num_guests: "",
    phone_number: "",
    email: "",
    check_in_date: "",
    check_out_date: "",
    notes: "",
    room_number: "",
    };

    const [values, setValues] = useState(initialValues);
    const [statusMessage, setStatusMessage] = useState("");
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3001/get_rooms")
        .then((res) => {
            const sortedRooms = [...res.data].sort((a, b) => {
            const roomA = parseInt(a.room_number, 10);
            const roomB = parseInt(b.room_number, 10);

            if (!Number.isNaN(roomA) && !Number.isNaN(roomB)) {
                return roomA - roomB;
            }

            return String(a.room_number).localeCompare(String(b.room_number));
            });
            setRooms(sortedRooms);
        })
        .catch((err) => {
            console.error("Error fetching rooms:", err);
        });
    }, []);

    const handleCancel = () => {
        setValues(initialValues);
        setStatusMessage("");
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatusMessage("Saving reservation...");

        // Find the room id based on room_number
        const selectedRoom = rooms.find(room => String(room.room_number) === String(values.room_number));
        if (!selectedRoom) {
        setStatusMessage("Room number not found!");
        return;
        }

        axios
        .post("http://localhost:3001/add_reservation", {
            ...values,
            room_id: selectedRoom.id,
        })
        .then((res) => {
            console.log("Success:", res.data);
            setValues(initialValues);
            onClose();
            alert("Walk-in reservation saved successfully!");
        })
        .catch((err) => {
            console.error("Error sa pag-save:", err);
            setStatusMessage("May sala sa pag-save sang data!");
        });
    };
    

    return (
        <div className={(show ? "walkin-modal modal-visible" : "walkin-modal modal-hidden")} id="modal">
            <div className="walkin-container">
                <div className="walkin-form-card">
                    <div className="walkin-reservation-modal-header">
                        <h2 className="walkin-reservation-modal-title">Walk-in Reservation</h2>
                        <button className="walkin-reservation-modal-close" onClick={onClose}>×</button>
                    </div>
                    <div className="walkin-reservation-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" required value={values.last_name} onChange={handleChange} placeholder="e.g. Family Name" />
                            </div>
                            <div className="walkin-reservation-form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" required value={values.first_name} onChange={handleChange} placeholder="e.g. First Name" />
                            </div>
                        </div>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>No. of Guests</label>
                            <input type="number" name="num_guests" required value={values.num_guests} onChange={handleChange} placeholder="e.g. 2" />
                            </div>
                            <div className="walkin-reservation-form-group">
                            <label>Room Number</label>
                            <select name="room_number" required value={values.room_number} onChange={handleChange}>
                              <option value="">Select Room</option>
                              {rooms.map(room => (
                                <option key={room.id} value={String(room.room_number)}>
                                  {room.room_number} - {room.room_name} ({room.room_type})
                                </option>
                              ))}
                            </select>
                            </div>
                        </div>
                        <div className="walkin-reservation-form-group">
                            <label>Phone Number</label>
                            <input type="text" name="phone_number" required value={values.phone_number} onChange={handleChange} placeholder="e.g. 09XX XXX XXXX" />
                        </div>
                        <div className="walkin-reservation-form-group">
                            <label>Email</label>
                            <input type="email" name="email" required value={values.email} onChange={handleChange} placeholder="e.g. example@email.com" />
                        </div>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>Check-in Date</label>
                            <input type="date" name="check_in_date" required value={values.check_in_date} onChange={handleChange} className="walkin-input" />
                            </div>
                            <div className="walkin-reservation-form-group">
                                <label>Check-out Date</label>
                                <input type="date" name="check_out_date" required value={values.check_out_date} onChange={handleChange} className="walkin-input" />
                            </div>
                        </div>
                        
                        

                        <div className="walkin-reservation-form-group">
                            <label>Notes <span className="optional">Optional</span></label>
                            <textarea name="notes" rows="3" value={values.notes} onChange={handleChange} placeholder="..."></textarea>
                        </div>

                        </form>
                    </div>
                    <div className="walkin-reservation-modal-footer">
                        <button type="button" className="walkin-reservation-btn-cancel" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="walkin-reservation-btn-save" onClick={handleSubmit}>Save Reservation</button>
                        {statusMessage && (
                          <p className="walkin-status-message">{statusMessage}</p>
                        )}
                    </div>
                 </div>
                </div>
            </div>
    );
}

export default AdminWalkinModal;