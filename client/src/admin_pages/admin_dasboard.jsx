import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../admincss/admin_dashboard.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_revenue: 0,
    todays_sales: 0,
    booking_sales: 0,
    total_rooms: 0,
    todays_checkins: 0,
    pending_bookings: 0,
    total_guests: 0
  });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
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

  const fetchStats = async () => {
    setLoading(true);

    try {
      const [guestRes, bookingRes, roomRes] = await Promise.all([
        axios.get("http://localhost:3001/get_guest_arrivals"),
        axios.get("http://localhost:3001/get_reservations"),
        axios.get("http://localhost:3001/get_rooms")
      ]);

      const guestData = guestRes.data || [];
      const bookingData = bookingRes.data || [];
      const roomData = roomRes.data || [];

      const today = new Date().toISOString().split("T")[0];

      const guestRevenue = guestData.reduce((sum, guest) => {
        return sum + Number(guest.total_price || 0);
      }, 0);

      const todaysSales = guestData.reduce((sum, guest) => {
        const guestDate = guest.created_at
          ? new Date(guest.created_at).toISOString().split("T")[0]
          : null;

        if (guestDate === today) {
          return sum + Number(guest.total_price || 0);
        }

        return sum;
      }, 0);

      let bookingRevenue = 0;

      bookingData.forEach((booking) => {
        const status = (booking.res_status || "").toLowerCase();
        if (status === "confirmed" || status === "complete") {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);

          const nights =
            checkOut > checkIn
              ? Math.max(
                  1,
                  Math.ceil((checkOut - checkIn) / 86400000)
                )
              : 1;

          bookingRevenue += Number(booking.room_price || 0) * nights;
        }
      });

      const todaysCheckins = guestData.filter((guest) => {
        const checkinDate = guest.check_in_date
          ? new Date(guest.check_in_date).toISOString().split("T")[0]
          : null;

        return checkinDate === today;
      }).length;

      const confirmedBookings = bookingData.filter(
        (booking) => {
          const status = (booking.res_status || "").toLowerCase();
          return status === "confirmed" || status === "complete";
        }
      ).length;

      const totalGuestArrivals = guestData.reduce((sum, guest) => {
        const guestCount = Number(guest.number_of_guests || guest.num_guests || 0);
        return sum + (Number.isNaN(guestCount) ? 0 : guestCount);
      }, 0);

      const totalBookingGuests = bookingData.reduce((sum, booking) => {
        const status = (booking.res_status || "").toLowerCase();
        if (status !== "confirmed" && status !== "complete") {
          return sum;
        }
        const bookingCount = Number(booking.num_guests || 0);
        return sum + (Number.isNaN(bookingCount) ? 0 : bookingCount);
      }, 0);

      setStats({
        total_revenue: guestRevenue + bookingRevenue,
        todays_sales: todaysSales,
        booking_sales: bookingRevenue,
        total_rooms: roomData.length,
        todays_checkins: todaysCheckins,
        pending_bookings: confirmedBookings,
        total_guests: totalGuestArrivals + totalBookingGuests
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to fetch dashboard statistics."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleStorageChange = (e) => {
      if (e.key === 'dashboardRefreshTrigger') {
        fetchStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatCurrency = (amount = 0) => {
    const value = Number(amount || 0);
    return `₱${value.toLocaleString()}`;
  };

  return (
    <div className="wrap">
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
                      <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
                      <li><Link to="/Users">User</Link></li>
                      <li><Link to="/Sales">Sales</Link></li>
                      <p>management</p>
                      <li><Link to="/Rooms">Rooms</Link></li>
                      <li><Link to="/Booking">Booking</Link></li>
                      <li><Link to="/Guest">Guest / Feedback</Link></li>
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
            <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
            <li><Link to="/Users">User</Link></li>
            <li><Link to="/Sales">Sales</Link></li>
            <p>management</p>
            <li><Link to="/Rooms">Rooms</Link></li>
            <li><Link to="/Booking">Booking</Link></li>
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

        <section className="dashboard-main-section">
          <div className="dashboard-main-content-section">
            <div className="dashboard-topbar-section">
              <h1>Dashboard</h1>
              <div className="dashboard-topbar-btns">
                  <button className="dashboard-topbar-btn1" onClick={() => setShowWalkinModal(true)}>Walk in</button>
                  <Link className="dashboard-topbar-btn1" to="/AddGuest">Add Guest</Link>
              </div>
            </div>

            <p className="section-label">Revenue overview</p>
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card soft-gold">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-gold">
                    <i className="fa-solid fa-dollar-sign"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.total_revenue)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Total revenue</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-green">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-green">
                    <i className="fa-solid fa-calendar-check"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.todays_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today's sales</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-amber">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-amber">
                    <i className="fa-solid fa-clock"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.booking_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Booking sales</p>
                </div>
              </div>

            </div>

            <p className="section-label">Property overview</p>
            <div className="dashboard-stats-grid-4">

              <div className="dashboard-stat-card soft-gold">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-gold">
                    <i className="fa-solid fa-bed"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : stats.total_rooms}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Total rooms</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-green">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-green">
                    <i className="fa-solid fa-calendar-check"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : stats.todays_checkins}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today's check-ins</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-amber">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-amber">
                    <i className="fa-solid fa-clock"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : stats.pending_bookings}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Confirmed / Completed bookings</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-blue">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-blue">
                    <i className="fa-solid fa-users"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : stats.total_guests}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Total guests</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      <AdminWalkinModal show={showWalkinModal} onClose={() => setShowWalkinModal(false)} />
    </div>
  );
}

export default AdminDashboard;