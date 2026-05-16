import React from "react";
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

  );
}

export default NoRoomsModal;
