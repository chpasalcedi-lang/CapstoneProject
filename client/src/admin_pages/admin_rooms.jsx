import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from '../api';
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
    const [roomsRaw, setRoomsRaw] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [checkerDate, setCheckerDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [checkerSearch, setCheckerSearch] = useState('');
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
        apiClient.get("/get_rooms")
            .then((res) => {
                const rooms = res.data || [];
                
                // If room has maintenance status set, use that. Otherwise calculate occupancy.
                const mapped = rooms.map((room) => {
                    // If admin set maintenance status, use that.
                    if (room.room_status?.toLowerCase() === 'maintenance') {
                        return {
                            ...room,
                            room_status: 'Maintenance',
                            _isMaintenance: true
                        };
                    }
                    return room;
                });
                setRoomsRaw(mapped);
                
                // For non-maintenance rooms, fetch reservations to determine occupancy
                apiClient.get('/get_reservations')
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
                        
                        setReservations(reservations);
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

    const parseIsoDate = (value) => {
        if (!value) return null;
        const parsed = new Date(`${value}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getRoomStatusOnDate = (room, date) => {
        if (room._isMaintenance) return 'Maintenance';
        if (!date || !reservations.length) return room.room_status || 'Available';

        const isOccupied = reservations.some((r) => {
            if (Number(r.room_id) !== Number(room.id)) return false;
            const status = (r.res_status || '').toLowerCase();
            if (status !== 'confirmed' && status !== 'pending') return false;
            const start = new Date(r.check_in_date);
            const end = new Date(r.check_out_date);
            return date >= start && date < end;
        });

        return isOccupied ? 'Occupied' : 'Available';
    };

    const checkerDateObj = parseIsoDate(checkerDate);
    const checkerRooms = roomsRaw.map((room) => ({
        ...room,
        checkerStatus: getRoomStatusOnDate(room, checkerDateObj),
    }));
    const filteredCheckerRooms = checkerRooms.filter((room) => {
        const term = checkerSearch.trim().toLowerCase();
        if (!term) return true;
        const roomName = String(room.room_name || '').toLowerCase();
        const roomNumber = String(room.room_number || room.id || '').toLowerCase();
        const roomType = String(room.room_type || '').toLowerCase();
        const status = String(room.checkerStatus || '').toLowerCase();
        return (
            roomName.includes(term) ||
            roomNumber.includes(term) ||
            roomType.includes(term) ||
            status.includes(term)
        );
    });

    const checkerCounts = {
        total: checkerRooms.length,
        available: checkerRooms.filter((room) => room.checkerStatus === 'Available').length,
        occupied: checkerRooms.filter((room) => room.checkerStatus === 'Occupied').length,
        maintenance: checkerRooms.filter((room) => room.checkerStatus === 'Maintenance').length,
    };

    const handleEdit = (room) => {
        setSelectedRoom(room);
        setShowEditModal(true);
    };

    const handleDelete = async (roomId) => {
        if (!isAdmin) {
            await Swal.fire({
                icon: 'warning',
                title: 'Access denied',
                text: 'Only admin can access this action.',
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Confirm delete',
            text: 'Are you sure you want to delete this room?',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await apiClient.delete(`/delete_room/${roomId}`);
            setData((prev) => prev.filter((room) => room.id !== roomId));
            Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: response.data?.message || 'Room deleted successfully.',
            });
        } catch (err) {
            console.error('Error deleting room:', err);
            const message = err?.response?.data?.error || 'Unable to delete the room. Please try again.';
            Swal.fire({ icon: 'error', title: 'Error', text: message });
        }
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

                    <div className="rooms-stats-checker">
                        <div className="rooms-stats-header">
                            <div>
                                <h2>Room Checker</h2>
                            </div>
                            <div className="rooms-stats-controls">
                                <span>Date</span>
                                <input type="date" value={checkerDate} onChange={(e) => setCheckerDate(e.target.value)}/>
                            </div>
                        </div>

                        <div className="rooms-stats-summary">
                            <div className="rooms-stats-card available">
                                <span>Total</span>
                                <h1>{checkerCounts.total}</h1>
                            </div>
                            <div className="rooms-stats-card available">
                                <span>Available</span>
                                <h1>{checkerCounts.available}</h1>
                            </div>
                            <div className="rooms-stats-card occupied">
                                <span>Occupied</span>
                                <h1>{checkerCounts.occupied}</h1>
                            </div>
                            <div className="rooms-stats-card maintenance">
                                <span>Maintenance</span>
                                <h1>{checkerCounts.maintenance}</h1>
                            </div>
                        </div>

                        <div className="rooms-stats-search">
                            <h3>Rooms</h3>
                            <div className="rooms-stats-searchbar">
                                <span>Rooms Status</span>
                                <input type="text" className="rooms-stats-search-input" placeholder="Search by room, number, type" value={checkerSearch} onChange={(e) => setCheckerSearch(e.target.value)}/>
                            </div>
                        </div>

                        <div className="rooms-stats-list"> 
                            {filteredCheckerRooms.map((room) => (
                                <div className="rooms-stats-item" key={room.id}>
                                    <div>
                                        <strong>{room.room_name}</strong>
                                        <p>#{room.room_number || room.id} · {room.room_type}</p>
                                    </div>
                                    <div className={`rooms-stats-badge ${room.checkerStatus.toLowerCase()}`}>
                                        <span className="rooms-stats-dot"></span>
                                        {room.checkerStatus}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rooms-stats-grid">
                        {data.map((room, index) => (
                            <div className="rooms-stat-card" key={room.id ?? index}>
                                <div className="rooms-room-card-img">
                                    <img src={room.room_image} alt={room.room_name} />
                                    <span className="rooms-room-badge">{room.room_type}</span>
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