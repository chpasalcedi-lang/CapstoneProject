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

    // Add room_price column to reservations table if it doesn't exist
    db.query(`ALTER TABLE reservations ADD COLUMN room_price DECIMAL(10,2) AFTER room_id`, (alterErr) => {
        // Ignore error if column already exists
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
            console.log('Note: room_price column may already exist or other schema update');
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
    const rawRoomPrice = req.body.room_price;
    const normalizedRoomPrice = rawRoomPrice != null ? parseFloat(String(rawRoomPrice).replace(/,/g, '')) : null;
    const numGuests = parseInt(req.body.num_guests, 10) || 0;
    const roomId = req.body.room_id || null;

    // If room_price is provided and valid, use it; otherwise, get it from rooms table
    if (normalizedRoomPrice && !Number.isNaN(normalizedRoomPrice) && normalizedRoomPrice > 0) {
        // Room price is provided, insert directly
        const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [
            req.body.last_name || '',
            req.body.first_name || '',
            numGuests,
            req.body.phone_number || '',
            req.body.email || '',
            req.body.check_in_date,
            req.body.check_out_date,
            req.body.notes || '',
            req.body.status || 'pending',
            roomId,
            normalizedRoomPrice
        ];
        db.query(sql, values, (err, data) => {
            if (err) {
                console.error("Error inserting reservation:", err);
                return res.status(500).json({ error: "Database query error!", details: err.message });
            }
            console.log(`Reservation created with room_price=${normalizedRoomPrice}`);
            return res.status(200).json({ message: "Reservation saved successfully!" });
        });
    } else if (roomId) {
        // Get room_price from rooms table
        const getRoomPriceSql = "SELECT room_price FROM rooms WHERE id = ?";
        db.query(getRoomPriceSql, [roomId], (err, results) => {
            if (err || results.length === 0) {
                console.error("Error fetching room price:", err);
                // Still insert even if room price fetch fails
                const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                const values = [
                    req.body.last_name || '',
                    req.body.first_name || '',
                    numGuests,
                    req.body.phone_number || '',
                    req.body.email || '',
                    req.body.check_in_date,
                    req.body.check_out_date,
                    req.body.notes || '',
                    req.body.status || 'pending',
                    roomId,
                    null
                ];
                db.query(sql, values, (err, data) => {
                    if (err) {
                        console.error("Error inserting reservation:", err);
                        return res.status(500).json({ error: "Database query error!", details: err.message });
                    }
                    return res.status(200).json({ message: "Reservation saved successfully!" });
                });
            } else {
                const roomPrice = parseFloat(String(results[0].room_price).replace(/,/g, '')) || null;
                const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                const values = [
                    req.body.last_name || '',
                    req.body.first_name || '',
                    numGuests,
                    req.body.phone_number || '',
                    req.body.email || '',
                    req.body.check_in_date,
                    req.body.check_out_date,
                    req.body.notes || '',
                    req.body.status || 'pending',
                    roomId,
                    roomPrice
                ];
                db.query(sql, values, (err, data) => {
                    if (err) {
                        console.error("Error inserting reservation:", err);
                        return res.status(500).json({ error: "Database query error!", details: err.message });
                    }
                    console.log(`Reservation created with room_price=${roomPrice}`);
                    return res.status(200).json({ message: "Reservation saved successfully!" });
                });
            }
        });
    } else {
        // No room_price and no room_id
        const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [
            req.body.last_name || '',
            req.body.first_name || '',
            numGuests,
            req.body.phone_number || '',
            req.body.email || '',
            req.body.check_in_date,
            req.body.check_out_date,
            req.body.notes || '',
            req.body.status || 'pending',
            null,
            null
        ];
        db.query(sql, values, (err, data) => {
            if (err) {
                console.error("Error inserting reservation:", err);
                return res.status(500).json({ error: "Database query error!", details: err.message });
            }
            return res.status(200).json({ message: "Reservation saved successfully!" });
        });
    }
});

