import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_walkin.css";

const initialValues = {
  last_name: "",
  first_name: "",
  num_guests: "",
  phone_number: "",
  email: "",
  check_in_date: "",
  check_out_date: "",
  notes: "",
  room_number: "",
};

function AdminWalkin() {
  const [values, setValues] = useState(initialValues);
  const [statusMessage, setStatusMessage] = useState("");

  const handleCancel = () => {
    setValues(initialValues);
    setStatusMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage("Saving reservation...");

    axios
      .post("http://localhost:3000/add_reservation", {
        ...values,
        room_id: values.room_number,
      })
      .then((res) => {
        console.log("Success:", res.data);
        setStatusMessage("Reservation added successfully.");
        setValues(initialValues);
      })
      .catch((err) => {
        console.error("Error sa pag-save:", err);
        setStatusMessage("May sala sa pag-save sang data!");
      });
  };

  return (
    <div className="wrap">
      <nav className="dashboard-navbar">
        <div className="dashboard-nav-content">
          <div className="dashboard-logo">
            <h1>Messiah</h1>
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
              <div className="walkin-container">
                <div className="walkin-form-card">
                    <h2>Walk-in Reservation</h2>
                    <p>Complete the form below to record a new walk-in guest reservation.</p>
                    <form className="walkin-reservation-modal-body" onSubmit={handleSubmit}>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" required value={values.last_name} onChange={handleChange} placeholder="e.g. Family Name" />
                            </div>
                            <div className="walkin-reservation-form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" required value={values.first_name} onChange={handleChange} placeholder="e.g. First Name" />
                            </div>
                        </div>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>No. of Guests</label>
                            <input type="number" name="num_guests" required value={values.num_guests} onChange={handleChange} placeholder="e.g. 2" />
                            </div>
                            <div className="walkin-reservation-form-group">
                            <label>Room Number</label>
                            <input type="text" name="room_number" required value={values.room_number} onChange={handleChange} placeholder="e.g. 101" />
                            </div>
                        </div>
                        <div className="walkin-reservation-form-group">
                            <label>Phone Number</label>
                            <input type="text" name="phone_number" required value={values.phone_number} onChange={handleChange} placeholder="e.g. 09XX XXX XXXX" />
                        </div>
                        <div className="walkin-reservation-form-group">
                            <label>Email</label>
                            <input type="email" name="email" required value={values.email} onChange={handleChange} placeholder="e.g. example@email.com" />
                        </div>
                        <div className="walkin-reservation-form-row">
                            <div className="walkin-reservation-form-group">
                            <label>Check-in Date</label>
                            <input type="date" name="check_in_date" required value={values.check_in_date} onChange={handleChange} className="walkin-input" />
                            </div>
                            <div className="walkin-reservation-form-group">
                                <label>Check-out Date</label>
                                <input type="date" name="check_out_date" required value={values.check_out_date} onChange={handleChange} className="walkin-input" />
                            </div>
                        </div>
                        
                        

                        <div className="walkin-reservation-form-group">
                            <label>Notes <span>Optional</span></label>
                            <textarea name="notes" rows="3" value={values.notes} onChange={handleChange} placeholder="..."></textarea>
                        </div>

                        <div className="walkin-reservation-modal-footer">
                            <button type="button" className="walkin-reservation-btn-cancel" onClick={handleCancel}>Cancel</button>
                            <button type="submit" className="walkin-reservation-btn-save">Save Reservation</button>
                        </div>
                        </form>
                        {statusMessage && <p className="walkin-status-message">{statusMessage}</p>}
                    </div>
                </div>
            </div>
      </section>
    </div>
  );
}

export default AdminWalkin;