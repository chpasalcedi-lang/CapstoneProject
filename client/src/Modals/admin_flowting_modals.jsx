import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../api';
import Swal from 'sweetalert2';
import EditBookingModal from './Edit_booking_modal';
import EditGuestModal from './edit_guest_modal';
import '../Modalscss/admin_flowting_modal.css';

const getManilaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getDateKey = (value) => {
  if (!value) return '';
  if (value instanceof Date) return getManilaDateKey(value);
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : getManilaDateKey(parsed);
};

const formatDate = (value) => {
  const dateKey = getDateKey(value);
  if (!dateKey) return '—';
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-PH', { maximumFractionDigits: 2 });
};

const formatTime = (value) => {
  const match = String(value || '').match(/[ T](\d{2}):(\d{2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'PM' : 'AM'}`;
};

function AdminFloatingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservations, setReservations] = useState([]);
  const [guestArrivals, setGuestArrivals] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const today = getManilaDateKey();

  const fetchTodayItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reservationResponse, guestResponse] = await Promise.all([
        apiClient.get('/get_reservations'),
        apiClient.get('/get_guest_arrivals'),
      ]);
      setReservations((reservationResponse.data || []).filter(
        (reservation) => getDateKey(reservation.check_in_date) === getManilaDateKey()
      ));
      setGuestArrivals((guestResponse.data || []).filter(
        (guest) => getDateKey(guest.created_at) === getManilaDateKey()
      ));
    } catch (err) {
      console.error('Error fetching today’s admin arrivals:', err);
      setError('Could not load today’s reservations and guest arrivals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchTodayItems();
  }, [isOpen, fetchTodayItems]);

  const handleUpdateGuest = async (id, payload) => {
    try {
      await apiClient.put(`/update_guest_arrival/${id}`, payload);
      await fetchTodayItems();
      setSelectedGuest(null);
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Guest arrival updated successfully.' });
    } catch (err) {
      console.error('Error updating guest arrival:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: err.response?.data?.details || err.response?.data?.error || 'Failed to update guest arrival.',
      });
    }
  };

  const openReservationEditor = (reservation) => {
    setIsOpen(false);
    setSelectedReservation(reservation);
  };

  const closeReservationEditor = () => {
    setSelectedReservation(null);
    setIsOpen(true);
  };

  const reservationItems = reservations.map((reservation) => (
    <article className="admin-today-item" key={`reservation-${reservation.id}`}>
      <div className="admin-today-item-details">
        <h3>{reservation.first_name} {reservation.last_name}</h3>
        <p>Room {reservation.room_number || 'Unassigned'} · {reservation.num_guests || 0} guest(s)</p>
        <p>Check-in {formatDate(reservation.check_in_date)} · Check-out {formatDate(reservation.check_out_date)}</p>
        <span className="admin-today-status">{reservation.res_status || 'Pending'}</span>
      </div>
      <button
        type="button"
        className="admin-today-edit"
        onClick={() => openReservationEditor(reservation)}
      >
        Edit
      </button>
    </article>
  ));

  const guestItems = guestArrivals.map((guest) => (
    <article className="admin-today-item" key={`guest-${guest.id}`}>
      <div className="admin-today-item-details">
        <h3>{guest.group_name || 'Walk-in guest'}</h3>
        <p>{guest.number_of_guests || 0} guest(s){formatTime(guest.created_at) ? ` · Added ${formatTime(guest.created_at)}` : ''}</p>
        <p>Total ₱{formatCurrency(guest.total_price)}</p>
      </div>
      <button
        type="button"
        className="admin-today-edit"
        onClick={() => setSelectedGuest(guest)}
      >
        Edit
      </button>
    </article>
  ));

  return (
    <>
      {!selectedReservation && !selectedGuest && (
        <>
          <div className="admin-floating-control">
            <button
              type="button"
              className="admin-floating-trigger"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={isOpen ? 'Close today’s arrivals' : 'Open today’s arrivals'}
              aria-expanded={isOpen}
            >
              <span className="admin-floating-label">Today’s arrivals</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 2v4m10-4v4M4 9h16M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                <path d="m8 15 2.2 2.2L16 12" />
              </svg>
              {(reservations.length + guestArrivals.length) > 0 && (
                <span className="admin-floating-count">{reservations.length + guestArrivals.length}</span>
              )}
            </button>
          </div>
          {isOpen && (
            <div className="admin-today-overlay" onClick={() => setIsOpen(false)}>
              <section
                className="admin-today-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-today-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="admin-today-header">
                  <div>
                    <p className="admin-today-eyebrow">ADMIN ARRIVALS</p>
                    <h2 id="admin-today-title">Today’s list</h2>
                    <p>{formatDate(today)}</p>
                  </div>
                  <button type="button" className="admin-today-close" onClick={() => setIsOpen(false)} aria-label="Close">
                    &times;
                  </button>
                </header>
                <div className="admin-today-content">
                  {loading ? (
                    <p className="admin-today-message">Loading today’s arrivals…</p>
                  ) : error ? (
                    <p className="admin-today-message admin-today-error">{error}</p>
                  ) : (
                    <>
                      <section className="admin-today-section">
                        <h3>Reservations <span>{reservations.length}</span></h3>
                        {reservationItems.length ? (
                          <div className="admin-today-list admin-today-list--reservations">
                            {reservationItems}
                          </div>
                        ) : (
                          <p className="admin-today-empty">No reservations checking in today.</p>
                        )}
                      </section>
                      <section className="admin-today-section">
                        <h3>Guest arrivals <span>{guestArrivals.length}</span></h3>
                        {guestItems.length ? (
                          <div className="admin-today-list admin-today-list--guests">
                            {guestItems}
                          </div>
                        ) : (
                          <p className="admin-today-empty">No guest arrivals added today.</p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}
      <EditBookingModal
        show={Boolean(selectedReservation)}
        booking={selectedReservation}
        onClose={closeReservationEditor}
        onUpdate={fetchTodayItems}
      />
      <EditGuestModal
        show={Boolean(selectedGuest)}
        guest={selectedGuest}
        onClose={() => setSelectedGuest(null)}
        onUpdate={handleUpdateGuest}
      />
    </>
  );
}

export default AdminFloatingModal;