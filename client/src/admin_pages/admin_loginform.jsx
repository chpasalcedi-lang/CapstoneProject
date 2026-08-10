import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from '../api';
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";
import "../admincss/admin_loginform.css";

const EMAILJS_SERVICE_ID = "service_mv433ts";
const EMAILJS_TEMPLATE_ID = "template_dt2u03l";
const EMAILJS_PUBLIC_KEY = "VuQPGuRo7jAh72RA6";

emailjs.init(EMAILJS_PUBLIC_KEY);

function AdminLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [forgotMode, setForgotMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [code, setCode] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [sentEmail, setSentEmail] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [loading, setLoading] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const [resetUserId, setResetUserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const adminUser = localStorage.getItem("adminUser");
        if (adminUser) {
            navigate("/Dashboard", { replace: true });
            return;
        }

        const fetchAdminUsers = async () => {
            try {
                const response = await apiClient.get("/get_user_accounts");
                setAdminUsers(response.data || []);
            } catch (error) {
                console.error("Failed to fetch admin users:", error);
            } finally {
                setAdminLoading(false);
            }
        };
        fetchAdminUsers();
    }, [navigate]);

    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleSendCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            Swal.fire({ icon: "warning", title: "Enter email", text: "Please type your admin email first." });
            return;
        }

        try {
            const response = await apiClient.post("/find_admin_by_email", { email: normalizedEmail });
            if (!response.data?.id) {
                Swal.fire({ icon: "error", title: "Email not found", text: "No admin account is registered with this email." });
                return;
            }

            setResetUserId(response.data.id);
            const otp = generateOtp();
            setWaiting(true);
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    email: normalizedEmail,
                    otp: otp,
                    time: "15 minutes",
                }
            );

            setOtpSent(true);
            setAttempts(0);
            setSentEmail(normalizedEmail);
            localStorage.setItem("pendingOtp", otp);
            localStorage.setItem("pendingOtpEmail", normalizedEmail);
            localStorage.setItem("pendingOtpExpires", String(Date.now() + 15 * 60 * 1000));
            localStorage.setItem("verificationAttempts", "0");
            Swal.fire({ icon: "success", title: "Code sent", text: `A verification code was sent to ${normalizedEmail}. It expires in 15 minutes.` });
        } catch (err) {
            console.error("Forgot password email error:", err);
            Swal.fire({ icon: "error", title: "Send failed", text: "Unable to send the verification code. Please try again." });
        } finally {
            setWaiting(false);
        }
    };

    const handleVerifyCode = (e) => {
        e.preventDefault();

        const storedOtp = localStorage.getItem("pendingOtp");
        const storedEmail = localStorage.getItem("pendingOtpEmail");
        const expires = Number(localStorage.getItem("pendingOtpExpires"));

        if (!storedOtp || !storedEmail || !expires) {
            Swal.fire({ icon: "error", title: "No code", text: "Request a verification code first." });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== storedEmail.toLowerCase()) {
            Swal.fire({ icon: "error", title: "Email mismatch", text: "Use the same email that received the code." });
            return;
        }

        if (Date.now() > expires) {
            Swal.fire({ icon: "warning", title: "Code expired", text: "The code expired. Please request a new one." });
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
            localStorage.removeItem("verificationAttempts");
            setOtpSent(false);
            return;
        }

        if (code.trim() !== storedOtp) {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            localStorage.setItem("verificationAttempts", String(nextAttempts));
            if (nextAttempts >= 5) {
                Swal.fire({ icon: "warning", title: "Too many attempts", text: "Please request a new verification code." });
                setOtpSent(false);
                localStorage.removeItem("pendingOtp");
                localStorage.removeItem("pendingOtpEmail");
                localStorage.removeItem("pendingOtpExpires");
                localStorage.removeItem("verificationAttempts");
                setCode("");
                return;
            }
            Swal.fire({ icon: "error", title: "Invalid code", text: "The verification code is incorrect." });
            return;
        }

        setIsVerified(true);
        Swal.fire({ icon: "success", title: "Verified", text: "Email verified. You can now reset your password." });
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetUserId) {
            Swal.fire({ icon: "error", title: "No user", text: "Unable to verify admin account." });
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Swal.fire({ icon: "warning", title: "Weak password", text: "Password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire({ icon: "warning", title: "Mismatch", text: "Passwords do not match." });
            return;
        }

        try {
            await apiClient.post(`/update_user_account/${resetUserId}`, {
                password: newPassword,
            });
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
            localStorage.removeItem("verificationAttempts");
            setForgotMode(false);
            setOtpSent(false);
            setIsVerified(false);
            setCode("");
            setNewPassword("");
            setConfirmPassword("");
            Swal.fire({ icon: "success", title: "Password reset", text: "Your password has been updated. Please log in with your new password." });
        } catch (err) {
            console.error("Password reset error:", err);
            Swal.fire({ icon: "error", title: "Reset failed", text: "Unable to reset password. Please try again." });
        }
    };

    const switchToForgot = () => {
        setForgotMode(true);
        setPassword("");
    };

    const switchToLogin = () => {
        setForgotMode(false);
        setIsVerified(false);
        setOtpSent(false);
        setCode("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await apiClient.post("/login", {
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
                {forgotMode ? (
                    <div>
                        <form onSubmit={isVerified ? handleResetPassword : handleVerifyCode}>
                            <div className="admin-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your admin email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {!isVerified ? (
                                <>
                                    <div className="admin-form-group">
                                        <button type="button" className="login-btn" onClick={handleSendCode} disabled={waiting || !email}>
                                            {otpSent && email.toLowerCase() === sentEmail?.toLowerCase() ? "Resend Code" : "Send Verification Code"}
                                        </button>
                                    </div>
                                    {otpSent && (
                                        <>
                                            <div className="admin-form-group">
                                                <label>Verification Code</label>
                                                <input
                                                    type="text"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="Enter 6-digit code"
                                                    maxLength="6"
                                                    required
                                                />
                                            </div>
                                            <button type="button" className="login-btn" onClick={handleVerifyCode} disabled={code.length !== 6}>
                                                Verify Code
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="admin-form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="login-btn" disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword}>
                                        Reset Password
                                    </button>
                                </>
                            )}
                        </form>
                        <div className="admin-form-group">
                            <button type="button" className="login-btn" onClick={switchToLogin}>
                                Back to Login
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your credentials email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? "Signing in..." : "access system"}
                            </button>
                        </form>
                        <div className="admin-form-group">
                            <p className="admin-login-note">
                                {adminLoading ? "Loading admin accounts..." : adminUsers.length > 0 ? "Use your admin credentials to access the dashboard." : "No admin accounts found. Please contact support."}
                            </p>
                        </div>
                      
                        <a href="#" className="login-a" role="button" onClick={(e) => { e.preventDefault(); switchToForgot(); }}>
                            Forgot password?
                        </a>
                        <div className="admin-login-footer">
                            <p>authorized users can access only</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminLoginForm;