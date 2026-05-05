import React from "react";
import "../admincss/admin_loginform.css";

function AdminLoginForm() {
    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h2>System Portal</h2>
                    <p>authorized users only</p>
                </div>

                <form>
                    <div className="admin-form-group">
                        <label>Username</label>
                        <input type="text" placeholder="Enter username" required />
                    </div>

                    <div className="admin-form-group">
                        <label>Password</label>
                        <input type="password" placeholder="Enter password" required />
                    </div>

                    <button type="submit" className="login-btn">
                        access system
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