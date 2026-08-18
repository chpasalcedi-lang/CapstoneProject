import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from 'sweetalert2';
import emailjs from "@emailjs/browser";
import "../admincss/admin_boking.css";
import ViewBookingModal from "../Modals/view_booking_modal.jsx";

// EmailJS API key
emailjs.init("VuQPGuRo7jAh72RA6");

function AdminBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewModal, setViewModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentBookingPage, setCurrentBookingPage] = useState(1);
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
                const res = await apiClient.get('/get_reservations');
                setBookings(res.data);
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
                const templateParams = {
                    email: booking.email,
                    guest_name: `${booking.first_name} ${booking.last_name}`,
                    room_number: booking.room_number,
                    check_in_date: new Date(booking.check_in_date).toLocaleDateString(),
                    check_out_date: new Date(booking.check_out_date).toLocaleDateString(),
                    room_price: `₱${formatCurrency(booking.room_price)}`,
                    num_guests: booking.num_guests,
                };

                try {
                    await emailjs.send(
                        "service_9fw39gp",
                        "template_wba3f1m",
                        templateParams
                    );
                    Swal.fire({ icon: 'success', title: 'Confirmed', text: 'Reservation confirmed and email sent to guest.' });
                } catch (emailErr) {
                    console.error('Email send error:', emailErr);
                    Swal.fire({ icon: 'warning', title: 'Confirmed', text: 'Reservation confirmed but email failed to send.' });
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
        const bookingStatus = status;

        return (
            fullName.includes(search) ||
            roomNumber.includes(search) ||
            bookingStatus.includes(search)
        );
    });

    // Cancel requests list should show all bookings that submitted a cancel request
    // and should NOT be affected by the filter buttons or search box.
    const cancelRequestBookings = bookings.filter((booking) => {
        const note = String(booking.cancel_notes_request || '').trim();
        return note.length > 0;
    });

    // Pagination for bookings
    const totalBookingPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const bookingStartIndex = (currentBookingPage - 1) * itemsPerPage;
    const paginatedBookings = filteredBookings.slice(bookingStartIndex, bookingStartIndex + itemsPerPage);

    // Pagination for cancel requests
    const totalCancelPages = Math.ceil(cancelRequestBookings.length / itemsPerPage);
    const cancelStartIndex = (currentCancelPage - 1) * itemsPerPage;
    const paginatedCancelRequests = cancelRequestBookings.slice(cancelStartIndex, cancelStartIndex + itemsPerPage);

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

    return (
        <div>
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
                        {loading ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>Loading bookings...</p>
                        ) : filteredBookings.length === 0 ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>No bookings found.</p>
                        ) : (
                            <>
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
                                            {paginatedBookings.map((booking) => {
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
                                                            <button className="btn guest btn-primary" onClick={() => handleView(booking)}>
                                                                view
                                                            </button>
                                                            <button className="btn guest btn-primary"onClick={() => handleConfirm(booking)} 
                                                                disabled={['cancelled', 'complete'].includes(status)} >
                                                                {status === 'pending' ? 'Confirm' : 'Done'}
                                                            </button>
                                                            <button className="btn guest btn-danger"onClick={() => handleCancel(booking)}
                                                                 disabled={['cancelled', 'complete'].includes(status)} >
                                                                cancel
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                            </>
                        )}
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
                    <div className="guests-table-container-cancel-request">
                        <h1>Recent Cancel Requests</h1>
                        {loading ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>Loading cancel requests...</p>
                        ) : cancelRequestBookings.length === 0 ? (
                            <p style={{ padding: '20px', color: '#f0ede8' , textAlign: 'center' }}>No cancel requests found.</p>
                        ) : (
                            <>
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
                                            {paginatedCancelRequests.map((booking) => {
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
                            </>
                        )}
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
        </div>
    );
}

export default AdminBooking;