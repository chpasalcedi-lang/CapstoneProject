import React from "react";
import { Link } from "react-router-dom";
import "../pagescss/landing_page.css";
import "../pagescss/landing-guide.css";

const LandingGuide = () => (
  <div className="landing-guide-page">
    <nav className="landing-navbar">
      <div className="landing-nav-content">
        <Link className="logo landing-guide-logo" to="/Home" aria-label="Messiah home">
          <h1>MESSIAH</h1>
        </Link>
        <ul className="landing-nav-links">
          <li><Link to="/Home">Home</Link></li>
          <li><Link to="/Reservation">Rooms</Link></li>
          <li><Link to="/Home#about-pool">About</Link></li>
          <li><Link to="/Guide" aria-current="page">Guide</Link></li>
        </ul>
        <div className="nav-actions">
          <Link to="/Reservation" className="landing-btn">Book to stay</Link>
        </div>
      </div>
    </nav>

    <main className="landing-guide">
      <header className="landing-guide-header">
        <span className="landing-guide-eyebrow">MESSIAH INLAND RESORT</span>
        <h1>Guest Guide</h1>
        <p>A few helpful details to make your stay comfortable and enjoyable.</p>
      </header>

      <section className="landing-guide-video-section" aria-labelledby="landing-guide-video-title">
        <h2 id="landing-guide-video-title">Online Reservation Guide</h2>
        <video
          className="landing-guide-video"
          controls
          playsInline
          preload="metadata"
          aria-label="Messiah online reservation guide video"
        >
          <source src="/messiah-online-reservation-guide.mp4" type="video/mp4" />
          Your browser does not support video playback.
        </video>
      </section>

      <section className="landing-guide-section">
        <h2>Check-in and Check-out</h2>
        <h3>Rooms</h3>
            <ul>
            <li>Check-in time is from 2:00 PM onwards.</li>
            <li>Check-out time is until 2:00 PM.</li>
            <li>Please present a valid ID upon check-in.</li>
            </ul>
        <h3>Function Rooms</h3>
            <ul>
            <li>Check-in is from 7:00 AM onwards.</li>
            <li>Check-out is until 7:00 AM.</li>
            <li>Function rooms are available for private events and gatherings.</li>
            <li>Please present a valid ID upon check-in.</li>
            </ul>
      </section>

      <section className="landing-guide-section">
        <h2>Resort Rules</h2>
        <ul>
          <li>Smoking is not allowed in the rooms or public areas.</li>
          <li>Pets are allowed on the resort.</li>
          <li>Please respect the privacy and comfort of other guests.</li>
        </ul>
      </section>

      <section className="landing-guide-section">
        <h2>Facilities and Services</h2>
        <ul>
          <li>Enjoy our swimming pool and other resort amenities during your stay.</li>
          <li>Room service is available 24/7.</li>
          <li>Wi-Fi is available throughout the resort.</li>
        </ul>
      </section>

      <section className="landing-guide-section">
        <h2>Emergency Contacts</h2>
        <ul>
          <li>For emergencies, please contact the front desk immediately.</li>
          <li>Local emergency services can be reached at 911.</li>
        </ul>
      </section>

      <div className="landing-guide-actions">
        <Link to="/Home" className="landing-guide-home-link">Back to home</Link>
        <Link to="/Reservation" className="landing-btn">Check available rooms</Link>
      </div>
    </main>
  </div>
);

export default LandingGuide;
