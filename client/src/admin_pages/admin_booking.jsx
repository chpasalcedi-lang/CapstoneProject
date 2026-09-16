import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from 'sweetalert2';
import emailjs from "@emailjs/browser";
import "../admincss/admin_boking.css";
import ViewBookingModal from "../Modals/view_booking_modal.jsx";
import ViewEventModal from "../Modals/view_event_modal.jsx";

// EmailJS API key
emailjs.init("-Vq78NrvG691mgYQ3");

function AdminBooking() {
    const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('adminTheme') === 'light');
    const [bookings, setBookings] = useState([]);
    const [eventBookings, setEventBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewModal, setViewModal] = useState(false);
    const [eventViewModal, setEventViewModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentBookingPage, setCurrentBookingPage] = useState(1);
    const [currentEventPage, setCurrentEventPage] = useState(1);
    const [currentCancelPage, setCurrentCancelPage] = useState(1);
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

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const [reservationResponse, eventResponse] = await Promise.all([
                    apiClient.get('/get_reservations'),
                    apiClient.get('/get_event_bookings'),
                ]);
                setBookings(reservationResponse.data || []);
                setEventBookings(eventResponse.data || []);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();

        const handleReservationUpdate = () => {
            fetchBookings();
        };

        const handleStorageRefresh = (event) => {
            if (event.key === 'dashboardRefreshTrigger') {
                fetchBookings();
            }
        };

        window.addEventListener('reservation-updated', handleReservationUpdate);
        window.addEventListener('storage', handleStorageRefresh);

        return () => {
            window.removeEventListener('reservation-updated', handleReservationUpdate);
            window.removeEventListener('storage', handleStorageRefresh);
        };
    }, []);

    useEffect(() => {
        const handleThemeChange = () => {
            setIsLightMode(localStorage.getItem('adminTheme') === 'light');
        };

        window.addEventListener('storage', handleThemeChange);
        return () => window.removeEventListener('storage', handleThemeChange);
    }, []);

    const checkInsToday = bookings.filter((b) => {
        if (!b.check_in_date) return false;
        const today = new Date().toISOString().slice(0, 10);
        return b.check_in_date.slice(0, 10) === today;
    }).length;

    const pendingCount = bookings.filter((b) => b.res_status?.toLowerCase() === 'pending').length;

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

    const handleEventView = (booking) => {
        setSelectedBooking(booking);
        setEventViewModal(true);
    };

    const handleConfirm = async (booking) => {
        try {
            if (!booking) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Booking not found' });
                return;
            }

            const currentStatus = (booking.res_status || 'pending').toLowerCase();
            let targetStatus = 'confirmed';

            if (currentStatus === 'pending') {
                targetStatus = 'confirmed';
            } else if (currentStatus === 'confirmed') {
                targetStatus = 'complete';
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No action needed',
                    text: 'This reservation cannot be updated at this time.'
                });
                return;
            }

            await apiClient.post(`/update_reservation/${booking.id}`, { status: targetStatus });

            if (currentStatus === 'pending') {
                const recipientEmail = String(booking.email || '').trim();
                const templateParams = {
                    email: recipientEmail,
                    to_email: recipientEmail,
                    reply_to: recipientEmail,
                    guest_name: `${booking.first_name} ${booking.last_name}`,
                    room_number: booking.room_number,
                    check_in_date: new Date(booking.check_in_date).toLocaleDateString(),
                    check_out_date: new Date(booking.check_out_date).toLocaleDateString(),
                    room_price: `₱${formatCurrency(booking.room_price)}`,
                    num_guests: booking.num_guests,
                };

                try {
                    if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) {
                        throw new Error(`Invalid guest email address: ${recipientEmail || 'missing'}`);
                    }
                    await emailjs.send(
                        "service_9fw39gp",
                        "template_wba3f1m",
                        templateParams,
                        "-Vq78NrvG691mgYQ3"
                    );
                    Swal.fire({ icon: 'success', title: 'Confirmed', text: 'Reservation confirmed and email sent to guest.' });
                } catch (emailErr) {
                    const errorText = emailErr?.text || emailErr?.message || 'Unknown EmailJS error';
                    console.error('Email send error:', emailErr?.status, errorText, emailErr);
                    Swal.fire({ icon: 'warning', title: 'Confirmed', text: `Reservation confirmed, but email failed: ${errorText}` });
                }
            } else if (targetStatus === 'complete') {
                Swal.fire({ icon: 'success', title: 'Complete', text: 'Reservation marked complete.' });
            } else {
                Swal.fire({ icon: 'success', title: 'Confirmed', text: 'Reservation confirmed successfully.' });
            }

            const res = await apiClient.get('/get_reservations');
            setBookings(res.data);
            localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
        } catch (err) {
            console.error('Error confirming booking:', err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to update booking' });
        }
    };

    const handleCancel = async (booking) => {
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
            await apiClient.post(`/update_reservation/${booking.id}`, { status: 'cancelled' });
            const emailParams = {
                email: booking.email,
                guest_name: `${booking.first_name} ${booking.last_name}`,
                room_number: booking.room_number,
                check_in_date: new Date(booking.check_in_date).toLocaleDateString(),
                check_out_date: new Date(booking.check_out_date).toLocaleDateString(),
                total_price: `₱${formatCurrency(booking.total_price)}`,
                discount: booking.discount !== undefined && booking.discount !== null ? `${booking.discount}%` : '0%'
            };

            let emailSent = true;
            try {
                await emailjs.send(
                    "service_mv433ts",
                    "template_9763lg8",
                    emailParams
                );
            } catch (emailErr) {
                emailSent = false;
                console.error('Email send error:', emailErr);
            }

            const res = await apiClient.get('/get_reservations');
            setBookings(res.data);
            localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
            if (emailSent) {
                Swal.fire({ icon: 'success', title: 'Cancelled', text: 'Booking cancelled successfully.' });
            } else {
                Swal.fire({ icon: 'warning', title: 'Cancelled', text: 'Booking cancelled successfully, but email failed to send.' });
            }
        } catch (err) {
            console.error("Error cancelling booking:", err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to cancel booking' });
        }
    };

    const refreshEventBookings = async () => {
        const response = await apiClient.get('/get_event_bookings');
        setEventBookings(response.data || []);
        localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
        window.dispatchEvent(new Event('event-booking-updated'));
    };

    const handleEventConfirm = async (booking) => {
        const currentStatus = String(booking?.status || 'pending').toLowerCase();
        const targetStatus = currentStatus === 'pending' ? 'confirmed' : currentStatus === 'confirmed' ? 'complete' : null;

        if (!targetStatus) return;

        try {
            await apiClient.post(`/update_event_booking/${booking.id}`, { status: targetStatus });
            await refreshEventBookings();
            Swal.fire({
                icon: 'success',
                title: targetStatus === 'complete' ? 'Complete' : 'Confirmed',
                text: `Event booking marked ${targetStatus}.`,
            });
        } catch (err) {
            console.error('Error updating event booking:', err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to update event booking.' });
        }
    };

    const handleEventCancel = async (booking) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Cancel event booking',
            text: 'Are you sure you want to cancel this event booking?',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'Keep booking',
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.post(`/update_event_booking/${booking.id}`, { status: 'cancelled' });
            await refreshEventBookings();
            Swal.fire({ icon: 'success', title: 'Cancelled', text: 'Event booking cancelled successfully.' });
        } catch (err) {
            console.error('Error cancelling event booking:', err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to cancel event booking.' });
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus((prev) => (prev === status ? 'all' : status));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentBookingPage(1);
    };

    const handleBookingPageChange = (page) => {
        if (page >= 1 && page <= Math.ceil(filteredBookings.length / itemsPerPage)) {
            setCurrentBookingPage(page);
        }
    };

    const handleCancelPageChange = (page) => {
        if (page >= 1 && page <= Math.ceil(cancelRequestBookings.length / itemsPerPage)) {
            setCurrentCancelPage(page);
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

    const filteredBookings = bookings.filter((booking) => {
        const status = (booking.res_status || 'pending').toLowerCase();

        if (filterStatus === 'confirmed' && status !== 'confirmed') return false;
        if (filterStatus === 'complete' && status !== 'complete') return false;
        if (filterStatus === 'pending' && status !== 'pending') return false;
        if (filterStatus === 'cancelled' && status !== 'cancelled') return false;

        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        const fullName = `${booking.first_name || ''} ${booking.last_name || ''}`.toLowerCase();
        const roomNumber = (booking.room_number || '').toString().toLowerCase();
        const isRoomNumberSearch = /^\d+$/.test(search.trim());

        if (isRoomNumberSearch) {
            return roomNumber === search.trim();
        }

        return fullName.includes(search);
    });

    // Cancel requests list should show all bookings that submitted a cancel request
    // and should NOT be affected by the filter buttons or search box.
    const cancelRequestBookings = bookings.filter((booking) => {
        const note = String(booking.cancel_notes_request || '').trim();
        return note.length > 0;
    });

    const confirmedCount = bookings.filter((booking) => {
        return (booking.res_status || '').toLowerCase() === 'confirmed';
    }).length;
    const cancelledCount = cancelRequestBookings.length;
    const totalCancelledCount = bookings.filter((booking) => {
        return (booking.res_status || '').toLowerCase() === 'cancelled';
    }).length;

    // Pagination for bookings
    const totalBookingPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const bookingStartIndex = (currentBookingPage - 1) * itemsPerPage;
    const paginatedBookings = filteredBookings.slice(bookingStartIndex, bookingStartIndex + itemsPerPage);

    // Pagination for cancel requests
    const totalCancelPages = Math.ceil(cancelRequestBookings.length / itemsPerPage);
    const cancelStartIndex = (currentCancelPage - 1) * itemsPerPage;
    const paginatedCancelRequests = cancelRequestBookings.slice(cancelStartIndex, cancelStartIndex + itemsPerPage);

    const totalEventPages = Math.ceil(eventBookings.length / itemsPerPage);
    const eventStartIndex = (currentEventPage - 1) * itemsPerPage;
    const paginatedEventBookings = eventBookings.slice(eventStartIndex, eventStartIndex + itemsPerPage);

    useEffect(() => {
        setCurrentBookingPage(1);
    }, [filterStatus, searchTerm]);

    useEffect(() => {
        if (totalBookingPages > 0 && currentBookingPage > totalBookingPages) {
            setCurrentBookingPage(totalBookingPages);
        }
    }, [currentBookingPage, totalBookingPages]);

    useEffect(() => {
        if (totalCancelPages > 0 && currentCancelPage > totalCancelPages) {
            setCurrentCancelPage(totalCancelPages);
        }
    }, [currentCancelPage, totalCancelPages]);

    useEffect(() => {
        if (totalEventPages > 0 && currentEventPage > totalEventPages) {
            setCurrentEventPage(totalEventPages);
        }
    }, [currentEventPage, totalEventPages]);

    const handleEventPageChange = (page) => {
        if (page >= 1 && page <= totalEventPages) {
            setCurrentEventPage(page);
        }
    };

    return (
        <div className={`admin-booking-page ${isLightMode ? 'admin-booking-page--light' : ''}`}>
            <div className="mobile-topbar">
                <Link to="/Dashboard">
                <h1 className="mobile-logo">
                    Messiah
                </h1>
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
                                  <li  className="active"><Link to="/Booking">Booking</Link></li>
                                  <li><Link to="/Guest">Guest / Feedback</Link></li>
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
                    <li className="active"><Link to="/Booking">Booking</Link></li>
                    <li><Link to="/Guest">Guest / Feedback</Link></li>
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

            <section className="guests-main">
                <div className="guests-main-content">

                    <div className="guests-topbar">
                        <h1>Booking Management</h1>
                    </div>
                    <div className="guests-stats-grid">
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Confirmed Bookings</p>
                            <p className="booking-stat-value">{confirmedCount}</p>
                        </div>
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Cancelled Requests</p>
                            <p className="booking-stat-value">{cancelledCount}</p>
                        </div>
                        <div className="booking-stat-card">
                            <p className="booking-stat-label">Total Cancelled</p>
                            <p className="booking-stat-value">{totalCancelledCount}</p>
                        </div>
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
                                        <button type="button" className={filterStatus === 'confirmed' ? 'active' : ''} onClick={() => handleFilterChange('confirmed')}>
                                            Confirmed   
                                        </button>
                                        <button type="button" className={filterStatus === 'complete' ? 'active' : ''} onClick={() => handleFilterChange('complete')}>
                                            Complete
                                        </button>
                                        <button type="button" className={filterStatus === 'pending' ? 'active' : ''} onClick={() => handleFilterChange('pending')}>
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
                        <div className="guests-table-wrapper">
                            <table className="guests-table">
                                <thead>
                                    <tr>
                                        <th>Guest</th>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Discount</th>
                                        <th>Total Price</th>
                                        <th>Status</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Loading bookings...
                                            </td>
                                        </tr>
                                    ) : filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No bookings found.
                                            </td>
                                        </tr>
                                    ) : paginatedBookings.map((booking) => {
                                        const status = (booking.res_status || 'pending').toLowerCase();
                                        return (
                                            <tr key={booking.id}>
                                                <td>{booking.first_name} {booking.last_name}</td>
                                                <td>{booking.room_number}</td>
                                                <td>{formatBookingDate(booking.check_in_date)}</td>
                                                <td>{formatBookingDate(booking.check_out_date)}</td>
                                                <td>{booking.discount !== undefined && booking.discount !== null ? `${booking.discount}%` : '0%'}</td>
                                                <td>₱{formatCurrency(booking.total_price)}</td>
                                                <td>
                                                    <span className={`status-${status}`}>
                                                        {booking.res_status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn guest btn-primary" onClick={() => handleView(booking)}>view</button>
                                                    <button className="btn guest btn-primary" onClick={() => handleConfirm(booking)}
                                                        disabled={['cancelled', 'complete'].includes(status)}>
                                                        {status === 'pending' ? 'Confirm' : 'Done'}
                                                    </button>
                                                    <button className="btn guest btn-danger" onClick={() => handleCancel(booking)}
                                                        disabled={['cancelled', 'complete'].includes(status)}>cancel</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {filteredBookings.length > 0 && (
                                    <div className="pagination-container">
                                        <button className="pagination-btn prev-btn" 
                                            onClick={() => handleBookingPageChange(currentBookingPage - 1)} disabled={currentBookingPage === 1} aria-label="Previous page">
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
                                                    <button key={pageNum}className={`pagination-number ${currentBookingPage === pageNum ? 'active' : ''}`} 
                                                        onClick={() => handleBookingPageChange(pageNum)}>
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
                    
                    <div className="event-bookings-section">
                        <h1>Events Bookings</h1>
                        <div className="event-bookings-table-wrapper">
                            <table className="event-bookings-table">
                                <thead>
                                    <tr>
                                        <th>Guest</th>
                                        <th>Number</th>
                                        <th>Check-Date</th>
                                        <th>Time</th>
                                        <th>Discount</th>
                                        <th>Total Price</th>
                                        <th>Status</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Loading bookings...
                                            </td>
                                        </tr>
                                    ) : eventBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No event bookings found.
                                            </td>
                                        </tr>
                                    ) : paginatedEventBookings.map((booking) => {
                                        const eventStatus = String(booking.status || 'pending').toLowerCase();
                                        const eventDate = booking.end_date && booking.end_date !== booking.start_date
                                            ? `${formatBookingDate(booking.start_date)} - ${formatBookingDate(booking.end_date)}`
                                            : formatBookingDate(booking.start_date);
                                        return (
                                        <tr key={booking.id}>
                                            <td>{booking.guest_name}</td>
                                            <td>{booking.guest_number ?? '-'}</td>
                                            <td>{eventDate || '-'}</td>
                                            <td>{booking.time_in || '-'} - {booking.time_out || '-'}</td>
                                            <td>{booking.discount !== undefined && booking.discount !== null ? `₱${formatCurrency(booking.discount)}` : 'N/A'}</td>
                                            <td>{booking.total_price !== undefined && booking.total_price !== null ? `₱${formatCurrency(booking.total_price)}` : 'N/A'}</td>
                                            <td><span className={`status-${eventStatus}`}>
                                                {booking.status || 'pending'}
                                            </span></td>
                                            <td className="actions-cell">
                                                <button className="btn guest btn-primary" onClick={() => handleEventView(booking)}>view</button>
                                                <button className="btn guest btn-primary" onClick={() => handleEventConfirm(booking)}
                                                        disabled={['cancelled', 'complete'].includes(eventStatus)}>
                                                        {eventStatus === 'pending' ? 'Confirm' : 'Done'}
                                                </button>
                                                <button className="btn guest btn-danger" onClick={() => handleEventCancel(booking)}
                                                    disabled={['cancelled', 'complete'].includes(eventStatus)}>cancel</button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {eventBookings.length > 0 && (
                                    <div className="pagination-container">
                                        <button className="pagination-btn prev-btn" 
                                            onClick={() => handleEventPageChange(currentEventPage - 1)} disabled={currentEventPage === 1} aria-label="Previous page">
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
                                                    <button key={pageNum} className={`pagination-number ${currentEventPage === pageNum ? 'active' : ''}`} 
                                                        onClick={() => handleEventPageChange(pageNum)}>
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

                    <div className="guests-table-container-cancel-request">
                        <h1>Recent Cancel Requests</h1>
                        <div className="guests-table-wrapper-cancel-request">
                            <table className="guests-table-cancel-request">
                                        <thead>
                                            <tr>
                                                <th>Guest</th>
                                                <th>Email</th>
                                                <th>Room</th>
                                                <th>Check-date</th>
                                                <th>Total Price</th>
                                                <th>Reason</th>
                                                <th className="actions-header">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                        Loading cancel requests...
                                                    </td>
                                                </tr>
                                            ) : cancelRequestBookings.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                        No cancel requests found.
                                                    </td>
                                                </tr>
                                            ) : paginatedCancelRequests.map((booking) => {
                                                const status = (booking.res_status || 'pending').toLowerCase();
                                                return (
                                                    <tr key={booking.id}>
                                                        <td>{booking.first_name} {booking.last_name}</td>
                                                        <td>{booking.email}</td>
                                                        <td>{booking.room_number}</td>
                                                        <td>{formatBookingDate(booking.check_in_date)}</td>
                                                        <td>₱{formatCurrency(booking.total_price)}</td>
                                                        <td>{booking.cancel_notes_request || 'No cancellation note provided.'}</td>
                                                        
                                                        <td className="actions-cell">
                                                            <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                                view
                                                            </button>
                                                            <button
                                                                className="btn guest btn-danger"
                                                                onClick={() => handleCancel(booking)}
                                                                disabled={['cancelled', 'complete'].includes(status)}
                                                            >
                                                                cancel
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                            </table>
                        </div>
                    </div>

                    {cancelRequestBookings.length > 0 && (
                                    <div className="pagination-container">
                                        <button className="pagination-btn prev-btn" onClick={() => handleCancelPageChange(currentCancelPage - 1)} 
                                        disabled={currentCancelPage === 1}aria-label="Previous page">
                                            &lt;
                                        </button>
                                        <div className="pagination-numbers">
                                            {Array.from({ length: Math.min(totalCancelPages, 5) }, (_, i) => {
                                                let pageNum;
                                                if (totalCancelPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentCancelPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentCancelPage >= totalCancelPages - 2) {
                                                    pageNum = totalCancelPages - 4 + i;
                                                } else {
                                                    pageNum = currentCancelPage - 2 + i;
                                                }
                                                return (
                                                    <button key={pageNum} className={`pagination-number ${currentCancelPage === pageNum ? 'active' : ''}`}
                                                        onClick={() => handleCancelPageChange(pageNum)}>
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button className="pagination-btn next-btn" 
                                            onClick={() => handleCancelPageChange(currentCancelPage + 1)} disabled={currentCancelPage === totalCancelPages} aria-label="Next page">
                                            &gt;
                                        </button>
                                    </div>
                                )}
                

                </div>
            </section>

            <ViewBookingModal 
                show={viewModal} 
                onClose={() => setViewModal(false)} 
                booking={selectedBooking} 
            />
            <ViewEventModal
                show={eventViewModal}
                onClose={() => setEventViewModal(false)}
                booking={selectedBooking}
            />
        </div>
    );
}

export default AdminBooking;