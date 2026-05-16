import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../admincss/admin_usersAcc.css";
import AddAccountModal from '../Modals/add_acc_modal';
import UpdateAccountModal from '../Modals/update_userAcc.modal';

function AdminUsersAcc() {
  const [users, setUsers] = useState([]);
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [showUpdateAccModal, setShowUpdateAccModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/get_user_accounts");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching user accounts:", err);
      Swal.fire({ icon: 'error', title: 'Unable to load users', text: 'Please check your server connection.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleFilterRole = (role) => {
    setFilterRole(role);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const getSortedUsers = (list) => {
    return [...list].sort((a, b) => {
      const valueA = String(a[sortBy] || "").toLowerCase();
      const valueB = String(b[sortBy] || "").toLowerCase();
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const visibleUsers = getSortedUsers(
    users
      .filter((user) => {
        if (filterRole !== "all") {
          return user.role === filterRole;
        }
        return true;
      })
      .filter((user) => {
        const normalizedSearch = searchText.trim().toLowerCase();
        if (!normalizedSearch) return true;
        return [user.name, user.email, user.role]
          .some((value) => value?.toString().toLowerCase().includes(normalizedSearch));
      })
  );

  const formatRoleLabel = (role) => {
    if (!role) return "Staff";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setShowUpdateAccModal(true);
  };

  const handleCreateUser = async (userData) => {
    try {
      await axios.post("http://localhost:3001/add_user_account", userData);
      await fetchUsers();
      setShowAddAccModal(false);
      Swal.fire({ icon: 'success', title: 'Created', text: 'User account added successfully.' });
    } catch (err) {
      console.error("Error creating user account:", err);
      Swal.fire({ icon: 'error', title: 'Create failed', text: err?.response?.data?.error || 'Unable to create user.' });
    }
  };

  const handleUpdateUser = async (updatedData) => {
    if (!selectedUser) return;
    const payload = {
      name: updatedData.name,
      email: updatedData.email,
      role: updatedData.role,
    };
    if (updatedData.password) {
      payload.password = updatedData.password;
    }

    try {
      await axios.post(`http://localhost:3001/update_user_account/${selectedUser.id}`, payload);
      await fetchUsers();
      setSelectedUser(null);
      setShowUpdateAccModal(false);
      Swal.fire({ icon: 'success', title: 'Saved', text: 'User account updated successfully.' });
    } catch (err) {
      console.error("Error updating user account:", err);
      Swal.fire({ icon: 'error', title: 'Update failed', text: err?.response?.data?.error || 'Unable to update user.' });
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Delete user?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:3001/delete_user_account/${id}`);
      await fetchUsers();
      Swal.fire({ icon: 'success', title: 'Deleted', text: 'User account was removed.' });
    } catch (err) {
      console.error("Error deleting user account:", err);
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err?.response?.data?.error || 'Unable to delete user.' });
    }
  };

  const sortIndicator = (field) => {
    if (sortBy !== field) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div>
      <nav className="dashboard-navbar">
        <div className="dashboard-nav-content">
          <div className="dashboard-logo">
            <Link to="/Dashboard"><h1>Messiah</h1></Link>
          </div>
          <ul className="dashboard-nav-links">
            <p>dashboard</p>
            <li><Link to="/Dashboard">Dashboard</Link></li>
            <li className="active"><Link to="/Users">User</Link></li>
            <li><Link to="">Sales</Link></li>
            <p>management</p>
            <li><Link to="/Rooms">Rooms</Link></li>
            <li><Link to="/Booking">Booking</Link></li>
            <li><Link to="/Guest">Guest</Link></li>
            <p>reports</p>
            <li><Link to="/Logs">Active logs</Link></li>
            <div className="dasboard-admin-status">
              <Link to="/Profile">
                <div className="dasboard-admin-status-content">
                  <h1>System admin</h1>
                  <p className="admin-status ">admin</p>
                </div>
                <div className="dasboard-admin-profile"> Ap </div>
              </Link>
            </div>
          </ul>
        </div>
      </nav>

      <section className="admin-users-main">
        <div className="admin-users-main-content">
          <div className="admin-users-topbar">
            <h1>Access Control</h1>
            <div>
              <button className="admin-users-topbar-btn" onClick={() => setShowAddAccModal(true)}>
                New Account
              </button>
            </div>
          </div>

          <div className="admin-users-stats-bar">
            <div className="admin-users-stats-bar-content">
              <div className="admin-users-stats-card">
                <input
                  type="search"
                  value={searchText}
                  onChange={handleSearchChange}
                  placeholder="Search users..."
                />
                <div className="admin-users-filter-btns">
                  <button className={filterRole === 'all' ? 'active' : ''} type="button" onClick={() => handleFilterRole('all')}>all</button>
                  <button className={filterRole === 'admin' ? 'active' : ''} type="button" onClick={() => handleFilterRole('admin')}>Admin</button>
                  <button className={filterRole === 'staff' ? 'active' : ''} type="button" onClick={() => handleFilterRole('staff')}>Staff</button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-users-table-container">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name{sortIndicator('name')}</th>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>Email{sortIndicator('email')}</th>
                  <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>Role{sortIndicator('role')}</th>
                  <th className="action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">Loading users...</td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4">No user accounts found.</td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <div className="avatar">{user.name?.charAt(0) || 'U'}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{formatRoleLabel(user.role)}</td>
                      <td className="action">
                        <button className="admin-users-action-btn edit" type="button" onClick={() => openEditUser(user)}>Edit</button>
                        <button className="admin-users-action-btn delete" type="button" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AddAccountModal
        show={showAddAccModal}
        onClose={() => setShowAddAccModal(false)}
        onSave={handleCreateUser}
      />
      <UpdateAccountModal
        show={showUpdateAccModal}
        onClose={() => {
          setShowUpdateAccModal(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateUser}
        initialData={selectedUser}
      />
    </div>
  );
}

export default AdminUsersAcc;
