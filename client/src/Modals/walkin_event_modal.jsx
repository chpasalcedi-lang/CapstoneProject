import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import apiClient from '../api';
import '../Modalscss/walkin_event_modal.css';

const initialForm = {
  event_name: '',
  guest_name: '',
  phone_number: '',
  email: '',
  start_date: '',
  end_date: '',
  time_in: '',
  time_out: '',
  guest_number: '',
  notes: '',
  discount: '',
};

function WalkinEventModal({ show, onClose, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [eventRooms, setEventRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [functionRoomsOpen, setFunctionRoomsOpen] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;

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
          const isAvailable = String(item.room_status || '').trim().toLowerCase() === 'available';
          const isOccupied = occupiedRoomIds.has(Number(item.id));
          return !isOccupied && isAvailable;
        });
        setEventRooms(availableRooms);
      })
      .catch(() => {
        Swal.fire({ icon: 'error', title: 'Unable to load rooms', text: 'Please try again later.' });
      });
  }, [show]);

  useEffect(() => {
    if (!show) return;
    setForm(initialForm);
    setSelectedRoomIds([]);
    setRoomsOpen(false);
    setFunctionRoomsOpen(false);
    setDiscountEnabled(false);
  }, [show]);

  if (!show) return null;

  const selectedRooms = eventRooms.filter((item) => selectedRoomIds.includes(String(item.id)));
  const regularRooms = eventRooms.filter((item) => String(item.room_type || '').toLowerCase() !== 'event');
  const functionRooms = eventRooms.filter((item) => String(item.room_type || '').toLowerCase() === 'event');
  const guestCount = Number(form.guest_number) || 0;
  const roomPrice = selectedRooms.reduce((total, item) => total + (Number(item.room_price) || 0), 0);
  const exemptedGuests = selectedRooms.reduce((total, item) => {
    const roomType = String(item.room_type || '').toLowerCase();
    const roomText = `${item.room_name || ''} ${item.room_label || ''}`;
    if (roomType === 'family' || roomType === 'double' || roomType === 'couple') return total + 2;
    if (roomType === 'event') return total + (/big|large/i.test(roomText) ? 100 : 70);
    return total;
  }, 0);
  const eventDays = form.start_date && form.end_date
    ? Math.max(1, Math.round((new Date(`${form.end_date}T00:00:00`) - new Date(`${form.start_date}T00:00:00`)) / 86400000) + 1)
    : 1;
  const eventPrice = roomPrice + (Math.max(0, guestCount - exemptedGuests) * 175);
  const totalPrice = eventPrice * eventDays;
  const lastPriceValue = Number(form.discount) || 0;
  const finalPrice = discountEnabled
    ? Math.min(totalPrice, lastPriceValue)
    : totalPrice;
  const discountSaved = discountEnabled ? Math.max(0, totalPrice - finalPrice) : 0;
  const discountPercent = totalPrice > 0 ? (discountSaved / totalPrice) * 100 : 0;

  const updateField = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'phone_number' ? value.replace(/\D/g, '').slice(0, 11) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const handleDiscountToggle = (event) => {
    const enabled = event.target.checked;
    setDiscountEnabled(enabled);
    if (!enabled) setForm((current) => ({ ...current, discount: '' }));
  };

  const toggleRoom = (room, checked) => {
    const roomId = String(room.id);
    setSelectedRoomIds((current) => checked
      ? [...new Set([...current, roomId])]
      : current.filter((id) => id !== roomId));
  };

  const renderRoomOptions = (rooms, emptyText) => rooms.length === 0 ? (
    <p className="event-booking-room-empty">{emptyText}</p>
  ) : rooms.map((eventRoom) => (
    <label className="event-booking-room-option" key={eventRoom.id}>
      <input
        type="checkbox"
        checked={selectedRoomIds.includes(String(eventRoom.id))}
        onChange={(event) => toggleRoom(eventRoom, event.target.checked)}
      />
      <span className="event-booking-room-option-copy">
        <strong>{eventRoom.room_name || eventRoom.room_label || 'Unnamed room'}</strong>
        <small>{String(eventRoom.room_type || '').toLowerCase() === 'event' ? 'Function room' : `${eventRoom.room_type || 'Room'} available`}</small>
      </span>
      {String(eventRoom.room_type || '').toLowerCase() !== 'event' && (
        <span className="event-booking-room-number">Room {eventRoom.room_number || eventRoom.id}</span>
      )}
      <span className="event-booking-room-option-price">
        {Number(eventRoom.room_price) > 0 ? `PHP ${Number(eventRoom.room_price).toLocaleString('en-PH')}` : 'Price unavailable'}
      </span>
    </label>
  ));

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (form.time_out <= form.time_in) {
      Swal.fire({ icon: 'error', title: 'Invalid time', text: 'Time out must be later than time in.' });
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'End date must not be earlier than start date.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const firstRoom = selectedRooms[0];
      const response = await apiClient.post('/add_event_booking', {
        ...form,
        end_date: form.end_date || form.start_date,
        room_id: firstRoom?.id || null,
        room_ids: selectedRoomIds,
        rooms: selectedRooms.map((item) => item.room_name || item.room_label).join(', '),
        price: eventPrice,
        total_price: finalPrice,
        discount: discountSaved,
        event_days: eventDays,
        source: 'walkin',
        status: 'confirmed',
      });

      if (!response.data?.bookingId) throw new Error('The booking was not saved.');
      Swal.fire({ icon: 'success', title: 'Walk-in event saved', text: 'The event booking was added successfully.' });
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Unable to save booking', text: error.response?.data?.error || 'Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <div className="walkin-event-booking-overlay" onClick={close}>
      <div className="event-booking-modal" onClick={(event) => event.stopPropagation()}>
        <div className="event-booking-header">
          <div>
            <p className="event-booking-eyebrow">Walk-in event</p>
            <h2>Book an event</h2>
          </div>
          <button type="button" className="event-booking-close" onClick={close} disabled={isSubmitting} aria-label="Close walk-in event form">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form id="walkin-event-booking-form" className="event-booking-body" onSubmit={submit}>
          <div className="event-booking-grid">
            <label>Event name<input name="event_name" required maxLength="120" value={form.event_name} onChange={updateField} placeholder="e.g. Birthday celebration" /></label>
            <label>Guest name<input name="guest_name" required maxLength="120" value={form.guest_name} onChange={updateField} placeholder="e.g. Juan Dela Cruz" /></label>
            <label>Phone number<input name="phone_number" required inputMode="numeric" pattern="09[0-9]{9}" maxLength="11" value={form.phone_number} onChange={updateField} placeholder="09XXXXXXXXX" /></label>
            <label>Number of guests<input name="guest_number" required type="number" min="1" max="10000" value={form.guest_number} onChange={updateField} /></label>
            <label className="event-booking-full">Email<input name="email" required type="email" maxLength="254" value={form.email} onChange={updateField} /></label>
            <label>
              <span className="event-booking-field-label">Start date</span>
              <div className="event-booking-date-time-wrap">
                <input name="start_date" required type="date" value={form.start_date} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} />
                <i className="fa-regular fa-calendar-days event-booking-date-time-icon" aria-hidden="true" />
              </div>
            </label>
            <label>
              <span className="event-booking-field-label">End date <span className="optional">Optional</span></span>
              <div className="event-booking-date-time-wrap">
                <input name="end_date" type="date" min={form.start_date} value={form.end_date} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} />
                <i className="fa-regular fa-calendar-days event-booking-date-time-icon" aria-hidden="true" />
              </div>
            </label>
            <label>
              <span className="event-booking-field-label">Time in</span>
              <div className="event-booking-date-time-wrap">
                <input name="time_in" required type="time" value={form.time_in} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} />
                <i className="fa-regular fa-clock event-booking-date-time-icon" aria-hidden="true" />
              </div>
            </label>
            <label>
              <span className="event-booking-field-label">Time out</span>
              <div className="event-booking-date-time-wrap">
                <input name="time_out" required type="time" value={form.time_out} onChange={updateField} onClick={(event) => event.currentTarget.showPicker?.()} />
                <i className="fa-regular fa-clock event-booking-date-time-icon" aria-hidden="true" />
              </div>
            </label>

            <div className="event-booking-full event-booking-room-picker">
              <button type="button" className={`event-booking-room-toggle ${roomsOpen ? 'is-open' : ''}`} onClick={() => setRoomsOpen((open) => !open)} aria-expanded={roomsOpen}>
                <span>Rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() !== 'event') ? ' selected' : ''}</span>
                <i className={`fa-solid fa-chevron-${roomsOpen ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
              {roomsOpen && <div className="event-booking-room-list">{renderRoomOptions(regularRooms, 'No available rooms found.')}</div>}
            </div>

            <div className="event-booking-full event-booking-room-picker">
              <button type="button" className={`event-booking-room-toggle ${functionRoomsOpen ? 'is-open' : ''}`} onClick={() => setFunctionRoomsOpen((open) => !open)} aria-expanded={functionRoomsOpen}>
                <span>Function rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() === 'event') ? ' selected' : ''}</span>
                <i className={`fa-solid fa-chevron-${functionRoomsOpen ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
              {functionRoomsOpen && <div className="event-booking-room-list">{renderRoomOptions(functionRooms, 'No available function rooms found.')}</div>}
            </div>

            <label className="event-booking-full">Notes<textarea name="notes" rows="3" maxLength="2000" value={form.notes} onChange={updateField} placeholder="Additional event details" /></label>
          </div>
          <div className="event-booking-discount-section">
            <div className="event-booking-discount-header">
              <div>
                <h3>Discount</h3>
                <p>Apply a fixed amount to the event total.</p>
              </div>
              <label className="event-booking-discount-toggle">
                <input type="checkbox" checked={discountEnabled} onChange={handleDiscountToggle} />
                <span>Enable</span>
              </label>
            </div>

            {discountEnabled && (
              <div className="event-booking-discount-details">
                <label className="event-booking-discount-input">
                  Last Price
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    max={totalPrice}
                    step="0.01"
                    value={form.discount}
                    onChange={updateField}
                    placeholder="e.g. 500"
                  />
                </label>
                <div className="event-booking-discount-results">
                  <div><span>Price</span><strong>₱{totalPrice.toLocaleString('en-PH')}</strong></div>
                  <div><span>Discount saved</span><strong>₱{discountSaved.toLocaleString('en-PH')}</strong></div>
                  <div><span>Discount</span><strong>{discountPercent.toFixed(2)}%</strong></div>
                  <div><span>Final price</span><strong>₱{finalPrice.toLocaleString('en-PH')}</strong></div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="event-booking-price-summary" aria-label="Walk-in event total price">
          <div className="event-booking-price-item">
            <div className="event-booking-price-icon total"><i className="fa-solid fa-receipt" aria-hidden="true" /></div>
            <div>
              <p className="event-booking-price-label">Total price ({eventDays} {eventDays === 1 ? 'day' : 'days'})</p>
              <p className="event-booking-price-value total">₱{finalPrice.toLocaleString('en-PH')}</p>
            </div>
          </div>
        </div>

        <div className="event-booking-footer">
          <button type="button" className="event-booking-cancel" onClick={close} disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="walkin-event-booking-form" className="event-booking-submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save event'}</button>
        </div>
      </div>
    </div>
  );
}

export default WalkinEventModal;
