import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_boking.css";

function AdminBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axios.get('http://localhost:3000/get_reservations');
                setBookings(res.data);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const checkInsToday = bookings.filter((b) => {
        if (!b.check_in_date) return false;
        const today = new Date().toISOString().slice(0, 10);
        return b.check_in_date.slice(0, 10) === today;
    }).length;

    const pendingCount = bookings.filter((b) => b.status?.toLowerCase() === 'pending').length;

    

    return (
        <div>
            <nav className="admin-booking-navbar">
                <div className="admin-booking-nav-content">
                    <div className="admin-booking-logo">
                        <h1>Messiah</h1>
                    </div>
                    <ul className="admin-booking-nav-links">
                        <li><Link to="/Dashboard">Dashboard</Link></li>
                        <li><Link to="/Rooms">Rooms</Link></li>
                        <li className="active"><Link to="/Booking">Booking</Link></li>
                        <li><Link to="/Guest">Guest</Link></li>
                        <li><span>Settings</span></li>
                    </ul>
                </div>
            </nav>

            <section className="admin-booking-main">
                <div className="admin-booking-main-content">

                    <div className="admin-booking-topbar">
                        <h1>Booking Management</h1>
                    </div>

                    <div className="admin-booking-stats-grid">
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Total Bookings</p>
                            <p className="booking-stat-value">{bookings.length}</p>
                        </div>
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Check-ins Today</p>
                            <p className="booking-stat-value gold">{checkInsToday}</p>
                        </div>
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Pending Requests</p>
                            <p className="booking-stat-value">{pendingCount}</p>
                        </div>
                    </div>

                    <div className="bookings-table-wrap">
                        <div className="bookings-table-header">
                            <p>Recent Bookings</p>
                        </div>
                        {loading ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>Loading bookings...</p>
                        ) : bookings.length === 0 ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>No bookings found.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Guest</th>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>{booking.first_name} {booking.last_name}</td>
                                            <td>{booking.room_number}</td>
                                            <td>{booking.check_in_date}</td>
                                            <td>{booking.check_out_date}</td>
                                            <td>
                                                <span className={`booking-status ${booking.status?.toLowerCase()}`}>
                                                    {booking.status || 'pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <button  className="btn guest btn-primary">
                                                    view
                                                </button>
                                                <button className="btn guest btn-primary">
                                                    confirm
                                                </button>
                                                <button className="btn guest btn-danger">
                                                    cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </section>
        </div>
    );
}

export default AdminBooking;