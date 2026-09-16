import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from 'sweetalert2';
import "../admincss/admin_guest.css";
import EditBookingModal from '../Modals/Edit_booking_modal';
import EditEventModal from '../Modals/edit_event_modal';
import ViewBookingModal from '../Modals/view_booking_modal';
import FeedbackModal from '../Modals/feedback._modal';
import ViewGuestModal from '../Modals/view_guest_modal';
import EditGuestModal from '../Modals/edit_guest_modal';


function AdminGuest() {
    const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('adminTheme') === 'light');
    const [bookings, setBookings] = useState([]);
    const [eventBookings, setEventBookings] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [guestArrivals, setGuestArrivals] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);
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
    const [editEventModal, setEditEventModal] = useState(false);
    const [selectedEditBooking, setSelectedEditBooking] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [viewGuestModal, setViewGuestModal] = useState(false);
    const [editGuestModal, setEditGuestModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentBookingPage, setCurrentBookingPage] = useState(1);
    const [currentEventPage, setCurrentEventPage] = useState(1);
    const [currentGuestPage, setCurrentGuestPage] = useState(1);
    const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1);
    const itemsPerPage = 10;

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

    const formatCurrency = (value) => {
        const numeric = Number(String(value || '').replace(/,/g, ''));
        if (!Number.isFinite(numeric)) return '0';
        const hasDecimals = numeric % 1 !== 0;
        return numeric.toLocaleString('en-PH', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2,
        });
    };

    const handleView = (booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    const handleEdit = (booking) => {
        setSelectedEditBooking(booking);
        setEditModal(true);
    };

    const handleEditEvent = (booking) => {
        setSelectedBooking(booking);
        setEditEventModal(true);
    };

    const refreshEventBookings = async () => {
        const response = await apiClient.get('/get_event_bookings');
        setEventBookings(response.data || []);
    };

    const handleViewFeedback = (feedback) => {
        setSelectedFeedback(feedback);
        setFeedbackModal(true);
    };

    const handleViewGuest = (guest) => {
        setSelectedGuest(guest);
        setViewGuestModal(true);
    };

    const handleEditGuest = (guest) => {
        setSelectedGuest(guest);
        setEditGuestModal(true);
    };

    const handleUpdateGuest = async (id, payload) => {
        try {
            await apiClient.put(`/update_guest_arrival/${id}`, payload);
            const res = await apiClient.get('/get_guest_arrivals');
            setGuestArrivals(res.data);
            setEditGuestModal(false);
            Swal.fire({ icon: 'success', title: 'Updated', text: 'Guest arrival updated successfully.' });
        } catch (err) {
            console.error('Error updating guest arrival:', err);
            Swal.fire({ icon: 'error', title: 'Update failed', text: err.response?.data?.details || err.response?.data?.error || 'Failed to update guest arrival.' });
        }
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
        const databaseDate = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/);
        if (databaseDate) {
            const [, year, month, day, hours, minutes] = databaseDate;
            const hourNumber = Number(hours);
            const hour12 = hourNumber % 12 || 12;
            const meridiem = hourNumber >= 12 ? 'PM' : 'AM';
            const monthName = new Date(Number(year), Number(month) - 1, Number(day))
                .toLocaleDateString('en-US', { month: 'long' })
                .toUpperCase();
            return `${monthName} ${Number(day)} at ${hour12}:${minutes} ${meridiem}`;
        }

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        const monthDay = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Manila',
        }).toUpperCase();

        const time = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila',
        });

        return `${monthDay} at ${time}`;
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await apiClient.get("/get_reservations");
                setBookings(res.data);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoadingBookings(false);
            }
        };

        const fetchEventBookings = async () => {
            try {
                const res = await apiClient.get('/get_event_bookings');
                setEventBookings(res.data || []);
            } catch (err) {
                console.error('Error fetching event bookings:', err);
            } finally {
                setLoadingEvents(false);
            }
        };

        const fetchGuestArrivals = async () => {
            try {
                const res = await apiClient.get("/get_guest_arrivals");
                setGuestArrivals(res.data);
            } catch (err) {
                console.error("Error fetching guest arrivals:", err);
            } finally {
                setLoadingGuests(false);
            }
        };

        const fetchFeedback = async () => {
            try {
                const res = await apiClient.get("/get_feedback");
                setFeedbackList(res.data);
            } catch (err) {
                console.error("Error fetching feedback:", err);
            } finally {
                setLoadingFeedback(false);
            }
        };

        fetchBookings();
        fetchEventBookings();
        fetchGuestArrivals();
        fetchFeedback();

        const handleEventBookingUpdate = () => {
            fetchEventBookings();
        };

        const handleStorageRefresh = (event) => {
            if (event.key === 'dashboardRefreshTrigger') {
                fetchEventBookings();
            }
        };

        window.addEventListener('event-booking-updated', handleEventBookingUpdate);
        window.addEventListener('storage', handleStorageRefresh);

        return () => {
            window.removeEventListener('event-booking-updated', handleEventBookingUpdate);
            window.removeEventListener('storage', handleStorageRefresh);
        };
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

    const filteredEventBookings = eventBookings.filter((booking) => {
        const status = String(booking.status || 'pending').toLowerCase();
        if (status !== 'confirmed' && status !== 'complete') return false;

        const query = searchTerm.toLowerCase();
        const searchMatch = [
            booking.event_name,
            booking.guest_name,
            booking.room_number,
            booking.room_name,
            booking.phone_number,
            booking.email,
        ].some((value) => String(value || '').toLowerCase().includes(query));

        if (!selectedMonth) return searchMatch;

        const eventMonth = new Date(booking.start_date).getMonth() + 1;
        return searchMatch && eventMonth === parseInt(selectedMonth, 10);
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

    // Pagination for bookings
    const totalBookingPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const bookingStartIndex = (currentBookingPage - 1) * itemsPerPage;
    const paginatedBookings = filteredBookings.slice(bookingStartIndex, bookingStartIndex + itemsPerPage);

    // Pagination for event bookings
    const totalEventPages = Math.ceil(filteredEventBookings.length / itemsPerPage);
    const eventStartIndex = (currentEventPage - 1) * itemsPerPage;
    const paginatedEventBookings = filteredEventBookings.slice(eventStartIndex, eventStartIndex + itemsPerPage);

    // Pagination for guests
    const totalGuestPages = Math.ceil(filteredGuestArrivals.length / itemsPerPage);
    const guestStartIndex = (currentGuestPage - 1) * itemsPerPage;
    const paginatedGuestArrivals = filteredGuestArrivals.slice(guestStartIndex, guestStartIndex + itemsPerPage);

    // Pagination for feedback
    const totalFeedbackPages = Math.ceil(visibleFeedback.length / itemsPerPage);
    const feedbackStartIndex = (currentFeedbackPage - 1) * itemsPerPage;
    const paginatedFeedback = visibleFeedback.slice(feedbackStartIndex, feedbackStartIndex + itemsPerPage);

    const handleBookingPageChange = (page) => {
        if (page >= 1 && page <= totalBookingPages) {
            setCurrentBookingPage(page);
        }
    };

    const handleEventPageChange = (page) => {
        if (page >= 1 && page <= totalEventPages) {
            setCurrentEventPage(page);
        }
    };

    const handleGuestPageChange = (page) => {
        if (page >= 1 && page <= totalGuestPages) {
            setCurrentGuestPage(page);
        }
    };

    const handleFeedbackPageChange = (page) => {
        if (page >= 1 && page <= totalFeedbackPages) {
            setCurrentFeedbackPage(page);
        }
    };

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
            await apiClient.delete(`/delete_reservation/${id}`);
            const res = await apiClient.get('/get_reservations');
            setBookings(res.data);
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Booking deleted successfully.' });
        } catch (err) {
            console.error("Error deleting booking:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete booking' });
        }
    };

    const handleDeleteEventBooking = async (id) => {
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
            title: 'Delete event booking',
            text: 'This will permanently remove the event booking. Continue?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Keep booking',
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/delete_event_booking/${id}`);
            setEventBookings((currentBookings) => currentBookings.filter((booking) => booking.id !== id));
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Event booking deleted successfully.' });
        } catch (err) {
            console.error('Error deleting event booking:', err);
            const errorText = 'Failed to delete event booking.';
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: errorText,
            });
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
            await apiClient.delete(`/delete_guest_arrival/${id}`);
            const res = await apiClient.get('/get_guest_arrivals');
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
            await apiClient.delete(`/delete_feedback/${id}`);
            const res = await apiClient.get('/get_feedback');
            setFeedbackList(res.data);
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Feedback deleted successfully.' });
        } catch (err) {
            console.error("Error deleting feedback:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete feedback.' });
        }
    };

    useEffect(() => {
        setCurrentBookingPage(1);
        setCurrentEventPage(1);
    }, [searchTerm, selectedMonth]);

    useEffect(() => {
        setCurrentGuestPage(1);
    }, [selectedMonthGuest]);

    useEffect(() => {
        setCurrentFeedbackPage(1);
    }, [selectedMonthFeedback]);

    useEffect(() => {
        if (totalBookingPages > 0 && currentBookingPage > totalBookingPages) {
            setCurrentBookingPage(totalBookingPages);
        }
    }, [currentBookingPage, totalBookingPages]);

    useEffect(() => {
        if (totalEventPages > 0 && currentEventPage > totalEventPages) {
            setCurrentEventPage(totalEventPages);
        }
    }, [currentEventPage, totalEventPages]);

    useEffect(() => {
        if (totalGuestPages > 0 && currentGuestPage > totalGuestPages) {
            setCurrentGuestPage(totalGuestPages);
        }
    }, [currentGuestPage, totalGuestPages]);

    useEffect(() => {
        if (totalFeedbackPages > 0 && currentFeedbackPage > totalFeedbackPages) {
            setCurrentFeedbackPage(totalFeedbackPages);
        }
    }, [currentFeedbackPage, totalFeedbackPages]);

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

    useEffect(() => {
        const handleThemeChange = () => {
            setIsLightMode(localStorage.getItem('adminTheme') === 'light');
        };

        window.addEventListener('storage', handleThemeChange);
        return () => window.removeEventListener('storage', handleThemeChange);
    }, []);

    return (
        <div className={`admin-guest-page ${isLightMode ? 'admin-guest-page--light' : ''}`}>
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
                                        paginatedBookings.map((booking) => (
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
                            {filteredBookings.length > 0 && (
                                <div className="pagination-container booking-pagination">
                                    <button 
                                        className="pagination-btn prev-btn" 
                                        onClick={() => handleBookingPageChange(currentBookingPage - 1)}
                                        disabled={currentBookingPage === 1}
                                        aria-label="Previous page"
                                    >
                                        &lt;
                                    </button>
                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.min(totalBookingPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalBookingPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentBookingPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentBookingPage >= totalBookingPages - 2) {
                                                pageNum = totalBookingPages - 4 + i;
                                            } else {
                                                pageNum = currentBookingPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentBookingPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => handleBookingPageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        className="pagination-btn next-btn" 
                                        onClick={() => handleBookingPageChange(currentBookingPage + 1)}
                                        disabled={currentBookingPage === totalBookingPages}
                                        aria-label="Next page"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="event-list-label" id="event-list">Event list</p>
                        <div className="event-list-filters">
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
                        
                        <div className="event-list-section">
                            <div className="event-list-table-wrapper">
                                <table className="event-list-table">
                                    <thead>
                                        <tr>
                                            <th>Guest Name</th>
                                            <th>Number</th>
                                            <th>Email</th>
                                            <th>rooms</th>
                                            <th>Check-Date</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th className="actions-header">Actions</th>
                                        </tr>
                                    </thead>    
                                    <tbody>
                                    {loadingEvents ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Loading events...
                                            </td>
                                        </tr>
                                    ) : filteredEventBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No events found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedEventBookings.map((booking) => (
                                            <tr key={booking.id}>
                                                <td>{booking.guest_name || '-'}</td>
                                                <td>{booking.phone_number || '-'}</td>
                                                <td>{booking.email}</td>
                                                <td>{booking.room_number || booking.room_name || booking.rooms || '-'}</td>
                                                <td>{formatBookingDate(booking.start_date)}</td>
                                                <td>{booking.time_in || '-'} - {booking.time_out || '-'}</td>
                                                <td>{booking.status || 'pending'}</td>
                                                <td className="actions-cell">
                                                    <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                        view
                                                    </button>
                                                    <button className="btn guest btn-primary" onClick={() => handleEditEvent(booking)}>
                                                        edit
                                                    </button>
                                                    <button className="btn guest btn-danger" onClick={() => handleDeleteEventBooking(booking.id)}>
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
                            {filteredEventBookings.length > 0 && (
                                <div className="pagination-container event-pagination">
                                    <button 
                                        className="pagination-btn prev-btn" 
                                        onClick={() => handleEventPageChange(currentEventPage - 1)}
                                        disabled={currentEventPage === 1}
                                        aria-label="Previous page"
                                    >
                                        &lt;
                                    </button>
                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.min(totalEventPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalEventPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentEventPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentEventPage >= totalEventPages - 2) {
                                                pageNum = totalEventPages - 4 + i;
                                            } else {
                                                pageNum = currentEventPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentEventPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => handleEventPageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        className="pagination-btn next-btn" 
                                        onClick={() => handleEventPageChange(currentEventPage + 1)}
                                        disabled={currentEventPage === totalEventPages}
                                        aria-label="Next page"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        
                    
                    
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
                                            <th>Group Name</th>
                                            <th>Number of Guests</th>
                                            <th>Corkage</th>
                                            <th>Total Price</th>
                                            <th>Time & Date</th>
                                            <th className="actions-header">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingGuests ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                    Loading guest arrivals...
                                                </td>
                                            </tr>
                                        ) : guestArrivals.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                    No guest records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedGuestArrivals.map((guest) => (
                                                <tr key={guest.id}>
                                                    <td>{guest.group_name || '-'}</td>
                                                    <td>{guest.number_of_guests}</td>
                                                    <td>{guest.corkage || 'No Corkage'}</td>
                                                    <td>₱{formatCurrency(guest.total_price)}</td>
                                                    <td>{formatGuestDateTime(guest.created_at)}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn guest btn-primary" onClick={() => handleViewGuest(guest)}>View</button>
                                                        <button className="btn guest btn-primary" onClick={() => handleEditGuest(guest)}>Edit</button>
                                                        <button className="btn guest btn-danger" onClick={() => handleDeleteGuest(guest.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div> 
                        </div>                           
                            {filteredGuestArrivals.length > 0 && (
                                <div className="pagination-container">
                                    <button 
                                        className="pagination-btn prev-btn" 
                                        onClick={() => handleGuestPageChange(currentGuestPage - 1)}
                                        disabled={currentGuestPage === 1}
                                        aria-label="Previous page"
                                    >
                                        &lt;
                                    </button>
                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.min(totalGuestPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalGuestPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentGuestPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentGuestPage >= totalGuestPages - 2) {
                                                pageNum = totalGuestPages - 4 + i;
                                            } else {
                                                pageNum = currentGuestPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentGuestPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => handleGuestPageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        className="pagination-btn next-btn" 
                                        onClick={() => handleGuestPageChange(currentGuestPage + 1)}
                                        disabled={currentGuestPage === totalGuestPages}
                                        aria-label="Next page"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                       
                        
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
                                            paginatedFeedback.map((feedback) => (
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
                            {visibleFeedback.length > 0 && (
                                <div className="pagination-container">
                                    <button 
                                        className="pagination-btn prev-btn" 
                                        onClick={() => handleFeedbackPageChange(currentFeedbackPage - 1)}
                                        disabled={currentFeedbackPage === 1}
                                        aria-label="Previous page"
                                    >
                                        &lt;
                                    </button>
                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.min(totalFeedbackPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalFeedbackPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentFeedbackPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentFeedbackPage >= totalFeedbackPages - 2) {
                                                pageNum = totalFeedbackPages - 4 + i;
                                            } else {
                                                pageNum = currentFeedbackPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentFeedbackPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => handleFeedbackPageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        className="pagination-btn next-btn" 
                                        onClick={() => handleFeedbackPageChange(currentFeedbackPage + 1)}
                                        disabled={currentFeedbackPage === totalFeedbackPages}
                                        aria-label="Next page"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        
                </div>
            </section>
            <EditBookingModal 
                show={editModal} onClose={() => setEditModal(false)} booking={selectedEditBooking} onUpdate={() => {
                    // Refetch bookings after update
                    apiClient.get("/get_reservations").then(res => setBookings(res.data));
                }}/>
            <EditEventModal
                show={editEventModal}
                onClose={() => setEditEventModal(false)}
                booking={selectedBooking}
                onUpdated={refreshEventBookings}
            />
            <ViewBookingModal 
                show={viewModal} onClose={() => setViewModal(false)} booking={selectedBooking} onEdit={handleEdit}/>
            <FeedbackModal show={feedbackModal} onClose={() => setFeedbackModal(false)} feedback={selectedFeedback} />
            <ViewGuestModal show={viewGuestModal} onClose={() => setViewGuestModal(false)} guest={selectedGuest} />
            <EditGuestModal show={editGuestModal} onClose={() => setEditGuestModal(false)} guest={selectedGuest} onUpdate={handleUpdateGuest} />
        </div>
    );
}
export default AdminGuest;