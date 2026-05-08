import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_boking.css";
import ViewBookingModal from "../Modals/view_booking_modal.jsx";

function AdminBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewModal, setViewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axios.get('http://localhost:3001/get_reservations');
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

    const pendingCount = bookings.filter((b) => b.res_status?.toLowerCase() === 'pending').length;

    const handleView = (booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    const handleConfirm = async (id) => {
        try {
            await axios.post(`http://localhost:3001/update_reservation/${id}`, { status: 'confirmed' });
            // Refetch bookings
            const res = await axios.get('http://localhost:3001/get_reservations');
            setBookings(res.data);
            localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
        } catch (err) {
            console.error("Error confirming booking:", err);
            alert("Failed to confirm booking");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await axios.post(`http://localhost:3001/update_reservation/${id}`, { status: 'cancelled' });
            // Refetch bookings
            const res = await axios.get('http://localhost:3001/get_reservations');
            setBookings(res.data);
            localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
        } catch (err) {
            console.error("Error cancelling booking:", err);
            alert("Failed to cancel booking");
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredBookings = bookings.filter((booking) => {
        const status = (booking.res_status || 'pending').toLowerCase();

        if (filterStatus === 'completed' && status !== 'confirmed') return false;
        if (filterStatus === 'pending' && status !== 'pending') return false;
        if (filterStatus === 'cancelled' && status !== 'cancelled') return false;

        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        const fullName = `${booking.first_name || ''} ${booking.last_name || ''}`.toLowerCase();
        const roomNumber = (booking.room_number || '').toString().toLowerCase();
        const bookingStatus = status;

        return (
            fullName.includes(search) ||
            roomNumber.includes(search) ||
            bookingStatus.includes(search)
        );
    });

    return (
        <div>
            <nav className="dashboard-navbar">
                      <div className="dashboard-nav-content">
                          <div className="dashboard-logo">
                              <a href="/Dashboard"><h1>Messiah</h1></a>
                          </div>
                              <ul className="dashboard-nav-links">
                                  <p>dashboard</p>
                                  <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
                                  <li><Link to="/Users">User</Link></li>
                                  <li><Link to="">Sales</Link></li>
                                  <p>management</p>
                                  <li><Link to="/Rooms">Rooms</Link></li>
                                  <li><Link to="/Booking">Booking</Link></li>
                                  <li><Link to="/Guest">Guest</Link></li>
                                  <p>reports</p>
                                  <li><Link to="/Logs">Active logs</Link></li>
                                  <div className="dasboard-admin-status">
                                      <Link to="/Profile">
                                          <div className="dasboard-admin-status-content">
                                              <h1>System admin</h1>
                                              <p className="admin-status ">admin</p>
                                          </div>
                                          <div className="dasboard-admin-profile"> Ap </div>
                                      </Link>
                                  </div>
                            </ul>
                      </div>
                  </nav>

            <section className="guests-main">
                <div className="guests-main-content">

                    <div className="guests-topbar">
                        <h1>Booking Management</h1>
                    </div>

                    <div className="guests-stats-grid">
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
                    <div className="guests-booking-headers-status-bar">
                        <div className="admin-booking-stats-bar">
                            <div className="admin-booking-stats-bar-content">
                                <div className="admin-booking-stats-card">
                                    <input type="search" placeholder="Search bookings..." value={searchTerm} onChange={handleSearchChange}/>
                                    <div className="admin-booking-filter-btns">
                                        <button
                                            type="button" className={filterStatus === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>
                                            all
                                        </button>
                                        <button type="button" className={filterStatus === 'completed' ? 'active' : ''} onClick={() => handleFilterChange('completed')}>
                                            Completed
                                        </button>
                                        <button type="button" className={filterStatus === 'pending' ? 'active' : ''}onClick={() => handleFilterChange('pending')}
    >
                                            Pending
                                        </button>
                                        <button type="button" className={filterStatus === 'cancelled' ? 'active' : ''} onClick={() => handleFilterChange('cancelled')}>
                                            Cancelled
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="guests-table-container">
                        <h1>Recent Bookings</h1>
                        {loading ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>Loading bookings...</p>
                        ) : filteredBookings.length === 0 ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>No bookings found.</p>
                        ) : (
                            <table className="guests-table">
                                <thead>
                                    <tr>
                                        <th>Guest</th>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>{booking.first_name} {booking.last_name}</td>
                                            <td>{booking.room_number}</td>
                                            <td>{booking.check_in_date}</td>
                                            <td>{booking.check_out_date}</td>
                                            <td>₱{Number(booking.room_price || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={`status-${(booking.res_status || 'pending').toLowerCase()}`}>
                                                    {booking.res_status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                    view
                                                </button>
                                                <button className="btn guest btn-primary" onClick={() => handleConfirm(booking.id)}>
                                                    confirm
                                                </button>
                                                <button className="btn guest btn-danger" onClick={() => handleCancel(booking.id)}>
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

            <ViewBookingModal 
                show={viewModal} 
                onClose={() => setViewModal(false)} 
                booking={selectedBooking} 
            />
        </div>
    );
}

export default AdminBooking;