import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from 'sweetalert2';
import "../admincss/admin_addguest.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';


const PRICE_PER_CHILD = 150;
const PRICE_PER_ADULT = 175;

const FOOD_CHARGE = 500;

function AdminAddGuest() {
  const formatCurrency = (value) => {
    const n = Number(value) || 0;
    const hasDecimals = Math.abs(n % 1) > 0;
    return n.toLocaleString('en-PH', { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: hasDecimals ? 2 : 0 });
  };
  const [values, setValues] = useState({
    number_of_children: "",
    number_of_guests: "",
    foods: "No",
  });
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
    const adults = parseInt(values.number_of_guests) || 0;
    const children = parseInt(values.number_of_children) || 0;
    const guestTotal = adults * PRICE_PER_ADULT + children * PRICE_PER_CHILD;
    const foodTotal = values.foods === "Yes" ? FOOD_CHARGE : 0;
    return (guestTotal + foodTotal).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const adults = parseInt(values.number_of_guests) || 0;
    const children = parseInt(values.number_of_children) || 0;
    const totalGuests = adults + children;
    if (totalGuests <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid input',
        text: 'Please enter at least one guest (children or adults).',
      });
      return;
    }

    const totalPrice = calculateTotalPrice();
    const payload = {
      number_of_children: children,
      number_of_guests: totalGuests,
      food_service: values.foods,
      total_price: parseFloat(totalPrice)
    };

    try {
      await apiClient.post('/add_guest_arrival', payload);
      Swal.fire({
        icon: 'success',
        title: 'Guest added',
        text: 'Guest arrival recorded successfully!',
      });
      setValues({ number_of_children: "", number_of_guests: "", foods: "No" });
    } catch (err) {
      console.error("Error: ", err);
      const errorMsg = err.response?.data?.error || err.message || "Network error";
      Swal.fire({
        icon: 'error',
        title: 'Add failed',
        text: `${errorMsg}. Make sure the backend is available and the API URL is configured correctly`,
      });
    }
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
                      <p className="price-display">Guest Rate: ₱{formatCurrency(PRICE_PER_CHILD)}/child | ₱{formatCurrency(PRICE_PER_ADULT)}/adult | Food Service: ₱{formatCurrency(FOOD_CHARGE)}</p>
                      <div className="add-form-row">
                        <div className="add-form-group half-width">
                          <label>children / senior / pwd</label>
                          <input type="number" name="number_of_children" value={values.number_of_children} onChange={handleChange} placeholder="e.g. 2" min="0"/>
                        </div>
                        <div className="add-form-group half-width">
                          <label>adults</label>
                          <input type="number" name="number_of_guests" value={values.number_of_guests} onChange={handleChange} placeholder="e.g. 2" min="0"/>
                        </div>
                      </div>
                      <div className="add-form-group total-row">
                        <label>Total guests</label>
                        <div className="total-count">{(parseInt(values.number_of_children) || 0) + (parseInt(values.number_of_guests) || 0)}</div>
                      </div>

                      <div className="add-form-group add-form-checkbox">
                        <label>Include Food Service (₱{FOOD_CHARGE})</label>
                        <input type="checkbox" name="foods" checked={values.foods === "Yes"} onChange={handleFoodsToggle}/>
                      </div>

                      <div className="add-form-summary">
                        <div>
                          <p className="summary-label">Guest Total:</p>
                          <p className="summary-price">₱{formatCurrency((parseInt(values.number_of_children) || 0) * PRICE_PER_CHILD + (parseInt(values.number_of_guests) || 0) * PRICE_PER_ADULT)}</p>
                        </div>
                        {values.foods === "Yes" && (
                          <div>
                            <p className="summary-label">Food Charge:</p>
                            <p className="summary-price">₱{formatCurrency(FOOD_CHARGE)}</p>
                          </div>
                        )}
                        <div>
                          <p className="summary-label">Total Price:</p> 
                          <p className="summary-price-total">₱{formatCurrency(calculateTotalPrice())}</p> 
                        </div>
                      </div>
                      <button type="submit"> Confirm </button>
                    </form>
                </div>
            </div>
        </div>
      </section>
      <AdminWalkinModal show={showWalkinModal} onClose={() => setShowWalkinModal(false)} />
    </div>
  );
}

export default AdminAddGuest;
