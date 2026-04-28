import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AddRoomModal from "../Modals/add_room_modals";
import EditRoomModal from "../Modals/update_room-modal";
import "../admincss/admin_rooms.css";

function AdminRooms() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [data, setData] = useState([]);

    const fetchData = () => {
        axios.get("http://localhost:3000/get_rooms")
            .then((res) => setData(res.data))
            .catch((err) => console.error("Error sa pagkuha sang data:", err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (room) => {
        setSelectedRoom(room);
        setShowEditModal(true);
    };

    const handleDelete = (roomId) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            axios.delete(`http://localhost:3000/delete_room/${roomId}`)
                .then((res) => {
                    console.log("Deleted:", res.data);
                    setData((prev) => prev.filter((room) => room.id !== roomId));
                })
                .catch((err) => {
                    console.error("Error sa pag-delete:", err);
                    alert("May sala sa pag-delete sang data!");
                });
        }
    };

    return (
        <div>
            <nav className="rooms-navbar">
                <div className="rooms-nav-content">
                    <div className="rooms-logo">
                        <h1>Messiah</h1>
                    </div>
                    <ul className="rooms-nav-links">
                        <li><Link to="/Dashboard">Dashboard</Link></li>
                        <li className="active"><Link to="/Rooms">Rooms</Link></li>
                        <li><Link to="/Booking">Booking</Link></li>
                        <li><Link to="/Guest">Guest</Link></li>
                        <li><span>Settings</span></li>
                    </ul>
                </div>
            </nav>

            <section className="rooms-main">
                <div className="rooms-main-content">

                    <div className="rooms-topbar">
                        <h1>Rooms</h1>
                        <div>
                            <button className="rooms-topbar-btn" onClick={() => setShowAddModal(true)}>
                                Add Room
                            </button>
                        </div>
                    </div>

                    <div className="rooms-stats-grid">
                        {data.map((room, index) => (
                            <div className="rooms-stat-card" key={room.id ?? index}>
                                <div className="rooms-room-card-img">
                                    <img src={room.room_image} alt={room.room_name} />
                                    <span className="rooms-room-badge">{room.room_type}</span>
                                    <span className="rooms-room-rating">Room : {room.room_number}</span>
                                </div>
                                <div className="rooms-room-card-body">
                                    <div className="rooms-room-price">
                                        <span className="rooms-room-price-amount">₱{room.room_price}</span>
                                        <span className="rooms-room-price-night">per night</span>
                                    </div>
                                    <h3>{room.room_name}</h3>
                                    <p>{room.room_label}</p>
                                    <div className="rooms-room-card-footer">
                                        <button className="rooms-room-book-btn" onClick={() => handleEdit(room)}>
                                            Edit
                                        </button>
                                        <button className="rooms-room-book-btn" onClick={() => handleDelete(room.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <AddRoomModal showModal={showAddModal} setShowModal={setShowAddModal} refreshData={fetchData} />

            {selectedRoom && (
                <EditRoomModal showModal={showEditModal} setShowModal={setShowEditModal} refreshData={fetchData} roomData={selectedRoom} />
            )}
        </div>
    );
}

export default AdminRooms;