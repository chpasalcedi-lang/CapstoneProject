import React, { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/landing_page'));
const Reservation = lazy(() => import('./pages/res_book'));
const UserLogin = lazy(() => import('./admin_pages/user_login'));
const AdminLoginForm = lazy(() => import('./admin_pages/admin_loginform'));
const Dashboard = lazy(() => import('./admin_pages/admin_dasboard'));
const Rooms = lazy(() => import('./admin_pages/admin_rooms'));
const Booking = lazy(() => import('./admin_pages/admin_booking'));
const Guest = lazy(() => import('./admin_pages/admin_guest'));
const AdminAddGuest = lazy(() => import('./admin_pages/admin_addGuest'));
const AdminUsersAcc = lazy(() => import('./admin_pages/admin_usersAcc'));
const AdminProfile = lazy(() => import('./admin_pages/admin_profile'));
const AdminSales = lazy(() => import('./admin_pages/admin_sales'));

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function RequireAuth({ children }) {
  const adminUser = localStorage.getItem('adminUser');
  if (!adminUser) {
    return <Navigate to="/AdminLogin" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/Home" replace />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Reservation" element={<Reservation />} />
          <Route path="/Login" element={<UserLogin />} />

          <Route path="/AdminLogin" element={<AdminLoginForm />} />

          <Route path="/Dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/Rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
          <Route path="/Booking" element={<RequireAuth><Booking /></RequireAuth>} />
          <Route path="/Guest" element={<RequireAuth><Guest /></RequireAuth>} />
          <Route path="/AddGuest" element={<RequireAuth><AdminAddGuest /></RequireAuth>} />
          <Route path="/Users" element={<RequireAuth><AdminUsersAcc /></RequireAuth>} />
          <Route path="/Profile" element={<RequireAuth><AdminProfile /></RequireAuth>} />
          <Route path="/Sales" element={<RequireAuth><AdminSales /></RequireAuth>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;