app.get('/get_reservations', (req, res) => {
    const sql = `
        SELECT
            r.*,
            COALESCE(r.room_price, rm.room_price) AS room_price,
            COALESCE(rm.room_number, 'N/A') AS room_number,
            rm.room_name,
            rm.room_label,
            GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1) AS nights,
            COALESCE(r.room_price, rm.room_price) * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1) AS total_price
        FROM reservations r
        LEFT JOIN rooms rm ON r.room_id = rm.id
        ORDER BY r.id DESC
    `;
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

    // Get the reservation details
    const getReservationSql = `SELECT room_id, room_price FROM reservations WHERE id = ?`;
    db.query(getReservationSql, [reservationId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching reservation:', err);
            return res.status(500).json({ error: 'Failed to fetch reservation.' });
        }

        const reservation = results[0];
        
        // When confirming, ALWAYS fetch room_price from rooms table if room_id exists
        if (status === 'confirmed' && reservation.room_id) {
            const getRoomPriceSql = `SELECT room_price FROM rooms WHERE id = ?`;
            db.query(getRoomPriceSql, [reservation.room_id], (err, roomResults) => {
                let finalRoomPrice = reservation.room_price;
                
                if (!err && roomResults.length > 0) {
                    const fetchedPrice = parseFloat(String(roomResults[0].room_price).replace(/,/g, ''));
                    if (!isNaN(fetchedPrice) && fetchedPrice > 0) {
                        finalRoomPrice = fetchedPrice;
                    }
                }
                
                console.log(`Updating reservation ${reservationId}: status=${status}, room_price=${finalRoomPrice}`);
                
                // Update both status and room_price
                const updateSql = `UPDATE reservations SET res_status = ?, room_price = ? WHERE id = ?`;
                db.query(updateSql, [status, finalRoomPrice, reservationId], (updateErr, result) => {
                    if (updateErr) {
                        console.error('Error updating reservation:', updateErr);
                        return res.status(500).json({ error: 'Database error.' });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'Reservation not found.' });
                    }
                    console.log(`Reservation ${reservationId} confirmed with room_price=${finalRoomPrice}`);
                    return res.status(200).json({ message: 'Reservation updated successfully.' });
                });
            });
        } else {
            // For pending or cancelled, just update the status
            console.log(`Updating reservation ${reservationId}: status=${status}`);
            const updateSql = `UPDATE reservations SET res_status = ? WHERE id = ?`;
            db.query(updateSql, [status, reservationId], (updateErr, result) => {
                if (updateErr) {
                    console.error('Error updating reservation:', updateErr);
                    return res.status(500).json({ error: 'Database error.' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Reservation not found.' });
                }
                console.log(`Reservation ${reservationId} status changed to ${status}`);
                return res.status(200).json({ message: 'Reservation updated successfully.' });
            });
        }
    });
});

app.get('/get_dashboard_stats', (req, res) => {
    // Query with very strict data validation to exclude invalid records
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM rooms) as total_rooms,
            (SELECT COUNT(*) FROM reservations WHERE res_status IN ('confirmed', 'pending') AND DATE(check_in_date) = CURDATE() AND first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' AND num_guests >= 1 AND num_guests <= 20 AND room_price IS NOT NULL AND room_price > 500) as todays_checkins,
            (SELECT COUNT(*) FROM reservations WHERE res_status = 'pending' AND first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' AND num_guests >= 1 AND num_guests <= 20 AND room_price IS NOT NULL AND room_price > 500) as pending_bookings,
            (SELECT COALESCE(SUM(num_guests), 0) FROM reservations WHERE res_status IN ('confirmed', 'pending') AND first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' AND num_guests >= 1 AND num_guests <= 20 AND room_price IS NOT NULL AND room_price > 500) as total_guests,
            (SELECT COALESCE(SUM(COALESCE(r.room_price, rm.room_price) * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r LEFT JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status = 'confirmed' AND r.first_name IS NOT NULL AND r.first_name != '' AND r.last_name IS NOT NULL AND r.last_name != '' AND r.num_guests >= 1 AND r.num_guests <= 20 AND COALESCE(r.room_price, rm.room_price) IS NOT NULL AND COALESCE(r.room_price, rm.room_price) > 500) as total_revenue,
            (SELECT COALESCE(SUM(COALESCE(r.room_price, rm.room_price) * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r LEFT JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status = 'confirmed' AND DATE(r.check_in_date) = CURDATE() AND r.first_name IS NOT NULL AND r.first_name != '' AND r.last_name IS NOT NULL AND r.last_name != '' AND r.num_guests >= 1 AND r.num_guests <= 20 AND COALESCE(r.room_price, rm.room_price) IS NOT NULL AND COALESCE(r.room_price, rm.room_price) > 500) as todays_sales,
            (SELECT COALESCE(SUM(COALESCE(r.room_price, rm.room_price) * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)), 0) FROM reservations r LEFT JOIN rooms rm ON r.room_id = rm.id WHERE r.res_status IN ('confirmed', 'pending') AND r.first_name IS NOT NULL AND r.first_name != '' AND r.last_name IS NOT NULL AND r.last_name != '' AND r.num_guests >= 1 AND r.num_guests <= 20 AND COALESCE(r.room_price, rm.room_price) IS NOT NULL AND COALESCE(r.room_price, rm.room_price) > 500) as booking_sales,
            (SELECT COUNT(*) FROM reservations WHERE res_status = 'cancelled' AND first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '') as cancelled_count
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