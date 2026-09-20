import React, { useState } from 'react';
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
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ViewEventModal({ show, onClose, booking }) {
    const [showReceipt, setShowReceipt] = useState(false);

    if (!show || !booking) return null;

    const status = String(booking.status || 'pending').toLowerCase();
    const totalPrice = Number(booking.total_price) || 0;
    const discount = Number(booking.discount) || 0;

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
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
                    <button type="button" className="btn-primary" onClick={() => setShowReceipt(true)}>
                        <i className="fa-solid fa-receipt" aria-hidden="true" /> View Receipt
                    </button>
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
                                <div><span>Event date</span><strong>{formatDate(booking.start_date)}</strong></div>
                                <div><span>Room</span><strong>{booking.room_number || booking.room_name || booking.rooms || '\u2014'}</strong></div>
                                <div><span>Guests</span><strong>{booking.guest_number ?? '\u2014'}</strong></div>
                            </div>
                            <div className="receipt-line"><span>Subtotal</span><strong>₱{formatCurrency(totalPrice + discount)}</strong></div>
                            <div className="receipt-line"><span>Discount</span><strong>- ₱{formatCurrency(discount)}</strong></div>
                            <div className="receipt-total"><span>Total</span><strong>₱{formatCurrency(totalPrice)}</strong></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewEventModal;
