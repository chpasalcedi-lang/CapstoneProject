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

function landingEventModal({ show, onClose, room, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [eventRooms, setEventRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    if (!show) return;
    apiClient.get('/get_rooms')
      .then((response) => {
        const availableEventRooms = (response.data || []).filter((item) => (
          String(item.room_type || '').toLowerCase() === 'event'
          && (String(item.room_status || '').toLowerCase() === 'available' || item.id === room?.id)
        ));
        setEventRooms(availableEventRooms);
      })
      .catch((error) => console.error('Error fetching event rooms:', error));

    setSelectedRoomId(room?.id ? String(room.id) : '');
    setForm({
      ...initialForm,
      rooms: room?.room_name || room?.room_label || '',
      price: room?.room_price ?? '',
      email: userEmail,
    });
  }, [show, room, userEmail]);

  if (!show || !room) return null;

  const selectedRoom = eventRooms.find((item) => String(item.id) === selectedRoomId) || room;
  const eventPrice = Number(selectedRoom.room_price ?? form.price) || 0;
  const eventDays = 1;
  const totalPrice = Math.max(0, (eventPrice * eventDays) - (Number(form.discount) || 0));

  const updateField = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'phone_number'
      ? value.replace(/\D/g, '').slice(0, 11)
      : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const handleRoomChange = (event) => {
    const nextRoomId = event.target.value;
    const nextRoom = eventRooms.find((item) => String(item.id) === nextRoomId);
    setSelectedRoomId(nextRoomId);
    setForm((current) => ({
      ...current,
      rooms: nextRoom?.room_name || nextRoom?.room_label || '',
      price: nextRoom?.room_price ?? '',
    }));
  };

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
      const availability = await apiClient.get('/check_event_booking_availability', {
        params: {
          room_id: selectedRoom.id,
          start_date: eventDate,
          end_date: eventDate,
        },
      });

      if (availability.data?.available !== true) {
        Swal.fire({
          icon: 'warning',
          title: 'Event room unavailable',
          text: 'This event room is already booked for the selected dates.',
        });
        return;
      }

      const response = await apiClient.post('/add_event_booking', {
        ...form,
        room_id: selectedRoom.id,
        start_date: eventDate,
        end_date: eventDate,
        rooms: form.rooms || selectedRoom.room_name || selectedRoom.room_label || '',
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
    <div className="event-booking-overlay" onClick={onClose}>
      <div className="event-booking-modal" onClick={(event) => event.stopPropagation()}>
        <div className="event-booking-header">
          <div>
            <p className="event-booking-eyebrow">Event reservation</p>
            <h2>Book an event room</h2>
          </div>
          <button type="button" className="event-booking-close" onClick={onClose} disabled={isSubmitting} aria-label="Close event booking form">
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
            <label className="event-booking-full">Function room<select name="room_id" value={selectedRoomId} onChange={handleRoomChange}>
              <option value="">Select a function room</option>
              {eventRooms.map((eventRoom) => {
                const roomText = `${eventRoom.room_name || eventRoom.room_label || ''}`.toLowerCase();
                const roomSize = /big|large/i.test(roomText) ? 'Big Function Room' : 'Small Function Room';
                return (
                  <option key={eventRoom.id} value={String(eventRoom.id)}>
                    {roomSize} - ₱{Number(eventRoom.room_price || 0).toLocaleString('en-PH')}
                  </option>
                );
              })}
            </select></label>
            <label className="event-booking-full">Notes<textarea name="notes" rows="3" maxLength="2000" value={form.notes} onChange={updateField} placeholder="Additional event details" /></label>
          </div>

        </form>

        <div className="event-booking-price-summary" aria-label="Event booking price summary">
              <div className="event-booking-price-item">
                <div className="event-booking-price-icon">
                  <i className="fa-solid fa-building" aria-hidden="true" />
                </div>
                <div>
                  <p className="event-booking-price-label">Event room price / day</p>
                  <p className="event-booking-price-value">₱{eventPrice.toLocaleString('en-PH')}</p>
                </div>
              </div>
              <div className="event-booking-price-divider" aria-hidden="true" />
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
          <button type="button" className="event-booking-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="event-booking-form" className="event-booking-submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Book event'}</button>
        </div>
      </div>
    </div>
  );
}

export default landingEventModal;
