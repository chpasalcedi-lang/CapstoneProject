import React from "react";
import AdminLoginForm from "./admin_loginform";
import "../admincss/user_login.css";

function AdminLogin() {
    return (
        <div className="user-login-page">
            <div className="user-login-card">
                <img src="https://image2url.com/r2/default/images/1772332199936-491a3025-c124-4928-a38c-faad063cc82a.jpg" alt="Admin Login Background" className="admin-login-bg" />
                <div className="user-login-content">
                    <div className="user-login-header">
                        <h2>Messiah Login</h2>
                    </div>
                    <form className="user-login-form">
                        <label >Email</label>
                        <input type="email" id="email" placeholder="Enter your email" required />
                        <label >Verification Code</label>
                        <input type="text" id="verification" placeholder="Enter verification code" required />  
                    </form>
                    <button className="user-login-btn">Login</button>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;