import React from 'react';
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

function ViewEventModal({ show, onClose, booking }) {
    if (!show || !booking) return null;

    const status = String(booking.status || 'pending').toLowerCase();

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
                            <label>Room</label>
                            <p>{booking.room_number || booking.room_name || booking.rooms || '\u2014'}</p>
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
                            <label>Time</label>
                            <p>{booking.time_in || '\u2014'} - {booking.time_out || '\u2014'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Discount</label>
                            <p>₱{booking.discount ?? '0'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Total Price</label>
                            <p>₱{booking.total_price ?? '0'}</p>
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
            </div>
        </div>
    );
}

export default ViewEventModal;
