import React from 'react';
import '../Modalscss/feedback_modal.css';

function FeedbackModal({ show, onClose, feedback }) {
    if (!show || !feedback) return null;

    return (
        <div className="feedback-modal-overlay" onClick={onClose}>
            <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="feedback-modal-header">
                    <h2>Feedback Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="feedback-modal-body">
                    <div className="feedback-detail grid-2">
                        <div className="feedback-field">
                            <label>Name</label>
                            <p>{feedback.name}</p>
                        </div>
                        <div className="feedback-field full-span">
                            <label>Email</label>
                            <p>{feedback.email}</p>
                        </div>
                    </div>
                    <div className="feedback-detail">
                        <div className="feedback-field">
                            <label>Message</label>
                            <p className="notes-text">{feedback.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FeedbackModal;