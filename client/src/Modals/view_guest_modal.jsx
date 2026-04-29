import React from 'react';
import '../Modalscss/guest_bookings_modal.css';

function GuestBookingsModal({ show, onClose, guest }) {
    const [viewModal, setViewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    if (!show || !guest) return null;

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Bookings for {guest.name}</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        {bookings.length === 0 ? (
                            <p>No bookings found for this guest.</p>
                        ) : (
                            <table className="guest-bookings-table">
                                <thead>
                                    <tr>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>{booking.room_number}</td>
                                            <td>{booking.check_in_date}</td>
                                            <td>{booking.check_out_date}</td>
                                            <td>
                                                <span className={`status ${booking.res_status?.toLowerCase()}`}>
                                                    {booking.res_status || 'pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-primary" onClick={() => handleViewBooking(booking)}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            <ViewBookingModal 
                show={viewModal} 
                onClose={() => setViewModal(false)} 
                booking={selectedBooking} 
            />
        </>
    );
}

export default GuestBookingsModal;