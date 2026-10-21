import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import "../admincss/user_login.css";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_9fw39gp";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_sff4wpr";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "-Vq78NrvG691mgYQ3";
const INITIAL_RESEND_COOLDOWN_MS = 0;
const REPEAT_RESEND_COOLDOWN_MS = 5 * 60 * 1000;

emailjs.init(EMAILJS_PUBLIC_KEY);

function UserLogin() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [sentEmail, setSentEmail] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [resendAvailableAt, setResendAvailableAt] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const codeInputs = useRef([]);
    const location = useLocation();
    const navigate = useNavigate();
    const isCodeStep = otpSent && email.trim().toLowerCase() === sentEmail?.toLowerCase();
    const resendSecondsLeft = Math.max(0, Math.ceil((resendAvailableAt - currentTime) / 1000));

    useEffect(() => {
        const pendingEmail = localStorage.getItem("pendingOtpEmail");
        const pendingExpires = Number(localStorage.getItem("pendingOtpExpires"));
        const storedAttempts = Number(localStorage.getItem("verificationAttempts")) || 0;
        const storedResendAvailableAt = Number(localStorage.getItem("pendingOtpResendAt")) || 0;

        if (pendingEmail && pendingExpires && Date.now() < pendingExpires) {
            setOtpSent(true);
            setEmail(pendingEmail);
            setSentEmail(pendingEmail);
            setAttempts(storedAttempts);
            setResendAvailableAt(storedResendAvailableAt);
        } else {
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
            localStorage.removeItem("verificationAttempts");
            localStorage.removeItem("pendingOtpResendAt");
            localStorage.removeItem("pendingOtpSendCount");
        }

        const clockInterval = window.setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => window.clearInterval(clockInterval);
    }, []);





    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleCodeDigitChange = (index, value) => {
        const digits = value.replace(/\D/g, "");

        if (digits.length > 1) {
            const pastedCode = digits.slice(0, 6);
            setCode(pastedCode);
            codeInputs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
            return;
        }

        const nextCode = code.padEnd(6, " ").split("");
        nextCode[index] = digits || " ";
        setCode(nextCode.join("").trimEnd());

        if (digits && index < 5) {
            codeInputs.current[index + 1]?.focus();
        }
    };

    const handleCodePaste = (event) => {
        const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pastedCode) return;

        event.preventDefault();
        setCode(pastedCode);
        codeInputs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
    };

    const handleCodeKeyDown = (event, index) => {
        if (event.key === "Backspace" && !code[index]?.trim() && index > 0) {
            codeInputs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            codeInputs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < 5) {
            codeInputs.current[index + 1]?.focus();
        }
    };

    const handleSendCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            Swal.fire({ icon: "warning", title: "Enter email", text: "Please type your email address first." });
            return;
        }

        const pendingEmail = localStorage.getItem("pendingOtpEmail")?.trim().toLowerCase();
        const resendAvailableAtForPendingCode = Number(localStorage.getItem("pendingOtpResendAt")) || 0;
        if (pendingEmail === normalizedEmail && Date.now() < resendAvailableAtForPendingCode) return;

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

            const pendingExpires = Number(localStorage.getItem("pendingOtpExpires"));
            const previousPendingEmail = localStorage.getItem("pendingOtpEmail")?.trim().toLowerCase();
            const hasActiveCode = Boolean(localStorage.getItem("pendingOtp")) &&
                pendingExpires > Date.now() &&
                previousPendingEmail === normalizedEmail;
            const storedSendCount = Number(localStorage.getItem("pendingOtpSendCount")) || 0;
            const sendCount = hasActiveCode ? storedSendCount : 0;
            const nextSuccessfulCodeSends = sendCount + 1;
            const cooldown = sendCount === 0 ? INITIAL_RESEND_COOLDOWN_MS : REPEAT_RESEND_COOLDOWN_MS;
            const nextResendAvailableAt = Date.now() + cooldown;
            setOtpSent(true);
            setAttempts(0);
            setResendAvailableAt(nextResendAvailableAt);
            localStorage.setItem("pendingOtpResendAt", String(nextResendAvailableAt));
            localStorage.setItem("pendingOtpSendCount", String(nextSuccessfulCodeSends));
            localStorage.setItem("pendingOtp", otp);
            localStorage.setItem("pendingOtpEmail", normalizedEmail);
            localStorage.setItem("pendingOtpExpires", String(Date.now() + 15 * 60 * 1000));
            localStorage.setItem("verificationAttempts", "0");
            setSentEmail(normalizedEmail);
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

        if (!storedOtp || !storedEmail || !expires) {
            Swal.fire({ icon: "error", title: "No code sent", text: "Please request a verification code first." });
            return;
        }

        if (!/^\d{6}$/.test(code.trim())) {
            Swal.fire({ icon: "warning", title: "Invalid code format", text: "The verification code must be 6 digits." });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (Date.now() > expires) {
            Swal.fire({ icon: "warning", title: "Code expired", text: "The verification code expired. Please request a new one." });
            setOtpSent(false);
            localStorage.removeItem("pendingOtp");
            localStorage.removeItem("pendingOtpEmail");
            localStorage.removeItem("pendingOtpExpires");
            localStorage.removeItem("verificationAttempts");
            localStorage.removeItem("pendingOtpResendAt");
            localStorage.removeItem("pendingOtpSendCount");
            return;
        }

        if (normalizedEmail !== storedEmail.toLowerCase()) {
            Swal.fire({ icon: "error", title: "Email mismatch", text: "Please use the same email address that received the code." });
            return;
        }

        if (code.trim() !== storedOtp) {
            const newAttempts = attempts + 1;
            
            if (newAttempts >= 5) {
                setAttempts(0);
                setOtpSent(false);
                setCode("");
                localStorage.removeItem("pendingOtp");
                localStorage.removeItem("pendingOtpEmail");
                localStorage.removeItem("pendingOtpExpires");
                localStorage.removeItem("verificationAttempts");
                localStorage.removeItem("pendingOtpResendAt");
                localStorage.removeItem("pendingOtpSendCount");
                Swal.fire({ icon: "warning", title: "Too many attempts", text: "Please request a new verification code." });
                return;
            }
            
            setAttempts(newAttempts);
            localStorage.setItem("verificationAttempts", String(newAttempts));
            Swal.fire({ icon: "error", title: "Invalid code", text: "The verification code is incorrect." });
            return;
        }

        localStorage.setItem("userEmail", normalizedEmail);
        localStorage.removeItem("pendingOtp");
        localStorage.removeItem("pendingOtpEmail");
        localStorage.removeItem("pendingOtpExpires");
        localStorage.removeItem("verificationAttempts");
        localStorage.removeItem("pendingOtpResendAt");
        localStorage.removeItem("pendingOtpSendCount");
        setCode("");
        Swal.fire({ icon: "success", title: "Logged in", text: "You are now verified and can continue with your booking." });
        const returnTo = ["/Home", "/Reservation"].includes(location.state?.returnTo)
            ? location.state.returnTo
            : "/Reservation";
        const returnToEventBooking = location.state?.openEventBooking === true;
        navigate(returnToEventBooking ? returnTo : "/Reservation", {
            replace: true,
            state: returnToEventBooking ? { openEventBooking: true } : undefined,
        });
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
                        {isCodeStep && (
                            <>

                                <div className="user-login-field">
                                    <label>Verification Code</label>
                                    <div className="user-login-code-inputs" role="group" aria-label="6-digit verification code">
                                        {Array.from({ length: 6 }, (_, index) => (
                                            <input
                                                key={index}
                                                ref={(element) => { codeInputs.current[index] = element; }}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                                value={code[index]?.trim() ? code[index] : ""}
                                                onChange={(event) => handleCodeDigitChange(index, event.target.value)}
                                                onPaste={handleCodePaste}
                                                onKeyDown={(event) => handleCodeKeyDown(event, index)}
                                                aria-label={`Verification code digit ${index + 1}`}
                                                maxLength="1"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button className="user-login-btn" type="submit" disabled={!/^\d{6}$/.test(code)}>Verify and Login</button>

                                <div className="user-login-code-footer">
                                    <div className="user-login-expiry">
                                        <i className="fa-regular fa-clock" aria-hidden="true"></i>
                                        <span>Code expires in <strong>15 minutes</strong></span>
                                    </div>
                                    <div className="user-login-code-actions">
                                        <button type="button" className="user-login-inline-link" onClick={handleSendCode} disabled={waiting || resendSecondsLeft > 0}>
                                            {waiting ? (
                                                <>
                                                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                                                    Sending...
                                                </>
                                            ) : resendSecondsLeft > 0 ? (
                                                <>
                                                    <i className="fa-solid fa-clock" aria-hidden="true"></i>
                                                    Resend in {String(Math.floor(resendSecondsLeft / 60)).padStart(2, "0")}:{String(resendSecondsLeft % 60).padStart(2, "0")}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
                                                    Resend code
                                                </>
                                            )}
                                        </button>
                                        <button type="button" className="user-login-inline-link user-login-back-link" onClick={() => {
                                            setOtpSent(false);
                                            setCode("");
                                        }}>
                                            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                                            Back
                                        </button>
                                    </div>
                                </div>

                            </>
                        )}
                        {!isCodeStep && (
                            <>
                                <div className="user-login-field">
                                    <label>Email</label>
                                    <input type="email" value={email} onChange={(e) => {
                                        setEmail(e.target.value);
                                        setCode("");
                                    }} placeholder="Enter your email" required/>
                                </div>
                                <div className="user-login-buttons">
                                    <button type="button" className={`user-login-btn${waiting ? " user-login-btn-loading" : ""}`} onClick={handleSendCode} disabled={waiting} aria-busy={waiting}>
                                        {waiting ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                                                Sending code...
                                            </>
                                        ) : "Send Verification Code"}
                                    </button>
                                </div>

                                <div className="user-login-verification-notice">
                                    <i className="fa-regular fa-envelope" aria-hidden="true"></i>
                                    <p>A one-time code has been sent to your email.</p>
                                </div>
                                {sentEmail && (
                                    <button type="button" className="user-login-verification-back" onClick={() => setOtpSent(true)}>
                                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                                        Back to verification code
                                    </button>
                                )}
                            </>
                        )}
      
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserLogin;