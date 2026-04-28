import React from 'react';
import Home from './pages/landing_page';
import Reservation from './pages/res_book';
import About from './pages/about';

import Dashboard from './admin_pages/admin_dasboard';
import Rooms from './admin_pages/admin_rooms';
import Booking from './admin_pages/admin_booking';
import Guest from './admin_pages/admin_guest';



import { BrowserRouter, Routes, Route, Navigate,} from "react-router-dom"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Reservation" element={<Reservation />} />
        <Route path="/About" element={<About />} />


        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Rooms" element={<Rooms/>} />
        <Route path="/Booking" element={<Booking />} />
        <Route path="/Guest" element={<Guest />} />

      

    
      </Routes>
    </BrowserRouter>
  );
}

export default App;