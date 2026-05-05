import React from "react";
import { Link } from "react-router-dom";
import "../admincss/admin_profile.css";



function AdminProfile() {


    return (
        <div>
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <a href="/Dashboard"><h1>Messiah</h1></a>
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
                        </div>
                    </div>

                    <div className="admin-profile-content">
                        <div className="admin-profile-card">
                            <div className="admin-profile-card-img">
                                <img src="https://i.pinimg.com/564x/1c/0b/8e/1c0b8e7a9d2f5a3c9e4b6a1d9c8f2e.jpg" alt="Admin Profile" />
                            </div>
                            <div className="admin-profile-card-body">
                                <h2>John Doe</h2>
                                <p>Email:
                                    <span>
                                        john.doe@example.com
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>





                </div>
            </section>
        </div>
    );
}

export default AdminProfile;