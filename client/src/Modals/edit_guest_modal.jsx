import React, { useEffect, useState } from 'react';
import '../Modalscss/view_guest_modal.css';

const CORKAGE_PRICES = { Food: 500, Beer: 300, Whiskey: 300 };
const CORKAGE_OPTIONS = Object.keys(CORKAGE_PRICES);
const PRICE_PER_CHILD = 150;
const PRICE_PER_ADULT = 175;

function getLegacyBreakdown(guest, corkage) {
  const children = Number(guest.number_of_children) || 0;
  const adults = Number(guest.number_of_adults) || 0;
  if (children > 0 || adults > 0 || !Number(guest.number_of_guests)) return { children, adults };

  const corkageTotal = corkage.reduce((sum, option) => sum + CORKAGE_PRICES[option], 0);
  const guestCharge = Number(guest.total_price || 0) - corkageTotal;
  const totalGuests = Number(guest.number_of_guests);
  const inferredAdults = (guestCharge - (PRICE_PER_CHILD * totalGuests)) / (PRICE_PER_ADULT - PRICE_PER_CHILD);
  return Number.isInteger(inferredAdults) && inferredAdults >= 0 && inferredAdults <= totalGuests
    ? { children: totalGuests - inferredAdults, adults: inferredAdults }
    : { children: 0, adults: totalGuests };
}

function EditGuestModal({ show, onClose, guest, onUpdate }) {
  const [form, setForm] = useState({ group_name: '', number_of_children: 0, number_of_adults: 0, corkage: [] });

  useEffect(() => {
    if (!guest) return;
    const corkage = guest.corkage && guest.corkage !== 'No Corkage' ? guest.corkage.split(',').map((item) => item.trim()) : [];
    const breakdown = getLegacyBreakdown(guest, corkage);
    setForm({
      group_name: guest.group_name || '',
      number_of_children: breakdown.children,
      number_of_adults: breakdown.adults,
      corkage,
    });
  }, [guest]);

  if (!show || !guest) return null;

  const corkageTotal = form.corkage.reduce((sum, option) => sum + CORKAGE_PRICES[option], 0);
  const totalPrice = (Number(form.number_of_children || 0) * PRICE_PER_CHILD) + (Number(form.number_of_adults || 0) * PRICE_PER_ADULT) + corkageTotal;
  const toggleCorkage = (option) => setForm((current) => ({ ...current, corkage: current.corkage.includes(option) ? current.corkage.filter((item) => item !== option) : [...current.corkage, option] }));

  const submit = (event) => {
    event.preventDefault();
    onUpdate(guest.id, { ...form, total_price: totalPrice, corkage: form.corkage.join(', ') || 'No Corkage' });
  };

  return (
    <div className="guest-modal-overlay" onClick={onClose}>
      <form className="guest-receipt-modal guest-edit-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="guest-modal-close" onClick={onClose} aria-label="Close edit form">&times;</button>
        <p className="guest-receipt-kicker">Edit guest arrival</p>
        <label>Group name<input value={form.group_name} onChange={(event) => setForm({ ...form, group_name: event.target.value })} /></label>
        <label>Children / senior / PWD<input type="number" min="0" value={form.number_of_children} onChange={(event) => setForm({ ...form, number_of_children: event.target.value })} /></label>
        <label>Adults<input type="number" min="0" value={form.number_of_adults} onChange={(event) => setForm({ ...form, number_of_adults: event.target.value })} /></label>
        <fieldset><legend>Corkage</legend>{CORKAGE_OPTIONS.map((option) => <label className="guest-edit-check" key={option}><input type="checkbox" checked={form.corkage.includes(option)} onChange={() => toggleCorkage(option)} />{option} - ₱{CORKAGE_PRICES[option]}</label>)}</fieldset>
        <div className="guest-edit-total">Total price: ₱{totalPrice.toLocaleString('en-PH')}</div>
        <button type="submit" className="guest-edit-save">Save changes</button>
      </form>
    </div>
  );
}

export default EditGuestModal;