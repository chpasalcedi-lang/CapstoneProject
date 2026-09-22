import React, { useEffect, useState } from 'react';
import apiClient from '../api';
import '../Modalscss/view_booking_modal.css';

function formatDate(dateValue) {
    if (!dateValue) return '\u2014';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '\u2014';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return amount.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

function normalizeRoomIds(roomIds, fallbackRooms) {
    const source = Array.isArray(roomIds) ? roomIds : [roomIds || fallbackRooms];
    return source
        .flatMap((value) => String(value || '').split(','))
        .map((roomId) => roomId.trim())
        .filter(Boolean);
}

function ViewEventModal({ show, onClose, booking, showReceiptButton = true }) {
    const [showReceipt, setShowReceipt] = useState(false);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        if (!show || !booking) return;
        apiClient.get('/get_rooms')
            .then((response) => setRooms(response.data || []))
            .catch(() => setRooms([]));
    }, [show, booking]);

    if (!show || !booking) return null;

    const status = String(booking.status || 'pending').toLowerCase();
    const totalPrice = Number(booking.total_price) || 0;
    const discount = Number(booking.discount) || 0;
    const selectedRoomIds = normalizeRoomIds(booking.room_ids, booking.rooms).map(String);
    const selectedRooms = rooms.filter((room) => selectedRoomIds.includes(String(room.id)));
    const roomOptions = selectedRooms.length > 0
        ? selectedRooms
        : [{ id: booking.rooms, room_number: booking.room_number, room_name: booking.room_name }];

    const roomLabel = (room) => [room.room_number && `Room ${room.room_number}`, room.room_name || room.room_label]
        .filter(Boolean)
        .join(' - ') || room.id || '\u2014';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2>Event Booking Details</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close event booking details">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="booking-detail grid-2">
                        <div className="booking-field">
                            <label>Event Name</label>
                            <p>{booking.event_name || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Guest Name</label>
                            <p>{booking.guest_name || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Number of Guests</label>
                            <p>{booking.guest_number ?? '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Rooms ({roomOptions.length} selected)</label>
                            <select className="view-event-rooms-select" value={selectedRoomIds[0] || ''} onChange={() => {}} aria-label="Rooms booked for this event">
                                <option value="" disabled>Select a room</option>
                                {roomOptions.map((room) => (
                                    <option key={room.id || room.room_number} value={String(room.id || '')}>{roomLabel(room)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="booking-field">
                            <label>Phone</label>
                            <p>{booking.phone_number || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Email</label>
                            <p>{booking.email || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Event Date</label>
                            <p className="date-value">{formatDate(booking.start_date)}</p>
                        </div>
                        <div className="booking-field">
                            <label>Extend Date</label>
                            <p>{formatDate(booking.extend_date) || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Time</label>
                            <p>{booking.time_in || '\u2014'} - {booking.time_out || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Total Price</label>
                            <p>₱{formatCurrency(totalPrice)}</p>
                        </div>
                    </div>
                    <div className="booking-detail status-row">
                        <label>Status</label>
                        <span className={`status ${status}`}>{booking.status || 'Pending'}</span>
                    </div>
                    {booking.notes && (
                        <div className="booking-detail">
                            <div className="booking-field full-span">
                                <label>Notes</label>
                                <p className="notes-text">{booking.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
                    {showReceiptButton && (
                        <button type="button" className="btn-primary" onClick={() => setShowReceipt(true)}>
                            <i className="fa-solid fa-receipt" aria-hidden="true" /> View Receipt
                        </button>
                    )}
                </div>
                {showReceipt && (
                    <div className="receipt-overlay" onClick={() => setShowReceipt(false)}>
                        <div className="receipt-modal" onClick={(event) => event.stopPropagation()}>
                            <div className="receipt-header">
                                <div>
                                    <p className="receipt-kicker">Event booking receipt</p>
                                    <h3>{booking.event_name || 'Event booking'}</h3>
                                </div>
                                <button type="button" className="close-btn" onClick={() => setShowReceipt(false)} aria-label="Close receipt">
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                            <div className="receipt-details">
                                <div><span>Guest</span><strong>{booking.guest_name || '\u2014'}</strong></div>
                                <div><span>Event date</span><strong>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</strong></div>
                                <div>
                                    <span>Rooms ({roomOptions.length} selected)</span>
                                    <select className="receipt-rooms-select" value={selectedRoomIds[0] || ''} onChange={() => {}} aria-label="Rooms booked for this event receipt">
                                        <option value="" disabled>Select a room</option>
                                        {roomOptions.map((room) => (
                                            <option key={room.id || room.room_number} value={String(room.id || '')}>{roomLabel(room)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div><span>Guests</span><strong>{booking.guest_number ?? '\u2014'}</strong></div>
                            </div>
                            <div className="receipt-line"><span>Subtotal</span><strong>₱{formatCurrency(totalPrice + discount)}</strong></div>
                            {discount > 0 && (
                                <div className="receipt-line"><span>Discount</span><strong>- ₱{formatCurrency(discount)}</strong></div>
                            )}
                            <div className="receipt-total"><span>Total</span><strong>₱{formatCurrency(totalPrice)}</strong></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewEventModal;
