import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_guest.css";
import EditBookingModal from '../Modals/Edit_booking_modal';
import ViewBookingModal from '../Modals/view_booking_modal';


function AdminGuest() {
    const [bookings, setBookings] = useState([]);
    const [guestArrivals, setGuestArrivals] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingGuests, setLoadingGuests] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewModal, setViewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [selectedEditBooking, setSelectedEditBooking] = useState(null);


    const handleView = (booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    const handleEdit = (booking) => {
        setSelectedEditBooking(booking);
        setEditModal(true);
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axios.get("http://localhost:3001/get_reservations");
                setBookings(res.data);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoadingBookings(false);
            }
        };

        const fetchGuestArrivals = async () => {
            try {
                const res = await axios.get("http://localhost:3001/get_guest_arrivals");
                setGuestArrivals(res.data);
            } catch (err) {
                console.error("Error fetching guest arrivals:", err);
            } finally {
                setLoadingGuests(false);
            }
        };

        fetchBookings();
        fetchGuestArrivals();
    }, []);

    const filteredBookings = bookings.filter((booking) => {
        const query = searchTerm.toLowerCase();
        return (
            booking.first_name?.toLowerCase().includes(query) ||
            booking.last_name?.toLowerCase().includes(query) ||
            booking.room_number?.toString().toLowerCase().includes(query) ||
            booking.phone_number?.toLowerCase().includes(query) ||
            booking.email?.toLowerCase().includes(query)
        );
    });

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await axios.post(`http://localhost:3000/update_reservation/${id}`, { status: 'cancelled' });
            // Refetch bookings
            const res = await axios.get('http://localhost:3000/get_reservations');
            setBookings(res.data);
        } catch (err) {
            console.error("Error cancelling booking:", err);
            alert("Failed to cancel booking");
        }
    };

    return (
        <div>
            <nav className="guests-navbar">
                <div className="guests-nav-content">
                  <div className="guests-logo">
                    <a href="/Dashboard"><h1>Messiah</h1></a>
                  </div>
                  <ul className="guests-nav-links">
                    <li><Link to="/Dashboard">Dashboard</Link></li>
                    <li><Link to="/Rooms">Rooms</Link></li>
                    <li><Link to="/Booking">Booking</Link></li>
                    <li className="active"><Link to="/Guest">Guest</Link></li>
                    <li><span>Settings</span></li>
                  </ul>
                </div>
            </nav>
            <section className="guests-main">
                <div className="guests-main-content">
                    <div className="guests-topbar">
                        <h1>Guest Management</h1>
                    </div>
                
                    <div className="guests-booking-header">
                        <p className="Guest-section-label">Booking list</p>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by guest, room, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="guests-bokking-container">
                        <div className="guests-booking-table">
                            <table className="booking-table">
                                <thead>
                                    <tr>
                                        <th>Room No.</th>
                                        <th>Guest Name</th>
                                        <th>Number</th>
                                        <th>Email</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>    
                                <tbody>
                                {loadingBookings ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                            Loading bookings...
                                        </td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                            No bookings found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>{booking.room_number || 'N/A'}</td>
                                            <td>{booking.first_name} {booking.last_name}</td>
                                            <td>{booking.phone_number || 'N/A'}</td>
                                            <td>{booking.email || 'N/A'}</td>
                                            <td>{booking.check_in_date || 'N/A'}</td>
                                            <td>{booking.check_out_date || 'N/A'}</td>
                                            <td className="actions-cell">
                                                <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                    view
                                                </button>
                                                <button className="btn guest btn-primary" onClick={() => handleEdit(booking.id)}>
                                                    edit
                                                </button>
                                                <button className="btn guest btn-danger" onClick={() => handleCancel(booking.id)}>
                                                    cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            </table>
                        </div>
                    </div>
                
                    <p className="Guest-section-label">Guest list</p>
                    <div className="guests-table-container">
                        <table className="guests-table">
                            <thead className="guests-table-header">
                                <tr>
                                    <th>Number of Guests</th>
                                    <th>Food Service</th>
                                    <th>Total Price</th>
                                    <th>Time & Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="guests-table-body">
                                {loadingGuests ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                            Loading guest arrivals...
                                        </td>
                                    </tr>
                                ) : guestArrivals.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                            No guest records found.
                                        </td>
                                    </tr>
                                ) : (
                                    guestArrivals.map((guest) => (
                                        <tr key={guest.id}>
                                            <td>{guest.number_of_guests}</td>
                                            <td>{guest.food_service}</td>
                                            <td>₱{parseFloat(guest.total_price).toFixed(2)}</td>
                                            <td>{guest.created_at}</td>
                                            <td className="actions-cell">
                                                <button className="btn guest btn-primary">Edit</button>
                                                <button className="btn guest btn-danger">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <EditBookingModal 
                show={editModal} 
                onClose={() => setEditModal(false)} 
                booking={selectedEditBooking} 
                onUpdate={() => {
                    // Refetch bookings after update
                    axios.get("http://localhost:3000/get_reservations").then(res => setBookings(res.data));
                }}
            />
            <ViewBookingModal 
                show={viewModal} 
                onClose={() => setViewModal(false)} 
                booking={selectedBooking} 
            />
        </div>
    );
}
export default AdminGuest;