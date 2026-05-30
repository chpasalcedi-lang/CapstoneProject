import express from "express";
import cors from "cors";
import mysql from "mysql2";
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));



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
});

const SECRET_KEY = process.env.SECRET_KEY || 'uV9_7lXJ_v_N9Z9pL5mGk1m8n8-v7Z7r9R_vP8N7X2s=';

function getCryptoKey() {
    return CryptoJS.SHA256(SECRET_KEY);
}

function getCryptoIv() {
    return CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16));
}

function encrypt(text) {
    if (text === undefined || text === null) return '';
    const key = getCryptoKey();
    const iv = getCryptoIv();
    return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(String(text)), key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
}

function decrypt(text) {
    if (!text) return '';
    try {
        const key = getCryptoKey();
        const iv = getCryptoIv();
        const bytes = CryptoJS.AES.decrypt(text, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) return decrypted;
    } catch (_error) {
        // fall through and try passphrase-based decrypt
    }
    try {
        const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return String(text);
    }
}


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
    const roomId = parseInt(req.params.id, 10);
    
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

app.delete('/delete_guest_arrival/:id', (req, res) => {
    const sql = "DELETE FROM guest WHERE id = ?";
    const guestId = req.params.id;
    db.query(sql, [guestId], (err, result) => {
        if (err) {
            console.error("Error deleting guest arrival:", err);
            return res.status(500).json({ error: "Database error!" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Guest arrival not found" });
        }
        return res.status(200).json({ message: "Guest arrival deleted successfully" });
    });
});


app.get('/get_user_accounts', (req, res) => {
    const sql = "SELECT id, name, email, role, created_at FROM admins";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching admin accounts:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        const decryptedData = data
            .map((item) => ({
                ...item,
                name: decrypt(item.name),
                email: decrypt(item.email)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return res.status(200).json(decryptedData);
    });
});

app.post('/add_user_account', (req, res) => {
    // Create admin account (all users are stored in `admins` table)
    const sql = "INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)";
    const plain = req.body.password || '';
    const hashed = bcrypt.hashSync(plain, 10);
    const encryptedName = req.body.name ? encrypt(req.body.name) : '';
    const encryptedEmail = req.body.email ? encrypt(req.body.email) : '';
    const values = [
        encryptedName,
        encryptedEmail,
        hashed,
        req.body.role || ''
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error adding admin account:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "Admin account created successfully", id: data.insertId });
    });
});

app.post('/update_user_account/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const fields = [];
    const values = [];

    if (req.body.name) {
        fields.push('name = ?');
        values.push(encrypt(req.body.name));
    }
    if (req.body.email) {
        fields.push('email = ?');
        values.push(encrypt(req.body.email));
    }
    if (req.body.role) {
        fields.push('role = ?');
        values.push(req.body.role);
    }
    if (req.body.password) {
        const hashed = bcrypt.hashSync(req.body.password, 10);
        fields.push('password = ?');
        values.push(hashed);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating admin account:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Admin account not found" });
        }
        return res.status(200).json({ message: "Admin account updated successfully" });
    });
});

app.delete('/delete_user_account/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM admins WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error deleting admin account:", err);
            return res.status(500).json({ error: "Database error!" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Admin account not found" });
        }
        return res.status(200).json({ message: "Admin account deleted successfully" });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = 'SELECT id, name, email, role, password FROM admins WHERE email = ?';
    db.query(sql, [encrypt(email)], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Database query error', details: err.message });
        }
        const handleUserRow = (userRow) => {
            const user = { ...userRow };
            user.name = decrypt(user.name);
            user.email = decrypt(user.email);
            const hash = user.password || '';
            const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

            const finishLogin = () => {
                delete user.password;
                console.log('Login successful for:', user.email, 'role:', user.role);
                return res.status(200).json({ message: 'Login successful', user });
            };

            if (isBcrypt) {
                bcrypt.compare(password, hash, (bcryptErr, same) => {
                    if (bcryptErr) {
                        console.error('Bcrypt compare error:', bcryptErr);
                        return res.status(500).json({ error: 'Server error' });
                    }
                    if (!same) {
                        return res.status(401).json({ error: 'Invalid email or password' });
                    }
                    finishLogin();
                });
                return;
            }

            if (password === hash) {
                const newHash = bcrypt.hashSync(password, 10);
                db.query('UPDATE admins SET password = ? WHERE email = ?', [newHash, encrypt(email)], (updateErr) => {
                    if (updateErr) {
                        console.error('Error migrating plaintext password:', updateErr);
                    }
                    finishLogin();
                });
                return;
            }

            return res.status(401).json({ error: 'Invalid email or password' });
        };

        if (!results.length) {
            // Legacy fallback for accounts stored with plain email.
            db.query(sql, [email], (legacyErr, legacyResults) => {
                if (legacyErr) {
                    console.error('Error during legacy login:', legacyErr);
                    return res.status(500).json({ error: 'Database query error', details: legacyErr.message });
                }
                if (!legacyResults.length) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                handleUserRow(legacyResults[0]);
            });
            return;
        }

        handleUserRow(results[0]);
        user.name = decrypt(user.name);
        user.email = decrypt(user.email);
        const hash = user.password || '';
        const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

        const finishLogin = () => {
            delete user.password;
            console.log('Login successful for:', user.email, 'role:', user.role);
            return res.status(200).json({ message: 'Login successful', user });
        };

        if (isBcrypt) {
            bcrypt.compare(password, hash, (bcryptErr, same) => {
                if (bcryptErr) {
                    console.error('Bcrypt compare error:', bcryptErr);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (!same) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                finishLogin();
            });
            return;
        }

        if (password === hash) {
            const newHash = bcrypt.hashSync(password, 10);
            db.query('UPDATE admins SET password = ? WHERE email = ?', [newHash, encrypt(email)], (updateErr) => {
                if (updateErr) {
                    console.error('Error migrating plaintext password:', updateErr);
                }
                finishLogin();
            });
            return;
        }

        return res.status(401).json({ error: 'Invalid email or password' });
    });
});

