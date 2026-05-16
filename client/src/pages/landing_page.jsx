import React from "react";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "../pagescss/landing_page.css";


function LandingPage() {


  return (
    <div>
      <nav className="landing-navbar">
        <div className="landing-nav-content">
            <div className="logo">
            <h1>MESSIAH</h1>
            </div>
            <ul className="landing-nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/Reservation">Room</Link></li>
            <li><a href="#about-pool">About</a></li>
            <li>
                <button className="landing-btn">
                    sign in
                </button>
            </li>
            </ul>
        </div>
    </nav>

      <section className="landing-main">
        <div className="landing-main-content">
          <h1>Welcome to Messiah!</h1>
          <p>Experience luxury and comfort like never before. Book your stay with us today and enjoy an unforgettable experience.</p>
        </div>

        <div className="landing-main-seclection">
          <Link to="/Reservation">
            <button className="landing-btn">Check Available</button>
          </Link>
        </div>
      </section>


      <section className="landing-info">
         <span className="landing-info-eyebrow">The Messhia Experience</span>
          <div className="landing-info-title">
            <h1>Discover the Messhia Experience</h1>
          </div>
          <div className="landing-info-grid">
            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-solid fa-water"></i></span>
              </div>
             <h3>Pool</h3>
             <p>Dive into relaxation. Enjoy our refreshing pool with stunning views and curated amenities designed for your total peace of mind.</p>
            </div>

            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-regular fa-clock"></i></span>
              </div>
             <h3>24/7 Service</h3>
             <p>Rest easy knowing our dedicated team is here for you around the clock. From dawn until dusk, we are committed to your total comfort and satisfaction.</p>
            </div>
           
            <div className="landing-info-content">
              <div className="landing-info-icon">
                  <span><i className="fa-regular fa-handshake"></i></span>
              </div>
             <h3>Excellence Experience</h3>
             <p>Our commitment to excellence ensures every aspect of your stay is perfect.</p>
            </div>
          </div>
      </section>


<section className="about-pool" id="about-pool">
    <div className="about-pool-content">
        <div id="carouselExampleDark" className="carousel carousel-dark slide" data-bs-ride="carousel">
            <div className="carousel-indicators">
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="2" aria-label="Slide 3"></button>
            </div>
            <div className="carousel-inner">
                <div className="carousel-item active" data-bs-interval="10000">
                    <img src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1" className="d-block w-100" alt="..." />
                <div className="carousel-caption d-none d-md-block">
                </div>
                </div>
                <div className="carousel-item" data-bs-interval="2000">
                    <img src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1" className="d-block w-100" alt="..."/>
                <div className="carousel-caption d-none d-md-block">
                </div>
                </div>
                <div className="carousel-item">
                    <img src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1" className="d-block w-100" alt="..."/>
                <div className="carousel-caption d-none d-md-block">
                </div>
                </div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
            </button>
        </div>
        <div className="about-pool-text">
            <h1>MESSIAH POOL RESORT</h1>
            <p>Experience our premium infinity pool with elegant ambiance, breathtaking views, and world-class comfort designed for your perfect stay.</p>
            <Link to="/Reservation">
                <button className="about-btn-pool">Check Available</button>
            </Link>
        </div>
    </div>
</section>
      

      <section className="landing-map">
       <span className="landing-map-eyebrow">Our Location</span>
        <div className="landing-map-content">
          <h1>Find Us</h1>
          <p>Located in the heart of the city, Messiah is easily accessible and surrounded by attractions.</p>
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

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <p className="landing-footer-brand">MESSIAH</p>
          
          <p>© 2026 Messiah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;