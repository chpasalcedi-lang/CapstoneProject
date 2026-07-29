import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "../Modalscss/walkin_reservation_modal.css";


function AdminWalkinModal({ show, onClose }) {
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
    const [rooms, setRooms] = useState([]);

    const selectedRoom = useMemo(
        () => rooms.find(room => String(room.room_number) === String(values.room_number)),
        [rooms, values.room_number]
    );

    const roomPrice = selectedRoom ? parseFloat(String(selectedRoom.room_price).replace(/,/g, '')) : null;

    const nights = useMemo(() => {
        if (!values.check_in_date || !values.check_out_date) return 0;
        const start = new Date(values.check_in_date);
        const end = new Date(values.check_out_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
        const diff = Math.ceil((end - start) / 86400000);
        return diff > 0 ? diff : 0;
    }, [values.check_in_date, values.check_out_date]);

    const totalPrice = roomPrice && nights > 0 ? roomPrice * nights : 0;

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
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const digits = value.replace(/\D/g, '');
            setValues((prev) => ({ ...prev, [name]: digits }));
            return;
        }
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target.closest('form');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const requiredFields = [
            'last_name',
            'first_name',
            'num_guests',
            'phone_number',
            'email',
            'check_in_date',
            'check_out_date',
            'room_number'
        ];

        const missingField = requiredFields.some((field) => {
            const value = values[field];
            return value === undefined || value === null || String(value).trim() === '';
        });

        if (missingField) {
            Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please fill all required fields.' });
            return;
        }

        const selectedRoom = rooms.find(room => String(room.room_number) === String(values.room_number));
        if (!selectedRoom) {
            Swal.fire({ icon: 'error', title: 'Invalid room', text: 'Please select a valid room.' });
            return;
        }

        const checkIn = new Date(values.check_in_date);
        const checkOut = new Date(values.check_out_date);
        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
            Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'Please choose valid check-in and check-out dates.' });
            return;
        }

        if (checkOut < checkIn) {
            Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'Check-out cannot be earlier than check-in.' });
            return;
        }

        axios
        .post("http://localhost:3001/add_reservation", {
            ...values,
            room_id: selectedRoom.id,
            room_price: roomPrice,
            total_price: totalPrice,
            status: 'confirmed',
        })
        .then((res) => {
            console.log("Success:", res.data);
            setValues(initialValues);
            onClose();
            Swal.fire({ icon: 'success', title: 'Saved', text: 'Walk-in reservation saved successfully!' });
        })
        .catch((err) => {
            console.error("Error sa pag-save:", err);
            const message = err.response?.data?.error || err.message || 'Failed to save reservation.';
            Swal.fire({ icon: 'error', title: 'Error', text: message });
        });
    };
    

    return (
        <div className={(show ? "walkin-modal modal-visible" : "walkin-modal modal-hidden")} id="modal">
            <div className="walkin-container">
                <div className="walkin-form-card">
                    <div className="walkin-reservation-modal-header">
                        <h2 className="walkin-reservation-modal-title">Walk-in Reservation</h2>
                        <button className="walkin-reservation-modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
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
                                <input type="tel" name="phone_number" inputMode="numeric" maxLength={11} pattern="\d{11}" required value={values.phone_number} onChange={handleChange} placeholder="e.g. 09XXXXXXXXX" />
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
                    <div className="walkin-reservation-form-price sticky-price">
                        <div className="walkin-reservation-price-item">
                            <div className="walkin-reservation-price-icon">
                                <i className="fa-solid fa-building" />
                            </div>
                            <div>
                                <p className="walkin-reservation-price-label">Room price / night</p>
                                <p className="walkin-reservation-price-value">
                                    {roomPrice ? `₱${roomPrice}` : "0"}
                                </p>
                            </div>
                        </div>

                        <div className="walkin-reservation-price-divider" />
                        <div className="walkin-reservation-price-item">
                            <div className="walkin-reservation-price-icon total">
                                <i className="fa-solid fa-receipt" />
                            </div>
                            <div>
                                <p className="walkin-reservation-price-label">
                                    Total {nights > 0 ? `(${nights} ${nights === 1 ? 'night' : 'nights'})` : ""}
                                </p>
                                <p className="walkin-reservation-price-value total">
                                    {roomPrice !== 0 && nights > 0 ? `₱${totalPrice.toLocaleString()}` : "0"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="walkin-reservation-modal-footer">
                        <button type="button" className="walkin-reservation-btn-cancel" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="walkin-reservation-btn-save" onClick={handleSubmit}>Save Reservation</button>
                    </div>
                 </div>
                </div>
            </div>
    );
}

export default AdminWalkinModal;