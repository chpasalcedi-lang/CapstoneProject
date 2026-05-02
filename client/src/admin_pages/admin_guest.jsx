import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_guest.css";


function AdminGuest() {
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axios.get("http://localhost:3000/get_reservations");
                setBookings(res.data);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoadingBookings(false);
            }
        };

        fetchBookings();
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
                                                <button className="btn guest btn-primary">View</button>
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
                
                    <p className="Guest-section-label">Guest list</p>
                    <div className="guests-table-container">
                        <table className="guests-table">
                            <thead className="guests-table-header">
                                <tr>
                                    <th>Number of Guests</th>
                                    <th>Foods</th>
                                    <th>Price</th>
                                    <th>Time & Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="guests-table-body">
                                <tr>
                                    <td>2</td>
                                    <td>500</td>
                                    <td>$100.00</td>
                                    <td>2023-10-15 14:30</td>
                                    <td className="actions-cell">
                                        <button className="btn guest btn-primary">Edit</button>
                                        <button className="btn guest btn-danger">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
export default AdminGuest;