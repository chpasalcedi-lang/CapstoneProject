import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ViewLanding from "../Modals/view_landing.jsx";
import LandingUpdate from "../Modals/landingUpdate.jsx";
import "../pagescss/landing_page.css";


function LandingPage() {
  const location = useLocation();
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const menuButtonRef = useRef(null);
  const [userEmail, setUserEmail] = useState(() => {
    // Read auth info synchronously to avoid a flash of the "sign in" button
    const stored = localStorage.getItem("userEmail");
    if (stored) return stored;
    const adminStr = localStorage.getItem("adminUser");
    if (adminStr) {
      try {
        const parsed = JSON.parse(adminStr);
        // prefer an email if available, otherwise use name
        return parsed.email || parsed.name || null;
      } catch (e) {
        console.error("Error parsing adminUser from localStorage:", e);
        return null;
      }
    }
    return null;
  });

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (!next && menuButtonRef.current) {
        menuButtonRef.current.focus();
      }
      return next;
    });
  };
  const fetchUserReservations = async (email) => {
    if (!email) return;
    setLoadingReservations(true);
    try {
      const res = await axios.get('http://localhost:3001/get_reservations');
      const allReservations = res.data || [];
      const userReservations = allReservations.filter(
        (r) => r.email && r.email.toLowerCase() === email.toLowerCase()
      );
      setReservations(userReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const toggleProfile = () => {
    if (!profileOpen && userEmail) {
      fetchUserReservations(userEmail);
    }
    setProfileOpen((prev) => !prev);
  };

  const handleLogout = () => {
    // clear both possible login keys and update UI immediately
    localStorage.removeItem("userEmail");
    localStorage.removeItem("adminUser");
    setUserEmail(null);
    setProfileOpen(false);
    Swal.fire({ icon: "success", title: "Logged out", text: "You have been logged out." });
  };

  const closeMenu = () => {
    setMenuOpen(false);
    if (menuButtonRef.current) {
      menuButtonRef.current.focus();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (location.hash === "#about-pool") {
      const section = document.getElementById("about-pool");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (location.pathname === "/Home") {
      scrollToTop();
    }
  }, [location]);

  useEffect(() => {
    if (!menuOpen && menuButtonRef.current) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('.mobile-menu')) {
        active.blur();
        menuButtonRef.current.focus();
      }
    }
  }, [menuOpen]);

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) {
      alert('Please fill out all fields before submitting your feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:3001/add_feedback', feedback);
      Swal.fire({
        icon: 'success',
        title: 'Thank you!',
        text: 'Your feedback has been submitted successfully.',
      });
      setFeedback({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Feedback submission error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission failed',
        text: error.response?.data?.message || 'Unable to submit feedback. Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (location.hash === "#about-pool") {
      const section = document.getElementById("about-pool");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-dropdown-wrapper")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <nav className="landing-navbar">
        <div className="landing-nav-content">
            <div className="logo">
              <h1>MESSIAH</h1>
            </div>
            <ul className="landing-nav-links">
              <li><Link to="/Home" onClick={scrollToTop}>Home</Link></li>
              <li><Link to="/Reservation">Room</Link></li>
              <li><Link to="/Home#about-pool">About</Link></li>
            </ul>
            <div className="nav-actions">
              {userEmail ? (
                <div className="profile-dropdown-wrapper">
                  <button className="landing-btn" onClick={toggleProfile}>
                    <i className="fa-solid fa-user"></i>
                    Profile
                  </button>
                  {profileOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-info">
                        <div className="profile-dropdown-avatar"><i className="fa-solid fa-user"></i></div>
                        <div className="profile-dropdown-email">{userEmail}</div>
                      </div>
                      <div className="profile-dropdown-divider"></div>
                      <div className="profile-dropdown-credentials">
                        {loadingReservations ? (
                          <p className="profile-credentials-loading">Loading reservations...</p>
                        ) : reservations.length === 0 ? (
                          <p className="profile-credentials-empty">No reservations found</p>
                        ) : (
                          reservations.map((booking) => (
                            <div className="profile-dropdown-credential-card" key={booking.id}>
                              <div className="profile-credential-header">
                                <h4>{booking.room_name || 'Room Reservation'}</h4>
                                <span className={`profile-credential-status ${(booking.res_status || 'pending').toLowerCase()}`}>
                                  {booking.res_status || 'Pending'}
                                </span>
                              </div>
                              <div className="profile-credential-dates">
                                <span className="profile-credential-date-label">Check-in</span>
                                <span className="profile-credential-date-value">{new Date(booking.check_in_date).toLocaleDateString()}</span>
                                <span className="profile-credential-date-label">Check-out</span>
                                <span className="profile-credential-date-value">{new Date(booking.check_out_date).toLocaleDateString()}</span>
                              </div>
                              <div className="profile-credential-info">
                                <span><strong>Room Type:</strong> {booking.room_type || 'N/A'}</span>
                                <span><strong>Guests:</strong> {booking.num_guests || 'N/A'}</span>
                                <span><strong>Total:</strong> ₱{booking.total_price || '0'}</span>
                              </div>
                              <div className="profile-credential-actions">
                                <button className="profile-credential-btn-view" onClick={() => { setSelectedBooking(booking); setShowViewModal(true); }}>
                                  View Details
                                </button>
                                {((!booking.res_status) || (['confirmed','complete'].indexOf(String(booking.res_status).toLowerCase()) === -1)) && (
                                  <button className="profile-credential-btn-edit" onClick={() => { setSelectedBooking(booking); setShowEditModal(true); }}>
                                    Update
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="profile-dropdown-divider"></div>
                      <button className="profile-dropdown-item profile-dropdown-logout" onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/Login">
                  <button className="landing-btn">
                    SIGN IN
                  </button>
                </Link>
              )}
              <button ref={menuButtonRef} className="hamburger-btn" onClick={toggleMenu} aria-controls="mobile-menu" aria-label="Toggle menu" aria-expanded={menuOpen}>
                <i className={`fa-solid ${menuOpen ? "fa-x" : "fa-bars"}`}></i>
              </button>
            </div>
        </div>

        <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
          <Link to="/Home" tabIndex={menuOpen ? 0 : -1} onClick={() => { closeMenu(); scrollToTop(); }}>Home</Link>
          <Link to="/Reservation" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>Room</Link>
          <a href="#about-pool" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>About</a>
        </div>
      </nav>
      

      <section className="landing-main">
        <div className="landing-main-content">
          <h1>Welcome to Messiah!</h1>
          <p>Experience luxury and comfort like never before. Book your stay with us today and enjoy an unforgettable experience.</p>
        </div>

        <div className="landing-main-seclection">
          <Link to="/Reservation">
            <button className="landing-btn">Check Available</button>
          </Link>
        </div>
      </section>


      <section className="landing-info">
         <span className="landing-info-eyebrow">The Messhia Experience</span>
          <div className="landing-info-title">
            <h1>Discover the Messhia Experience</h1>
          </div>
          <div className="landing-info-grid">
            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-solid fa-water"></i></span>
              </div>
             <h3>Pool</h3>
             <p>Dive into relaxation. Enjoy our refreshing pool with stunning views and curated amenities designed for your total peace of mind.</p>
            </div>

            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-regular fa-clock"></i></span>
              </div>
             <h3>24/7 Service</h3>
             <p>Rest easy knowing our dedicated team is here for you around the clock. From dawn until dusk, we are committed to your total comfort and satisfaction.</p>
            </div>
           
            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-regular fa-handshake"></i></span>
              </div>
             <h3>Excellence Experience</h3>
             <p>Our commitment to excellence ensures every aspect of your stay is perfect.</p>
            </div>
          </div>
      </section>


      <section className="about-pool" id="about-pool">
          <div className="about-pool-content">
              <div id="carouselExampleDark" className="carousel carousel-dark slide" data-bs-ride="carousel">
                  <div className="carousel-indicators">
                      <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                      <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="1" aria-label="Slide 2"></button>
                      <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="2" aria-label="Slide 3"></button>
                  </div>
                  <div className="carousel-inner">
                      <div className="carousel-item active" data-bs-interval="10000">
                          <img src="/src/image/pool1.jpg" className="d-block w-100" alt="..." />
                      <div className="carousel-caption d-none d-md-block">
                      </div>
                      </div>
                      <div className="carousel-item" data-bs-interval="2000">
                          <img src="/src/image/pool2.jpg" className="d-block w-100" alt="..."/>
                      <div className="carousel-caption d-none d-md-block">
                      </div>
                      </div>
                      <div className="carousel-item">
                          <img src="/src/image/pool3.jpg" className="d-block w-100" alt="..."/>
                      <div className="carousel-caption d-none d-md-block">
                      </div>
                      </div>
                  </div>
                  <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  </button>
              </div>
              <div className="about-pool-text">
                  <h1>MESSIAH POOL RESORT</h1>
                  <p>Experience our premium infinity pool with elegant ambiance, breathtaking views, and world-class comfort designed for your perfect stay.</p>
                  <Link to="/Reservation">
                      <button className="about-btn-pool">Check Available</button>
                  </Link>
              </div>
          </div>
      </section>
      

      <section className="landing-map">
       <span className="landing-map-eyebrow">Our Location</span>
        <div className="landing-map-content">
          <h1>Find Us</h1>
          <p>Located in the heart of the city, Messiah is easily accessible and surrounded by attractions.</p>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps?q=Messiah+Inland+Resort+San+Miguel+Iloilo&output=embed"
              allowFullScreen
              loading="lazy"
              title="Messiah Inland Resort Location"
            />
          </div>
        </div>
      </section>

      <section className="landing-contact">
        <div className="landing-contact-content-main">
          <span className="landing-contact-eyebrow">Get in Touch</span>
          <div className="landing-contact-content">
            <h1>Contact Us</h1>
            <p>
              Have questions or need assistance? Our team is here to help.
              Reach out to us anytime!
            </p>
            <div className="contact-info">
              <p><i className="fa-solid fa-phone"></i> +63 912 345 6789</p>
              <p>
                <i className="fa-solid fa-envelope"></i>
                <a href="mailto:info@messiahresort.com">
                  info@messiahresort.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="landing-feedback">
          <h1>Tell us about your experience</h1>
          <p>
            Your feedback helps us improve and provide the best
            experience possible.
          </p>
          <form onSubmit={handleFeedbackSubmit}>
            <label>Name</label>
            <input type="text" name="name" placeholder="Your Name" value={feedback.name} onChange={handleFeedbackChange} required/>

            <label>Email</label>
            <input type="email" name="email" placeholder="Your Email" value={feedback.email} onChange={handleFeedbackChange} required/>

            <label>Message</label>
            <textarea className="message-box" name="message" placeholder="Your Message" value={feedback.message} onChange={handleFeedbackChange} required/>

            <button type="submit" className="landing-btn-feedback" disabled={submitting}>
              Submit
            </button>
          </form>
        </div>
      </section>

      <ViewLanding
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        booking={selectedBooking}
        onEdit={() => {
          setShowViewModal(false);
          setShowEditModal(true);
        }}
      />
      <LandingUpdate
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBooking(null);
          if (userEmail) fetchUserReservations(userEmail);
        }}
        booking={selectedBooking}
        onUpdate={() => {
          setShowEditModal(false);
          setSelectedBooking(null);
          if (userEmail) fetchUserReservations(userEmail);
        }}
      />

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <p className="landing-footer-brand">MESSIAH</p>
          
          <p>© 2026 Messiah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;