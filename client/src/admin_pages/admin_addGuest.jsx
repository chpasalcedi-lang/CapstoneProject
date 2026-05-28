import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../admincss/admin_addguest.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';


const PRICE_PER_GUEST = 150;
const FOOD_CHARGE = 500;

function AdminAddGuest() {
  const [values, setValues] = useState({
    number_of_guests: "",
    foods: "No",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoodsToggle = (e) => {
    const foods = e.target.checked ? "Yes" : "No";
    setValues((prev) => ({ ...prev, foods }));
  };

  const calculateTotalPrice = () => {
    const numGuests = parseInt(values.number_of_guests) || 0;
    const guestTotal = numGuests * PRICE_PER_GUEST;
    const foodTotal = values.foods === "Yes" ? FOOD_CHARGE : 0;
    return (guestTotal + foodTotal).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!values.number_of_guests || values.number_of_guests <= 0) {
      setStatusMessage("Please enter a valid number of guests.");
      return;
    }

    setStatusMessage("Adding guest...");

    const totalPrice = calculateTotalPrice();
    const payload = {
      number_of_guests: parseInt(values.number_of_guests, 10),
      food_service: values.foods,
      total_price: parseFloat(totalPrice),
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    console.log('Submitting add guest payload:', payload);
    axios.post('http://localhost:3001/add_guest_arrival', payload)
      .then((res) => {
        console.log("Success: ", res.data);
        setStatusMessage(`✓ Guest arrival recorded successfully! ID: ${res.data.guestId}`);
        setValues({ number_of_guests: "", foods: "No" });

        setTimeout(() => setStatusMessage(""), 3000);
      })
      .catch((err) => {
        console.error("Error: ", err);
        const errorMsg = err.response?.data?.error || err.response?.statusText || "Network error";
        setStatusMessage(`Error: ${errorMsg}. Make sure server is running on http://localhost:3001/add_guest_arrival`);
      });
  };

  return (
    <div className="wrap">
      <div className="mobile-topbar">
        <Link to="/Dashboard">
          <h1 className="mobile-logo">
            Messiah
          </h1>
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
            <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
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
        </div>
      </nav>

        <nav className={`drawer-panel ${drawerOpen ? 'open' : ''}`}>
          <div className="dashboard-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingRight: 20 }}>
            <Link to="/Dashboard"><h1>Messiah</h1></Link>
          </div>
          <ul className="dashboard-nav-links" onClick={() => setDrawerOpen(false)}>
            <p>dashboard</p>
            <li className="active"><Link to="/Dashboard">Dashboard</Link></li>
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

      <section className="add-guest-main">
        <div className="add-guest-main-content">
          <div className="add-guest-topbar">
            <h1>Dashboard</h1>
            <div className="add-guest-topbar-btns">
                <button className="add-guest-topbar-btn1" onClick={() => setShowWalkinModal(true)}>Walk in</button>
                <Link className="add-guest-topbar-btn1" to="/AddGuest">Add Guest</Link>
            </div>
          </div>
            <div className="add-guest-container">
                <div className="add-guest-form">
                    <h2>Add New Guest Arrival</h2>
                    <form onSubmit={handleSubmit}>
                      <p className="price-display">Guest Rate: ₱{PRICE_PER_GUEST} | Food Service: ₱{FOOD_CHARGE}</p>
                      <div className="add-form-group">
                        <label>Number of Guests:</label>
                        <input type="number" name="number_of_guests" required value={values.number_of_guests} onChange={handleChange} placeholder="e.g. 2" min="1"/>
                      </div>
                      <div className="add-form-group add-form-checkbox">
                        <label>Include Food Service (₱{FOOD_CHARGE})</label>
                        <input type="checkbox" name="foods" checked={values.foods === "Yes"} onChange={handleFoodsToggle}/>
                      </div>

                      <div className="add-form-summary">
                        <div>
                          <p className="summary-label">Guest Total:</p>
                          <p className="summary-price">₱{((parseInt(values.number_of_guests) || 0) * PRICE_PER_GUEST).toFixed(2)}</p>
                        </div>
                        {values.foods === "Yes" && (
                          <div>
                            <p className="summary-label">Food Charge:</p>
                            <p className="summary-price">₱{FOOD_CHARGE}</p>
                          </div>
                        )}
                        <div>
                          <p className="summary-label">Total Price:</p> 
                          <p className="summary-price-total">₱{calculateTotalPrice()}</p> 
                        </div>
                      </div>
                      <button type="submit"> Confirm </button>
                    </form>
                    {statusMessage && (
                      <p className={`add-status-message ${statusMessage.includes('<i class="fa-solid fa-check"></i>') ? 'success' : 'error'}`}>
                        {statusMessage}
                      </p>
                    )}
                </div>
            </div>
        </div>
      </section>
      <AdminWalkinModal show={showWalkinModal} onClose={() => setShowWalkinModal(false)} />
    </div>
  );
}

export default AdminAddGuest;
