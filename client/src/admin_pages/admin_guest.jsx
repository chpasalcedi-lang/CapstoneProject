import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import "../admincss/admin_guest.css";
import EditBookingModal from '../Modals/Edit_booking_modal';
import ViewBookingModal from '../Modals/view_booking_modal';
import FeedbackModal from '../Modals/feedback._modal';


function AdminGuest() {
    const [bookings, setBookings] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [guestArrivals, setGuestArrivals] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingGuests, setLoadingGuests] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedMonthGuest, setSelectedMonthGuest] = useState("");
    const [selectedMonthFeedback, setSelectedMonthFeedback] = useState("");
    const [feedbackList, setFeedbackList] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(true);
    const [viewModal, setViewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [selectedEditBooking, setSelectedEditBooking] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [adminData] = useState(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          return {
            name: parsed.name,
            role: parsed.role,
          };
        }
        return { name: "?", role: "?" };
      });

    const isAdmin = adminData.role?.toString().toLowerCase() === 'admin';


    const handleView = (booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    const handleEdit = (booking) => {
        setSelectedEditBooking(booking);
        setEditModal(true);
    };

    const handleViewFeedback = (feedback) => {
        setSelectedFeedback(feedback);
        setFeedbackModal(true);
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

        const fetchFeedback = async () => {
            try {
                const res = await axios.get("http://localhost:3001/get_feedback");
                setFeedbackList(res.data);
            } catch (err) {
                console.error("Error fetching feedback:", err);
            } finally {
                setLoadingFeedback(false);
            }
        };

        fetchBookings();
        fetchGuestArrivals();
        fetchFeedback();
    }, []);

    const filteredBookings = bookings.filter((booking) => {
        const status = booking.res_status?.toLowerCase();
        const isVisible = status === 'confirmed' || status === 'complete';
        if (!isVisible) return false;

        const query = searchTerm.toLowerCase();
        const searchMatch = (
            booking.first_name?.toLowerCase().includes(query) ||
            booking.last_name?.toLowerCase().includes(query) ||
            booking.room_number?.toString().toLowerCase().includes(query) ||
            booking.phone_number?.toLowerCase().includes(query) ||
            booking.email?.toLowerCase().includes(query)
        );

        if (!selectedMonth) return searchMatch;

        const checkInDate = new Date(booking.check_in_date);
        const bookingMonth = checkInDate.getMonth() + 1;
        return searchMatch && bookingMonth === parseInt(selectedMonth);
    });

    const filteredGuestArrivals = guestArrivals.filter((guest) => {
        if (!selectedMonthGuest) return true;

        const guestDate = new Date(guest.created_at);
        const guestMonth = guestDate.getMonth() + 1;
        return guestMonth === parseInt(selectedMonthGuest);
    });

    const filteredFeedback = feedbackList.filter((feedback) => {
        if (!selectedMonthFeedback) return true;

        const feedbackDate = new Date(feedback.created_at);
        const feedbackMonth = feedbackDate.getMonth() + 1;
        return feedbackMonth === parseInt(selectedMonthFeedback);
    });

    const visibleFeedback = filteredFeedback.filter((feedback) => {
        return String(feedback.name || feedback.email || feedback.message).trim().length > 0;
    });

    const handleDeleteBooking = async (id) => {
        if (!isAdmin) {
            await Swal.fire({
                icon: 'warning',
                title: 'Access denied',
                text: 'Only admin can access this action.',
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete booking',
            text: 'Are you sure you want to delete this booking?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Keep booking'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`http://localhost:3001/delete_reservation/${id}`);
            const res = await axios.get('http://localhost:3001/get_reservations');
            setBookings(res.data);
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Booking deleted successfully.' });
        } catch (err) {
            console.error("Error deleting booking:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete booking' });
        }
    };

    const handleDeleteGuest = async (id) => {
        if (!isAdmin) {
            await Swal.fire({
                icon: 'warning',
                title: 'Access denied',
                text: 'Only admin can access this action.',
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete guest record',
            text: 'This will permanently remove the guest arrival record. Continue?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Keep record'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`http://localhost:3001/delete_guest_arrival/${id}`);
            const res = await axios.get('http://localhost:3001/get_guest_arrivals');
            setGuestArrivals(res.data);
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Guest arrival record deleted successfully.' });
        } catch (err) {
            console.error("Error deleting guest arrival:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete guest arrival record.' });
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!isAdmin) {
            await Swal.fire({
                icon: 'warning',
                title: 'Access denied',
                text: 'Only admin can access this action.',
            });
            return;
        }
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete feedback',
            text: 'This will permanently remove the feedback. Continue?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Keep feedback'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`http://localhost:3001/delete_feedback/${id}`);
            const res = await axios.get('http://localhost:3001/get_feedback');
            setFeedbackList(res.data);
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Feedback deleted successfully.' });
        } catch (err) {
            console.error("Error deleting feedback:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete feedback.' });
        }
    };


    useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 400) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
        window.removeEventListener("scroll", handleScroll);
    };
}, []);

    return (
        <div>
            <div className="mobile-topbar">
                <Link to="/Dashboard">
                <h1 className="mobile-logo">Messiah</h1>
                </Link>
                <button className="mobile-hamburger" onClick={() => setDrawerOpen(prev => !prev)} aria-label={drawerOpen ? "Close menu" : "Open menu"}>
                    <i className={drawerOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
                </button>
            </div>

            <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                        <ul className="dashboard-nav-links">
                            <p>dashboard</p>
                            <li><Link to="/Dashboard">Dashboard</Link></li>
                            <li><Link to="/Users">User</Link></li>
                            <li><Link to="/Sales">Sales</Link></li>
                            <p>management</p>
                            <li><Link to="/Rooms">Rooms</Link></li>
                            <li><Link to="/Booking">Booking</Link></li>
                            <li className="active"><Link to="/Guest">Guest / Feedback</Link></li>
                            <div className="dasboard-admin-status">
                                <Link to="/Profile">
                                    <div className="dasboard-admin-status-content">
                                        <h1>System admin</h1>
                                        <p className="admin-status ">{adminData.role}</p>
                                    </div>
                                    <div className="dasboard-admin-profile"> {adminData.name.charAt(0).toUpperCase()} </div>
                                </Link>
                            </div>
                        </ul>
                </div>
            </nav>
            <nav className={`drawer-panel ${drawerOpen ? 'open' : ''}`}>
                <div className="dashboard-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingRight: 20 }}>
                    <Link to="/Dashboard"><h1>Messiah</h1></Link>
                </div>
                <ul className="dashboard-nav-links" onClick={() => setDrawerOpen(false)}>
                    <p>dashboard</p>
                    <li><Link to="/Dashboard">Dashboard</Link></li>
                    <li><Link to="/Users">User</Link></li>
                    <li><Link to="/Sales">Sales</Link></li>
                    <p>management</p>
                    <li><Link to="/Rooms">Rooms</Link></li>
                    <li><Link to="/Booking">Booking</Link></li>
                    <li className="active"><Link to="/Guest">Guest / Feedback</Link></li>
                    <div className="dasboard-admin-status">
                    <Link to="/Profile">
                        <div className="dasboard-admin-status-content">
                        <h1>System admin</h1>
                        <p className="admin-status">{adminData.role}</p>
                        </div>
                        <div className="dasboard-admin-profile">{adminData.name.charAt(0).toUpperCase()}</div>
                    </Link>
                    </div>
                </ul>
            </nav>

            <div className={`guests-up-btn ${showScrollTop ? "show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <i className="fa-solid fa-angles-up"></i>
            </div>
            
            <section className="guests-main">
                <div className="guests-main-content" id="guests-up-btn">
                    <div className="guests-topbar">
                        <h1>Guest Management</h1>
                    </div>

                    <div className="admin-guest-stats-bar">
                        <div className="admin-guest-stats-bar-content">
                            <div className="admin-guest-stats-card">
                                <p className="guests-section-label">Manage guest records and bookings</p>
                                <div className="admin-guest-filter-btns">
                                    <a href="#booking-list"> booking </a>
                                    <a href="#guest-list"> guest </a>
                                    <a href="#feedback-list"> feedback </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    
                        <p className="Guest-section-label" id="booking-list">Booking list</p>
                        <div className="guests-booking-headers">
                            <input type="text" className="search-input" placeholder="Search by guest, room, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            <select className="search-options" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                <option value="">All Months</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
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
                                            <th className="actions-header">Actions</th>
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
                                                <td>{booking.room_number}</td>
                                                <td>{booking.first_name} {booking.last_name}</td>
                                                <td>{booking.phone_number}</td>
                                                <td>{booking.email}</td>
                                                <td>{formatBookingDate(booking.check_in_date)}</td>
                                                <td>{formatBookingDate(booking.check_out_date)}</td>
                                                <td className="actions-cell">
                                                    <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                        view
                                                    </button>
                                                    <button className="btn guest btn-primary" onClick={() => handleEdit(booking)}>
                                                        edit
                                                    </button>
                                                    <button className="btn guest btn-danger" onClick={() => handleDeleteBooking(booking.id)}>
                                                        delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                </table>
                            </div>
                        </div>
                    
                        <p className="Guest-section-label" id="guest-list"> Guest list </p>
                        <div className="guests-booking-headers">
                            <select className="search-options" value={selectedMonthGuest} onChange={(e) => setSelectedMonthGuest(e.target.value)}>
                                <option value="">All Months</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </div>
                        <div className="guests-table-containers">
                            <div className="guests-main-tables">
                                <table className="guests-tables">
                                    <thead>
                                        <tr>
                                            <th>Number of Guests</th>
                                            <th>Food Service</th>
                                            <th>Total Price</th>
                                            <th>Time & Date</th>
                                            <th className="actions-header">Actions</th>
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
                                            filteredGuestArrivals.map((guest) => (
                                                <tr key={guest.id}>
                                                    <td>{guest.number_of_guests}</td>
                                                    <td>{guest.food_service}</td>
                                                    <td>₱{parseFloat(guest.total_price).toFixed(2)}</td>
                                                    <td>{formatGuestDateTime(guest.created_at)}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn guest btn-danger" onClick={() => handleDeleteGuest(guest.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <p className="Guest-section-label" id="feedback-list"> Feedback list </p>
                        <div className="feedback-booking-headers">
                            <select className="search-options" value={selectedMonthFeedback} onChange={(e) => setSelectedMonthFeedback(e.target.value)}>
                                <option value="">All Months</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </div>
                        <div className="feedback-table-containers">
                            <div className="feedback-main-tables">
                                <table className="feedback-tables">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Message</th>
                                            <th className="actions-header">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingFeedback ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                                    Loading feedback...
                                                </td>
                                            </tr>
                                        ) : visibleFeedback.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                                    No feedback found.
                                                </td>
                                            </tr>
                                        ) : (
                                            visibleFeedback.map((feedback) => (
                                                <tr key={feedback.id}>
                                                    <td>{feedback.name}</td>
                                                    <td>{feedback.email}</td>
                                                    <td>{feedback.message}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn guest btn-primary1" onClick={() => handleViewFeedback(feedback)}>View</button>
                                                        <button className="btn guest btn-danger" onClick={() => handleDeleteFeedback(feedback.id)}>Delete</button>
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
                show={editModal} onClose={() => setEditModal(false)} booking={selectedEditBooking} onUpdate={() => {
                    // Refetch bookings after update
                    axios.get("http://localhost:3001/get_reservations").then(res => setBookings(res.data));
                }}/>
            <ViewBookingModal 
                show={viewModal} onClose={() => setViewModal(false)} booking={selectedBooking} onEdit={handleEdit}/>
            <FeedbackModal show={feedbackModal} onClose={() => setFeedbackModal(false)} feedback={selectedFeedback} />
        </div>
    );
}
export default AdminGuest;