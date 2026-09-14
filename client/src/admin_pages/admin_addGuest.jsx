import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
import Swal from 'sweetalert2';
import "../admincss/admin_addguest.css";
import AdminWalkinModal from '../Modals/walkin_reresvation_modal';


const PRICE_PER_CHILD = 150;
const PRICE_PER_ADULT = 175;

const CORKAGE_OPTIONS = {
  Food: { rate: 500, unit: "group" },
  Beer: { rate: 300, unit: "case" },
  Whiskey: { rate: 300, unit: "bottle" },
};

const defaultCorkageState = Object.fromEntries(
  Object.entries(CORKAGE_OPTIONS).map(([option]) => [
    option,
    { enabled: false, price: "" },
  ])
);

const getCorkageQuantity = (option, config) => {
  if (!config?.enabled) return 0;
  const value = config.price;
  if (value === "" || value === null || value === undefined) {
    return 1;
  }
  return Math.max(0, Number(value) || 0);
};

const getCorkagePrice = (option, config) => {
  if (!config?.enabled) return 0;
  const rate = Number(CORKAGE_OPTIONS[option]?.rate) || 0;
  return getCorkageQuantity(option, config) * rate;
};

function AdminAddGuest() {
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('adminTheme') === 'light');
  const formatCurrency = (value) => {
    const n = Number(value) || 0;
    const hasDecimals = Math.abs(n % 1) > 0;
    return n.toLocaleString('en-PH', { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: hasDecimals ? 2 : 0 });
  };
  const [values, setValues] = useState({
    group_name: "",
    number_of_children: "",
    number_of_guests: "",
    corkage: defaultCorkageState,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  React.useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('adminTheme') === 'light');
    };

    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = () => {
    const adults = parseInt(values.number_of_guests) || 0;
    const children = parseInt(values.number_of_children) || 0;
    const guestTotal = adults * PRICE_PER_ADULT + children * PRICE_PER_CHILD;
    const corkageTotal = Object.entries(values.corkage).reduce((total, [option, config]) => {
      return total + getCorkagePrice(option, config);
    }, 0);
    return (guestTotal + corkageTotal).toFixed(2);
  };

  const handleCorkageToggle = (option) => {
    setValues((prev) => ({
      ...prev,
      corkage: {
        ...prev.corkage,
        [option]: {
          enabled: !prev.corkage[option]?.enabled,
          price: prev.corkage[option]?.enabled ? "" : prev.corkage[option]?.price || "",
        },
      },
    }));
  };

  const handleCorkagePriceChange = (option, nextValue) => {
    setValues((prev) => ({
      ...prev,
      corkage: {
        ...prev.corkage,
        [option]: {
          ...prev.corkage[option],
          price: nextValue,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

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
    const corkageSummary = Object.entries(values.corkage)
      .filter(([, config]) => config?.enabled)
      .map(([option, config]) => `${option} - ₱${formatCurrency(getCorkagePrice(option, config))}`)
      .join(", ") || "No Corkage";

    const payload = {
      group_name: values.group_name.trim(),
      number_of_children: children,
      number_of_adults: adults,
      number_of_guests: totalGuests,
      corkage: corkageSummary,
      total_price: parseFloat(totalPrice)
    };

    setIsSubmitting(true);
    try {
      await apiClient.post('/add_guest_arrival', payload);
      Swal.fire({
        icon: 'success',
        title: 'Guest added',
        text: 'Guest arrival recorded successfully!',
      });
      setValues({
        group_name: "",
        number_of_children: "",
        number_of_guests: "",
        corkage: defaultCorkageState,
      });
    } catch (err) {
      console.error("Error: ", err);
      const errorMsg = err.response?.data?.details
        || err.response?.data?.error
        || err.message
        || "Network error";
      Swal.fire({
        icon: 'error',
        title: 'Add failed',
        text: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`wrap admin-add-guest-page ${isLightMode ? 'admin-add-guest-page--light' : ''}`}>
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
                      <p className="price-display">Guest Rate: ₱{formatCurrency(PRICE_PER_CHILD)}/child | ₱{formatCurrency(PRICE_PER_ADULT)}/adult </p>
                      <p className="price-display"> Corkage: Food ₱500/group, Beer ₱300/case, Whiskey ₱300/bottle</p>

                      <div className="add-form-group">
                        <label htmlFor="group-name">Group name</label>
                        <input id="group-name" type="text" name="group_name" value={values.group_name} onChange={handleChange} placeholder="e.g. Santos Family" />
                      </div>

                      <div className="add-form-row compact-row">
                        <div className="add-form-group half-width">
                          <label>children / senior / pwd</label>
                          <input type="number" name="number_of_children" value={values.number_of_children} onChange={handleChange} placeholder="e.g. 2" min="0"/>
                        </div>
                        <div className="add-form-group half-width">
                          <label>adults</label>
                          <input type="number" name="number_of_guests" value={values.number_of_guests} onChange={handleChange} placeholder="e.g. 2" min="0"/>
                        </div>
                      </div>

                      <div className="add-form-group total-row compact-total">
                        <label>Total guests</label>
                        <div className="total-count">{(parseInt(values.number_of_children) || 0) + (parseInt(values.number_of_guests) || 0)}</div>
                      </div>

                      <div className="add-form-group">
                        <label>Corkage</label>
                        <details className="corkage-dropdown" open>
                          <summary>Choose corkage</summary>
                          <div className="corkage-list">
                            {Object.entries(CORKAGE_OPTIONS).map(([option, { unit }]) => (
                              <div className="corkage-option" key={option}>
                                <label className="corkage-option-label">
                                  <input
                                    type="checkbox"
                                    checked={!!values.corkage[option]?.enabled}
                                    onChange={() => handleCorkageToggle(option)}
                                  />
                                  <span>{option}</span>
                                </label>
                                <div className="corkage-price-wrap">
                                  <small>{unit} / {CORKAGE_OPTIONS[option].rate}</small>
                                  <input
                                    type="number"
                                    min="0"
                                    value={values.corkage[option]?.enabled ? values.corkage[option]?.price ?? '' : ''}
                                    onChange={(e) => handleCorkagePriceChange(option, e.target.value)}
                                    placeholder="0"
                                    disabled={!values.corkage[option]?.enabled}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>

                      <div className="add-form-summary">
                        <div>
                          <p className="summary-label">Guest Total:</p>
                          <p className="summary-price">₱{formatCurrency((parseInt(values.number_of_children) || 0) * PRICE_PER_CHILD + (parseInt(values.number_of_guests) || 0) * PRICE_PER_ADULT)}</p>
                        </div>
                        <div>
                          <p className="summary-label">Corkage:</p>
                          <p className="summary-price">₱{formatCurrency(Object.entries(values.corkage).reduce((total, [option, config]) => {
                            return total + getCorkagePrice(option, config);
                          }, 0))}</p>
                        </div>
                        <div>
                          <p className="summary-label">Total Price:</p>
                          <p className="summary-price-total">₱{formatCurrency(calculateTotalPrice())}</p>
                        </div>
                      </div>

                      <button type="submit" className="modal-submit-button" disabled={isSubmitting}>
                        {isSubmitting ? <><span className="modal-submit-spinner" aria-hidden="true"></span>Saving...</> : 'Confirm'}
                      </button>
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
