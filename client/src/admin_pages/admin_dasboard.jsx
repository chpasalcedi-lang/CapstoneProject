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
    total_revenue: 0,
    todays_sales: 0,
    booking_sales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/get_dashboard_stats');
        console.log("Fetched dashboard stats:", res.data);
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        alert("Failed to fetch dashboard statistics. Please check the server connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount = 0) => {
    const value = Number(amount || 0);
    return `₱${value.toLocaleString()}`;
  };

  return (
    <div className="wrap">
      <nav className="dashboard-navbar">
        <div className="dashboard-nav-content">
          <div className="dashboard-logo">
            <a href="/Dashboard"><h1>Messiah</h1></a>
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
            <div className="dashboard-topbar-btns">
                <Link className="dashboard-topbar-btn1" to="/Walkin">Walk in</Link>
                <Link className="dashboard-topbar-btn1" to="/AddGuest">Add Guest</Link>
            </div>
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
        
          
          <p className="section-label">Calendar</p>

          <div className="calendar-overview">
            <div className="calendar-side-info-container">
              <div className="calendar-side-header">
                <h3>Calendar</h3>
                <button className="calendar-button calendar-edit-button">Update</button>
              </div>
              
              <div className="calendar-legend-box">
                <div className="calendar-side-info">
                  <p><span className="calendar-legend confirmed"></span> Confirmed</p>
                  <p><span className="calendar-legend pending"></span> Pending</p>
                  <p><span className="calendar-legend maintenance"></span> Maintenance</p>
                  <p><span className="calendar-legend closed"></span> Closed</p>
                </div>
              </div>
              
              <div className="calendar-legend-box-bottom">
                <div className="calendar-side-title">
                  <h1>name: junard</h1>
                  <p>room: 101</p>
                </div>
                <div className="calendar-side-title">
                  <h1>name: junard</h1>
                  <p>room: 101</p>
                </div>
                <div className="calendar-side-title">
                  <h1>name: junard</h1>
                  <p>room: 101</p>
                </div>
                <div className="calendar-side-title">
                  <h1>name: junard</h1>
                  <p>room: 101</p>
                </div>
                <div className="calendar-side-title">
                  <h1>name: junard</h1>
                  <p>room: 101</p>
                </div>  
              </div>
            </div>
            <div className="calendar-box container">
              <div className="calendar-action">
                
                <p>june</p>
                <div className="calendar-action-btns">
                <button className="calendar-btn">Prev</button>
                <button className="calendar-btn">Today</button>
                <button className="calendar-btn">Next</button>
              
              </div>
              </div>
              
            <div className="calendar-container">
              <div className="sperate-calendar-table">
                <table>
                <thead>
                  <tr>
                    <th>Sun</th>  
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="calendar-day">1 
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">2
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">3
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">4
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">5
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">6
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">7
                      <p>ano</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="calendar-day">8
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">9
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">10
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">11
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">12
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">13
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">14
                      <p>ano</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="calendar-day">15
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">16
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">17
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">18
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">19
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">20
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">21
                      <p>ano</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="calendar-day">22
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">23
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">24
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">25
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">26
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">27
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">28
                      <p>ano</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="calendar-day">29
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">30
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">31
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">
                      <p>ano</p>
                    </td>
                    <td className="calendar-day">
                      <p>ano</p>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>
          </div>
          </div>
      </section>
    </div>
  );
}

export default AdminDashboard;