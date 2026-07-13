import React from 'react';
import '../Modalscss/view_booking_modal.css';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function ViewBookingModal({ show, onClose, booking, onEdit }) {
    if (!show || !booking) return null;

    const status = booking.res_status?.toLowerCase() || 'pending';

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
                        <div className="booking-field full-span">
                            <label>Email</label>
                            <p>{booking.email ?? '—'}</p>
                        </div>
                    </div>
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

                </div>
                <div className="modal-footer">
                    {onEdit && (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                if (onClose) onClose();
                                onEdit(booking);
                            }}
                        >
                            Edit Booking
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ViewBookingModal;