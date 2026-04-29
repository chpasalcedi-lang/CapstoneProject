import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_dashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_rooms: 0,
    todays_checkins: 0,
    pending_bookings: 0,
    total_guests: 0,
    total_profit: 0,
    todays_profit: 0,
    booking_profit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3000/get_dashboard_stats');
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString()}`;
  };

  return (
    <div className="wrap">
      <nav className="dashboard-navbar">
        <div className="dashboard-nav-content">
          <div className="dashboard-logo">
            <h1>Messiah</h1>
          </div>
          <ul className="dashboard-nav-links">
            <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
            <li><Link to="/Rooms">Rooms</Link></li>
            <li><Link to="/Booking">Booking</Link></li>
            <li><Link to="/Guest">Guest</Link></li>
            <li><span>Settings</span></li>
          </ul>
        </div>
      </nav>

      <section className="dashboard-main1">
        <div className="dashboard-main-content1">

          <div className="dashboard-topbar1">
            <h1>Dashboard</h1>
            <button className="dashboard-topbar-btn1">Add Guest</button>
          </div>

          {/* Revenue Overview */}
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
                  {loading ? "..." : formatCurrency(stats.total_profit)}
                </h2>
                <p className="dashboard-stat-eyebrow">Total profit</p>
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
                  {loading ? "..." : formatCurrency(stats.todays_profit)}
                </h2>
                <p className="dashboard-stat-eyebrow">Today's profit</p>
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
                  {loading ? "..." : formatCurrency(stats.booking_profit)}
                </h2>
                <p className="dashboard-stat-eyebrow">Booking profit</p>
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
    </div>
  );
}

export default AdminDashboard;