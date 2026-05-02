import express from "express";
import cors from "cors";
import mysql from "mysql2";

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));


const db = mysql.createConnection({
    host:   'localhost',
    user:   'root',
    password: '',
    database: 'resort_managements'
}); 

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database');

    db.query(`CREATE TABLE IF NOT EXISTS guest (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number_of_guests INT NOT NULL,
        food_service VARCHAR(10) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`, (tableErr) => {
        if (tableErr) {
            console.error('Error ensuring guest table exists:', tableErr);
            process.exit(1);
        }
    });
}); 


app.post('/add_rooms', (req, res) => {
    const sql = "INSERT INTO rooms (room_name, room_number, room_price, room_image, room_type, room_status, room_label) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [
        req.body.room_name,
        req.body.room_number,
        req.body.room_price,
        req.body.room_image,
        req.body.room_type,
        req.body.room_status,
        req.body.room_label
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error inserting room:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "Room added successfully!" });
    });
});

app.get('/get_rooms', (req, res) => {
    const sql = "SELECT * FROM rooms";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching rooms:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        return res.status(200).json(data);
    });
});

app.post('/update_rooms/:id', (req, res) => {
    const sql = "UPDATE rooms SET room_name = ?, room_number = ?, room_price = ?, room_image = ?, room_type = ?, room_status = ?, room_label = ? WHERE id = ?";
    const roomId = parseInt(req.params.id);
    
    const values = [
        req.body.room_name,
        req.body.room_number,
        req.body.room_price,
        req.body.room_image,
        req.body.room_type,
        req.body.room_status,
        req.body.room_label,
        roomId
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating room:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Room not found!" });
        }
        return res.status(200).json({ message: "Room updated successfully!", affectedRows: result.affectedRows });
    });
});
   
app.delete('/delete_room/:id', (req, res) => {
    const sql = "DELETE FROM rooms WHERE id = ?";
    const roomId = req.params.id;
    db.query(sql, [roomId], (err, result) => {
        if (err) {
            console.error("Error deleting room:", err);
            return res.status(500).json({ error: "Database error!" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Room not found" });
        }
        return res.status(200).json({ message: "Room deleted successfully" });
    });
});



app.post('/add_reservation', (req, res) => {
    const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
        req.body.last_name,
        req.body.first_name,
        req.body.num_guests,
        req.body.phone_number,
        req.body.email,
        req.body.check_in_date,
        req.body.check_out_date,
        req.body.notes,
        req.body.status || 'pending',
        req.body.room_id || null
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error inserting reservation:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "Reservation saved successfully!" });
    });
});

app.get('/get_reservations', (req, res) => {
    const sql = "SELECT r.*, COALESCE(rm.room_number, 'N/A') AS room_number FROM reservations r LEFT JOIN rooms rm ON r.room_id = rm.id ORDER BY r.id DESC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching reservations:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        return res.status(200).json(data);
    });
});

app.post('/add_guest_arrival', (req, res) => {
    console.log('Received add_guest_arrival payload:', req.body);
    const sql = "INSERT INTO guest (number_of_guests, food_service, total_price, created_at) VALUES (?, ?, ?, ?)";
    const values = [
        req.body.number_of_guests,
        req.body.food_service,
        req.body.total_price,
        req.body.created_at || new Date()
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error inserting guest arrival:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "Guest arrival recorded successfully!", guestId: data.insertId });
    });
});

app.get('/get_guest_arrivals', (req, res) => {
    const sql = "SELECT * FROM guest ORDER BY created_at DESC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching guest arrivals:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        return res.status(200).json(data);
    });
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Guest arrival backend is running' });
});

app.post('/update_reservation/:id', (req, res) => {
    const reservationId = parseInt(req.params.id);
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }

    const sql = "UPDATE reservations SET res_status = ? WHERE id = ?";
    db.query(sql, [status, reservationId], (err, result) => {
        if (err) {
            console.error('Error updating reservation status:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reservation not found.' });
        }
        return res.status(200).json({ message: 'Reservation status updated successfully.' });
    });
});

app.get('/get_dashboard_stats', (req, res) => {
    // Query to get all dashboard statistics using the database date
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM rooms) as total_rooms,
            (SELECT COUNT(*) FROM reservations WHERE res_status IN ('confirmed', 'pending') AND DATE(check_in_date) = CURDATE()) as todays_checkins,
            (SELECT COUNT(*) FROM reservations WHERE res_status = 'pending') as pending_bookings,
            (SELECT COALESCE(SUM(r.num_guests), 0) FROM reservations r WHERE r.res_status IN ('confirmed', 'pending')) as total_guests,
            (SELECT COALESCE(SUM(rm.room_price * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status = 'confirmed') as total_revenue,
            (SELECT COALESCE(SUM(rm.room_price * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status = 'confirmed' AND DATE(r.check_in_date) = CURDATE()) as todays_sales,
            (SELECT COALESCE(SUM(rm.room_price * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status = 'pending') as booking_sales
    `;

    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching dashboard stats:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        console.log("Dashboard stats:", data[0]);
        return res.status(200).json(data[0]); 
    });
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});