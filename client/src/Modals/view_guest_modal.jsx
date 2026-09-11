import React from 'react';
import '../Modalscss/view_guest_modal.css';

const CORKAGE_PRICES = { Food: 500, Beer: 300, Whiskey: 300 };
const CHILD_RATE = 150;
const ADULT_RATE = 175;

function getGuestBreakdown(guest, corkageItems) {
  const storedChildren = Number(guest.number_of_children) || 0;
  const storedAdults = Number(guest.number_of_adults) || 0;
  if (storedChildren > 0 || storedAdults > 0 || !Number(guest.number_of_guests)) {
    return { children: storedChildren, adults: storedAdults };
  }

  const corkageTotal = corkageItems.reduce((total, item) => total + (CORKAGE_PRICES[item] || 0), 0);
  const guestCharge = Number(guest.total_price || 0) - corkageTotal;
  const totalGuests = Number(guest.number_of_guests);
  const adults = (guestCharge - (CHILD_RATE * totalGuests)) / (ADULT_RATE - CHILD_RATE);
  if (Number.isInteger(adults) && adults >= 0 && adults <= totalGuests) {
    return { children: totalGuests - adults, adults };
  }

  return { children: 0, adults: totalGuests };
}

function ViewGuestModal({ show, onClose, guest }) {
  if (!show || !guest) return null;

  const corkage = guest.corkage || 'No Corkage';
  const corkageItems = corkage === 'No Corkage' ? [] : corkage.split(',').map((item) => item.trim());
  const breakdown = getGuestBreakdown(guest, corkageItems);

  return (
    <div className="guest-modal-overlay" onClick={onClose}>
      <div className="guest-receipt-modal" onClick={(event) => event.stopPropagation()}>
        <button className="guest-modal-close" onClick={onClose} aria-label="Close receipt">&times;</button>
        <p className="guest-receipt-kicker">Guest arrival receipt</p>
        <h2>{guest.group_name || 'Unnamed group'}</h2>
        <div className="guest-receipt-divider" />
        <div className="guest-receipt-row"><span>Group name</span><strong>{guest.group_name || '-'}</strong></div>
        <div className="guest-receipt-row"><span>Children / senior / PWD</span><strong>{breakdown.children}</strong></div>
        <div className="guest-receipt-row"><span>Adults</span><strong>{breakdown.adults}</strong></div>
        <div className="guest-receipt-section-title">Corkage</div>
        {corkageItems.length === 0 ? <div className="guest-receipt-row"><span>No corkage</span><strong>₱0</strong></div> : corkageItems.map((item) => (
          <div className="guest-receipt-row" key={item}><span>{item} {item === 'Food' ? '(per group)' : item === 'Beer' ? '(/case)' : '(/bottle)'}</span><strong>₱{CORKAGE_PRICES[item] || 0}</strong></div>
        ))}
        <div className="guest-receipt-total"><span>Total price</span><strong>₱{Number(guest.total_price || 0).toLocaleString('en-PH')}</strong></div>
        <p className="guest-receipt-date">{guest.created_at ? new Date(guest.created_at).toLocaleString() : ''}</p>
      </div>
    </div>
  );
}

export default ViewGuestModal;