import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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