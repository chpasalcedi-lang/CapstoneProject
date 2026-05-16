import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../admincss/admin_loginform.css";

function AdminLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const adminUser = localStorage.getItem("adminUser");
        if (adminUser) {
            navigate("/Dashboard", { replace: true });
            return;
        }

        const fetchAdminUsers = async () => {
            try {
                const response = await axios.get("http://localhost:3001/get_admin_users");
                setAdminUsers(response.data || []);
            } catch (error) {
                console.error("Failed to fetch admin users:", error);
            } finally {
                setAdminLoading(false);
            }
        };
        fetchAdminUsers();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:3001/login", {
                email,
                password,
            });
            const user = response.data.user;
            localStorage.setItem("adminUser", JSON.stringify(user));
            Swal.fire({ icon: "success", title: "Welcome", text: "Login successful." });
            navigate("/Dashboard", { replace: true });
        } catch (error) {
            const message = error?.response?.data?.error || "Login failed. Please check your credentials.";
            Swal.fire({ icon: "error", title: "Login failed", text: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h2>Messiah Admin Login</h2>
                    <p>authorized users only</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="admin-form-group">
                        <p className="admin-login-note">
                            {adminLoading ? "Loading admin accounts..." : adminUsers.length > 0 ? "Use your admin credentials to access the dashboard." : "No admin accounts found. Please contact support."}
                        </p>
                    </div>

                    <div className="admin-form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Signing in..." : "access system"}
                    </button>
                </form>
                <div className="admin-login-footer">
                    <p>authorized users can access only</p>
                </div>

            </div>
        </div>
    );
}

export default AdminLoginForm;