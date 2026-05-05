/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Modalscss/Edit_booking_modal.css';

function EditBookingModal({ show, onClose, booking, onUpdate }) {
    const [values, setValues] = useState({
        last_name: '',
        first_name: '',
        num_guests: '',
        phone_number: '',
        email: '',
        check_in_date: '',
        check_out_date: '',
        notes: '',
        room_number: '',
    });
    const [rooms, setRooms] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (booking) {
            setValues({
                last_name: booking.last_name || '',
                first_name: booking.first_name || '',
                num_guests: booking.num_guests || '',
                phone_number: booking.phone_number || '',
                email: booking.email || '',
                check_in_date: booking.check_in_date || '',
                check_out_date: booking.check_out_date || '',
                notes: booking.notes || '',
                room_number: booking.room_number || '',
            });
        }
    }, [booking]);

    useEffect(() => {
        axios.get("http://localhost:3000/get_rooms")
            .then((res) => {
                setRooms(res.data);
            })
            .catch((err) => {
                console.error("Error fetching rooms:", err);
            });
    }, []);

    if (!show || !booking) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatusMessage("Updating reservation...");

        const selectedRoom = rooms.find(room => String(room.room_number) === String(values.room_number));
        if (!selectedRoom) {
            setStatusMessage("Room number not found!");
            return;
        }

        axios
            .post(`http://localhost:3000/update_reservation/${booking.id}`, {
                ...values,
                room_id: selectedRoom.id,
            })
            .then((res) => {
                console.log("Success:", res.data);
                setStatusMessage("Reservation updated successfully!");
                onUpdate();
                setTimeout(() => {
                    onClose();
                }, 2000);
            })
            .catch((err) => {
                console.error("Error updating:", err);
                setStatusMessage("Error updating reservation!");
            });
    };

    return (
        <div className="edit-booking-modal-overlay" onClick={onClose}>
            <div className="edit-booking-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="edit-booking-modal-header">
                    <h2>Edit Booking</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="edit-booking-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="edit-form-row">
                            <div className="edit-form-group">
                                <label>Last Name</label>
                                <input type="text" name="last_name" required value={values.last_name} onChange={handleChange} />
                            </div>
                            <div className="edit-form-group">
                                <label>First Name</label>
                                <input type="text" name="first_name" required value={values.first_name} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="edit-form-row">
                            <div className="edit-form-group">
                                <label>No. of Guests</label>
                                <input type="number" name="num_guests" required value={values.num_guests} onChange={handleChange} />
                            </div>
                            <div className="edit-form-group">
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
                        <div className="edit-form-group">
                            <label>Phone Number</label>
                            <input type="text" name="phone_number" required value={values.phone_number} onChange={handleChange} />
                        </div>
                        <div className="edit-form-group">
                            <label>Email</label>
                            <input type="email" name="email" required value={values.email} onChange={handleChange} />
                        </div>
                        <div className="edit-form-row">
                            <div className="edit-form-group">
                                <label>Check-in Date</label>
                                <input type="date" name="check_in_date" required value={values.check_in_date} onChange={handleChange} />
                            </div>
                            <div className="edit-form-group">
                                <label>Check-out Date</label>
                                <input type="date" name="check_out_date" required value={values.check_out_date} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="edit-form-group">
                            <label>Notes</label>
                            <textarea name="notes" rows="3" value={values.notes} onChange={handleChange}></textarea>
                        </div>
                        <div className="edit-modal-footer">
                            <button type="button" className="edit-btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="edit-btn-save">Update Reservation</button>
                        </div>
                        {statusMessage && (
                            <p className="edit-status-message">{statusMessage}</p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditBookingModal;