import React from 'react';
import '../Modalscss/view_booking_modal.css';

function ViewBookingModal({ show, onClose, booking }) {
    if (!show || !booking) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Booking Details</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="booking-detail">
                        <label>Guest Name:</label>
                        <p>{booking.first_name} {booking.last_name}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Number of Guests:</label>
                        <p>{booking.num_guests}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Phone Number:</label>
                        <p>{booking.phone_number}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Email:</label>
                        <p>{booking.email}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Room Number:</label>
                        <p>{booking.room_number}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Check-in Date:</label>
                        <p>{booking.check_in_date}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Check-out Date:</label>
                        <p>{booking.check_out_date}</p>
                    </div>
                    <div className="booking-detail">
                        <label>Status:</label>
                        <p className={`status ${booking.res_status?.toLowerCase()}`}>{booking.res_status || 'pending'}</p>
                    </div>
                    {booking.notes && (
                        <div className="booking-detail-notes">
                            <label>Notes:</label>
                            <p>{booking.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewBookingModal;