import React from "react";
import { Link } from "react-router-dom";
import "../admincss/admin_addguest.css";

function AdminAddGuest() {
  return (
    <div className="wrap">
      <nav className="dashboard-navbar">
        <div className="dashboard-nav-content">
          <div className="dashboard-logo">
            <a href="/Dashboard"><h1>Messiah</h1></a>
          </div>
          <ul className="dashboard-nav-links">
            <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
            <li><Link to="/Rooms">Rooms</Link></li>
            <li><Link to="/Booking">Booking</Link></li>
            <li><Link to="/Guest">Guest</Link></li>
            <li><span>Settings</span></li>
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
            <div className="add-guest-container">
                <div className="add-guest-form">
                    <h2>Add New Guest</h2>
                    <form>
                    <p>price: 150 </p>
                    <div className="add-form-group">
                        <label>Number of Guests:</label>
                        <input type="number" name="guest No." />
                    </div>
                    <div className="add-form-group add-form-checkbox">
                        <label>Foods</label>
                        <input type="checkbox" />
                    </div>

                    <div className="add-form-group">
                    <p>total price: 150 x number of guests</p> 
                    </div>
                    <button type="submit">Add Guest</button>
                    </form>

                </div>
            </div>
        </div>
      </section>
    </div>
  );
}

export default AdminAddGuest;
