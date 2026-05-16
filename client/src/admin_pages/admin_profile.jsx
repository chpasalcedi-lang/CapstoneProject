import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../admincss/admin_profile.css";

function AdminProfile() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        navigate('/AdminLogin');
    };
    return (
        <div>
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                        <ul className="dashboard-nav-links">
                            <p>dashboard</p>
                            <li><Link to="/Dashboard">Dashboard</Link></li>
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

            <section className="admin-profile-main">
                <div className="admin-profile-main-content">

                    <div className="admin-profile-topbar">
                        <h1>Profile</h1>
                        <div>
                            <button className="admin-profile-topbar-btn">
                                Update Profile
                            </button>
                            <button className="dashboard-topbar-btn1" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>

                    <div className="admin-profile-content">
                        <div className="admin-profile-card">
                            <div className="admin-profile-card-img">
                                <div className="admin-profile-avatar"> Ap </div>
                            </div>
                            <div className="admin-profile-card-body">
                                <h2>Admin User</h2>
                                <p>Email:
                                    <span>
                                        admin@example.com
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-profile-grid">
                        <div className="admin-profile-activity">
                            <h2>Recent Activity</h2>
                            <ul>
                                <li>Updated room details for Room 101</li>
                                <li>Confirmed booking for Jane Smith</li>
                                <li>Added new user account for staff member</li>
                                <li>Generated sales report for last month</li>
                            </ul>
                        </div>

                        <div className="admin-profile-logs">
                            <h2>Activity Logs</h2>
                            <ul>
                                <li>Logged in at 09:00 AM</li>
                                <li>Logged out at 05:00 PM</li>
                                <li>Updated profile information</li>
                            </ul>
                        </div>
                        <div className="admin-profile-settings">
                            <h2>Sales</h2>
                            <ul>
                                <li>Booking Sales + $1,200</li>
                                <li>Guest Revenue + $2,500</li>
                                <li>Monthly Sales + $3,700</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminProfile;