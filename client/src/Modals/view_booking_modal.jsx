import React, { useState } from 'react';
import '../Modalscss/view_booking_modal.css';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ViewBookingModal({ show, onClose, booking }) {
    const [showReceipt, setShowReceipt] = useState(false);

    if (!show || !booking) return null;

    const status = booking.res_status?.toLowerCase() || 'pending';
    const totalPrice = Number(booking.total_price) || 0;
    const discount = Number(booking.discount) || 0;
    const guestName = `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || '—';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Booking Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="booking-detail grid-2">
                        <div className="booking-field">
                            <label>Guest Name</label>
                            <p>{booking.first_name} {booking.last_name}</p>
                        </div>
                        <div className="booking-field">
                            <label>Guests</label>
                            <p>{booking.num_guests ?? '—'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Phone</label>
                            <p>{booking.phone_number ?? '—'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Room</label>
                            <p>{booking.room_number ?? 'Unassigned'}</p>
                        </div>
                        <div className="booking-field">
                            <label>Room Type</label>
                            <p>{booking.room_type ?? '—'}</p>
                        </div>
                        <div className="booking-field full-span">
                            <label>Email</label>
                            <p>{booking.email ?? '—'}</p>
                        </div>
                         
                    </div>
                    {booking.cancel_notes_request && String(booking.cancel_notes_request).trim() ? (
                        <div className="booking-detail">
                            <div className="booking-field full-span">
                                <label>Cancel Request</label>
                                <p className="notes-text">{booking.cancel_notes_request}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="booking-detail grid-2">
                                <div className="booking-field">
                                    <label>Check-in</label>
                                    <p className="date-value">
                                        {formatDate(booking.check_in_date)}
                                    </p>
                                </div>
                                <div className="booking-field">
                                    <label>Check-out</label>
                                    <p className="date-value">
                                        {formatDate(booking.check_out_date)}
                                    </p>
                                </div>
                            </div>
                            <div className="booking-detail status-row">
                                <label>Status</label>
                                <span className={`status ${status}`}>
                                    {booking.res_status || 'Pending'}
                                </span>
                            </div>
                            {booking.notes && (
                                <div className="booking-detail">
                                    <div className="booking-field">
                                        <label>Notes</label>
                                        <p className="notes-text">{booking.notes}</p>
                                    </div>
                                </div>
                            )}
                        </>
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
                                    <p className="receipt-kicker">Reservation receipt</p>
                                    <h3>{guestName}</h3>
                                </div>
                                <button type="button" className="close-btn" onClick={() => setShowReceipt(false)} aria-label="Close receipt">
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                            <div className="receipt-details">
                                <div><span>Check-in</span><strong>{formatDate(booking.check_in_date)}</strong></div>
                                <div><span>Check-out</span><strong>{formatDate(booking.check_out_date)}</strong></div>
                                <div><span>Room</span><strong>{booking.room_number || 'Unassigned'}</strong></div>
                                <div><span>Guests</span><strong>{booking.num_guests ?? '—'}</strong></div>
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

export default ViewBookingModal;