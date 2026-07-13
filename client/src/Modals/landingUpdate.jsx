/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Modalscss/landingUpdate.css';

const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

function LandingUpdate({ show, onClose, booking, onUpdate }) {
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

    useEffect(() => {
        if (booking) {
            setValues({
                last_name: booking.last_name || '',
                first_name: booking.first_name || '',
                num_guests: booking.num_guests || '',
                phone_number: booking.phone_number || '',
                email: booking.email || '',
                check_in_date: formatDateForInput(booking.check_in_date) || '',
                check_out_date: formatDateForInput(booking.check_out_date) || '',
                notes: booking.notes || '',
                room_number: booking.room_number || '',
            });
        }
    }, [booking]);

    const isConfirmed = booking && booking.res_status && ['confirmed','approved','occupied','complete'].includes(String(booking.res_status).toLowerCase());

    useEffect(() => {
        axios.get("http://localhost:3001/get_rooms")
            .then((res) => {
                setRooms(res.data);
            })
            .catch((err) => {
                console.error("Error fetching rooms:", err);
            });
    }, []);

    const handleCancel = () => {
        onClose();
    };

    if (!show || !booking) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const digits = value.replace(/\D/g, '');
            setValues((prev) => ({ ...prev, [name]: digits }));
            return;
        }
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isConfirmed) {
            return;
        }

        const selectedRoom = rooms.find(room => String(room.room_number) === String(values.room_number));
        const roomId = selectedRoom ? selectedRoom.id : booking.room_id;
        if (!roomId) {
            return;
        }

        const updateData = {};
        if (values.last_name !== booking.last_name) 
            updateData.last_name = values.last_name || undefined;
        if (values.first_name !== booking.first_name) 
            updateData.first_name = values.first_name || undefined;
        if (String(values.num_guests) !== String(booking.num_guests)) 
            updateData.num_guests = values.num_guests || undefined;
        if (values.phone_number !== booking.phone_number) 
            updateData.phone_number = values.phone_number || undefined;
        if (values.email !== booking.email) 
            updateData.email = values.email || undefined;
        if (values.check_in_date !== formatDateForInput(booking.check_in_date)) 
            updateData.check_in_date = values.check_in_date || undefined;
        if (values.check_out_date !== formatDateForInput(booking.check_out_date)) 
            updateData.check_out_date = values.check_out_date || undefined;
        if (values.notes !== (booking.notes || '')) 
            updateData.notes = values.notes || undefined;
        if (roomId && String(roomId) !== String(booking.room_id)) 
            updateData.room_id = roomId;

        if (Object.keys(updateData).length === 0) {
            return;
        }

        try {
            const res = await axios.post(`http://localhost:3001/update_reservation/${booking.id}`, updateData);
            console.log("Success:", res.data);
            onUpdate();
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Error updating:", err);
        }
    };

    return (
        <div className={(show ? "landing-edit-booking-modal modal-visible" : "landing-edit-booking-modal modal-hidden")} id="modal">
            <div className="landing-edit-booking-container">
                <div className="landing-edit-booking-form-card">
                    <div className="landing-edit-booking-modal-header">
                        <h2 className="landing-edit-booking-modal-title">Edit Booking</h2>
                        <button className="landing-edit-booking-modal-close" onClick={handleCancel}><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="landing-edit-booking-modal-body">
                        {isConfirmed ? (
                            <div style={{padding: '16px'}}>
                                <p style={{marginTop:0, color:'#374151'}}>This reservation has been confirmed by admin and cannot be edited.</p>
                                <p style={{color:'#6b7280'}}>If you need changes, please contact support.</p>
                            </div>
                        ) : (
                            <form id="landing-edit-form" onSubmit={handleSubmit}>
                            <div className="landing-edit-booking-form-row">
                                <div className="landing-edit-booking-form-group">
                                    <label>Last Name</label>
                                    <input type="text" name="last_name" required value={values.last_name} onChange={handleChange} placeholder="e.g. Family Name" readOnly={isConfirmed} />
                                </div>
                                <div className="landing-edit-booking-form-group">
                                    <label>First Name</label>
                                    <input type="text" name="first_name" required value={values.first_name} onChange={handleChange} placeholder="e.g. First Name" readOnly={isConfirmed} />
                                </div>
                            </div>
                            <div className="landing-edit-booking-form-row">
                                <div className="landing-edit-booking-form-group">
                                    <label>No. of Guests</label>
                                    <input type="number" name="num_guests" required value={values.num_guests} onChange={handleChange} placeholder="e.g. 2" />
                                </div>
                                <div className="landing-edit-booking-form-group">
                                    <label>Room Number</label>
                                    <select name="room_number" required value={values.room_number} onChange={handleChange} disabled={isConfirmed}>
                                        <option value="">Select Room</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={String(room.room_number)}>
                                                {room.room_number} - {room.room_name} ({room.room_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="landing-edit-booking-form-group">
                                <label>Phone Number</label>
                                <input type="text" name="phone_number" inputMode="numeric" pattern="\d{11}" required value={values.phone_number} onChange={handleChange} placeholder="e.g. 09XXXXXXXXX" />
                            </div>
                            <div className="landing-edit-booking-form-group">
                                <label>Email</label>
                                <input type="email" name="email" required value={values.email} onChange={handleChange} placeholder="e.g. example@email.com" />
                            </div>
                            <div className="landing-edit-booking-form-row">
                                <div className="landing-edit-booking-form-group">
                                    <label>Check-in Date</label>
                                    <input type="date" name="check_in_date" required value={values.check_in_date} onChange={handleChange} className="landing-edit-booking-input" />
                                </div>
                                <div className="landing-edit-booking-form-group">
                                    <label>Check-out Date</label>
                                    <input type="date" name="check_out_date" required value={values.check_out_date} onChange={handleChange} className="landing-edit-booking-input" />
                                </div>
                            </div>

                            <div className="landing-edit-booking-form-group">
                                <label>Notes <span className="optional">Optional</span></label>
                                <textarea name="notes" rows="3" value={values.notes} onChange={handleChange} placeholder="..."></textarea>
                            </div>
                            </form>
                        )}
                    </div>
                            <div className="landing-edit-booking-modal-footer">
                        <button type="button" className="landing-edit-booking-btn-cancel" onClick={handleCancel}>Cancel</button>
                        <button type="submit" form="landing-edit-form" className="landing-edit-booking-btn-save" disabled={isConfirmed}>Update Reservation</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingUpdate;