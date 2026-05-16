import React from 'react';
import Home from './pages/landing_page';
import Reservation from './pages/res_book';
import About from './pages/about';

import Dashboard from './admin_pages/admin_dasboard';
import Rooms from './admin_pages/admin_rooms';
import Booking from './admin_pages/admin_booking';
import Guest from './admin_pages/admin_guest';
import AdminAddGuest from './admin_pages/admin_addGuest';
import AdminUsersAcc from './admin_pages/admin_usersAcc';
import AdminProfile from './admin_pages/admin_profile';
import AdminLogs from './admin_pages/admin_logs';
import AdminLoginForm from './admin_pages/admin_loginform';





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
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Reservation" element={<Reservation />} />
        <Route path="/About" element={<About />} />

        <Route path="/AdminLogin" element={<AdminLoginForm />} />

        <Route path="/Dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/Rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
        <Route path="/Booking" element={<RequireAuth><Booking /></RequireAuth>} />
        <Route path="/Guest" element={<RequireAuth><Guest /></RequireAuth>} />
        <Route path="/AddGuest" element={<RequireAuth><AdminAddGuest /></RequireAuth>} />
        <Route path="/Users" element={<RequireAuth><AdminUsersAcc /></RequireAuth>} />
        <Route path="/Profile" element={<RequireAuth><AdminProfile /></RequireAuth>} />
        <Route path="/Logs" element={<RequireAuth><AdminLogs /></RequireAuth>} />

        

      

    
      </Routes>
    </BrowserRouter>
  );
}

export default App;