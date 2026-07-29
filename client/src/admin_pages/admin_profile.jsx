import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_profile.css";

function AdminProfile() {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return {
                name: parsed.name || parsed.username || parsed.email,
                email: parsed.email,
                role: parsed.role,
            };
        }
        return { name: "?", email: "?", role: "?" };
    });
    const [editMode, setEditMode] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    // live sales totals
    const [guestSales, setGuestSales] = useState(0);
    const [bookingConfirmedSales, setBookingConfirmedSales] = useState(0);
    const [salesLoading, setSalesLoading] = useState(true);
    // monthly (this month) sales totals
    const [monthlyGuestSales, setMonthlyGuestSales] = useState(0);
    const [monthlyBookingConfirmedSales, setMonthlyBookingConfirmedSales] = useState(0);

    useEffect(() => {
        const parseDateValue = (value) => {
            if (!value) return null;
            const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
            const date = new Date(normalized);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const fetchSales = async () => {
            try {
                const [guestRes, bookingRes] = await Promise.all([
                    axios.get("http://localhost:3001/get_guest_arrivals"),
                    axios.get("http://localhost:3001/get_reservations")
                ]);

                const guests = guestRes.data || [];
                const bookings = bookingRes.data || [];

                const guestTotal = guests.reduce((sum, g) => sum + (Number(g.total_price) || 0), 0);

                const confirmedTotal = bookings.reduce((sum, b) => {
                    const status = (b.res_status || "").toLowerCase();
                    const val = Number(b.total_price || b.room_price || 0);
                    return (status === "confirmed" || status === "complete") ? sum + (Number.isNaN(val) ? 0 : val) : sum;
                }, 0);

                setGuestSales(guestTotal);
                setBookingConfirmedSales(confirmedTotal);

                // compute monthly totals (this month)
                const now = new Date();
                const month = now.getMonth();
                const year = now.getFullYear();

                const monthlyGuestTotal = (guests || []).reduce((sum, g) => {
                    const d = parseDateValue(g.created_at);
                    if (d && d.getFullYear() === year && d.getMonth() === month) {
                        return sum + (Number(g.total_price) || 0);
                    }
                    return sum;
                }, 0);

                const monthlyConfirmedTotal = (bookings || []).reduce((sum, b) => {
                    const status = (b.res_status || "").toLowerCase();
                    const d = parseDateValue(b.check_in_date);
                    if ((status === 'confirmed' || status === 'complete') && d && d.getFullYear() === year && d.getMonth() === month) {
                        const val = Number(b.total_price || b.room_price || 0);
                        return sum + (Number.isNaN(val) ? 0 : val);
                    }
                    return sum;
                }, 0);

                setMonthlyGuestSales(monthlyGuestTotal);
                setMonthlyBookingConfirmedSales(monthlyConfirmedTotal);
            } catch (err) {
                console.error("Error fetching sales for profile:", err);
            } finally {
                setSalesLoading(false);
            }
        };

        fetchSales();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        navigate('/AdminLogin');
    };

    const handleToggleEdit = () => {
        setEditMode((prev) => !prev);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setAdminData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSaveProfile = () => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const updatedUser = { ...parsed, name: adminData.name, email: adminData.email };
            localStorage.setItem('adminUser', JSON.stringify(updatedUser));
        }
        setEditMode(false);
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
                            <li><Link to="/Guest">Guest / Feedback</Link></li>
                            <div className="dasboard-admin-status">
                                <Link to="/Profile">
                                    <div className="dasboard-admin-status-content">
                                        <h1>System admin</h1>
                                        <p className="admin-status ">{adminData.role}</p>
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


            <section className="admin-profile-main">
                <div className="admin-profile-main-content">

                    <div className="admin-profile-topbar">
                        <h1>Profile</h1>
                        <div>
                            <button className="dashboard-topbar-btn1" onClick={handleToggleEdit}>
                                {editMode ? "Cancel" : "Edit Profile"}
                            </button>
                            <button className="dashboard-topbar-btn1" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>

                    <div className="admin-profile-content">
                        <div className={`admin-profile-card ${editMode ? 'admin-profile-card--editing' : ''}`}>
                            {editMode ? (
                                <div className="admin-profile-edit-form">
                                    <label>
                                        Name
                                        <input
                                            type="text"
                                            name="name"
                                            value={adminData.name}
                                            onChange={handleInputChange}
                                        />
                                    </label>
                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            name="email"
                                            value={adminData.email}
                                            onChange={handleInputChange}
                                        />
                                    </label>
                                    <button className="dashboard-topbar-btn12" type="button" onClick={handleSaveProfile}>
                                        Save Profile
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="admin-profile-card-img">
                                        <div className="admin-profile-avatar">
                                            {adminData.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="admin-profile-card-body">
                                        <h2>{adminData.name}</h2>
                                        <p className="admin-profile-role">{adminData.role}</p>
                                        <p>Email:
                                            <span>{adminData.email}</span>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="admin-profile-grid">
                        <div className="admin-sales-metrics">
                            <div className="sales-metric-card">
                                <span>Booking sales</span>
                                <h3>{salesLoading ? '...' : ('₱' + bookingConfirmedSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
                            </div>
                            <div className="sales-metric-card">
                                <span>Guest revenue</span>
                                <h3>{salesLoading ? '...' : ('₱' + guestSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
                            </div>
                            <div className="sales-metric-card">
                                <span>Total</span>
                                <h3>{salesLoading ? '...' : ('₱' + (bookingConfirmedSales + guestSales).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
                            </div>
                        </div>
                        <div className="admin-profile-settings">
                            <div className="admin-sales-header">
                                <div className="admin-sales-title">
                                    <i className="fa-solid fa-coins"></i>
                                    <h2>Sales overview</h2>
                                </div>
                                    <span className="admin-sales-badge">This month</span>
                                </div>
                            <div className="sales-cards-row">
                                <div className="sales-card">
                                    <div className="sales-icon-box sales-icon--green">
                                        <i className="fa-solid fa-bed"></i>
                                    </div>
                                    <div>
                                        <p>Booking sales (this month)</p>
                                        <h3>{salesLoading ? '...' : ('₱' + monthlyBookingConfirmedSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
                                    </div>
                                </div>
                            <div className="sales-card">
                                <div className="sales-icon-box sales-icon--blue">
                                    <i className="fa-solid fa-users"></i>
                                </div>
                                <div>
                                    <p>Guest revenue (this month)</p>
                                    <h3>{salesLoading ? '...' : ('₱' + monthlyGuestSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
                                </div>
                            </div>
                            <div className="sales-card">
                                <div className="sales-icon-box sales-icon--amber">
                                    <i className="fa-solid fa-chart-bar"></i>
                                </div>
                                <div>
                                    <p>Total (this month)</p>
                                    <h3>{salesLoading ? '...' : ('₱' + (monthlyBookingConfirmedSales + monthlyGuestSales).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</h3>
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

export default AdminProfile;