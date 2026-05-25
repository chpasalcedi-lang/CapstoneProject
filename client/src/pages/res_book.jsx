import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../pagescss/res_book.css"; 
import BookReservationModal from "../Modals/book_reservation_modal.jsx";
import "../pagescss/landing_page.css";

function ResBook() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const [BookshowModal, setBookShowModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleProfile = () => setProfileOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setProfileOpen(false);
    navigate('/Login');
  };

  const handleBookClick = (room) => {
    if (!userEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Login required',
        text: 'Please log in with your email before booking.',
      }).then(() => {
        navigate('/Login');
      });
      return;
    }

    setSelectedRoomId(room.id);
    setSelectedRoomPrice(room.room_price);
    setBookShowModal(true);
  };

  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu = () => setMenuOpen(false);

    const fetchData = () => {
        axios.get('http://localhost:3001/get_rooms')
            .then((res) => {
                setData(res.data);
                setFilteredData(res.data); 
            })
            .catch((err) => console.error("Error sa pagkuha sang data: ", err));
    };

    const checkAvailability = () => {
        let filtered = data.filter(room => room.room_status === 'available');
        
        if (roomType) {
            filtered = filtered.filter(room => room.room_type?.toLowerCase() === roomType.toLowerCase());
        }

        setFilteredData(filtered);
    };

    const handleCheckInChange = (e) => {
      const val = e.target.value;
      const today = new Date().toISOString().slice(0,10);
      if (val && val < today) {
        Swal.fire({ icon: 'error', title: 'Invalid date', text: 'Check-in cannot be in the past.' });
        return;
      }
      setCheckIn(val);
      if (val && checkOut && checkOut <= val) {
        setCheckOut('');
        Swal.fire({ icon: 'info', title: 'Check-out reset', text: 'Please choose a check-out date after the new check-in.' });
      }
    };

    const handleCheckOutChange = (e) => {
      const val = e.target.value;
      if (checkIn) {
        if (val <= checkIn) {
          Swal.fire({ icon: 'error', title: 'Invalid date', text: 'Check-out must be after check-in.' });
          return;
        }
      } else {
        const today = new Date().toISOString().slice(0,10);
        if (val < today) {
          Swal.fire({ icon: 'error', title: 'Invalid date', text: 'Check-out cannot be in the past.' });
          return;
        }
      }
      setCheckOut(val);
    };

    useEffect(() => {
        fetchData();
    }, []);

  
  return (
    <div className="res-book-container">
      <nav className="landing-navbar">
        <div className="landing-nav-content">
            <div className="logo">
              <h1>MESSIAH</h1>
            </div>

            <ul className="landing-nav-links">
              <li><Link to="/Home">Home</Link></li>
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
                        <div className="profile-dropdown-avatar">
                          <i className="fa-solid fa-circle-user"></i>
                        </div>
                        <div className="profile-dropdown-email">{userEmail}</div>
                      </div>
                      <div className="profile-dropdown-divider"/>

                      <button className="profile-dropdown-item profile-dropdown-logout" onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/Login">
                  <button className="landing-btn">
                    sign in
                  </button>
                </Link>
              )}
              <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen}>
                <i className={`fa-solid ${menuOpen ? "fa-x" : "fa-bars"}`}></i>
              </button>
            </div>
        </div>

        <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/Reservation" onClick={closeMenu}>Room</Link>
          <a href="#about-pool" onClick={closeMenu}>About</a>
        </div>
      </nav>

      <section className="booking-calendar">
        <div className="booking-calendar-content">
          <div className="booking-text">
            <span className="booking-eyebrow">Find Your Perfect Room</span>
            <h1>Room <strong>Availability</strong></h1>
          </div>
       
          <div className="booking-search-wrap">
            <div className="booking-search-bar">
              <div className="booking-field">
                <label className="booking-field-label">Check-In</label>
                <input type="date" className="booking-input" value={checkIn} 
                min={new Date().toISOString().slice(0,10)} 
                onChange={handleCheckInChange} 
                placeholder="Select check-in date"/>
              </div>

              <div className="booking-field">
                <label className="booking-field-label">Check-Out</label>
                <input type="date" className="booking-input" value={checkOut} 
                  min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })() : new Date().toISOString().slice(0,10)}
                  onChange={handleCheckOutChange}
                  placeholder="Select check-out date"/>
              </div>

              <div className="booking-field">
                <label className="booking-field-label">Room Type</label>
                <select className="booking-input booking-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="family">Family Room</option>
                  <option value="double">Double Room</option>
                  <option value="event">Event Room</option>
                </select>
              </div>
              <div className="booking-field">
                <button className="booking-btn" onClick={checkAvailability}>
                  check availability
                </button>
              </div>
            </div>
          </div>
        </div> 
      </section>
     
      <section className="booking-results-area">
        <div className="booking-results-content">
          {filteredData.length === 0 ? (
              <div className="booking-results-grid booking-empty">
                <p>No rooms available for your selected dates and type.</p>
              </div>
            ) : (
              <div className="booking-results-grid">
                  {filteredData.map((room) => (
                    <div className="booking-room-card" key={room.id}>
                      <div className="booking-room-card-img">
                        <img src={room.room_image} alt={room.room_name} />
                        <span className="booking-room-badge">{room.room_status}</span>
                        {room.room_type?.toLowerCase() !== 'event' && (
                            <span className="rooms-room-rating">Room : {room.room_number}</span>
                        )}
                      </div>
                      <div className="booking-room-card-body">
                        <h3>{room.room_name}</h3>
                        <p>{room.room_label}</p>
                        <div className="booking-room-card-footer">
                          <div className="booking-room-price">
                            <span className="booking-room-price-amount">₱{room.room_price}</span>
                            <span className="booking-room-price-night">per night</span>
                          </div>
                          <button className="booking-room-book-btn" onClick={() => handleBookClick(room)}>Book now</button>
                        </div>
                      </div>
                    </div>
                  )) }
                </div>
              )}
        </div>
      </section>
      <BookReservationModal showModal={BookshowModal} setShowModal={setBookShowModal} roomId={selectedRoomId} roomPrice={selectedRoomPrice} />
    </div>
  );
}   

export default ResBook;