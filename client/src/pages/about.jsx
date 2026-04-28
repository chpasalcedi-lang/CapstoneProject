import React from "react";
import { Link } from "react-router-dom";
import "../pagescss/about.css";

function About() {
    return (
        <div>
            <nav className="about-navbar">
                <div className="about-nav-content">
                <div className="logo">
                    <h1>Messiah</h1>
                </div>
                <ul className="about-nav-links">
                    <li className=""><Link to="/">Home</Link></li>
                    <li className=""><Link to="/Reservation">Room</Link></li>
                    <li className=""><Link to="/About">About</Link></li>
                    <li className="">Settings</li>
                </ul>
                </div>
            </nav>

            <section className="about-main">
                <div className="about-main-content">
                <h1>Welcome to Messiah!</h1>
                <p>Experience luxury and comfort like never before. Book your stay with us today and enjoy an unforgettable experience.</p>
                </div>

                <div className="about-main-seclection">
                <Link to="/Reservation">
                    <button className="about-btn">Check Available</button>
                </Link>
                </div>
            </section>


            <section className="about-info">
                <span className="about-info-eyebrow">The Messhia Experience</span>
                <div className="about-info-title">
                    <h1>Discover the Messhia Experience</h1>
                </div>
                <div className="about-info-grid">
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span>📸</span>
                    </div>
                <h3>Pool</h3>
                <p>Enjoy our luxurious rooftop pool with stunning city views and premium amenities.</p>
                </div>
            
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span>📸</span>
                    </div>
                <h3>24/7 Service</h3>
                <p>Our dedicated team is available around the clock to ensure your comfort and satisfaction.</p>
                </div>
                
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span>📸</span>
                    </div>
                <h3>Excellence Experience</h3>
                <p>Our commitment to excellence ensures every aspect of your stay is perfect.</p>
                </div>
            </div>
            </section>

            <section className="about-map">
            <span className="about-map-eyebrow">Our Location</span>
                <div className="about-map-content">
                <h1>Find Us</h1>
                <p>Located in the heart of the city, Messiah is easily accessible and surrounded by vibrant culture and attractions.</p>
                <div className="map-container">
                    <iframe
                    src="https://www.google.com/maps?q=Messiah+Inland+Resort+San+Miguel+Iloilo&output=embed"
                    allowFullScreen
                    loading="lazy"
                    title="Messiah Inland Resort Location"
                    />
                </div>
                </div>
            </section>

            <footer className="about-footer">
                <div className="about-footer-content">
                <p className="about-footer-brand">Messiah</p>
                <p className="about-footer-links">
                    <span>Privacy</span>
                    <span className="about-footer-dot">·</span>
                    <span>Terms</span>
                    <span className="about-footer-dot">·</span>
                    <span>Contact</span>
                </p>
                <p>© 2026 Messiah. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default About;