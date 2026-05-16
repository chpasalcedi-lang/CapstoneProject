import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../admincss/admin_dashboard.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_rooms: 0,
    todays_checkins: 0,
    pending_bookings: 0,
    total_guests: 0,
    total_revenue: 0,
    todays_sales: 0,
    booking_sales: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarWeeks, setCalendarWeeks] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/AdminLogin');
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/get_dashboard_stats');
        console.log("Fetched dashboard stats:", res.data);
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to fetch dashboard statistics. Please check the server connection.' });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 5000);

    const handleStorageChange = (e) => {
      if (e.key === 'dashboardRefreshTrigger') {
        fetchStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const formatCurrency = (amount = 0) => {
    const value = Number(amount || 0);
    return `₱${value.toLocaleString()}`;
  };

  

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const handleMonthChange = (e) => {
    const month = Number(e.target.value);
    setCurrentDate((prev) => new Date(prev.getFullYear(), month, 1));
  };

  const buildCalendarWeeks = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let day = 1;

    while (day <= daysInMonth) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        if (weeks.length === 0 && i < firstDayIndex) {
          week.push(null);
        } else if (day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day);
          day += 1;
        }
      }
      weeks.push(week);
    }

    return weeks;
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  useEffect(() => {
    setCalendarWeeks(buildCalendarWeeks(currentDate));
  }, [currentDate]);

  return (
    <div className="wrap">
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

      <section className="dashboard-main1">
        <div className="dashboard-main-content1">

          <div className="dashboard-topbar1">
            <h1>Dashboard</h1>
            <div className="dashboard-topbar-btns">
                <button className="dashboard-topbar-btn1" onClick={() => setShowWalkinModal(true)}>Walk in</button>
                <Link className="dashboard-topbar-btn1" to="/AddGuest">Add Guest</Link>
                <button className="dashboard-topbar-btn1" onClick={handleLogout}>Logout</button>
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


          {/* Property Overview */}
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
                <p className="dashboard-stat-eyebrow">Pending bookings</p>
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