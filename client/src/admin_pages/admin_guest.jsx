import React from "react";
import { Link } from "react-router-dom";
import "../admincss/admin_guest.css";


function AdminGuest() {   
    return (
        <div>
            <nav className="guests-navbar">
                <div className="guests-nav-content">
                  <div className="guests-logo">
                    <h1>Messiah</h1>
                  </div>
                  <ul className="guests-nav-links">
                    <li><Link to="/Dashboard">Dashboard</Link></li>
                    <li><Link to="/Rooms">Rooms</Link></li>
                    <li><Link to="/Booking">Booking</Link></li>
                    <li className="active"><Link to="/Guest">Guest</Link></li>
                    <li><span>Settings</span></li>
                  </ul>
                </div>
            </nav>
            <section className="guests-main">
                <div className="guests-main-content">
                    <div className="guests-topbar">
                        <h1>Guest Management</h1>
                    </div>
                

                    <p className="Guest-section-label">Booking list</p>
                    <div className="guests-bokking-container">
                        <div className="guests-booking-table">
                            <table className="booking-table">
                                <thead>
                                    <tr>
                                        <th>Room Number</th>
                                        <th>Guest Name</th>
                                        <th>Number</th>
                                        <th>Email</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>    
                                <tbody>
                                    <tr>
                                        <td>101</td>
                                        <td>John Doe</td>
                                        <td>123-456-7890</td>
                                        <td>john.doe@example.com</td>
                                        <td>2023-10-15</td>
                                        <td>2023-10-20</td>
                                        <td>
                                            <button className="btn guest btn-primary" onClick={() => handleView(guest)}>
                                                    view
                                                </button>
                                            <button className="btn guest btn-primary">Edit</button>
                                            <button className="btn guest btn-danger">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                
                    <p className="Guest-section-label">Guest list</p>
                    <div className="guests-table-container">
                        <table className="guests-table">
                            <thead className="guests-table-header">
                                <tr>
                                    <th>Number of Guests</th>
                                    <th>Price</th>
                                    <th>Time & Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="guests-table-body">
                                <tr>
                                    <td>2</td>
                                    <td>$100.00</td>
                                    <td>2023-10-15 14:30</td>
                                    <td>
                                        <button className="btn guest btn-primary">Edit</button>
                                        <button className="btn guest btn-danger">Delete</button>
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
export default AdminGuest;