import React, { useState, useEffect, useMemo } from "react";
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

  const getTomorrowISO = (dateValue) => {
    const baseDate = dateValue ? new Date(dateValue) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onlyDigits = (input) => String(input || '').replace(/\D/g, '');

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
    const calculateTotalPrice = (checkIn, checkOut, price) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nightlyRate = price !== undefined && price !== null ? parseFloat(String(price).replace(/,/g, '')) : NaN;
        if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(nightlyRate)) {
            return null;
        }
        const nights = Math.max(1, Math.ceil((end - start) / 86400000));
        return Number.isFinite(nightlyRate) ? nightlyRate * nights : null;
    };

    const totalPrice = useMemo(() => calculateTotalPrice(values.check_in_date, values.check_out_date, roomPrice), [values.check_in_date, values.check_out_date, roomPrice]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target.closest('form') || document.getElementById('bookReservationForm');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const requiredFields = [
            'last_name',
            'first_name',
            'num_guests',
            'phone_number',
            'email',
            'check_in_date',
            'check_out_date'
        ];

        const missingField = requiredFields.some((field) => {
            const value = values[field];
            return value === undefined || value === null || String(value).trim() === '';
        });

        if (missingField) {
            Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please fill all required fields.' });
            return;
        }

        const checkIn = new Date(values.check_in_date);
        const checkOut = new Date(values.check_out_date);
        const today = new Date(getTodayISO());

        if (checkIn < today) {
            Swal.fire({ icon: 'error', title: 'Invalid check-in', text: 'Check-in cannot be in the past.' });
            return;
        }

        if (checkOut <= checkIn) {
            Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'Check-out cannot be earlier than check-in. Please choose valid dates.' });
            return;
        }

        const normalizedPrice = roomPrice ? parseFloat(String(roomPrice).replace(/,/g, '')) : null;

        try {
            const response = await axios.post('http://localhost:3001/add_reservation', {
                ...values,
                room_id: roomId,
                room_price: normalizedPrice,
                total_price: totalPrice
            });

            console.log('Success:', response.data);
            Swal.fire({ icon: 'success', title: 'Saved', text: 'Reservation added successfully.' });
            setShowModal(false);
            setValues({
                last_name: '',
                first_name: '',
                num_guests: '',
                phone_number: '',
                email: userEmail || '',
                check_in_date: '',
                check_out_date: '',
                notes: '',
                room_id: null,
                room_price: null
            });
            localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
            if (refreshData) refreshData();
        } catch (err) {
            console.error('Error saving reservation:', err);
            const message = err.response?.data?.error || err.message || 'Failed to save reservation.';
            Swal.fire({ icon: 'error', title: 'Error', text: message });
        }
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
                      <input type="text" name="last_name" required value={values.last_name} onChange={(e)=> setValues({...values, last_name: e.target.value})} placeholder="e.g. Family Name"/>
                    </div>
                    <div className="book-reservation-form-group">
                      <label>First Name</label>
                      <input type="text" name="first_name" required value={values.first_name} onChange={(e)=> setValues({...values, first_name: e.target.value})} placeholder="e.g. First Name"/>
                    </div>
                  </div>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                      <label>No. of Guests</label>
                      <input type="number" name="num_guests" required min="1" value={values.num_guests} onChange={(e)=> setValues({...values, num_guests: e.target.value})} placeholder="e.g. 2"/>
                    </div>
                    <div className="book-reservation-form-group">
                      <label>Phone Number</label>
                      <input type="tel" name="phone_number" required inputMode="numeric" pattern="\d{11}" maxLength={11} value={values.phone_number || ''} 
                        onChange={(e) => setValues({ ...values, phone_number: onlyDigits(e.target.value) })} placeholder="e.g. 09XXXXXXXXX"/>
                    </div>
                  </div>
                  <div className="book-reservation-form-group">
                      <label>Email</label>
                      <input type="email" name="email" required value={values.email} onChange={(e)=> setValues({...values, email: e.target.value})} placeholder="e.g. example@email.com" disabled={Boolean(userEmail)}/>
                  </div>
                  <div className="book-reservation-form-row">
                    <div className="book-reservation-form-group">
                       <label>Check-in Date</label>
                      <input type="date" value={values.check_in_date} min={getTodayISO()} onChange={handleCheckInDateChange} className="book-input" />
                    </div>
                    <div className="book-reservation-form-group">
                        <label>Check-out Date</label>
                        <input
                          type="date"
                          name="check_out_date"
                          required
                          min={values.check_in_date ? getTomorrowISO(values.check_in_date) : getTomorrowISO()}
                          value={values.check_out_date}
                          onChange={(e)=> setValues({...values, check_out_date: e.target.value})}
                          className="book-input"
                        />
                      </div>
                  </div>
                  
                  <div className="book-reservation-form-group">
                    <label>Notes <span>Optional</span></label>
                    <textarea name="notes" rows="3" value={values.notes} onChange={(e)=> setValues({...values, notes: e.target.value})} placeholder="...">

                    </textarea>
                  </div>
                </form>
                <div>
                  <div className="book-reservation-form-price">
                    <div className="book-reservation-price-item">
                      <div className="book-reservation-price-icon">
                        <i className="fa-solid fa-building" />
                      </div>
                      <div>
                        <p className="book-reservation-price-label">Room price / night</p>
                        <p className="book-reservation-price-value">
                          {roomPrice ? `₱${roomPrice}` : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="book-reservation-price-divider" />
                    <div className="book-reservation-price-item">
                      <div className="book-reservation-price-icon total">
                        <i className="fa-solid fa-receipt" />
                      </div>
                      <div>
                        <p className="book-reservation-price-label">
                          Total {values.check_in_date && values.check_out_date
                            ? `(${Math.max(1, Math.ceil((new Date(values.check_out_date) - new Date(values.check_in_date)) / 86400000))} nights)`
                            : ""}
                        </p>
                        <p className="book-reservation-price-value total">
                          {totalPrice ? `₱${totalPrice.toLocaleString()}` : "₱0"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="book-reservation-modal-footer">
                  <button type="button" className="book-reservation-btn-cancel" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="book-reservation-btn-save" form="bookReservationForm">Save Reservation</button>
                </div>
              </div>
        </div>
    );
}   

export default BookReservationModal;
