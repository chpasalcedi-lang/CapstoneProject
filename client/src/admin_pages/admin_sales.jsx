import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from "sweetalert2";
import "../admincss/admin_sales.css";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function AdminSales() {
    const [guestSales, setGuestSales] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [bookingConfirmedSales, setBookingConfirmedSales] = useState(0);
    const [bookingCanceledLoss, setBookingCanceledLoss] = useState(0);
    const [guestArrivals, setGuestArrivals] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState('month');
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); 
    // Pie-specific chart controls (so pie updates independently)
    const [pieChartMode, setPieChartMode] = useState('month');
    const [pieSelectedYear, setPieSelectedYear] = useState(now.getFullYear());
    const [pieSelectedMonthIndex, setPieSelectedMonthIndex] = useState(now.getMonth());
    const [pieSelectedDay, setPieSelectedDay] = useState(now.getDate());
    // searchable year dropdown state (main chart)
    const [yearSearchQuery, setYearSearchQuery] = useState('');
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const yearContainerRef = useRef(null);
    // searchable year dropdown state (pie chart)
    const [pieYearSearchQuery, setPieYearSearchQuery] = useState('');
    const [showPieYearDropdown, setShowPieYearDropdown] = useState(false);
    const pieYearContainerRef = useRef(null);
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
        const fetchSales = async () => {
            try {
                const [guestRes, bookingRes] = await Promise.all([
                    apiClient.get("/get_guest_arrivals"),
                    apiClient.get("/get_reservations")
                ]);

                const guestData = guestRes.data || [];
                const bookingData = bookingRes.data || [];

                const guestTotal = guestData.reduce((sum, guest) => {
                    const value = Number(guest.total_price || 0);
                    return sum + (Number.isNaN(value) ? 0 : value);
                }, 0);

                let confirmedTotal = 0;
                let canceledTotal = 0;

                bookingData.forEach((booking) => {
                    const status = (booking.res_status || '').toLowerCase();
                    const checkIn = booking.check_in_date ? new Date(booking.check_in_date) : null;
                    const checkOut = booking.check_out_date ? new Date(booking.check_out_date) : null;
                    const nights = checkIn && checkOut && checkOut > checkIn
                        ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
                        : 1;
                    const roomPrice = Number(booking.room_price || 0);
                    const reservationRevenue = Number.isNaN(roomPrice) ? 0 : roomPrice * nights;

                    if (status === 'confirmed' || status === 'complete') {
                        confirmedTotal += reservationRevenue;
                    }

                    // Count a reservation as a cancellation loss only when a cancellation request/note exists
                    const hasCancelRequest = Object.prototype.hasOwnProperty.call(booking, 'cancel_notes_request') && String(booking.cancel_notes_request || '').trim() !== '';
                    if (hasCancelRequest) {
                        canceledTotal += reservationRevenue;
                    }
                });

                setGuestArrivals(guestData);
                setBookings(bookingData);
                setGuestSales(guestTotal);
                setBookingConfirmedSales(confirmedTotal);
                setBookingCanceledLoss(canceledTotal);
            } catch (err) {
                console.error("Error fetching sales stats:", err);
                Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to fetch sales statistics.' });
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

    const totalRevenue = guestSales + bookingConfirmedSales;


    const yearLabels = useMemo(() => {
        return Array.from({ length: 5 }, (_, idx) => String(selectedYear - 2 + idx));
    }, [selectedYear]);

    const parseDate = useCallback((value) => {
        if (value === undefined || value === null || value === '') return null;
        // If it's already a Date
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        // If it's a numeric timestamp or numeric string
        const asNumber = Number(value);
        if (!Number.isNaN(asNumber) && String(value).trim() !== '') {
            const ndate = new Date(asNumber);
            if (!Number.isNaN(ndate.getTime())) return ndate;
        }

        // Fallback: try parsing as ISO/string date
        const date = new Date(String(value).trim());
        return Number.isNaN(date.getTime()) ? null : date;
    }, []);

    // close dropdowns when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (yearContainerRef.current && !yearContainerRef.current.contains(e.target)) {
                setShowYearDropdown(false);
            }
            if (pieYearContainerRef.current && !pieYearContainerRef.current.contains(e.target)) {
                setShowPieYearDropdown(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    

    const barChartData = useMemo(() => {
        const labels = chartMode === 'year'
            ? yearLabels
            : chartMode === 'day'
                ? Array.from({ length: new Date(selectedYear, selectedMonthIndex + 1, 0).getDate() }, (_, idx) => String(idx + 1))
                : MONTH_LABELS;

        const stats = labels.map(() => ({ guest: 0, confirmed: 0, canceled: 0 }));

        const addGuestRevenue = (date, value) => {
            if (!date || Number.isNaN(value)) return;
            if (chartMode === 'year') {
                const idx = yearLabels.indexOf(String(date.getFullYear()));
                if (idx !== -1) stats[idx].guest += value;
            } else if (chartMode === 'month') {
                if (date.getFullYear() === selectedYear) {
                    const index = date.getMonth();
                    if (stats[index]) {
                        stats[index].guest += value;
                    }
                }
            } else {
                if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIndex) {
                    const index = date.getDate() - 1;
                    if (stats[index]) {
                        stats[index].guest += value;
                    }
                }
            }
        };

        const addBookingRevenue = (date, status, value, hasCancelRequest) => {
            if (!date || Number.isNaN(value)) return;
            let idx = -1;
            if (chartMode === 'year') {
                idx = yearLabels.indexOf(String(date.getFullYear()));
            } else if (chartMode === 'month') {
                idx = date.getFullYear() === selectedYear ? date.getMonth() : -1;
            } else {
                idx = date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIndex ? date.getDate() - 1 : -1;
            }
            if (idx < 0 || idx >= stats.length) return;
            if (status === 'confirmed' || status === 'complete') {
                stats[idx].confirmed += value;
            }
            // Only count cancellation loss when there is an actual cancel request
            else if (hasCancelRequest) {
                stats[idx].canceled += value;
            }
        };

        guestArrivals.forEach((guest) => {
            const date = parseDate(guest.created_at);
            addGuestRevenue(date, Number(guest.total_price || 0));
        });

        bookings.forEach((booking) => {
            const date = parseDate(booking.check_in_date);
            const roomPrice = Number(booking.room_price || 0);
            const checkIn = parseDate(booking.check_in_date);
            const checkOut = parseDate(booking.check_out_date);
            const nights = checkIn && checkOut && checkOut > checkIn
                ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
                : 1;
            const revenue = Number.isNaN(roomPrice) ? 0 : roomPrice * nights;
            const hasCancelRequest = Object.prototype.hasOwnProperty.call(booking, 'cancel_notes_request') && String(booking.cancel_notes_request || '').trim() !== '';
            addBookingRevenue(date, (booking.res_status || '').toLowerCase(), revenue, hasCancelRequest);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Total revenue',
                    data: stats.map((item) => Math.round(item.guest + item.confirmed)),
                    backgroundColor: 'rgba(11, 178, 50, 0.6)',
                    borderColor: 'rgb(11, 178, 50)',
                    borderWidth: 1
                },
                {
                    label: 'Confirmed/Completed Reservations',
                    data: stats.map((item) => Math.round(item.confirmed)),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: 'Guest Arrivals',
                    data: stats.map((item) => Math.round(item.guest)),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                },
                {
                    label: 'Canceled Reservation Loss',
                    data: stats.map((item) => Math.round(item.canceled)),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        };
    }, [chartMode, selectedYear, selectedMonthIndex, guestArrivals, bookings, parseDate, yearLabels]);

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#f0ede8'
                }
            }
        }
    };

    // Dedicated metrics and pie data for the "Revenue Sales Metrics" section
    const salesMetrics = useMemo(() => {
        const guestTotal = (guestArrivals || []).reduce((sum, g) => {
            const date = parseDate(g.created_at);
            let include = true;
            if (pieChartMode === 'year') {
                include = date && date.getFullYear() === pieSelectedYear;
            } else if (pieChartMode === 'month') {
                include = date && date.getFullYear() === pieSelectedYear && date.getMonth() === pieSelectedMonthIndex;
            } else {
                include = date && date.getFullYear() === pieSelectedYear && date.getMonth() === pieSelectedMonthIndex && date.getDate() === pieSelectedDay;
            }
            if (!include) return sum;
            const v = Number(g.total_price || 0);
            return sum + (Number.isNaN(v) ? 0 : v);
        }, 0);

        let confirmedTotal = 0;
        let canceledTotal = 0;

        // Filter by pie mode selection so the pie updates independently
        (bookings || []).forEach((booking) => {
            const checkIn = parseDate(booking.check_in_date);
            const checkOut = parseDate(booking.check_out_date);
            const nights = checkIn && checkOut && checkOut > checkIn
                ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
                : 1;
            const roomPrice = Number(booking.room_price || 0);
            const revenue = Number.isNaN(roomPrice) ? 0 : roomPrice * nights;

            const status = (booking.res_status || '').toLowerCase();
            const hasCancelRequest = Object.prototype.hasOwnProperty.call(booking, 'cancel_notes_request') && String(booking.cancel_notes_request || '').trim() !== '';

            // determine whether this booking should be included based on pie selection
            let include = true;
            if (pieChartMode === 'year') {
                include = checkIn && checkIn.getFullYear() === pieSelectedYear;
            } else if (pieChartMode === 'month') {
                include = checkIn && checkIn.getFullYear() === pieSelectedYear && checkIn.getMonth() === pieSelectedMonthIndex;
            } else {
                include = checkIn && checkIn.getFullYear() === pieSelectedYear && checkIn.getMonth() === pieSelectedMonthIndex && checkIn.getDate() === pieSelectedDay;
            }

            if (!include) return;

            if (status === 'confirmed' || status === 'complete') {
                confirmedTotal += revenue;
            }

            if (hasCancelRequest) {
                canceledTotal += revenue;
            }
        });

        const totalRevenue = guestTotal + confirmedTotal;

        const metricsPieData = {
            labels: ['Guest Arrivals', 'Confirmed Reservations', 'Cancellation Loss'],
            datasets: [
                {
                    label: 'Metrics',
                    data: [guestTotal, confirmedTotal, canceledTotal],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)'
                    ],
                    borderWidth: 1
                }
            ]
        };

        return {
            totalRevenue,
            guestTotal,
            confirmedTotal,
            canceledTotal,
            pieData: metricsPieData
        };
    }, [pieChartMode, pieSelectedYear, pieSelectedMonthIndex, pieSelectedDay, guestArrivals, bookings, parseDate]);

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#aaa' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.08)' },
                ticks: { color: '#aaa' }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#f0ede8'
                }
            }
        }
    };

    const formatCurrency = (amount = 0) => {
        const value = Number(amount || 0);
        return `₱${value.toLocaleString()}`;
    };

    const handlePrev = () => {
        if (chartMode === 'year' || chartMode === 'month') {
            setSelectedYear((prev) => prev - 1);
            return;
        }
        if (chartMode === 'day') {
            if (selectedMonthIndex === 0) {
                setSelectedMonthIndex(11);
                setSelectedYear((prev) => prev - 1);
            } else {
                setSelectedMonthIndex((prev) => prev - 1);
            }
        }
    };

    const handleNext = () => {
        if (chartMode === 'year' || chartMode === 'month') {
            setSelectedYear((prev) => prev + 1);
            return;
        }
        if (chartMode === 'day') {
            if (selectedMonthIndex === 11) {
                setSelectedMonthIndex(0);
                setSelectedYear((prev) => prev + 1);
            } else {
                setSelectedMonthIndex((prev) => prev + 1);
            }
        }
    };

    // Pie-specific navigation and mode setter
    const handlePrevPie = () => {
        if (pieChartMode === 'year' || pieChartMode === 'month') {
            setPieSelectedYear((prev) => prev - 1);
            return;
        }
        if (pieChartMode === 'day') {
            // move selected pie date one day back
            const cur = new Date(pieSelectedYear, pieSelectedMonthIndex, pieSelectedDay || 1);
            cur.setDate(cur.getDate() - 1);
            setPieSelectedYear(cur.getFullYear());
            setPieSelectedMonthIndex(cur.getMonth());
            setPieSelectedDay(cur.getDate());
        }
    };

    const handleNextPie = () => {
        if (pieChartMode === 'year' || pieChartMode === 'month') {
            setPieSelectedYear((prev) => prev + 1);
            return;
        }
        if (pieChartMode === 'day') {
            // move selected pie date one day forward
            const cur = new Date(pieSelectedYear, pieSelectedMonthIndex, pieSelectedDay || 1);
            cur.setDate(cur.getDate() + 1);
            setPieSelectedYear(cur.getFullYear());
            setPieSelectedMonthIndex(cur.getMonth());
            setPieSelectedDay(cur.getDate());
        }
    };

    const handleSetChartModePie = (mode) => {
        setPieChartMode(mode);
        if (mode === 'day') {
            const today = new Date();
            setPieSelectedYear(today.getFullYear());
            setPieSelectedMonthIndex(today.getMonth());
            setPieSelectedDay(today.getDate());
        }
    };

    const handleSetChartMode = (mode) => {
        setChartMode(mode);
        if (mode === 'day') {
            const today = new Date();
            if (today.getFullYear() === selectedYear) {
                setSelectedMonthIndex(today.getMonth());
            }
        }
    };
    


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

            <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}/>
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                    <ul className="dashboard-nav-links">
                        <p>dashboard</p>
                        <li><Link to="/Dashboard">Dashboard</Link></li>
                        <li><Link to="/Users">User</Link></li>
                        <li className="active"><Link to="/Sales">Sales</Link></li>
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
                    <li className="active"><Link to="/Sales">Sales</Link></li>
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


            <section className="admin-sales-main">
                <div className="admin-sales-main-content">

                    <div className="admin-sales-topbar">
                        <h1>Sales</h1>
                    </div>

                    <p className="section-label">Revenue overview</p>
                    <div className="sales-stats-grid">

                        <div className="sales-stat-card soft-gold">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-gold">
                            <i className="fa-solid fa-dollar-sign"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(totalRevenue)}
                            </h2>
                            <p className="sales-stat-eyebrow">Total revenue</p>
                        </div>
                        </div>

                        <div className="sales-stat-card soft-green">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-green">
                            <i className="fa-solid fa-calendar-check"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(guestSales)}
                            </h2>
                            <p className="sales-stat-eyebrow">Guests sales</p>
                        </div>
                        </div>

                            <div className="sales-stat-card soft-amber">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-amber">
                            <i className="fa-solid fa-clock"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(bookingConfirmedSales)}
                            </h2>
                            <p className="sales-stat-eyebrow">Confirmed reservations</p>
                        </div>
                        </div>

                        <div className="sales-stat-card soft-red">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-red">
                            <i className="fa-solid fa-ban"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(bookingCanceledLoss)}
                            </h2>
                            <p className="sales-stat-eyebrow">Canceled reservation loss</p>
                        </div>
                        </div>

                    </div>  

                    


                    <p className="section-label">Revenue stats</p>
                    
                    <div className="admin-sales-table-container">
                        <div className="admin-sales-chart-grid">
                            <div className="admin-sales-chart-card-container">
                                

                                <div className="admin-sales-chart-card-header-stats-btn">
                                    <div>
                                        <button className={chartMode === 'month' ? 'active' : ''} onClick={() => handleSetChartMode('month')}>
                                            Month
                                        </button>
                                        <button className={chartMode === 'year' ? 'active' : ''} onClick={() => handleSetChartMode('year')}>
                                            Year
                                        </button>
                                        <button className={chartMode === 'day' ? 'active' : ''} onClick={() => handleSetChartMode('day')}>
                                            Day
                                        </button>
                                    </div>
                                    <div className="admin-sales-chart-card-header-stats-btn-nav">
                                        {/* Month: show month + year dropdowns */}
                                        {chartMode === 'month' && (
                                            <div className="admin-sales-chart-selects">
                                                <select
                                                    aria-label="Select month"
                                                    value={selectedMonthIndex}
                                                    onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                                                >
                                                    {MONTH_LABELS.map((m, idx) => (
                                                        <option key={m} value={idx}>{m}</option>
                                                    ))}
                                                </select>
                                                        <div ref={yearContainerRef} className="year-search-dropdown">
                                                            <input
                                                                aria-label="Search year"
                                                                className="year-search-input"
                                                                value={yearSearchQuery || String(selectedYear)}
                                                                onChange={(e) => { setYearSearchQuery(e.target.value); setShowYearDropdown(true); }}
                                                                onFocus={() => { setShowYearDropdown(true); setYearSearchQuery(''); }}
                                                            />
                                                            {showYearDropdown && (
                                                                <ul className="year-dropdown-list">
                                                                    {yearLabels
                                                                        .filter((y) => y.includes(yearSearchQuery))
                                                                        .map((y) => (
                                                                            <li key={y} onClick={() => { setSelectedYear(Number(y)); setShowYearDropdown(false); setYearSearchQuery(''); }}>
                                                                                {y}
                                                                            </li>
                                                                        ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                            </div>
                                        )}

                                        {/* Year: show year dropdown */}
                                        {chartMode === 'year' && (
                                            <div className="admin-sales-chart-selects">
                                                        <div ref={yearContainerRef} className="year-search-dropdown">
                                                            <input
                                                                aria-label="Search year"
                                                                className="year-search-input"
                                                                value={yearSearchQuery || String(selectedYear)}
                                                                onChange={(e) => { setYearSearchQuery(e.target.value); setShowYearDropdown(true); }}
                                                                onFocus={() => { setShowYearDropdown(true); setYearSearchQuery(''); }}
                                                            />
                                                            {showYearDropdown && (
                                                                <ul className="year-dropdown-list">
                                                                    {yearLabels
                                                                        .filter((y) => y.includes(yearSearchQuery))
                                                                        .map((y) => (
                                                                            <li key={y} onClick={() => { setSelectedYear(Number(y)); setShowYearDropdown(false); setYearSearchQuery(''); }}>
                                                                                {y}
                                                                            </li>
                                                                        ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                            </div>
                                        )}

                                        {/* Day: show a date input (calendar) */}
                                        {chartMode === 'day' && (
                                            <div className="admin-sales-chart-selects">
                                                <select
                                                    aria-label="Select month"
                                                    value={selectedMonthIndex}
                                                    onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                                                >
                                                    {MONTH_LABELS.map((m, idx) => (
                                                        <option key={m} value={idx}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="admin-sales-chart-card-header-stats-btn-nav-btns">
                                            <button onClick={handlePrev} aria-label="Previous period">
                                                <i className="fa-solid fa-arrow-left-long"></i>
                                            </button>
                                            <button onClick={handleNext} aria-label="Next period">
                                                <i className="fa-solid fa-arrow-right-long"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className="admin-sales-chart-card-header">
                                    <h2>{chartMode === 'month' ? 'Monthly' : chartMode === 'year' ? 'Yearly' : 'Daily'} Revenue</h2>
                                </div>
                                <div className="admin-sales-chart-card">
                                    <Bar data={barChartData} options={barChartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="section-label">Revenue Sales Metrics</p>
                    
                    <div className="admin-sales-table-container">
                        <div className="admin-sales-chart-grid">
                            <div className="admin-sales-chart-card-container">
                                

                                        <div className="admin-sales-chart-card-header-stats-btn">
                                    <div>
                                        <button className={pieChartMode === 'month' ? 'active' : ''} onClick={() => handleSetChartModePie('month')}>
                                            Month
                                        </button>
                                        <button className={pieChartMode === 'year' ? 'active' : ''} onClick={() => handleSetChartModePie('year')}>
                                            Year
                                        </button>
                                        <button className={pieChartMode === 'day' ? 'active' : ''} onClick={() => handleSetChartModePie('day')}>
                                            Day
                                        </button>
                                    </div>
                                    <div className="admin-sales-chart-card-header-stats-btn-nav">
                                        {/* Pie: Month -> month+year selects, Year -> year select, Day -> date picker */}
                                        {pieChartMode === 'month' && (
                                            <div className="admin-sales-chart-selects">
                                                <select
                                                    aria-label="Select pie month"
                                                    value={pieSelectedMonthIndex}
                                                    onChange={(e) => setPieSelectedMonthIndex(Number(e.target.value))}
                                                >
                                                    {MONTH_LABELS.map((m, idx) => (
                                                        <option key={m} value={idx}>{m}</option>
                                                    ))}
                                                </select>
                                                <div ref={pieYearContainerRef} className="year-search-dropdown">
                                                    <input
                                                        aria-label="Search pie year"
                                                        className="year-search-input"
                                                        value={pieYearSearchQuery || String(pieSelectedYear)}
                                                        onChange={(e) => { setPieYearSearchQuery(e.target.value); setShowPieYearDropdown(true); }}
                                                        onFocus={() => { setShowPieYearDropdown(true); setPieYearSearchQuery(''); }}
                                                    />
                                                    {showPieYearDropdown && (
                                                        <ul className="year-dropdown-list">
                                                            {yearLabels
                                                                .filter((y) => y.includes(pieYearSearchQuery))
                                                                .map((y) => (
                                                                    <li key={y} onClick={() => { setPieSelectedYear(Number(y)); setShowPieYearDropdown(false); setPieYearSearchQuery(''); }}>
                                                                        {y}
                                                                    </li>
                                                                ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {pieChartMode === 'year' && (
                                            <div className="admin-sales-chart-selects">
                                                <select
                                                    aria-label="Select pie year"
                                                    value={pieSelectedYear}
                                                    onChange={(e) => setPieSelectedYear(Number(e.target.value))}
                                                >
                                                    {yearLabels.map((y) => (
                                                        <option key={y} value={Number(y)}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {pieChartMode === 'day' && (
                                            <div className="admin-sales-chart-selects">
                                                <input
                                                    type="date"
                                                    aria-label="Pick a pie day"
                                                    value={`${pieSelectedYear.toString().padStart(4,'0')}-${String(pieSelectedMonthIndex+1).padStart(2,'0')}-${String(pieSelectedDay).padStart(2,'0')}`}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (!v) return;
                                                        const d = new Date(v);
                                                        if (!Number.isNaN(d.getTime())) {
                                                            setPieSelectedYear(d.getFullYear());
                                                            setPieSelectedMonthIndex(d.getMonth());
                                                            setPieSelectedDay(d.getDate());
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="admin-sales-chart-card-header-stats-btn-nav-btns">
                                            <button onClick={handlePrevPie} aria-label="Previous pie period">
                                                <i className="fa-solid fa-arrow-left-long"></i>
                                            </button>
                                            <button onClick={handleNextPie} aria-label="Next pie period">
                                                <i className="fa-solid fa-arrow-right-long"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className="admin-sales-chart-card-header">
                                    <h2>{chartMode === 'month' ? 'Monthly' : chartMode === 'year' ? 'Yearly' : 'Daily'} Revenue</h2>
                                </div>
                                <div className="admin-sales-chart-card-box">
                                    <div className="admin-sales-chart-card-stats">
                                        <div className="admin-sales-chart-card-labels">
                                            <label>Total Revenue</label>
                                            <h1>{loading ? "..." : formatCurrency(salesMetrics.totalRevenue)}</h1>
                                        </div>
                                        <div className="admin-sales-chart-card-labels">
                                            <label>Guest Sales</label>
                                            <h1>{loading ? "..." : formatCurrency(salesMetrics.guestTotal)}</h1>
                                        </div>
                                        <div className="admin-sales-chart-card-labels">
                                            <label>Booking Sales</label>
                                            <h1>{loading ? "..." : formatCurrency(salesMetrics.confirmedTotal)}</h1>
                                        </div>
                                        <div className="admin-sales-chart-card-labels">
                                            <label>Sales loss</label>
                                            <h1>{loading ? "..." : formatCurrency(salesMetrics.canceledTotal)}</h1>
                                        </div>
                                    </div>
                                    <div className="admin-sales-chart-card admin-sales-pie">
                                        <Pie data={salesMetrics.pieData} options={pieChartOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminSales;
