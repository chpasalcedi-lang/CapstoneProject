import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_dashboard.css";
import UpdateCalendarModal from '../Modals/update_calendar_modals';

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
  const [selectedCalendarEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarWeeks, setCalendarWeeks] = useState([]);


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
            <li><Link to="">User</Link></li>
            <li><Link to="">Sales</Link></li>
            <p>management</p>
            <li><Link to="/Rooms">Rooms</Link></li>
            <li><Link to="/Booking">Booking</Link></li>
            <li><Link to="/Guest">Guest</Link></li>
            <p>reports</p>
            <li><Link to="">Active logs</Link></li>

            <div className="dasboard-admin-status">
              <div className="dasboard-admin-status-content">
                <h1>System addmin</h1>
                <p className="admin-status ">admiin</p>
              </div>
                <div className="dasboard-admin-profile">
                  Ap
                </div>
            </div>
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
                <button className="calendar-button calendar-edit-button" onClick={() => setShowUpdateModal(true)}>Update</button>
              </div>
              
              <div className="calendar-legend-box">
                <div className="calendar-side-info">
                  <p><span className="calendar-legend confirmed"></span> Confirmed</p>
                  <p><span className="calendar-legend pending"></span> Pending</p>
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
                <select className="calendar-select" name="calendarmonth" id="calendar" value={currentDate.getMonth()} onChange={handleMonthChange}>
                  {monthNames.map((monthName, index) => (
                    <option key={monthName} value={index}>{monthName}</option>
                  ))}
                </select>

                <div className="calendar-action-btns">
                  <button className="calendar-btn" onClick={handlePrevMonth}>Prev</button>
                  <button className="calendar-btn" onClick={handleToday}>Today</button>
                  <button className="calendar-btn" onClick={handleNextMonth}>Next</button>
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
                    <tbody className="calendar-body">
                      {calendarWeeks.map((week, weekIndex) => (
                        <tr key={weekIndex}>
                          {week.map((day, dayIndex) => {
                            return (
                              <td key={dayIndex} className={`calendar-day ${day ? 'active' : 'empty'} ${isToday(day) ? 'today' : ''}`}>
                                {day ? (
                                  <div className="calendar-day-content">
                                    <div className="calendar-day-number">{day}</div>
                                    <div className="calendar-day-bookings">
                                      <div className="calendar-booking confirmed"></div>
                                      <div className="calendar-booking pending"></div>
                                      <div className="calendar-booking closed"></div>
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          </div>
      </section>
      <UpdateCalendarModal 
        showModal={showUpdateModal} 
        setShowModal={setShowUpdateModal} 
        refreshData={() => {}} 
        calendarData={selectedCalendarEvent} 
      />
    </div>
  );
}

export default AdminDashboard;