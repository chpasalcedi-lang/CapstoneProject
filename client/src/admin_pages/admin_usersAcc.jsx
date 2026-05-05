import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../admincss/admin_usersAcc.css";
import AddAccountModal from '../Modals/add_acc_modal';
import UpdateAccountModal from '../Modals/update_userAcc.modal';


function AdminUsersAcc() {
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [showUpdateAccModal, setShowUpdateAccModal] = useState(false);



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
                            <li className="active"><Link to="/Users">User</Link></li>
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

            <section className="admin-users-main">
                <div className="admin-users-main-content">

                    <div className="admin-users-topbar">
                        <h1>Access Control</h1>
                        <div>
                            <button className="admin-users-topbar-btn" onClick={() => setShowAddAccModal(true)}>
                                New Account
                            </button>
                        </div>
                    </div>
                    <div className="admin-users-stats-bar">
                        <div className="admin-users-stats-bar-content">
                            <div className="admin-users-stats-card">
                                <input type="search" placeholder="Search users..." />
                                <div className="admin-users-filter-btns">
                                <button className="active">all</button>
                                <button>Admin</button>
                                <button>Staff</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="admin-users-table-container">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th className="action">Actions</th>
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
                                    <td className="action">
                                        <button className="admin-users-action-btn edit" onClick={() => setShowUpdateAccModal(true)}>Edit</button>   
                                        <button className="admin-users-action-btn delete">Delete</button>
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
                                    <td className="action">
                                        <button className="admin-users-action-btn edit" onClick={() => setShowUpdateAccModal(true)}>Edit</button>   
                                        <button className="admin-users-action-btn delete">Delete</button>
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
                                    <td className="action">
                                        <button className="admin-users-action-btn edit" onClick={() => setShowUpdateAccModal(true)}>Edit</button>   
                                        <button className="admin-users-action-btn delete">Delete</button>
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
                                    <td className="action">
                                        <button className="admin-users-action-btn edit" onClick={() => setShowUpdateAccModal(true)}>Edit</button>   
                                        <button className="admin-users-action-btn delete">Delete</button>
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
                                    <td className="action">
                                        <button className="admin-users-action-btn edit" onClick={() => setShowUpdateAccModal(true)}>Edit</button>   
                                        <button className="admin-users-action-btn delete">Delete</button>
                                    </td>
                                </tr>
                            

                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <AddAccountModal show={showAddAccModal} onClose={() => setShowAddAccModal(false)} />
            <UpdateAccountModal show={showUpdateAccModal} onClose={() => setShowUpdateAccModal(false)} />
        </div>
    );
}

export default AdminUsersAcc;
