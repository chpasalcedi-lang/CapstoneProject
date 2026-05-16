import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
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

    const formatBookingDate = (dateString) => {
        if (!dateString) return '';
    const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatGuestDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        const monthDay = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
        }).toUpperCase();

        const time = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        return `${monthDay} at ${time}`;
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
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Cancel booking',
            text: 'Are you sure you want to cancel this booking?',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'Keep booking'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.post(`http://localhost:3000/update_reservation/${id}`, { status: 'cancelled' });
            const res = await axios.get('http://localhost:3000/get_reservations');
            setBookings(res.data);
            Swal.fire({ icon: 'success', title: 'Cancelled', text: 'Booking cancelled successfully.' });
        } catch (err) {
            console.error("Error cancelling booking:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to cancel booking' });
        }
    };

    return (
        <div>
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                        <ul className="dashboard-nav-links">
                            <p>dashboard</p>
                            <li><Link to="/Dashboard">Dashboard</Link></li>
                            <li><Link to="/Users">User</Link></li>
                            <li><Link to="">Sales</Link></li>
                            <p>management</p>
                            <li><Link to="/Rooms">Rooms</Link></li>
                            <li><Link to="/Booking">Booking</Link></li>
                            <li className="active"><Link to="/Guest">Guest</Link></li>
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
                        <h1>Guest Management</h1>
                    </div>


                    <p className="Guest-section-label">Booking list</p>
                    <div className="guests-booking-headers">
                        <input type="text" className="search-input" placeholder="Search by guest, room, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    
                    <div className="guests-booking-container">
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
                                            <td>{formatBookingDate(booking.check_in_date)}</td>
                                            <td>{formatBookingDate(booking.check_out_date)}</td>
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
                    <div className="guests-table-containers">
                        <div className="guests-main-tables">
                            <table className="guests-tables">
                                <thead>
                                    <tr>
                                        <th>Number of Guests</th>
                                        <th>Food Service</th>
                                        <th>Total Price</th>
                                        <th>Time & Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                                                <td>{formatGuestDateTime(guest.created_at)}</td>
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