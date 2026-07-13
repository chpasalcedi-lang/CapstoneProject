import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import AddRoomModal from "../Modals/add_room_modals";
import EditRoomModal from "../Modals/update_room-modal";
import "../admincss/admin_rooms.css";

function AdminRooms() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [data, setData] = useState([]);
    const [adminData] = useState(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          return {
            name: parsed.name,
            role: parsed.role,
          };
        }
        return { name: "?", role: "?" };
      });

    const isAdmin = adminData.role?.toString().toLowerCase() === 'admin';

    const fetchData = () => {
        axios.get("http://localhost:3001/get_rooms")
            .then((res) => {
                const rooms = res.data || [];
                
                // If room has maintenance status set, use that. Otherwise calculate occupancy.
                const mapped = rooms.map((room) => {
                    // If admin set maintenance status, show that
                    if (room.room_status?.toLowerCase() === 'maintenance') {
                        return {
                            ...room,
                            room_status: 'Maintenance',
                            _isMaintenance: true
                        };
                    }
                    return room;
                });
                
                // For non-maintenance rooms, fetch reservations to determine occupancy
                axios.get('http://localhost:3001/get_reservations')
                    .then((rres) => {
                        const reservations = rres.data || [];
                        const today = new Date();
                        const occupiedRoomIds = new Set();
                        
                        reservations.forEach((r) => {
                            if (!r.room_id) return;
                            const status = (r.res_status || '').toLowerCase();
                            if (status !== 'confirmed' && status !== 'pending') return;
                            const rStart = new Date(r.check_in_date);
                            const rEnd = new Date(r.check_out_date);
                            if (today >= rStart && today < rEnd) {
                                occupiedRoomIds.add(Number(r.room_id));
                            }
                        });
                        
                        const finalMapped = mapped.map((room) => {
                            // If maintenance, keep that status
                            if (room._isMaintenance) {
                                return room;
                            }
                            // Otherwise show occupancy
                            return {
                                ...room,
                                room_status: occupiedRoomIds.has(Number(room.id)) ? 'Occupied' : 'Available'
                            };
                        });
                        
                        setData(finalMapped);
                    })
                    .catch((err) => {
                        console.error("Error fetching reservations:", err);
                        const defaultMapped = mapped.map((room) => {
                            if (room._isMaintenance) return room;
                            return { ...room, room_status: 'Available' };
                        });
                        setData(defaultMapped);
                    });
            })
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
        if (!isAdmin) {
            Swal.fire({
                icon: 'warning',
                title: 'Access denied',
                text: 'Only admin can access this action.',
            });
            return;
        }
        Swal.fire({
            icon: 'warning',
            title: 'Confirm delete',
            text: 'Are you sure you want to delete this room?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`http://localhost:3001/delete_room/${roomId}`)
                    .then((res) => {
                        console.log("Deleted:", res.data);
                        setData((prev) => prev.filter((room) => room.id !== roomId));
                        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Room deleted successfully.' });
                    })
                    .catch((err) => {
                        console.error("Error sa pag-delete:", err);
                        Swal.fire({ icon: 'error', title: 'Error', text: 'May sala sa pag-delete sang data!' });
                    });
            }
        });
    };

    return (
        <div>
            <div className="mobile-topbar">
                <Link to="/Dashboard">
                <h1 className="mobile-logo">Messiah</h1>
                </Link>
                <button className="mobile-hamburger" onClick={() => setDrawerOpen(prev => !prev)} aria-label={drawerOpen ? "Close menu" : "Open menu"}>
                    <i className={drawerOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
                </button>
            </div>

            <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}/>
                <nav className="dashboard-navbar">
                      <div className="dashboard-nav-content">
                          <div className="dashboard-logo">
                              <Link to="/Dashboard"><h1>Messiah</h1></Link>
                          </div>
                              <ul className="dashboard-nav-links">
                                  <p>dashboard</p>
                                  <li><Link to="/Dashboard">Dashboard</Link></li>
                                  <li><Link to="/Users">User</Link></li>
                                  <li><Link to="/Sales">Sales</Link></li>
                                  <p>management</p>
                                  <li className="active"><Link to="/Rooms">Rooms</Link></li>
                                  <li><Link to="/Booking">Booking</Link></li>
                                  <li><Link to="/Guest">Guest / Feedback</Link></li>
                                  <div className="dasboard-admin-status">
                                      <Link to="/Profile">
                                          <div className="dasboard-admin-status-content">
                                              <h1>System admin</h1>
                                              <p className="admin-status ">{adminData.role}</p>
                                          </div>
                                          <div className="dasboard-admin-profile"> {adminData.name.charAt(0).toUpperCase()} </div>
                                      </Link>
                                  </div>
                            </ul>
                      </div>
                </nav>

                <nav className={`drawer-panel ${drawerOpen ? 'open' : ''}`}>
                    <div className="dashboard-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingRight: 20 }}>
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                    <ul className="dashboard-nav-links" onClick={() => setDrawerOpen(false)}>
                        <p>dashboard</p>
                        <li><Link to="/Dashboard">Dashboard</Link></li>
                        <li><Link to="/Users">User</Link></li>
                        <li><Link to="/Sales">Sales</Link></li>
                        <p>management</p>
                        <li className="active"><Link to="/Rooms">Rooms</Link></li>
                        <li><Link to="/Booking">Booking</Link></li>
                        <li><Link to="/Guest">Guest / Feedback</Link></li>
                        <div className="dasboard-admin-status">
                            <Link to="/Profile">
                                <div className="dasboard-admin-status-content">
                                <h1>System admin</h1>
                                <p className="admin-status">{adminData.role}</p>
                                </div>
                                <div className="dasboard-admin-profile">{adminData.name.charAt(0).toUpperCase()}</div>
                            </Link>
                        </div>
                    </ul>
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
                                    <span className={`rooms-room-status ${room.room_status === 'Occupied' ? 'occupied' : room.room_status === 'Maintenance' ? 'maintenance' : 'available'}`}>
                                        {room.room_status || 'Available'}
                                    </span>
                                    {room.room_type?.toLowerCase() !== 'event' && (
                                        <span className="rooms-room-rating">Room : {room.room_number}</span>
                                    )}
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