import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../admincss/admin_sales.css";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function AdminSales() {
    const [guestSales, setGuestSales] = useState(0);
    const [bookingConfirmedSales, setBookingConfirmedSales] = useState(0);
    const [bookingCanceledLoss, setBookingCanceledLoss] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const [guestRes, bookingRes] = await Promise.all([
                    axios.get("http://localhost:3001/get_guest_arrivals"),
                    axios.get("http://localhost:3001/get_reservations")
                ]);

                const guestTotal = (guestRes.data || []).reduce((sum, guest) => {
                    const value = Number(guest.total_price || 0);
                    return sum + (Number.isNaN(value) ? 0 : value);
                }, 0);

                let confirmedTotal = 0;
                let canceledTotal = 0;

                (bookingRes.data || []).forEach((booking) => {
                    const status = (booking.res_status || '').toLowerCase();
                    const checkIn = booking.check_in_date ? new Date(booking.check_in_date) : null;
                    const checkOut = booking.check_out_date ? new Date(booking.check_out_date) : null;
                    const nights = checkIn && checkOut && checkOut > checkIn
                        ? Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
                        : 1;
                    const roomPrice = Number(booking.room_price || 0);
                    const reservationRevenue = Number.isNaN(roomPrice) ? 0 : roomPrice * nights;

                    if (status === 'confirmed') {
                        confirmedTotal += reservationRevenue;
                    } else if (status === 'cancelled' || status === 'canceled') {
                        canceledTotal += reservationRevenue;
                    }
                });

                setGuestSales(guestTotal);
                setBookingConfirmedSales(confirmedTotal);
                setBookingCanceledLoss(canceledTotal);
            } catch (err) {
                console.error("Error fetching sales stats:", err);
                Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to fetch sales statistics.' });
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

  

    const totalRevenue = guestSales + bookingConfirmedSales;

    const pieChartData = {
        labels: ['Guest Arrivals', 'Confirmed Reservations', 'Canceled Reservation Loss'],
        datasets: [
            {
                label: 'Revenue',
                data: [guestSales, bookingConfirmedSales, bookingCanceledLoss],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1,
                hoverBackgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ]
            }
        ]
    };

    const barChartData = {
        labels: ['Guest Arrivals', 'Confirmed Reservations', 'Canceled Reservation Loss'],
        datasets: [
            {
                label: 'Revenue',
                data: [guestSales, bookingConfirmedSales, bookingCanceledLoss],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1,
                hoverBackgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ]
            }
        ]
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#f0ede8'
                }
            }
        }
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#aaa' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.08)' },
                ticks: { color: '#aaa' }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#f0ede8'
                }
            }
        }
    };

    const formatCurrency = (amount = 0) => {
        const value = Number(amount || 0);
        return `₱${value.toLocaleString()}`;
    };
    


    return (
        <div>
            <nav className="dashboard-navbar">
                <div className="dashboard-nav-content">
                    <div className="dashboard-logo">
                        <Link to="/Dashboard"><h1>Messiah</h1></Link>
                    </div>
                        <ul className="dashboard-nav-links">
                            <p>dashboard</p>
                            <li><Link to="/Dashboard">Dashboard</Link></li>
                            <li><Link to="/Users">User</Link></li>
                            <li className="active"><Link to="/Sales">Sales</Link></li>
                            <p>management</p>
                            <li><Link to="/Rooms">Rooms</Link></li>
                            <li><Link to="/Booking">Booking</Link></li>
                            <li><Link to="/Guest">Guest s/ Feedback</Link></li>
                            <div className="dasboard-admin-status">
                                <Link to="/Profile">
                                    <div className="dasboard-admin-status-content">
                                        <h1>System admin</h1>
                                        <p className="admin-status ">admin</p>
                                    </div>
                                    <div className="dasboard-admin-profile"> Ap </div>
                                </Link>
                            </div>
                      </ul>
                </div>
            </nav>

            <section className="admin-sales-main">
                <div className="admin-sales-main-content">

                    <div className="admin-sales-topbar">
                        <h1>Sales</h1>
                    </div>

                    <p className="section-label">Revenue overview</p>
                    <div className="sales-stats-grid">

                        <div className="sales-stat-card soft-gold">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-gold">
                            <i className="fa-solid fa-dollar-sign"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(totalRevenue)}
                            </h2>
                            <p className="sales-stat-eyebrow">Total revenue</p>
                        </div>
                        </div>

                        <div className="sales-stat-card soft-green">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-green">
                            <i className="fa-solid fa-calendar-check"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(guestSales)}
                            </h2>
                            <p className="sales-stat-eyebrow">Guests sales</p>
                        </div>
                        </div>

                            <div className="sales-stat-card soft-amber">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-amber">
                            <i className="fa-solid fa-clock"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(bookingConfirmedSales)}
                            </h2>
                            <p className="sales-stat-eyebrow">Confirmed reservations</p>
                        </div>
                        </div>

                        <div className="sales-stat-card soft-red">
                        <div className="sales-stat-icon-row">
                            <span className="sales-stat-icon soft-red">
                            <i className="fa-solid fa-ban"></i>
                            </span>
                        </div>
                        <div>
                            <h2 className="sales-stat-title">
                            {loading ? "..." : formatCurrency(bookingCanceledLoss)}
                            </h2>
                            <p className="sales-stat-eyebrow">Canceled reservation loss</p>
                        </div>
                        </div>

                    </div>  

                    


                    <p className="section-label">Revenue stats</p>
                    
                    <div className="admin-sales-table-container">
                        <div className="admin-sales-chart-grid">
                            <div className="admin-sales-chart-card">
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                            
                            <div className="admin-sales-chart-card">
                                <Pie data={pieChartData} options={pieChartOptions} />
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}

export default AdminSales;
