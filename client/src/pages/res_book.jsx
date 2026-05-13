import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../pagescss/res_book.css"; 
import BookReservationModal from "../Modals/book_reservation_modal.jsx";
import NoRoomsModal from "../Modals/no_rooms_modal.jsx";
import "../pagescss/landing_page.css";

function ResBook() {

  const [BookshowModal, setBookShowModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');

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

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Auto-filter when room type changes
        checkAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomType, data]);

    useEffect(() => {
        // Show modal when no results found
        if (checkIn && checkOut && filteredData.length === 0) {
            setShowNoResultsModal(true);
        }
    }, [filteredData, checkIn, checkOut]);

  return (
    <div>
      <nav className="landing-navbar">
        <div className="landing-nav-content">
            <div className="logo">
            <h1>MESSIAH</h1>
            </div>
            <ul className="landing-nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/Reservation">Room</Link></li>
            <li><Link to="/About">About</Link></li>
            <li>
                <button className="landing-btn">
                    sign in
                </button>
            </li>
            </ul>
        </div>
    </nav>

      <section className="booking-calendar">
        <div className="booking-text">
          <span className="booking-eyebrow">Find Your Perfect Room</span>
          <h1>Room <strong>Availability</strong></h1>
        </div>
     
        <div className="booking-search-wrap">
          <div className="booking-search-bar">
            <div className="booking-field">
              <label className="booking-field-label">Check-In</label>
              <input type="date" className="booking-input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} placeholder="Select check-in date"/>
            </div>

            <div className="booking-field">
              <label className="booking-field-label">Check-Out</label>
              <input type="date" className="booking-input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} placeholder="Select check-out date"/>
            </div>

            <div className="booking-field">
              <label className="booking-field-label">Room Type</label>
              <select 
                className="booking-input booking-select"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
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
      </section>
      <div className="booking-results-area">
          {filteredData.length === 0 ? (
            <div className="booking-results-grid"></div>
          ) : (
            <div className="booking-results-grid">
               {filteredData.map((room) => (
                <div className="booking-room-card" key={room.id}>
                  <div className="booking-room-card-img">
                    <img src={room.room_image} alt={room.room_name} />
                    <span className="booking-room-badge">{room.room_status}</span>
                    <span className="booking-room-rating">Room : {room.room_number}</span>
                  </div>
                  <div className="booking-room-card-body">
                    <h3>{room.room_name}</h3>
                    <p>{room.room_label}</p>
                    <div className="booking-room-card-footer">
                      <div className="booking-room-price">
                        <span className="booking-room-price-amount">₱{room.room_price}</span>
                        <span className="booking-room-price-night">per night</span>
                      </div>
                      <button className="booking-room-book-btn" onClick={() => { setSelectedRoomId(room.id); setSelectedRoomPrice(room.room_price); setBookShowModal(true); }}>Book Now</button>
                    </div>
                  </div>
                </div>
              )) }
            </div>
          )}
      </div>
      <BookReservationModal showModal={BookshowModal} setShowModal={setBookShowModal} roomId={selectedRoomId} roomPrice={selectedRoomPrice} />
      <NoRoomsModal showModal={showNoResultsModal} setShowModal={setShowNoResultsModal} />
    </div>
  );
}   

export default ResBook;