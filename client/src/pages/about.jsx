import React, {useState} from "react";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "../pagescss/about.css";

function About() {

    const rooms = [
    {
      title: "Family Room",
      img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1",
      note: "Note: This is a static map image. For an interactive map, please visit our location on Google Maps."
    },
    {
      title: "Double Room",
      img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1",
      note: "Note: This is a static map image. For an interactive map, please visit our location on Google Maps."
    },
    {
      title: "Event Venue",
      img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/33/df/62/souphattra-hotel.jpg?w=700&h=-1&s=1",
      note: "Note: This is a static map image. For an interactive map, please visit our location on Google Maps."
    }
  ];

  const [index, setIndex] = useState(0);

  const next = () => {
    setIndex((prev) => (prev + 1) % rooms.length);
  };

  const prev = () => {
    setIndex((prev) => (prev === 0 ? rooms.length - 1 : prev - 1));
  };

  const room = rooms[index];

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
                    <li><Link to="/About">About</Link></li>
                    <li>
                        <button className="landing-btn">
                            sign in
                        </button>
                    </li>
                    </ul>
                </div>
            </nav>

            
            <section className="about-info">
                <span className="about-info-eyebrow">The Messhia Experience</span>
                <div className="about-info-title">
                    <h1>Discover the Messhia Experience</h1>
                </div>
                <div className="about-info-grid">
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span><i className="fa-solid fa-water"></i></span>
                    </div>
                <h3>Pool</h3>
                <p>Enjoy our luxurious rooftop pool with stunning city views and premium amenities.</p>
                </div>
            
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span><i className="fa-regular fa-clock"></i></span>
                    </div>
                <h3>24/7 Service</h3>
                <p>Our dedicated team is available around the clock to ensure your comfort and satisfaction.</p>
                </div>
                
                <div className="about-info-content">
                    <div className="about-info-icon">
                        <span><i className="fa-regular fa-handshake"></i></span>
                    </div>
                <h3>Excellence Experience</h3>
                <p>Our commitment to excellence ensures every aspect of your stay is perfect.</p>
                </div>

            </div>

            <div className="about-main-seclection">
                <Link to="/Reservation">
                <button className="about-btn">Check Available</button>
                </Link>
            </div>
            </section>

            <section className="about-img">
                <div className="about-img-content1">
                    <div className="about-img-text">
                        <span className="about-img-eyebrow">Find Us</span>
                        <h1>Our Location</h1>
                        <p>123 Main Street, Cityville, Country</p>
                        <p>Phone: (123) 456-7890</p>
                        <p>Email: info@messiah.com</p>
                    </div>
                </div>
                <div className="about-img-iframe-content">
                    <div className="about-img-content">
                        <div className="about-img-slider">
                            <button className="about-btn-img-prev" onClick={prev}><i className="fa-solid fa-arrow-left"></i></button>
                            <div className="about-img-iframe">
                                <img src={room.img} alt={room.title} />
                            </div>
                            <button className="about-btn-img-next" onClick={next}><i className="fa-solid fa-arrow-right"></i></button>
                        </div>
                        <div className="about-img-texts">
                            <Link to="/Reservation">
                            <button className="about-btn-img">Check Available</button>
                            </Link>
                            <h1>{room.title}</h1>
                            <p className="about-img-note">{room.note}</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="about-pool">
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

           <footer className="about-footer">
                <div className="about-footer-content">
                <p className="about-footer-brand">MESSIAH</p>
                
                <p>© 2026 Messiah. All rights reserved.</p> 
                </div>
            </footer>
        </div>
    );
}

export default About;