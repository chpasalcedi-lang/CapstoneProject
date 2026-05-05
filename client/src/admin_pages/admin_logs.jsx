import React from "react";
import { Link } from "react-router-dom";
import "../admincss/admin_logs.css";



function AdminLogs() {


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
                            <li className="active"><Link to="/Logs">Active logs</Link></li>
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

            <section className="admin-logs-main">
                <div className="admin-logs-main-content">

                    <div className="admin-logs-topbar">
                        <h1>Access Control</h1>
                    </div>
                    <div className="admin-logs-stats-bar">
                        <div className="admin-logs-stats-bar-content">
                            <div className="admin-logs-stats-card">
                                <input type="search" placeholder="Search logs..." />
                                <div className="admin-logs-filter-btns">
                                <button className="active">all</button>
                                <button>Admin</button>
                                <button>Staff</button>
                                <button>Guest</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="admin-logs-table-container">
                        <table className="admin-logs-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody >
                                <tr>
                                    <td>
                                    <div className="user-name-cell">
                                        <div className="avatar">J</div>
                                        <span>John Doe</span>
                                    </div>
                                    </td>
                                    <td>john.doe@example.com</td>
                                    <td>Manager</td>
                                    <td>edit</td>
                                    <td>
                                        <div className="logs-time"> 
                                            <div>June 10</div>
                                            <div>10:30 AM</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    <div className="user-name-cell">
                                        <div className="avatar">J</div>
                                        <span>Jane Smith</span>
                                    </div>
                                    </td>
                                    <td>jane.smith@example.com</td>
                                    <td>Receptionist</td>
                                    <td>edit</td>
                                    <td>
                                        <div className="logs-time"> 
                                            <div>June 10</div>
                                            <div>11:30 AM</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    <div className="user-name-cell">
                                        <div className="avatar">J</div>
                                        <span>Jane Smith</span>
                                    </div>
                                    </td>
                                    <td>jane.smith@example.com</td>
                                    <td>Receptionist</td>
                                    <td>log in</td>
                                    <td>
                                        <div className="logs-time"> 
                                            <div>June 10</div>
                                            <div>12:30 PM</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    <div className="user-name-cell">
                                        <div className="avatar">J</div>
                                        <span>Jane Smith</span>
                                    </div>
                                    </td>
                                    <td>jane.smith@example.com</td>
                                    <td>Receptionist</td>
                                    <td>edit</td>
                                    <td>
                                        <div className="logs-time"> 
                                            <div>June 10</div>
                                            <div>10:30 AM</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    <div className="user-name-cell">
                                        <div className="avatar">J</div>
                                        <span>Jane Smith</span>
                                    </div>
                                    </td>
                                    <td>jane.smith@example.com</td>
                                    <td>Receptionist</td>
                                    <td>log in</td>
                                    <td>
                                        <div className="logs-time"> 
                                            <div>June 10</div>
                                            <div>10:30 AM</div>
                                        </div>
                                    </td>
                                </tr>
                            

                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminLogs;
