import React from 'react';
import Home from './pages/landing_page';
import Reservation from './pages/res_book';
import LandingGuide from './pages/landing-guide';
import UserLogin from './admin_pages/user_login';
import Dashboard from './admin_pages/admin_dasboard';
import Rooms from './admin_pages/admin_rooms';
import Booking from './admin_pages/admin_booking';
import Guest from './admin_pages/admin_guest';
import AdminAddGuest from './admin_pages/admin_addGuest';
import AdminUsersAcc from './admin_pages/admin_usersAcc';
import AdminProfile from './admin_pages/admin_profile';
import AdminLoginForm from './admin_pages/admin_loginform';
import AdminSales from './admin_pages/admin_sales';
import AdminFloatingModal from './Modals/admin_flowting_modals';





import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function RequireAuth({ children }) {
  const adminUser = localStorage.getItem('adminUser');
  if (!adminUser) {
    return <Navigate to="/AdminLogin" replace />;
  }
  return children;
}

function AdminPage({ children }) {
  return (
    <RequireAuth>
      {children}
      <AdminFloatingModal />
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Guide" element={<LandingGuide />} />
        <Route path="/Reservation" element={<Reservation />} />
        <Route path="/Login" element={<UserLogin />} />

        <Route path="/AdminLogin" element={<AdminLoginForm />} />

        <Route path="/Dashboard" element={<AdminPage><Dashboard /></AdminPage>} />
        <Route path="/Rooms" element={<AdminPage><Rooms /></AdminPage>} />
        <Route path="/Booking" element={<AdminPage><Booking /></AdminPage>} />
        <Route path="/Guest" element={<AdminPage><Guest /></AdminPage>} />
        <Route path="/AddGuest" element={<AdminPage><AdminAddGuest /></AdminPage>} />
        <Route path="/Users" element={<AdminPage><AdminUsersAcc /></AdminPage>} />
        <Route path="/Profile" element={<AdminPage><AdminProfile /></AdminPage>} />
        <Route path="/Sales" element={<AdminPage><AdminSales /></AdminPage>} />

        

      

    
      </Routes>
    </BrowserRouter>
  );
}

export default App;