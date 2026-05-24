import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "../Modalscss/book_reservation_modal.css";


function BookReservationModal({ showModal, setShowModal, refreshData, roomId, roomPrice }) {
    const userEmail = localStorage.getItem('userEmail') || "";

  const getTodayISO = () => {
    const t = new Date();
    const year = t.getFullYear();
    const month = String(t.getMonth() + 1).padStart(2, '0');
    const day = String(t.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

    const [values, setValues] = useState({
        last_name: "",
        first_name: "",
        num_guests: "",
        phone_number: "",
        email: userEmail,
        check_in_date: "",
        check_out_date: "",
        notes: "",
        room_id: roomId || null,
        room_price: roomPrice || null
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues((prev) => ({
            ...prev,
            room_id: roomId || null,
            room_price: roomPrice || null,
            email: userEmail || prev.email
        }));
    }, [roomId, roomPrice, userEmail]);

    const closeModal = () => {
        setShowModal(false);
    };

    const handleCheckInDateChange = (e) => {
        const val = e.target.value;
        if (val && val < getTodayISO()) {
            Swal.fire({ icon: 'error', title: 'Invalid check-in', text: 'Check-in cannot be in the past.' });
            return;
        }
        setValues({ ...values, check_in_date: val });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
      const form = document.getElementById('bookReservationForm');
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const checkIn = values.check_in_date;
      const checkOut = values.check_out_date;
      if (checkIn) {
        const checkInDate = new Date(checkIn);
        const todayDate = new Date(getTodayISO());
        if (checkInDate < todayDate) {
          Swal.fire({ icon: 'error', title: 'Invalid check-in', text: 'Check-in cannot be in the past.' });
          return;
        }
      }
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate <= checkInDate) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid dates',
            text: 'Check-out must be later than check-in. Please choose valid dates.'
          });
          return;
        }
      }

        const normalizedPrice = roomPrice ? parseFloat(String(roomPrice).replace(/,/g, '')) : null;

        axios.post('http://localhost:3001/add_reservation', { 
            ...values, 
            room_id: roomId,
            room_price: normalizedPrice
        })
            .then((res) => {
                console.log("Success: ", res.data);
                Swal.fire({ icon: 'success', title: 'Saved', text: 'Reservation added successfully.' });
                setShowModal(false);
                setValues({
                    last_name: "",
                    first_name: "",
                    num_guests: "",
                    phone_number: "",
                    email: "",
                    check_in_date: "",
                    check_out_date: "",
                    notes: "",
                    room_id: null,
                    room_price: null
                });
                localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
                if (refreshData) refreshData();
            })
            .catch((err) => {
                console.error("Error sa pag-save: ", err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'May sala sa pag-save sang data!' });
            });
    };
    return (
      <div className={(showModal ? "book-reservation modal-visible" : "book-reservation modal-hidden")} id="modal">
            <div className="book-reservation-modal">
                <div className="book-reservation-modal-header">
                  <div>
                    <p className="book-reservation-modal-eyebrow">New Record</p>
                    <h2 className="book-reservation-modal-title">Book Reservation</h2>
                  </div>
                  <button className="book-reservation-modal-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <form id="bookReservationForm" className="book-reservation-modal-body" onSubmit={handleSubmit}>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                      <label>Last Name</label>
                      <input type="text" name="last_name" required onChange={(e)=> setValues({...values, last_name: e.target.value})} placeholder="e.g. Family Name" />
                    </div>
                    <div className="book-reservation-form-group">
                      <label>First Name</label>
                      <input type="text" name="first_name" required onChange={(e)=> setValues({...values, first_name: e.target.value})} placeholder="e.g. First Name" />
                    </div>
                  </div>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                      <label>No. of Guests</label>
                      <input type="number" name="num_guests" required onChange={(e)=> setValues({...values, num_guests: e.target.value})} placeholder="e.g. 2" />
                    </div>
                    <div className="book-reservation-form-group">
                      <label>Phone Number</label>
                      <input type="text" name="phone_number" required onChange={(e)=> setValues({...values, phone_number: e.target.value})} placeholder="e.g. 09XX XXX XXXX" />
                    </div>
                  </div>
                  <div className="book-reservation-form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={values.email}
                        onChange={(e)=> setValues({...values, email: e.target.value})}
                        placeholder="e.g. example@email.com"
                        disabled={Boolean(userEmail)}
                      />
                  </div>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                       <label>Check-in Date</label>
                      <input
                        type="date"
                        name="check_in_date"
                        required
                        value={values.check_in_date}
                        min={getTodayISO()}
                        onChange={handleCheckInDateChange}
                        className="book-input"
                      />
                    </div>
                    <div className="book-reservation-form-group">
                        <label>Check-out Date</label>
                        <input type="date" 
                          name="check_out_date" 
                          required 
                          min={values.check_in_date || ""} 
                          value={values.check_out_date} 
                          onChange={(e)=> setValues({...values, check_out_date: e.target.value})} 
                          className="book-input"
                        />
                      </div>
                  </div>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                      <label>Room Price</label>
                      <input type="text" disabled value={roomPrice ? `₱${roomPrice}` : "N/A"} className="book-input" />
                    </div>
                  </div>
                  <div className="book-reservation-form-group">
                    <label>Notes <span>Optional</span></label>
                    <textarea name="notes" rows="3" onChange={(e)=> setValues({...values, notes: e.target.value})} placeholder="..."></textarea>
                  </div>
                </form>
                <div className="book-reservation-modal-footer">
                  <button type="button" className="book-reservation-btn-cancel" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="book-reservation-btn-save" onClick={handleSubmit}>Save Reservation</button>
                </div>
              </div>
        </div>
    );
}   

export default BookReservationModal;
