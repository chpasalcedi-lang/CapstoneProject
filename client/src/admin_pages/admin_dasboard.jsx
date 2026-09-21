import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from "sweetalert2";
import "../admincss/admin_dashboard.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';
import WalkinEventModal from '../Modals/walkin_event_modal';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboard() {
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('adminTheme') === 'light');
  const [stats, setStats] = useState({
    total_revenue: 0,
    todays_sales: 0,
    booking_sales: 0,
    todays_lost_sales: 0,
    todays_online_sales: 0,
    todays_walkin_sales: 0,
    todays_event_sales: 0,
    todays_guest_sales: 0,
    total_rooms: 0,
    todays_checkins: 0,
    pending_bookings: 0,
    total_guests: 0
  });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showWalkinEventModal, setShowWalkinEventModal] = useState(false);
  const [guestArrivals, setGuestArrivals] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
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
      const [guestRes, bookingRes, roomRes, eventRes] = await Promise.all([
        apiClient.get("/get_guest_arrivals"),
        apiClient.get("/get_reservations"),
        apiClient.get("/get_rooms"),
        apiClient.get("/get_event_bookings")
      ]);

      const guestData = guestRes.data || [];
      const bookingData = bookingRes.data || [];
      const roomData = roomRes.data || [];
      const eventData = eventRes.data || [];

      setGuestArrivals(guestData);
      setReservations(bookingData);
      setEventBookings(eventData);
      setRooms(roomData);

      const toLocalDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      const today = toLocalDate(new Date());

      const guestRevenue = guestData.reduce((sum, guest) => {
        return sum + Number(guest.total_price || 0);
      }, 0);

      const todaysSales = guestData.reduce((sum, guest) => {
        const guestDate = guest.created_at ? toLocalDate(guest.created_at) : null;

        if (guestDate === today) {
          return sum + Number(guest.total_price || 0);
        }

        return sum;
      }, 0);

      let bookingRevenue = 0;
      let todaysLostSales = 0;
      let todaysOnlineSales = 0;
      let todaysWalkinSales = 0;
      let eventRevenue = 0;
      let todaysEventSales = 0;

      bookingData.forEach((booking) => {
        const status = (booking.res_status || "").toLowerCase();
        const checkInDate = booking.check_in_date ? toLocalDate(booking.check_in_date) : null;
        const saleDate = booking.created_at ? toLocalDate(booking.created_at) : checkInDate;
        const bookingSource = String(booking.booking_source || 'online').toLowerCase();
        const hasCancelRequest = Object.prototype.hasOwnProperty.call(booking, 'cancel_notes_request')
          && String(booking.cancel_notes_request || '').trim() !== '';
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

          if (saleDate === today && bookingSource === 'online') {
            todaysOnlineSales += Number(booking.total_price || (Number(booking.room_price || 0) * nights));
          }

          if (saleDate === today && bookingSource === 'walkin') {
            todaysWalkinSales += Number(booking.total_price || (Number(booking.room_price || 0) * nights));
          }

          if (checkInDate === today && hasCancelRequest) {
            todaysLostSales += Number(booking.room_price || 0) * nights;
          }
        } else if (checkInDate === today && hasCancelRequest) {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          const nights = checkOut > checkIn
            ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
            : 1;

          todaysLostSales += Number(booking.room_price || 0) * nights;
        }
      });

      eventData.forEach((eventBooking) => {
        const status = String(eventBooking.status || '').toLowerCase();
        if (status !== 'confirmed' && status !== 'complete') return;
        const revenue = Number(eventBooking.total_price || 0);
        eventRevenue += Number.isNaN(revenue) ? 0 : revenue;
        const saleDate = eventBooking.created_at ? toLocalDate(eventBooking.created_at) : toLocalDate(eventBooking.start_date);
        if (saleDate === today) todaysEventSales += Number.isNaN(revenue) ? 0 : revenue;
      });

      const todaysCheckins = guestData.filter((guest) => {
        const checkinDate = guest.check_in_date ? toLocalDate(guest.check_in_date) : null;

        return checkinDate === today;
      }).length;

      const pendingBookings = bookingData.filter(
        (booking) => {
          const status = (booking.res_status || "").toLowerCase();
          return status === "pending";
        }
      ).length;

      const todaysGuestCount = guestData.reduce((sum, guest) => {
        const guestDate = guest.created_at ? toLocalDate(guest.created_at) : null;

        if (guestDate !== today) {
          return sum;
        }

        const guestCount = Number(guest.number_of_guests || guest.num_guests || 0);
        return sum + (Number.isNaN(guestCount) ? 0 : guestCount);
      }, 0);

      const todaysBookingGuests = bookingData.reduce((sum, booking) => {
        const status = (booking.res_status || "").toLowerCase();
        if (status !== "confirmed" && status !== "complete") {
          return sum;
        }

        const bookingDate = booking.check_in_date ? toLocalDate(booking.check_in_date) : null;

        if (bookingDate !== today) {
          return sum;
        }

        const bookingCount = Number(booking.num_guests || 0);
        return sum + (Number.isNaN(bookingCount) ? 0 : bookingCount);
      }, 0);

      setStats({
        total_revenue: guestRevenue + bookingRevenue + eventRevenue,
        todays_sales: todaysSales + todaysOnlineSales + todaysWalkinSales + todaysEventSales,
        booking_sales: bookingRevenue + eventRevenue,
        todays_lost_sales: todaysLostSales,
        todays_online_sales: todaysOnlineSales,
        todays_walkin_sales: todaysWalkinSales,
        todays_event_sales: todaysEventSales,
        todays_guest_sales: todaysSales,
        total_rooms: roomData.length,
        todays_checkins: todaysCheckins,
        pending_bookings: pendingBookings,
        total_guests: todaysGuestCount + todaysBookingGuests
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
    const handleDashboardRefresh = () => fetchStats();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('adminTheme') === 'light');
    };

    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const formatCurrency = (amount = 0) => {
    const value = Number(amount || 0);
    return `₱${value.toLocaleString()}`;
  };

  const parseDateValue = useCallback((value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, []);

  const revenueChartData = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyTotals = Array(monthLabels.length).fill(0);

    guestArrivals.forEach((guest) => {
      const date = parseDateValue(guest.created_at);
      if (!date || date.getFullYear() !== currentYear) return;
      monthlyTotals[date.getMonth()] += Number(guest.total_price || 0);
    });

    reservations.forEach((booking) => {
      const checkIn = parseDateValue(booking.check_in_date || booking.created_at);
      if (!checkIn || checkIn.getFullYear() !== currentYear) return;

      const status = String(booking.res_status || '').toLowerCase();
      if (!['confirmed', 'complete', 'occupied', 'pending'].includes(status)) return;

      const checkOut = parseDateValue(booking.check_out_date);
      const nights = checkIn && checkOut && checkOut > checkIn
        ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
        : 1;
      const roomPrice = Number(booking.room_price || 0);
      const revenue = Number(booking.total_price || roomPrice * nights || 0);
      monthlyTotals[checkIn.getMonth()] += revenue;
    });

    eventBookings.forEach((eventBooking) => {
      const status = String(eventBooking.status || '').toLowerCase();
      if (status !== 'confirmed') return;
      const eventDate = parseDateValue(eventBooking.created_at || eventBooking.start_date);
      if (!eventDate || eventDate.getFullYear() !== currentYear) return;
      monthlyTotals[eventDate.getMonth()] += Number(eventBooking.total_price || 0);
    });

    return {
      labels: monthLabels,
      datasets: [
        {
          label: 'Revenue',
          data: monthlyTotals,
          backgroundColor: 'rgba(41, 154, 211, 0.7)',
          borderColor: 'rgb(32, 148, 231)',
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 18,
        }
      ]
    };
  }, [guestArrivals, reservations, eventBookings, parseDateValue]);

  const revenueTrendPct = useMemo(() => {
    const values = revenueChartData.datasets[0].data;
    const currentMonth = values[values.length - 1] || 0;
    const previousMonth = values[values.length - 2] || 0;
    if (previousMonth === 0) return 0;
    return (((currentMonth - previousMonth) / previousMonth) * 100);
  }, [revenueChartData]);

  const roomStatus = useMemo(() => {
    const counts = { available: 0, occupied: 0, maintenance: 0, reserved: 0 };
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const occupiedRoomIds = new Set();
    const reservedRoomIds = new Set();

    reservations.forEach((booking) => {
      const roomId = Number(booking.room_id);
      if (!roomId) return;

      const status = String(booking.res_status || '').toLowerCase();
      const checkIn = parseDateValue(booking.check_in_date);
      const checkOut = parseDateValue(booking.check_out_date);

      if (!checkIn || !checkOut) return;

      const bookingStart = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
      const bookingEnd = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

      const overlapsToday = bookingStart <= endOfToday && bookingEnd >= startOfToday;

      if (!overlapsToday) return;

      if (['confirmed', 'complete', 'occupied'].includes(status)) {
        occupiedRoomIds.add(roomId);
      } else if (['pending'].includes(status)) {
        reservedRoomIds.add(roomId);
      }
    });

    rooms.forEach((room) => {
      const roomId = Number(room.id);
      const rawStatus = String(room.room_status || '').toLowerCase();

      if (rawStatus.includes('maintenance')) {
        counts.maintenance += 1;
      } else if (occupiedRoomIds.has(roomId) || rawStatus.includes('occupied')) {
        counts.occupied += 1;
      } else if (reservedRoomIds.has(roomId) || rawStatus.includes('reserved')) {
        counts.reserved += 1;
      } else {
        counts.available += 1;
      }
    });

    const total = rooms.length || 1;
    const entries = [
      { label: 'Occupied', value: counts.occupied, tone: 'green' },
      { label: 'Available', value: counts.available, tone: 'blue' },
      { label: 'Maintenance', value: counts.maintenance, tone: 'amber' },
      { label: 'Reserved', value: counts.reserved, tone: 'gold' },
    ];

    return entries.map((item) => ({
      ...item,
      count: item.value,
      value: total ? Math.max(0, Math.round((item.value / total) * 100)) : 0,
    }));
  }, [rooms, reservations, parseDateValue]);



  const revenueChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    layout: {
      padding: { top: 10, left: 4, right: 4, bottom: 0 }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isLightMode ? '#687477' : '#bdbdbd',
          font: { size: 10 },
          maxRotation: 0,
          minRotation: 0,
        },
        barThickness: 16,
        categoryPercentage: 0.7,
        barPercentage: 0.8,
      },
      y: {
        beginAtZero: false,
        grid: {
          color: isLightMode ? 'rgba(37,50,56,0.08)' : 'rgba(255,255,255,0.08)',
        },
        ticks: {
          color: isLightMode ? '#687477' : '#bdbdbd',
          callback: (value) => `₱${Number(value).toLocaleString()}`
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₱${Number(context.parsed.y).toLocaleString()}`
        }
      }
    }
  }), [isLightMode]);

  return (
    <div className={`wrap admin-dashboard-page ${isLightMode ? 'admin-dashboard-page--light' : ''}`}>
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
                  <button className="dashboard-topbar-btn1" onClick={() => setShowWalkinEventModal(true)}>Walk in event</button>
                  <Link className="dashboard-topbar-btn1" to="/AddGuest">Add Guest</Link>
              </div>
            </div>

            <p className="section-label">Revenue overview</p>
            <div className="dashboard-stats-grid dashboard-stats-grid--three">
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

              <div className="dashboard-stat-card soft-red">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-red">
                    <i className="fa-solid fa-calendar-xmark"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.todays_lost_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today lost sales</p>
                </div>
              </div>

            </div>
             <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card soft-gold">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-gold">
                    <i className="fa-solid fa-dollar-sign"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.todays_online_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today Online revenue</p>
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
                    {loading ? "..." : formatCurrency(stats.todays_walkin_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today Walk-in revenue</p>
                </div>
              </div>

              <div className="dashboard-stat-card soft-amber">
                <div className="dashboard-stat-icon-row">
                  <span className="dashboard-stat-icon soft-amber">
                    <i className="fa-solid fa-champagne-glasses"></i>
                  </span>
                </div>
                <div>
                  <h2 className="dashboard-stat-title">
                    {loading ? "..." : formatCurrency(stats.todays_event_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today event revenue</p>
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
                    {loading ? "..." : formatCurrency(stats.todays_guest_sales)}
                  </h2>
                  <p className="dashboard-stat-eyebrow">Today guests sales</p>
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
                  <p className="dashboard-stat-eyebrow">Today's Total Guests</p>
                </div>
              </div>
            </div>

            <div className="dashboard-panel-grid">
              <div className="dashboard-panel dashboard-panel-wide">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Overview</p>
                    <h2>Revenue trend</h2>
                  </div>
                  <span className="panel-badge success">
                    {revenueTrendPct >= 0 ? '+' : ''}{revenueTrendPct.toFixed(1)}% this month
                  </span>
                </div>

                <div className="revenue-chart" aria-label="Revenue chart">
                  <Bar data={revenueChartData} options={revenueChartOptions} />
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Capacity</p>
                    <h2>Room status</h2>
                  </div>
                </div>

                <div className="status-list">
                  {roomStatus.map((item) => (
                    <div className="status-item" key={item.label}>
                      <div className="status-topline">
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className="status-subline">
                        <span>{item.count} rooms</span>
                      </div>
                      <div className="progress-track">
                        <span className={`progress-fill ${item.tone}`} style={{ width: `${item.value}%` }} /> 
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </div>
        </section>
      <AdminWalkinModal show={showWalkinModal} onClose={() => setShowWalkinModal(false)} />
      <WalkinEventModal show={showWalkinEventModal} onClose={() => setShowWalkinEventModal(false)} />
    </div>
  );
}

export default AdminDashboard;