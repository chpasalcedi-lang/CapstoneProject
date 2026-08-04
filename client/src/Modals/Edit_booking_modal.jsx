/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import Swal from 'sweetalert2';
import '../Modalscss/book_reservation_modal.css';

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

const getTodayISO = () => {
    const t = new Date();
    const year = t.getFullYear();
    const month = String(t.getMonth() + 1).padStart(2, '0');
    const day = String(t.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTomorrowISO = (dateValue) => {
    const baseDate = dateValue ? new Date(dateValue) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const onlyDigits = (input) => String(input || '').replace(/\D/g, '');

const calculateTotalPrice = (checkIn, checkOut, price) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nightlyRate = price !== undefined && price !== null ? parseFloat(String(price).replace(/,/g, '')) : NaN;
    if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(nightlyRate)) {
        return null;
    }
    const nights = Math.max(1, Math.ceil((end - start) / 86400000));
    return Number.isFinite(nightlyRate) ? nightlyRate * nights : null;
};

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
    const [allReservations, setAllReservations] = useState([]);

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

    useEffect(() => {
        apiClient.get('/get_rooms')
            .then((res) => setRooms(res.data))
            .catch((err) => console.error('Error fetching rooms:', err));
    }, []);

    useEffect(() => {
        if (!show) return;
        apiClient.get('/get_reservations')
            .then((res) => setAllReservations(res.data || []))
            .catch((err) => console.error('Error fetching reservations:', err));
    }, [show]);

    const selectedRoom = rooms.find((room) => String(room.room_number) === String(values.room_number));
    const activeRoomId = selectedRoom?.id ?? booking?.room_id;
    const activeStatusSet = ['pending', 'confirmed', 'complete', 'occupied'];

    const toDateOnly = (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const formatRoomPrice = (price) => {
        const numeric = Number(String(price || '').replace(/,/g, ''));
        if (!Number.isFinite(numeric)) return '0';
        const hasDecimals = numeric % 1 !== 0;
        return numeric.toLocaleString('en-PH', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2,
        });
    };

    const getRoomReservations = (roomId) => {
        if (!roomId) return [];
        return allReservations.filter((res) => {
            const status = (res.res_status || '').toLowerCase();
            return res.id !== booking?.id && String(res.room_id) === String(roomId) && activeStatusSet.includes(status);
        });
    };

    const isDateRangeAvailable = (checkIn, checkOut, roomId = activeRoomId) => {
        if (!checkIn || !checkOut || !roomId) return true;
        const checkInDate = toDateOnly(checkIn);
        const checkOutDate = toDateOnly(checkOut);
        if (!checkInDate || !checkOutDate) return true;

        return !getRoomReservations(roomId).some((res) => {
            const resCheckIn = toDateOnly(res.check_in_date);
            const resCheckOut = toDateOnly(res.check_out_date);
            if (!resCheckIn || !resCheckOut) return false;
            return checkInDate < resCheckOut && checkOutDate > resCheckIn;
        });
    };

    const roomPrice = selectedRoom?.room_price ?? booking?.room_price ?? null;

    const totalPrice = useMemo(
        () => calculateTotalPrice(values.check_in_date, values.check_out_date, roomPrice),
        [values.check_in_date, values.check_out_date, roomPrice]
    );

    const handleCancel = () => {
        onClose();
    };

    if (!show || !booking) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            setValues((prev) => ({ ...prev, [name]: onlyDigits(value) }));
            return;
        }
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckInDateChange = (e) => {
        const { value } = e.target;
        if (value && value < getTodayISO()) {
            Swal.fire({ icon: 'error', title: 'Invalid check-in', text: 'Check-in cannot be in the past.' });
            return;
        }
        if (value && values.check_out_date && !isDateRangeAvailable(value, values.check_out_date)) {
            Swal.fire({ icon: 'error', title: 'Room not available', text: 'This date range is already booked for the selected room.' });
            return;
        }
        setValues((prev) => ({ ...prev, check_in_date: value }));
    };

    const handleCheckOutDateChange = (e) => {
        const { value } = e.target;
        if (value && values.check_in_date && !isDateRangeAvailable(values.check_in_date, value)) {
            Swal.fire({ icon: 'error', title: 'Room not available', text: 'This date range is already booked for the selected room.' });
            return;
        }
        setValues((prev) => ({ ...prev, check_out_date: value }));
    };

    const handleRoomNumberChange = (e) => {
        const { value } = e.target;
        const selectedRoomForCheck = rooms.find((room) => String(room.room_number) === String(value));
        const newRoomId = selectedRoomForCheck?.id ?? booking?.room_id;
        if (values.check_in_date && values.check_out_date && !isDateRangeAvailable(values.check_in_date, values.check_out_date, newRoomId)) {
            Swal.fire({ icon: 'error', title: 'Room not available', text: 'This room is already booked for the chosen dates.' });
            return;
        }
        setValues((prev) => ({ ...prev, room_number: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.target.closest('form') || document.getElementById('editReservationForm');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const requiredFields = ['last_name', 'first_name', 'num_guests', 'phone_number', 'email', 'check_in_date', 'check_out_date'];
        const missingField = requiredFields.some((field) => {
            const value = values[field];
            return value === undefined || value === null || String(value).trim() === '';
        });

        if (missingField) {
            Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please fill all required fields.' });
            return;
        }

        const checkIn = new Date(values.check_in_date);
        const checkOut = new Date(values.check_out_date);
        const today = new Date(getTodayISO());

        if (checkIn < today) {
            Swal.fire({ icon: 'error', title: 'Invalid check-in', text: 'Check-in cannot be in the past.' });
            return;
        }

        if (checkOut <= checkIn) {
            Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'Check-out cannot be earlier than check-in. Please choose valid dates.' });
            return;
        }

        const selectedRoomItem = rooms.find((room) => String(room.room_number) === String(values.room_number));
        const roomId = selectedRoomItem ? selectedRoomItem.id : booking.room_id;
        if (!roomId) {
            Swal.fire({ icon: 'error', title: 'Room required', text: 'Please select a valid room.' });
            return;
        }

        if (!isDateRangeAvailable(values.check_in_date, values.check_out_date, roomId)) {
            Swal.fire({ icon: 'warning', title: 'Room occupied', text: 'The selected dates overlap an existing reservation for this room.' });
            return;
        }

        const updateData = {};
        if (values.last_name !== booking.last_name) updateData.last_name = values.last_name;
        if (values.first_name !== booking.first_name) updateData.first_name = values.first_name;
        if (String(values.num_guests) !== String(booking.num_guests)) updateData.num_guests = values.num_guests;
        if (values.phone_number !== booking.phone_number) updateData.phone_number = values.phone_number;
        if (values.email !== booking.email) updateData.email = values.email;
        if (values.check_in_date !== formatDateForInput(booking.check_in_date)) updateData.check_in_date = values.check_in_date;
        if (values.check_out_date !== formatDateForInput(booking.check_out_date)) updateData.check_out_date = values.check_out_date;
        if (values.notes !== (booking.notes || '')) updateData.notes = values.notes;
        if (roomId && String(roomId) !== String(booking.room_id)) updateData.room_id = roomId;

        if (Object.keys(updateData).length === 0) {
            return;
        }

        try {
            await apiClient.post(`/update_reservation/${booking.id}`, updateData);
            Swal.fire({ icon: 'success', title: 'Updated', text: 'Reservation updated successfully.' });
            onUpdate();
            setTimeout(onClose, 1500);
        } catch (err) {
            console.error('Error updating:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || err.message || 'Failed to update reservation.' });
        }
    };

    return (
        <div className={(show ? 'book-reservation modal-visible' : 'book-reservation modal-hidden')} id="modal">
            <div className="book-reservation-modal">
                <div className="book-reservation-modal-header">
                    <div>
                        <h2 className="book-reservation-modal-title">Edit Reservation</h2>
                        {booking.room_number && (
                            <p className="book-reservation-room-number">Room number: {booking.room_number}</p>
                        )}
                    </div>
                    <button className="book-reservation-modal-close" onClick={handleCancel}><i className="fa-solid fa-xmark"></i></button>
                </div>

                <form id="editReservationForm" className="book-reservation-modal-body" onSubmit={handleSubmit}>
                    <div className="book-reservation-form-row">
                        <div className="book-reservation-form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" required value={values.last_name} onChange={handleChange} placeholder="e.g. Family Name" />
                        </div>
                        <div className="book-reservation-form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" required value={values.first_name} onChange={handleChange} placeholder="e.g. First Name" />
                        </div>
                    </div>

                    <div className="book-reservation-form-row">
                        <div className="book-reservation-form-group">
                            <label>No. of Guests</label>
                            <input type="number" name="num_guests" required min="1" value={values.num_guests} onChange={handleChange} placeholder="e.g. 2" />
                        </div>
                        <div className="book-reservation-form-group">
                            <label>Room Number</label>
                            <select name="room_number" required value={values.room_number} onChange={handleRoomNumberChange}>
                                <option value="">Select Room</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={String(room.room_number)}>
                                        {room.room_number} - {room.room_name} ({room.room_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="book-reservation-form-group">
                        <label>Phone Number</label>
                        <input type="tel" name="phone_number" required inputMode="numeric" pattern="\d{11}" maxLength={11} value={values.phone_number || ''} onChange={handleChange} placeholder="e.g. 09XXXXXXXXX" />
                    </div>

                    <div className="book-reservation-form-group">
                        <label>Email</label>
                        <input type="email" name="email" required value={values.email} onChange={handleChange} placeholder="e.g. example@email.com" />
                    </div>

                    <div className="book-reservation-form-row">
                        <div className="book-reservation-form-group">
                            <label>Check-in Date</label>
                            <input type="date" name="check_in_date" required min={getTodayISO()} value={values.check_in_date} onChange={handleCheckInDateChange} />
                        </div>
                        <div className="book-reservation-form-group">
                            <label>Check-out Date</label>
                            <input type="date" name="check_out_date" required min={values.check_in_date ? getTomorrowISO(values.check_in_date) : getTomorrowISO()} value={values.check_out_date} onChange={handleCheckOutDateChange} />
                        </div>
                    </div>

                    <div className="book-reservation-form-group">
                        <label>Notes <span className="optional">Optional</span></label>
                        <textarea name="notes" rows="3" value={values.notes} onChange={handleChange} placeholder="..."></textarea>
                    </div>
                </form>

                <div>
                    <div className="book-reservation-form-price">
                        <div className="book-reservation-price-item">
                            <div className="book-reservation-price-icon">
                                <i className="fa-solid fa-building" />
                            </div>
                            <div>
                                <p className="book-reservation-price-label">Room price / night</p>
                                <p className="book-reservation-price-value">
                                    {roomPrice ? `₱${formatRoomPrice(roomPrice)}` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="book-reservation-price-divider" />
                        <div className="book-reservation-price-item">
                            <div className="book-reservation-price-icon total">
                                <i className="fa-solid fa-receipt" />
                            </div>
                            <div>
                                <p className="book-reservation-price-label">
                                    Total {values.check_in_date && values.check_out_date ? `(${Math.max(1, Math.ceil((new Date(values.check_out_date) - new Date(values.check_in_date)) / 86400000))} nights)` : ''}
                                </p>
                                <p className="book-reservation-price-value total">
                                    {totalPrice ? `₱${totalPrice.toLocaleString()}` : '₱0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="book-reservation-modal-footer">
                    <button type="button" className="book-reservation-btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="book-reservation-btn-save" form="editReservationForm">Update Reservation</button>
                </div>
            </div>
        </div>
    );
}

export default EditBookingModal;
