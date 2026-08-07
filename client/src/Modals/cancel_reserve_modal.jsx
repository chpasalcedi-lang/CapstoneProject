import React, { useEffect, useState } from 'react';
import "../Modalscss/cancel_reserve_modal.css";

function CancelReserveModal({ show, onClose, booking, onConfirm }) {
  const [reason, setReason] = useState('');
  const MAX_REASON = 300;

  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReason('');
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const handleOverlayClick = () => {
    if (onClose) onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleConfirm = () => {
    if (!booking?.id) return;
    if (onConfirm) onConfirm(booking, reason.trim());
  };

  return (
    <div className="cancel-reservation-modal">
      <div className="cancel-reservation-modal-overlay" onClick={handleOverlayClick} />
      <div className="cancel-reservation-modal-content" onClick={handleContentClick}>
        <div className="cancel-reservation-modal-header">
          <div>
            <h3 className="cancel-reservation-modal-title">Cancel Reservation</h3>
          </div>
          <button className="cancel-reservation-modal-close" type="button" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="cancel-reservation-modal-body">
          <div className="cancel-reservation-info-card">
            <div className="cancel-reservation-intro">
              <p className="cancel-reservation-modal-subtitle">Please review the reservation details below and share a brief reason for cancellation if you want.</p>
            </div>
            <div className="cancel-reservation-info-row">
              <span className="cancel-reservation-info-label">Reservation</span>
              <span className="cancel-reservation-info-value">{booking?.room_name || 'Room Reservation'}</span>
            </div>
            <div className="cancel-reservation-info-row">
              <span className="cancel-reservation-info-label">Check-in</span>
              <span className="cancel-reservation-info-value">{booking?.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="cancel-reservation-info-row">
              <span className="cancel-reservation-info-label">Room</span>
              <span className="cancel-reservation-info-value">{booking?.room_number || 'Unknown Room'}</span>
            </div>
          </div>

          <div className="cancel-reservation-form-group">
            <label htmlFor="cancel-reason">Reason for cancellation</label>
            <textarea
              id="cancel-reason"
              rows={6}
              maxLength={MAX_REASON}
              placeholder="Optional: briefly explain why you are cancelling (max 300 chars)"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
              aria-label="Reason for cancellation"
            />
            <div className="char-counter">{reason.length}/{MAX_REASON}</div>
          </div>
        </div>

        <div className="cancel-reservation-modal-footer">
          <button className="cancel-reservation-btn-secondary" type="button" onClick={onClose}>Close</button>
          <button
            className="cancel-reservation-btn-confirm"
            type="button"
            onClick={handleConfirm}
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelReserveModal;