app.post('/add_reservation', (req, res) => {
    const sql = "INSERT INTO reservations ( last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const normalizedRoomPrice = req.body.room_price ? parseFloat(String(req.body.room_price).replace(/,/g, '')) : null;
    const normalizedTotalPrice = req.body.total_price ? parseFloat(String(req.body.total_price).replace(/,/g, '')) : null;
    const finalTotalPrice = Number.isFinite(normalizedTotalPrice) ? normalizedTotalPrice : null;
    const values = [
        encrypt(req.body.last_name || ''),
        encrypt(req.body.first_name || ''),
        parseInt(req.body.num_guests, 10) || 0,
        encrypt(req.body.phone_number || ''),
        encrypt(req.body.email || ''),
        req.body.check_in_date || null,
        req.body.check_out_date || null,
        encrypt(req.body.notes || ''),
        req.body.status || 'pending',
        req.body.room_id || null,
        normalizedRoomPrice,
        finalTotalPrice
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('Error inserting reservation:', err);
            return res.status(500).json({
                error: 'Database query error!',
                details: err.message
            });
        }
        console.log('Reservation added successfully');
        return res.status(200).json({
            message: 'Reservation saved successfully!',
            reservationId: data.insertId
        });

    });

});

app.post('/add_feedback', (req, res) => {
    const sql = "INSERT INTO feedback (name, email, message, created_at) VALUES (?, ?, ?, ?)";
    const values = [
        encrypt(req.body.name || ''),
        encrypt(req.body.email || ''),
        encrypt(req.body.message || ''),
        new Date()
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error inserting feedback:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "Feedback submitted successfully!", feedbackId: data.insertId });
    });
});

app.get('/get_feedback', (req, res) => {
    const sql = "SELECT id, name, email, message, created_at FROM feedback ORDER BY created_at DESC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching feedback:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        const decryptedData = data.map((item) => ({
            ...item,
            name: decrypt(item.name),
            email: decrypt(item.email),
            message: decrypt(item.message)
        }));
        return res.status(200).json(decryptedData);
    });
});

app.delete('/delete_feedback/:id', (req, res) => {
    const feedbackId = parseInt(req.params.id, 10);
    if (Number.isNaN(feedbackId)) {
        return res.status(400).json({ error: 'Invalid feedback ID.' });
    }

    const sql = 'DELETE FROM feedback WHERE id = ?';
    db.query(sql, [feedbackId], (err, result) => {
        if (err) {
            console.error('Error deleting feedback:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Feedback not found.' });
        }
        return res.status(200).json({ message: 'Feedback deleted successfully.' });
    });
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
        const decryptedData = data.map((item) => {
            const first = decrypt(item.first_name);
            const last = decrypt(item.last_name);
            return {
                ...item,
                first_name: first,
                last_name: last,
                guest_name: (first + ' ' + last).trim(),
                phone_number: decrypt(item.phone_number),
                email: decrypt(item.email),
                notes: decrypt(item.notes),
            };
        });
        return res.status(200).json(decryptedData);
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
    const reservationId = parseInt(req.params.id, 10);
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

app.delete('/delete_reservation/:id', (req, res) => {
    const reservationId = parseInt(req.params.id, 10);
    if (Number.isNaN(reservationId)) {
        return res.status(400).json({ error: 'Invalid reservation ID.' });
    }

    const sql = 'DELETE FROM reservations WHERE id = ?';
    db.query(sql, [reservationId], (err, result) => {
        if (err) {
            console.error('Error deleting reservation:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reservation not found.' });
        }
        return res.status(200).json({ message: 'Reservation deleted successfully.' });
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