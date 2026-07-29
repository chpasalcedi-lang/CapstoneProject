import React from 'react';
import '../Modalscss/view_landing.css';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function ViewLanding({ show, onClose, booking, onEdit }) {
    if (!show || !booking) return null;

    const status = booking.res_status?.toLowerCase() || 'pending';
    const isConfirmed = status === 'confirmed' || status === 'approved' || status === 'occupied' || status === 'complete';

    return (
        <div className="landing-modal-overlay" onClick={onClose}>
            <div className="landing-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="landing-modal-header">
                    <h2>Booking Details</h2>
                    <button className="landing-close-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="landing-modal-body">
                    <div className="landing-booking-detail grid-2">
                        <div className="landing-booking-field">
                            <label>Guest Name</label>
                            <p>{booking.first_name} {booking.last_name}</p>
                        </div>
                        <div className="landing-booking-field">
                            <label>Guests</label>
                            <p>{booking.num_guests ?? '—'}</p>
                        </div>
                        <div className="landing-booking-field">
                            <label>Phone</label>
                            <p>{booking.phone_number ?? '—'}</p>
                        </div>
                        <div className="landing-booking-field">
                            <label>Room</label>
                            <p>{booking.room_number ?? 'Unassigned'}</p>
                        </div>
                        <div className="landing-booking-field full-span">
                            <label>Email</label>
                            <p>{booking.email ?? '—'}</p>
                        </div>
                    </div>
                    <div className="landing-booking-detail grid-2">
                        <div className="landing-booking-field">
                            <label>Check-in</label>
                            <p className="date-value">
                                {formatDate(booking.check_in_date)}
                            </p>
                        </div>
                        <div className="landing-booking-field">
                            <label>Check-out</label>
                            <p className="date-value">
                                {formatDate(booking.check_out_date)}
                            </p>
                        </div>
                    </div>
                    <div className="landing-booking-detail status-row">
                        <label>Status</label>
                        <span className={`status ${status}`}>
                            {booking.res_status || 'Pending'}
                        </span>
                    </div>
                    {booking.notes && (
                        <div className="landing-booking-detail">
                            <div className="landing-booking-field">
                                <label>Notes</label>
                                <p className="notes-text">{booking.notes}</p>
                            </div>
                        </div>
                    )}

                </div>
                <div className="landing-modal-footer">
                    {onEdit && !isConfirmed && (
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
                    {isConfirmed && (
                        <div style={{flex:1}}>
                            <p style={{margin:0, color:'#374151', fontSize:13}}>This reservation has been confirmed by admin and cannot be edited.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ViewLanding;