import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import apiClient from '../api';
import '../Modalscss/event_booking_modal.css';

const initialForm = {
  event_name: '',
  guest_name: '',
  phone_number: '',
  start_date: '',
  end_date: '',
  time_in: '',
  time_out: '',
  guest_number: '',
  notes: '',
  discount: '',
  price: '',
  email: '',
};

function LandingEventModal({ show, onClose, room, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [eventRooms, setEventRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [functionRoomPickerOpen, setFunctionRoomPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    if (!show) return;

    const currentRoomId = room?.id;

    Promise.all([
      apiClient.get('/get_rooms'),
      apiClient.get('/get_reservations'),
      apiClient.get('/get_event_bookings'),
    ])
      .then(([roomsResponse, reservationsResponse, eventsResponse]) => {
        const today = new Date();
        const occupiedRoomIds = new Set();
        const isActiveStatus = (status) => ['confirmed', 'pending', 'occupied'].includes(String(status || '').trim().toLowerCase());

        (reservationsResponse.data || []).forEach((reservation) => {
          if (!reservation.room_id || !isActiveStatus(reservation.res_status)) return;
          const checkIn = new Date(reservation.check_in_date);
          const checkOut = new Date(reservation.check_out_date);
          if (!Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime()) && today >= checkIn && today < checkOut) {
            occupiedRoomIds.add(Number(reservation.room_id));
          }
        });

        (eventsResponse.data || []).forEach((eventBooking) => {
          if (!isActiveStatus(eventBooking.status)) return;
          const startDate = new Date(`${eventBooking.start_date}T00:00:00`);
          const endDate = new Date(`${eventBooking.end_date}T23:59:59`);
          if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || today < startDate || today > endDate) return;
          const roomIds = String(eventBooking.room_ids || eventBooking.rooms || '')
            .split(',')
            .map((roomId) => Number(roomId.trim()))
            .filter((roomId) => Number.isInteger(roomId) && roomId > 0);
          roomIds.forEach((roomId) => occupiedRoomIds.add(roomId));
        });

        const availableRooms = (roomsResponse.data || []).filter((item) => {
          const isCurrentRoom = currentRoomId != null && String(item.id) === String(currentRoomId);
          const isAvailable = String(item.room_status || '').trim().toLowerCase() === 'available';
          const isOccupied = occupiedRoomIds.has(Number(item.id));
          return !isOccupied && (isAvailable || isCurrentRoom);
        });

        setEventRooms(availableRooms);
      })
      .catch((error) => {
        console.error('Error fetching event rooms:', error);
        Swal.fire({ icon: 'error', title: 'Unable to load rooms', text: 'Please try again later.' });
      });
  }, [show, room]);

  useEffect(() => {
    setSelectedRoomIds(room?.id != null ? [String(room.id)] : []);
    setRoomPickerOpen(room?.id != null);
    setFunctionRoomPickerOpen(String(room?.room_type || '').toLowerCase() === 'event');
    setForm({
      ...initialForm,
      rooms: room?.room_name || room?.room_label || '',
      price: room?.room_price ?? '',
      email: userEmail,
    });
  }, [room, userEmail]);

  if (!show || !room) return null;

  const selectedRooms = eventRooms.filter((item) => selectedRoomIds.includes(String(item.id)));
  const selectedRoom = selectedRooms[0] || null;
  const guestCount = Number(form.guest_number) || 0;
  const roomPrice = selectedRooms.reduce((total, item) => total + (Number(item.room_price) || 0), 0);
  const exemptedGuests = selectedRooms.reduce((total, item) => {
    const roomType = String(item.room_type || '').toLowerCase();
    const roomText = `${item.room_name || ''} ${item.room_label || ''}`;
    if (roomType === 'family' || roomType === 'double' || roomType === 'couple') return total + 2;
    if (roomType === 'event') return total + (/big|large/i.test(roomText) ? 100 : 70);
    return total;
  }, 0);
  const chargeableGuests = Math.max(0, guestCount - exemptedGuests);
  const eventPrice = roomPrice + (chargeableGuests * 175);
  const eventDays = 1;
  const totalPrice = Math.max(0, (eventPrice * eventDays) - (Number(form.discount) || 0));

  const updateField = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'phone_number'
      ? value.replace(/\D/g, '').slice(0, 11)
      : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const handleRoomCheckboxChange = (eventRoom, checked) => {
    const roomId = String(eventRoom.id);
    setSelectedRoomIds((current) => checked
      ? [...new Set([...current, roomId])]
      : current.filter((id) => id !== roomId));
  };

  const closeModal = () => {
    setSelectedRoomIds([]);
    setRoomPickerOpen(false);
    setFunctionRoomPickerOpen(false);
    onClose();
  };

  const regularRooms = eventRooms.filter((item) => String(item.room_type || '').toLowerCase() !== 'event');
  const functionRooms = eventRooms.filter((item) => String(item.room_type || '').toLowerCase() === 'event');

  const renderRoomOptions = (rooms, emptyText) => (
    rooms.length === 0 ? (
      <p className="event-booking-room-empty">{emptyText}</p>
    ) : rooms.map((eventRoom) => {
      const roomType = String(eventRoom.room_type || '').toLowerCase();
      const roomName = eventRoom.room_name || eventRoom.room_label || 'Unnamed room';
      const roomPrice = Number(eventRoom.room_price);
      const roomDescription = roomType === 'event' ? 'Function room' : `${eventRoom.room_type || 'Room'} available`;

      return (
        <label className="event-booking-room-option" key={eventRoom.id}>
          <input
            type="checkbox"
            checked={selectedRoomIds.includes(String(eventRoom.id))}
            onChange={(event) => handleRoomCheckboxChange(eventRoom, event.target.checked)}
          />
          <span className="event-booking-room-option-copy">
            <strong>{roomName}</strong>
            <small>{roomDescription}</small>
          </span>
          {roomType !== 'event' && (
            <span className="event-booking-room-number">
              Room {eventRoom.room_number || eventRoom.id}
            </span>
          )}
          <span className="event-booking-room-option-price">
            {roomPrice > 0 ? `₱${roomPrice.toLocaleString('en-PH')}` : 'Price unavailable'}
          </span>
        </label>
      );
    })
  );

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const eventDate = form.start_date;
    if (form.start_date && form.time_out <= form.time_in) {
      Swal.fire({ icon: 'error', title: 'Invalid time', text: 'Time out must be later than time in.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/add_event_booking', {
        ...form,
        room_id: selectedRoom?.id || null,
        room_ids: selectedRoomIds,
        start_date: eventDate,
        end_date: eventDate,
        rooms: form.rooms || selectedRoom?.room_name || selectedRoom?.room_label || '',
        price: eventPrice,
        total_price: totalPrice,
        event_days: eventDays,
        discount: Number(form.discount) || 0,
        guest_number: Number(form.guest_number) || 0,
      });

      if (!response.data?.bookingId) {
        throw new Error('The booking was not saved. Please try again.');
      }

      Swal.fire({ icon: 'success', title: 'Booking submitted', text: 'Your event booking request has been saved.' });
      setSelectedRoomIds([]);
      setRoomPickerOpen(false);
      setFunctionRoomPickerOpen(false);
      if (onSaved) onSaved();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to save booking',
        text: error.response?.data?.error || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="event-booking-overlay" onClick={closeModal}>
      <div className="event-booking-modal" onClick={(event) => event.stopPropagation()}>
        <div className="event-booking-header">
          <div>
            <p className="event-booking-eyebrow">Event reservation</p>
            <h2>Book an event room</h2>
          </div>
          <button type="button" className="event-booking-close" onClick={closeModal} disabled={isSubmitting} aria-label="Close event booking form">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form id="event-booking-form" className="event-booking-body" onSubmit={submit}>
          <div className="event-booking-grid">
            <label>Event name <input name="event_name" required maxLength="120" value={form.event_name} onChange={updateField} placeholder="e.g. Birthday celebration" /></label>
            <label>Guest name<input name="guest_name" required maxLength="120" value={form.guest_name} onChange={updateField} placeholder="e.g. Juan Dela Cruz" /></label>
            <label>Phone number<input name="phone_number" required inputMode="numeric" pattern="09[0-9]{9}" maxLength="11" value={form.phone_number} onChange={updateField} placeholder="09XXXXXXXXX" /></label>
            <label>Number of guests<input name="guest_number" required type="number" min="1" max="10000" step="1" value={form.guest_number} onChange={updateField} placeholder="e.g. 50" /></label>
            <label>Email<input name="email" required maxLength="254" type="email" value={form.email} onChange={updateField} disabled={Boolean(userEmail)} /></label>
            <label>Date<div className="event-booking-date-time-wrap"><input className={form.start_date ? 'has-value' : ''} name="start_date" required type="date" min={new Date().toISOString().slice(0, 10)} value={form.start_date} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-calendar-days event-booking-date-time-icon" aria-hidden="true" /></div></label>
            <label>Time in<div className="event-booking-date-time-wrap"><input className={form.time_in ? 'has-value' : ''} name="time_in" required type="time" value={form.time_in} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-clock event-booking-date-time-icon" aria-hidden="true" /></div></label>
            <label>Time out<div className="event-booking-date-time-wrap"><input className={form.time_out ? 'has-value' : ''} name="time_out" required type="time" value={form.time_out} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-clock event-booking-date-time-icon" aria-hidden="true" /></div></label>
            <div className="event-booking-full event-booking-room-picker">
              <button
                type="button"
                className={`event-booking-room-toggle ${roomPickerOpen ? 'is-open' : ''}`}
                onClick={() => {
                  setRoomPickerOpen((isOpen) => !isOpen);
                }}
                aria-expanded={roomPickerOpen}
                aria-controls="event-booking-rooms-list"
              >
                <span>Rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() !== 'event') ? ' selected' : ''}</span>
                <i className={`fa-solid fa-chevron-${roomPickerOpen ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
              {roomPickerOpen && <div id="event-booking-rooms-list" className="event-booking-room-list">{renderRoomOptions(regularRooms, 'No available rooms found.')}</div>}
            </div>
            <div className="event-booking-full event-booking-room-picker">
              <button
                type="button"
                className={`event-booking-room-toggle ${functionRoomPickerOpen ? 'is-open' : ''}`}
                onClick={() => {
                  setFunctionRoomPickerOpen((isOpen) => !isOpen);
                }}
                aria-expanded={functionRoomPickerOpen}
                aria-controls="event-booking-function-rooms-list"
              >
                <span>Function rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() === 'event') ? ' selected' : ''}</span>
                <i className={`fa-solid fa-chevron-${functionRoomPickerOpen ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
              {functionRoomPickerOpen && <div id="event-booking-function-rooms-list" className="event-booking-room-list">{renderRoomOptions(functionRooms, 'No available function rooms found.')}</div>}
            </div>
            <label className="event-booking-full">Notes<textarea name="notes" rows="3" maxLength="2000" value={form.notes} onChange={updateField} placeholder="Additional event details" /></label>
          </div>

        </form>

        <div className="event-booking-price-summary" aria-label="Event booking total price">
              <div className="event-booking-price-item">
                <div className="event-booking-price-icon total">
                  <i className="fa-solid fa-receipt" aria-hidden="true" />
                </div>
                <div>
                  <p className="event-booking-price-label">Total price ({eventDays} {eventDays === 1 ? 'day' : 'days'})</p>
                  <p className="event-booking-price-value total">₱{totalPrice.toLocaleString('en-PH')}</p>
                </div>
              </div>
        </div>

        <div className="event-booking-footer">
          <button type="button" className="event-booking-cancel" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="event-booking-form" className="event-booking-submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Book event'}</button>
        </div>
      </div>
    </div>
  );
}

export default LandingEventModal;
