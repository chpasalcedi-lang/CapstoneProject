import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import "../admincss/user_login.css";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_9fw39gp";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_sff4wpr";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "-Vq78NrvG691mgYQ3";

emailjs.init(EMAILJS_PUBLIC_KEY);

function UserLogin() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const pendingEmail = localStorage.getItem("pendingOtpEmail");
        const pendingExpires = Number(localStorage.getItem("pendingOtpExpires"));

        if (pendingEmail && pendingExpires && Date.now() < pendingExpires) {
            setOtpSent(true);
            setEmail(pendingEmail);
        } else {
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
        }
    }, []);

    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleSendCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            Swal.fire({ icon: "warning", title: "Enter email", text: "Please type your email address first." });
            return;
        }

        setEmail(normalizedEmail);
        const otp = generateOtp();
        setWaiting(true);

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    email: normalizedEmail,
                    otp: otp,
                    time: "15 minutes",
                    reply_to: normalizedEmail,
                },
                EMAILJS_PUBLIC_KEY
            );

            setOtpSent(true);
            localStorage.setItem("pendingOtp", otp);
            localStorage.setItem("pendingOtpEmail", normalizedEmail);
            localStorage.setItem("pendingOtpExpires", String(Date.now() + 15 * 60 * 1000));
            Swal.fire({ icon: "success", title: "Code sent", text: `A verification code was sent to ${normalizedEmail}. It will expire in 15 minutes.` });
        } catch (err) {
            console.error("EmailJS send error:", err);
            Swal.fire({ icon: "error", title: "Email failed", text: "Could not send the verification code. Please try again." });
        } finally {
            setWaiting(false);
        }
    };

    const handleVerify = (e) => {
        e.preventDefault();

        const storedOtp = localStorage.getItem("pendingOtp");
        const storedEmail = localStorage.getItem("pendingOtpEmail");
        const expires = Number(localStorage.getItem("pendingOtpExpires"));
        const normalizedEmail = email.trim().toLowerCase();

        if (!storedOtp || !storedEmail || !expires) {
            Swal.fire({ icon: "error", title: "No code sent", text: "Please request a verification code first." });
            return;
        }

        if (Date.now() > expires) {
            Swal.fire({ icon: "warning", title: "Code expired", text: "The verification code expired. Please request a new one." });
            setOtpSent(false);
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
            return;
        }

        if (normalizedEmail !== storedEmail.toLowerCase()) {
            Swal.fire({ icon: "error", title: "Email mismatch", text: "Please use the same email address that received the code." });
            return;
        }

        if (code.trim() !== storedOtp) {
            Swal.fire({ icon: "error", title: "Invalid code", text: "The verification code is incorrect." });
            return;
        }

        localStorage.setItem("userEmail", normalizedEmail);
        localStorage.removeItem("pendingOtp");
        localStorage.removeItem("pendingOtpEmail");
        localStorage.removeItem("pendingOtpExpires");
        setCode("");
        Swal.fire({ icon: "success", title: "Logged in", text: "You are now verified and can book a room." });
        navigate("/Reservation");
    };

    const handleBackToLanding = () => {
        navigate("/Home");
    };

    return (
        <div className="user-login-page">
            <div className="user-login-card">
                <button className="user-login-close-btn" type="button" onClick={handleBackToLanding}><i className="fa-solid fa-xmark"></i></button>
                <img src="https://image2url.com/r2/default/images/1772332199936-491a3025-c124-4928-a38c-faad063cc82a.jpg" alt="Login Background" className="admin-login-bg" />
                <div className="user-login-content">
                    <div className="user-login-header">
                        <h2>Messiah Email Login</h2>
                        <p>Verify with your email before booking a room.</p>
                    </div>

                    <form className="user-login-form" onSubmit={handleVerify}>
                        <div className="user-login-field">
                            <label>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required/>
                        </div>
                        <div className="user-login-buttons">
                            <button type="button" className="user-login-btn" onClick={handleSendCode} disabled={waiting}>
                                {otpSent ? "Resend Code" : "Send Verification Code"}
                            </button>
                        </div>
                        <div className="user-login-field">
                            <label>Verification Code</label>
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter verification code" required/>
                        </div>
                        <button className="user-login-btn" type="submit">Verify and Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserLogin;