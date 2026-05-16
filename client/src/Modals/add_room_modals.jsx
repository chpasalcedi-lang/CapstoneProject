import React, { useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "../Modalscss/add_room_modal.css";

function AddRoomModal({ showModal, setShowModal, refreshData }) {
    const [values, setValues] = useState({
        room_name: "",
        room_number: "",
        room_price: "",
        room_image: "",
        room_type: "",
        room_status: "",
        room_label: ""
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValues({ ...values, room_image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post('http://localhost:3001/add_rooms', values)
            .then((res) => {
                console.log("Success: ", res.data);
                setShowModal(false);
                setValues({
                    room_name: "",
                    room_number: "",
                    room_price: "",
                    room_image: "",
                    room_type: "",
                    room_status: "",
                    room_label: ""
                    
                });
                refreshData();
            })
            .catch((err) => {
                console.error("Error sa pag-save: ", err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'May sala sa pag-save sang data!' });
            });
    };

    const closeModal = () => {
        setShowModal(false);
    }
     

    return (
        <div className={(showModal ? "add-room modal-visible" : "add-room modal-hidden")} id="modal">
            <div className="add-room-modal">
                <div className="add-room-modal-header">
                    <div>
                        <p className="add-room-modal-eyebrow">New Record</p>
                        <h2 className="add-room-modal-title">Add Room</h2>
                    </div>
                    <button className="add-room-modal-close" onClick={closeModal}>X</button>
                </div>

                <form className="add-room-modal-body" onSubmit={handleSubmit}>
                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Room Name</label>
                            <input type="text" name="room_name" required onChange={(e)=> setValues({...values, room_name: e.target.value})}  placeholder="e.g. Double/Family" />
                        </div>
                        <div className="add-room-form-group">
                            <label>Room Number</label>
                            <input type="number" name="room_number" required onChange={(e)=> setValues({...values, room_number: e.target.value})}  placeholder="e.g. 101" />
                        </div>
                    </div>
                    
                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Price</label>
                            <input
                                type="text" name="room_price" required onChange={(e)=> setValues({...values, room_price: e.target.value})} placeholder="e.g. 5000" />
                        </div>
                        <div className="add-room-form-group">
                            <label>Image</label>
                            <input type="file" name="room_image" required onChange={handleImageChange} accept="image/*" />
                        </div>
                    </div>

                    <div className="add-room-form-row">
                        <div className="add-room-form-group">
                            <label>Select Room Type</label>
                            <select name="room_type" required onChange={(e)=> setValues({...values, room_type: e.target.value})}>
                                <option value="">-- choose --</option>
                                <option value="family">Family</option>
                                <option value="double">Double</option>
                                <option value="event">Event</option>
                            </select>
                        </div>
                        <div className="add-room-form-group">
                            <label>Select Room Status</label>
                            <select name="room_status" required onChange={(e)=> setValues({...values, room_status: e.target.value})}>
                                <option value="">-- choose --</option>
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <div className="add-room-form-group">
                        <label>Room label</label>
                        <textarea name="room_label" rows="3" required onChange={(e)=> setValues({...values, room_label: e.target.value})} placeholder="...">
                        </textarea>
                    </div>

                    <div className="add-room-modal-footer">
                        <button type="button" className="add-room-btn-cancel" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="add-room-btn-save">
                            Save Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddRoomModal;