import React, { useEffect, useState } from 'react';
import "../Modalscss/cancel_reserve_modal.css";

function CancelReserveModal({ show, onClose, booking, onConfirm }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_REASON = 300;

  useEffect(() => {
    if (show) {
      setReason('');
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const isEventBooking = Boolean(booking?.event_name);

  const handleOverlayClick = () => {
    if (isSubmitting) return;
    if (onClose) onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleConfirm = async () => {
    if (!booking?.id) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onConfirm) await onConfirm(booking, reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cancel-reservation-modal">
      <div className="cancel-reservation-modal-overlay" onClick={handleOverlayClick} />
      <div className="cancel-reservation-modal-content" onClick={handleContentClick}>
        <div className="cancel-reservation-modal-header">
          <div>
            <h3 className="cancel-reservation-modal-title">Cancel Reservation</h3>
          </div>
          <button className="cancel-reservation-modal-close modal-submit-close" type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close">
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
              <span className="cancel-reservation-info-value">{isEventBooking ? booking.event_name : (booking?.room_name || 'Room Reservation')}</span>
            </div>
            <div className="cancel-reservation-info-row">
              <span className="cancel-reservation-info-label">{isEventBooking ? 'Event date' : 'Check-in'}</span>
              <span className="cancel-reservation-info-value">{(booking?.start_date || booking?.check_in_date) ? new Date(booking.start_date || booking.check_in_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="cancel-reservation-info-row">
              <span className="cancel-reservation-info-label">{isEventBooking ? 'Guests' : 'Room'}</span>
              <span className="cancel-reservation-info-value">{isEventBooking ? (booking.guest_number || 'Unknown') : (booking?.room_number || 'Unknown Room')}</span>
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
          <button className="cancel-reservation-btn-secondary modal-submit-cancel" type="button" onClick={onClose} disabled={isSubmitting}>Close</button>
          <button
            className="cancel-reservation-btn-confirm"
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? <><span className="modal-submit-spinner" aria-hidden="true"></span>Submitting...</> : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelReserveModal;
