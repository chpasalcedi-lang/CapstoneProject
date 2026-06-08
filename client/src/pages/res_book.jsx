import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../pagescss/res_book.css"; 
import BookReservationModal from "../Modals/book_reservation_modal.jsx";
import ViewLanding from "../Modals/view_landing.jsx";
import LandingUpdate from "../Modals/landingUpdate.jsx";
import "../pagescss/landing_page.css";

function ResBook() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const [BookshowModal, setBookShowModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(null);
  const [data, setData] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingTimer = useRef(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userReservations, setUserReservations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const toggleProfile = () => {
    if (!profileOpen && userEmail) {
      fetchUserReservations(userEmail);
    }
    setProfileOpen((prev) => !prev);
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
      setUserReservations(userReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setUserReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adminUser');
    setProfileOpen(false);
    navigate('/Login');
  };

  const isDateOverlap = (startA, endA, startB, endB) => {
    return startA < endB && startB < endA;
  };

  const isRoomUnavailableForRange = (room, startDate, endDate) => {
    if (!room?.id || !startDate || !endDate) return false;
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    return reservations.some((r) => {
      if (!r.room_id) return false;
      if (Number(r.room_id) !== Number(room.id)) return false;
      const status = (r.res_status || '').toLowerCase();
      if (status !== 'confirmed' && status !== 'pending') return false;
      const reservationStart = new Date(r.check_in_date);
      const reservationEnd = new Date(r.check_out_date);
      return isDateOverlap(rangeStart, rangeEnd, reservationStart, reservationEnd);
    });
  };

  const handleBookClick = (room) => {
    // Check if room is under maintenance
    if (room.room_status?.toLowerCase() === 'maintenance') {
      Swal.fire({
        icon: 'warning',
        title: 'Room Under Maintenance',
        text: 'This room is currently under maintenance and is not available for booking.',
      });
      return;
    }

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

    const hasSelectedDates = checkIn && checkOut;
    const isCurrentlyOccupied = room.room_status === 'Occupied';

    if (room.room_status?.toLowerCase() === 'maintenance') {
      Swal.fire({
        icon: 'warning',
        title: 'Room Under Maintenance',
        text: 'This room is currently under maintenance and is not available for booking.',
      });
      return;
    }

    if (isCurrentlyOccupied) {
      Swal.fire({
        icon: 'warning',
        title: 'Room unavailable',
        text: 'Sorry, this room is not available. Please choose other dates using the check availability form above.',
      });
      return;
    }

    if (hasSelectedDates && isRoomUnavailableForRange(room, checkIn, checkOut)) {
      Swal.fire({
        icon: 'warning',
        title: 'Room unavailable',
        text: 'Sorry, this room is not available for the selected dates. Please choose other dates using the check availability form above.',
      });
      return;
    }

    setSelectedRoomId(room.id);
    setSelectedRoomPrice(room.room_price);
    setSelectedRoomNumber(room.room_number || null);
    setBookShowModal(true);
  };


  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu = () => setMenuOpen(false);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const fetchData = useCallback(() => {
      setLoading(true);
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
        loadingTimer.current = null;
      }

      // show cached data first to avoid empty results on refresh
      const cached = localStorage.getItem('roomsCache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
          setFilteredData(parsed);
        } catch (e) {
          console.warn('roomsCache parse error', e);
        }
      }

      axios.get('http://localhost:3001/get_rooms')
        .then((roomsRes) => {
          const rooms = roomsRes.data || [];
          setData(rooms);
          try { localStorage.setItem('roomsCache', JSON.stringify(rooms)); } catch (e) { console.warn('roomsCache set error', e); }

          const mapped = rooms.map((room) => {
            if (room.room_status?.toLowerCase() === 'maintenance') {
              return {
                ...room,
                room_status: 'Maintenance',
                _isMaintenance: true
              };
            }
            return room;
          });

          axios.get('http://localhost:3001/get_reservations')
            .then((rres) => {
              const reservationsList = rres.data || [];
              setReservations(reservationsList);
              const today = new Date();
              const occupiedRoomIds = new Set();
              reservationsList.forEach((r) => {
                if (!r.room_id) return;
                const status = (r.res_status || '').toLowerCase();
                if (status !== 'confirmed' && status !== 'pending') return;
                const rStart = new Date(r.check_in_date);
                const rEnd = new Date(r.check_out_date);
                if (today >= rStart && today < rEnd) occupiedRoomIds.add(Number(r.room_id));
              });

              const finalMapped = mapped.map((room) => {
                if (room._isMaintenance) {
                  return room;
                }
                return {
                  ...room,
                  room_status: occupiedRoomIds.has(Number(room.id)) ? 'Occupied' : 'Available',
                  _isAvailable: !occupiedRoomIds.has(Number(room.id))
                };
              });
              setFilteredData(finalMapped);
            })
            .catch((err) => {
              console.error('Error fetching reservations for initial occupancy:', err);
              const defaultMapped = mapped.map((room) => {
                if (room._isMaintenance) return room;
                return { ...room, room_status: 'Available', _isAvailable: true };
              });
              setReservations([]);
              setFilteredData(defaultMapped);
            });
        })
        .catch((err) => console.error("Error sa pagkuha sang data: ", err))
        .finally(() => {
          // keep loading visible for 5 seconds before revealing cards
          if (loadingTimer.current) clearTimeout(loadingTimer.current);
          loadingTimer.current = setTimeout(() => {
            setLoading(false);
            loadingTimer.current = null;
          }, 1000);
        });
    }, []);

    const checkAvailability = () => {
      const normalizedType = roomType?.trim().toLowerCase();
      const hasDateRange = Boolean(checkIn && checkOut);
      const updated = data
        .map((room) => {
          const normalizedRoom = room.room_status?.toLowerCase() === 'maintenance'
            ? { ...room, room_status: 'Maintenance', _isMaintenance: true }
            : room;

          if (normalizedRoom._isMaintenance) {
            return normalizedRoom;
          }

          if (hasDateRange && isRoomUnavailableForRange(normalizedRoom, checkIn, checkOut)) {
            return {
              ...normalizedRoom,
              room_status: 'Occupied'
            };
          }

          return {
            ...normalizedRoom,
            room_status: normalizedRoom.room_status?.toLowerCase() === 'occupied' ? 'Occupied' : 'Available'
          };
        });

      const filtered = normalizedType
        ? updated.filter((room) => {
            const rt = (room.room_type || '').toLowerCase();
            return rt.includes(normalizedType);
          })
        : updated;

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
        return () => {
          if (loadingTimer.current) {
            clearTimeout(loadingTimer.current);
            loadingTimer.current = null;
          }
        };
    }, [fetchData]);

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
    <div className="res-book-container">
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
                        ) : userReservations.length === 0 ? (
                          <p className="profile-credentials-empty">No reservations found</p>
                        ) : (
                          userReservations.map((booking) => (
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
                                {(!booking.res_status || booking.res_status.toLowerCase() !== 'confirmed') && (
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
          <Link to="/Home" onClick={() => { closeMenu(); scrollToTop(); }}>Home</Link>
          <Link to="/Reservation" onClick={closeMenu}>Room</Link>
          <Link to="/Home#about-pool" onClick={closeMenu}>About</Link>
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
          {loading ? (
            <div className="booking-loading">Loading rooms...</div>
          ) : filteredData.length === 0 ? (
            <div className="booking-results-grid booking-empty">
              <div>
                <h2>No rooms available</h2>
                <p>Try a different date range or room type to see available rooms.</p>
              
              </div>
            </div>
          ) : (
            <div className="booking-results-grid">
                {filteredData.map((room) => {
                  const hasSelectedDates = Boolean(checkIn && checkOut);
                  const isUnavailable = room.room_status === 'Occupied' || room._isMaintenance;
                  return (
                  <div className="booking-room-card" key={room.id}>
                      <div className="booking-room-card-img">
                        <img src={room.room_image} alt={room.room_name} />
                        <span className={`booking-room-status ${room.room_status === 'Occupied' ? 'occupied' : room.room_status === 'Maintenance' ? 'maintenance' : 'available'}`}>
                          {room.room_status || 'Available'}
                        </span>
                        {room.room_type?.toLowerCase() !== 'event' && (
                            <span className="booking-room-rating">Room : {room.room_number}</span>
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
                          <button
                            className={`booking-room-book-btn ${isUnavailable ? 'booking-room-book-btn-unavailable' : ''}`}
                            onClick={() => handleBookClick(room)}
                            title={isUnavailable ? 'This room is not available. Please choose other dates using the check availability form above.' : 'Book this room'}
                          >
                            Book now
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }) }
                </div>
              )}
        </div>
      </section>
      <BookReservationModal showModal={BookshowModal} setShowModal={setBookShowModal} roomId={selectedRoomId} roomPrice={selectedRoomPrice} roomNumber={selectedRoomNumber} refreshData={fetchData} />
      
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
    </div>
  );
}   

export default ResBook;