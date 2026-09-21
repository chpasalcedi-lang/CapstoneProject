import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import apiClient from '../api';
import '../Modalscss/edit_event_modal.css';

function normalizeRoomIds(roomIds, fallbackRooms) {
    const source = Array.isArray(roomIds) ? roomIds : [roomIds || fallbackRooms];
    return source
        .flatMap((value) => String(value || '').split(','))
        .map((roomId) => roomId.trim())
        .filter(Boolean);
}

function EditEventModal({ show, onClose, booking, onUpdated }) {
    const [form, setForm] = useState({
        event_name: '',
        guest_name: '',
        phone_number: '',
        email: '',
        start_date: '',
        end_date: '',
        time_in: '',
        time_out: '',
        guest_number: '',
        discount: '',
        notes: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [discountEnabled, setDiscountEnabled] = useState(false);
    const [lastPrice, setLastPrice] = useState('');
    const [eventRooms, setEventRooms] = useState([]);
    const [selectedRoomIds, setSelectedRoomIds] = useState([]);
    const [roomsOpen, setRoomsOpen] = useState(false);
    const [functionRoomsOpen, setFunctionRoomsOpen] = useState(false);

    useEffect(() => {
        if (!show) return;
        apiClient.get('/get_rooms')
            .then((response) => {
                const savedRoomIds = normalizeRoomIds(booking?.room_ids, booking?.rooms);
                const availableRooms = (response.data || []).filter((room) => (
                    String(room.room_status || '').toLowerCase() === 'available'
                    || savedRoomIds.includes(String(room.id))
                ));
                setEventRooms(availableRooms);
            })
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Unable to load rooms', text: 'Please try again later.' });
            });
    }, [show, booking]);

    useEffect(() => {
        if (!booking) return;
        const savedDiscount = Number(booking.discount || 0);
        const baseTotal = Number(booking.total_price || booking.price || 0);
        const savedTotal = Number(booking.total_price || 0);
        const hasSavedDiscount = savedDiscount > 0 || (savedTotal > 0 && savedTotal < baseTotal);
        setDiscountEnabled(hasSavedDiscount);
        setLastPrice(hasSavedDiscount && savedTotal > 0 ? String(savedTotal) : '');
        const savedRoomIds = normalizeRoomIds(booking.room_ids, booking.rooms);
        setSelectedRoomIds(savedRoomIds);
        setRoomsOpen(false);
        setFunctionRoomsOpen(false);
        setForm({
            event_name: booking.event_name || '',
            guest_name: booking.guest_name || '',
            phone_number: booking.phone_number || '',
            email: booking.email || '',
            start_date: String(booking.start_date || '').slice(0, 10),
            end_date: String(booking.end_date || booking.start_date || '').slice(0, 10),
            time_in: String(booking.time_in || '').slice(0, 5),
            time_out: String(booking.time_out || '').slice(0, 5),
            guest_number: booking.guest_number ?? '',
            discount: savedDiscount || '',
            notes: booking.notes || '',
        });
    }, [booking]);

    if (!show || !booking) return null;

    const startDateValue = form.start_date ? new Date(`${form.start_date}T00:00:00`) : null;
    const endDateValue = form.end_date ? new Date(`${form.end_date}T00:00:00`) : null;
    const eventDays = startDateValue && endDateValue && endDateValue >= startDateValue
        ? Math.max(1, Math.round((endDateValue - startDateValue) / 86400000) + 1)
        : 1;
    const totalPrice = Number(booking?.price || 0) * eventDays;
    const lastPriceValue = Number(lastPrice || 0);
    const hasDiscountValue = discountEnabled && lastPriceValue > 0;
    const discountSaved = hasDiscountValue
        ? Math.max(0, totalPrice - Math.min(totalPrice, lastPriceValue))
        : 0;
    const finalPrice = hasDiscountValue
        ? Math.max(0, Math.min(totalPrice, lastPriceValue))
        : totalPrice;
    const discountPercent = hasDiscountValue && totalPrice > 0
        ? (discountSaved / totalPrice) * 100
        : 0;
    const selectedRooms = eventRooms.filter((room) => selectedRoomIds.includes(String(room.id)));
    const regularRooms = eventRooms.filter((room) => String(room.room_type || '').toLowerCase() !== 'event');
    const functionRooms = eventRooms.filter((room) => String(room.room_type || '').toLowerCase() === 'event');

    const toggleRoom = (room, checked) => {
        const roomId = String(room.id);
        setSelectedRoomIds((current) => checked
            ? [...new Set([...current, roomId])]
            : current.filter((id) => id !== roomId));
    };

    const renderRoomOptions = (rooms, emptyText) => rooms.length === 0 ? (
        <p className="edit-event-room-empty">{emptyText}</p>
    ) : rooms.map((room) => (
        <label className="edit-event-room-option" key={room.id}>
            <input
                type="checkbox"
                checked={selectedRoomIds.includes(String(room.id))}
                onChange={(event) => toggleRoom(room, event.target.checked)}
            />
            <span className="edit-event-room-option-copy">
                <strong>{room.room_name || room.room_label || 'Unnamed room'}</strong>
                <small>{String(room.room_type || '').toLowerCase() === 'event' ? 'Function room' : `${room.room_type || 'Room'} available`}</small>
            </span>
            {String(room.room_type || '').toLowerCase() !== 'event' && (
                <span className="edit-event-room-number">Room {room.room_number || room.id}</span>
            )}
            <span className="edit-event-room-option-price">
                {Number(room.room_price) > 0 ? `PHP ${Number(room.room_price).toLocaleString('en-PH')}` : 'Price unavailable'}
            </span>
        </label>
    ));

    const formatRoomPrice = (price) => {
        const numeric = Number(String(price || '').replace(/,/g, ''));
        if (!Number.isFinite(numeric)) return '0';
        return numeric.toLocaleString('en-PH', {
            minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
            maximumFractionDigits: 2,
        });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        if (name === 'apply_discount') {
            setDiscountEnabled(event.target.checked);
            if (!event.target.checked) setLastPrice('');
            return;
        }
        if (name === 'last_price') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            setLastPrice(sanitizedValue);
            setDiscountEnabled(sanitizedValue !== '' && Number(sanitizedValue) > 0);
            return;
        }
        const nextValue = name === 'phone_number'
            ? value.replace(/\D/g, '').slice(0, 11)
            : value;
        setForm((current) => ({ ...current, [name]: nextValue }));
    };

    const submit = async (event) => {
        event.preventDefault();
        if (isSaving) return;

        const formElement = event.currentTarget;
        if (!formElement.checkValidity()) {
            formElement.reportValidity();
            return;
        }

        if (form.time_out <= form.time_in) {
            Swal.fire({ icon: 'error', title: 'Invalid time', text: 'Time out must be later than time in.' });
            return;
        }

        if (!form.end_date || form.end_date < form.start_date) {
            Swal.fire({ icon: 'error', title: 'Invalid dates', text: 'Extended date must be the same as or later than the start date.' });
            return;
        }

        setIsSaving(true);
        try {
            if (discountEnabled && (lastPrice === '' || Number(lastPrice) < 0)) {
                Swal.fire({ icon: 'error', title: 'Discount required', text: 'Please enter a valid last price before updating the discount.' });
                return;
            }

            await apiClient.post(`/update_event_booking/${booking.id}`, {
                event_name: form.event_name,
                guest_name: form.guest_name,
                phone_number: form.phone_number,
                email: form.email,
                start_date: form.start_date,
                end_date: form.end_date,
                time_in: form.time_in,
                time_out: form.time_out,
                notes: form.notes,
                guest_number: Number(form.guest_number),
                discount: Number(discountSaved.toFixed(2)),
                room_id: selectedRoomIds[0] || null,
                room_ids: selectedRoomIds,
            });
            Swal.fire({ icon: 'success', title: 'Updated', text: `Event booking updated successfully. Final total: ₱${formatRoomPrice(finalPrice)}` });
            onClose();
            if (onUpdated) await onUpdated();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: error.response?.data?.error || 'Unable to update event booking.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="edit-event-modal modal-visible" onClick={onClose}>
            <div className="edit-event-modal-content" onClick={(event) => event.stopPropagation()} aria-busy={isSaving}>
                <div className="edit-event-modal-header">
                    <div>
                        <p className="edit-event-modal-eyebrow">Event reservation</p>
                        <h2 className="edit-event-modal-title">Edit event booking</h2>
                    </div>
                    <button type="button" className="edit-event-modal-close" onClick={onClose} disabled={isSaving} aria-label="Close edit event form"><i className="fa-solid fa-xmark" /></button>
                </div>
                <form id="editEventForm" className="edit-event-modal-body" onSubmit={submit}>
                    <div className="edit-event-modal-form-row">
                        <div className="edit-event-modal-form-group"><label>Guest Name</label><input name="guest_name" required maxLength="120" value={form.guest_name} onChange={handleChange} /></div>
                        <div className="edit-event-modal-form-group"><label>Event Name</label><input name="event_name" required maxLength="120" value={form.event_name} onChange={handleChange} /></div>
                    </div>
                    <div className="edit-event-modal-form-row">
                        <div className="edit-event-modal-form-group"><label>Phone Number</label><input name="phone_number" required pattern="09[0-9]{9}" maxLength="11" value={form.phone_number} onChange={handleChange} /></div>
                        <div className="edit-event-modal-form-group"><label>Number of Guests</label><input name="guest_number" required type="number" min="1" max="10000" value={form.guest_number} onChange={handleChange} /></div>
                    </div>
                    <div className="edit-event-modal-form-group"><label>Email</label><input name="email" required type="email" maxLength="254" value={form.email} onChange={handleChange} /></div>
                    <div className="edit-event-modal-form-row">
                        <div className="edit-event-modal-form-group"><label>Date</label><div className="edit-event-date-time-wrap"><input className={form.start_date ? 'has-value' : ''} name="start_date" required type="date" value={form.start_date} onChange={handleChange} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-calendar-days edit-event-date-time-icon" aria-hidden="true" /></div></div>
                        <div className="edit-event-modal-form-group"><label>Extended Date</label><div className="edit-event-date-time-wrap"><input className={form.end_date ? 'has-value' : ''} name="end_date" required min={form.start_date} type="date" value={form.end_date} onChange={handleChange} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-calendar-days edit-event-date-time-icon" aria-hidden="true" /></div></div>
                    </div>
                    <div className="edit-event-modal-form-row">
                        <div className="edit-event-modal-form-group"><label>Time In</label><div className="edit-event-date-time-wrap"><input className={form.time_in ? 'has-value' : ''} name="time_in" required type="time" value={form.time_in} onChange={handleChange} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-clock edit-event-date-time-icon" aria-hidden="true" /></div></div>
                        <div className="edit-event-modal-form-group"><label>Time Out</label><div className="edit-event-date-time-wrap"><input className={form.time_out ? 'has-value' : ''} name="time_out" required type="time" value={form.time_out} onChange={handleChange} onClick={(event) => event.currentTarget.showPicker?.()} /><i className="fa-regular fa-clock edit-event-date-time-icon" aria-hidden="true" /></div></div>
                    </div>
                    <div className="edit-event-room-full edit-event-room-picker">
                        <button type="button" className={`edit-event-room-toggle ${roomsOpen ? 'is-open' : ''}`} onClick={() => setRoomsOpen((open) => !open)} aria-expanded={roomsOpen}>
                            <span>Rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() !== 'event') ? ' selected' : ''}</span>
                            <i className={`fa-solid fa-chevron-${roomsOpen ? 'up' : 'down'}`} aria-hidden="true" />
                        </button>
                        {roomsOpen && <div className="edit-event-room-list">{renderRoomOptions(regularRooms, 'No available rooms found.')}</div>}
                    </div>

                    <div className="edit-event-room-full edit-event-room-picker">
                        <button type="button" className={`edit-event-room-toggle ${functionRoomsOpen ? 'is-open' : ''}`} onClick={() => setFunctionRoomsOpen((open) => !open)} aria-expanded={functionRoomsOpen}>
                            <span>Function rooms{selectedRooms.some((item) => String(item.room_type || '').toLowerCase() === 'event') ? ' selected' : ''}</span>
                            <i className={`fa-solid fa-chevron-${functionRoomsOpen ? 'up' : 'down'}`} aria-hidden="true" />
                        </button>
                        {functionRoomsOpen && <div className="edit-event-room-list">{renderRoomOptions(functionRooms, 'No available function rooms found.')}</div>}
                    </div>

                    <div className="edit-event-modal-form-group"><label>Status</label><input value={booking.status || 'pending'} readOnly /></div>
                    <div className="edit-event-modal-form-group"><label>Notes <span className="optional">Optional</span></label><textarea name="notes" rows="3" maxLength="2000" value={form.notes} onChange={handleChange} /></div>
                    <div className="edit-event-modal-form-price discount-section">
                        <div className="discount-section-header">
                            <div>
                                <h3>Discount</h3>
                                <p>Apply a fixed amount and see the percentage.</p>
                            </div>
                            <label className="discount-toggle">
                                <input type="checkbox" name="apply_discount" checked={discountEnabled} onChange={handleChange} />
                                <span>Enable</span>
                            </label>
                        </div>

                        {discountEnabled && (
                            <>
                                <div className="edit-event-modal-form-group discount-input-group">
                                    <label htmlFor="last_price">Last Price</label>
                                    <input
                                        type="number"
                                        name="last_price"
                                        value={lastPrice}
                                        onChange={handleChange}
                                        placeholder="e.g. 2500"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="discount-result-box">
                                    <span className="discount-result-label">Price</span>
                                    <strong>
                                        {`₱${formatRoomPrice(totalPrice)}`}
                                    </strong>
                                </div>

                                <div className="discount-result-box">
                                    <span className="discount-result-label">Discount saved</span>
                                    <strong>
                                        {lastPrice && Number(lastPrice) > 0
                                            ? `₱${formatRoomPrice(discountSaved)}`
                                            : '₱0.00'}
                                    </strong>
                                </div>
                                <div className="discount-result-box">
                                    <span className="discount-result-label">Discount</span>
                                    <strong>
                                        {lastPrice && Number(lastPrice) > 0
                                            ? `${discountPercent.toFixed(2)}%`
                                            : '0%'}
                                    </strong>
                                </div>
                                <div className="discount-result-box">
                                    <span className="discount-result-label">Final Price</span>
                                    <strong>
                                        {lastPrice && Number(lastPrice) > 0
                                            ? `₱${formatRoomPrice(finalPrice)}`
                                            : `₱${formatRoomPrice(totalPrice)}`}
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>
                </form>
                <div className="edit-event-modal-footer">
                    <div className="edit-event-modal-total">Total price: ₱{formatRoomPrice(finalPrice)}</div>
                    <button type="button" className="edit-event-modal-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
                    <button type="submit" form="editEventForm" className="edit-event-modal-btn-save" disabled={isSaving}>
                        {isSaving && <span className="edit-event-modal-spinner" aria-hidden="true" />}
                        {isSaving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditEventModal;
