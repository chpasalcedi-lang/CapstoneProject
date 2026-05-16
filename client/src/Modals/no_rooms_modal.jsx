import React from "react";
<<<<<<< Updated upstream
import "../Modalscss/add_room_modal.css";

function NoRoomsModal({ showModal, setShowModal }) {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>No rooms available</h2>
        <p>Sorry, there are no available rooms matching your search criteria.</p>
        <button className="modal-close-button" onClick={() => setShowModal(false)}>
          Close
        </button>
      </div>
    </div>
=======
import "../Modalscss/no_rooms_modal.css";

function NoRoomsModal({ showModal, setShowModal }) {
  return (
    <>
      {showModal && (
        <div className="no-rooms-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="no-rooms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="no-rooms-modal-header">
              <h2>No Rooms Available</h2>
              <button className="no-rooms-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="no-rooms-modal-body">
              <p>Sorry, no rooms match your search criteria.</p>
              <p>Please try adjusting your dates or room type and search again.</p>
            </div>
            <div className="no-rooms-modal-footer">
              <button className="no-rooms-modal-btn" onClick={() => setShowModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
>>>>>>> Stashed changes
  );
}

export default NoRoomsModal;
