import express from "express";
import cors from "cors";
import mysql from "mysql2";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const app = express();

console.log('SERVER STARTED:', { cwd: process.cwd(), scriptFile: import.meta.url });

console.log('PROCESS CWD:', process.cwd());

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const CREDENTIAL_SECRET = process.env.USER_CREDENTIALS_SECRET || 'ChangeThisSecretInProduction123!';

function getCredentialKey() {
  return crypto.createHash('sha256').update(CREDENTIAL_SECRET).digest();
}

function encryptCredentials(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getCredentialKey(), iv);
  let encrypted = cipher.update(String(value), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
}

function decryptCredentials(value) {
  if (!value) return '';
  const stringValue = String(value);
  const parts = stringValue.split(':');
  if (parts.length !== 2) {
    return stringValue;
  }

  try {
    const [ivString, encryptedData] = parts;
    const iv = Buffer.from(ivString, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getCredentialKey(), iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (decodeErr) {
    console.warn('Failed to decrypt credentials, returning raw value:', decodeErr.message);
    return stringValue;
  }
}

function isEncryptedValue(value) {
  if (!value) return false;
  const stringValue = String(value);
  const parts = stringValue.split(':');
  if (parts.length !== 2) {
    return false;
  }

  try {
    const [ivString, encryptedData] = parts;
    const iv = Buffer.from(ivString, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getCredentialKey(), iv);
    decipher.update(encryptedData, 'base64', 'utf8');
    decipher.final('utf8');
    return true;
  } catch {
    return false;
  }
}

async function migrateExistingSensitiveData() {
  try {
    const [users] = await db.promise().query('SELECT id, password FROM users');
    for (const user of users) {
      if (user.password && !isEncryptedValue(user.password)) {
        const encryptedPassword = encryptCredentials(user.password);
        await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [encryptedPassword, user.id]);
      }
    }

    const [reservations] = await db.promise().query('SELECT id, last_name, first_name, phone_number, email, notes FROM reservations');
    for (const reservation of reservations) {
      const encryptedValues = {};
      if (reservation.last_name && !isEncryptedValue(reservation.last_name)) {
        encryptedValues.last_name = encryptCredentials(reservation.last_name);
      }
      if (reservation.first_name && !isEncryptedValue(reservation.first_name)) {
        encryptedValues.first_name = encryptCredentials(reservation.first_name);
      }
      if (reservation.phone_number && !isEncryptedValue(reservation.phone_number)) {
        encryptedValues.phone_number = encryptCredentials(reservation.phone_number);
      }
      if (reservation.email && !isEncryptedValue(reservation.email)) {
        encryptedValues.email = encryptCredentials(reservation.email);
      }
      if (reservation.notes && !isEncryptedValue(reservation.notes)) {
        encryptedValues.notes = encryptCredentials(reservation.notes);
      }
      if (Object.keys(encryptedValues).length > 0) {
        const setClauses = Object.keys(encryptedValues).map((field) => `${field} = ?`).join(', ');
        const values = Object.values(encryptedValues);
        values.push(reservation.id);
        await db.promise().query(`UPDATE reservations SET ${setClauses} WHERE id = ?`, values);
      }
    }

    const [guests] = await db.promise().query('SELECT id, food_service FROM guest');
    for (const guest of guests) {
      if (guest.food_service && !isEncryptedValue(guest.food_service)) {
        const encryptedFoodService = encryptCredentials(guest.food_service);
        await db.promise().query('UPDATE guest SET food_service = ? WHERE id = ?', [encryptedFoodService, guest.id]);
      }
    }

    console.log('Migration completed', { timestamp: new Date().toISOString() });
    return { migrated: true };
  } catch (err) {
    console.error('Error migrating existing sensitive data:', err);
    console.error('Migration error', { error: err.message });
    throw err;
  }
}

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'resort_managements',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
        console.error('Database connection failed', { error: err.message });
        process.exit(1);
    }
    console.log('Connected to database');

    // release the test connection back to the pool
    connection.release();

    db.query(`CREATE TABLE IF NOT EXISTS guest (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number_of_guests INT NOT NULL,
        food_service VARCHAR(10) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`, (tableErr) => {
        if (tableErr) {
            console.error('Error ensuring guest table exists:', tableErr);
        }
    });

    db.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(512) NOT NULL,
        role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`, (userTableErr) => {
        if (userTableErr) {
            console.error('Error ensuring users table exists:', userTableErr);
        }

        db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", (countErr, rows) => {
            if (!countErr && rows && rows[0] && rows[0].count === 0) {
                db.query(
                    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    ['System Administrator', 'admin@example.com', encryptCredentials('admin123'), 'admin'],
                    (insertErr) => {
                        if (insertErr) {
                            console.error('Error inserting default admin user:', insertErr);
                        } else {
                            console.log('Created default admin user: admin@example.com / admin123');
                        }
                    }
                );
            }
        });
    });

    db.query(`ALTER TABLE reservations 
        MODIFY COLUMN last_name VARCHAR(512),
        MODIFY COLUMN first_name VARCHAR(512),
        MODIFY COLUMN phone_number VARCHAR(512),
        MODIFY COLUMN email VARCHAR(512),
        MODIFY COLUMN notes TEXT`, (alterErr) => {
        if (alterErr) {
            console.log('Note: reservation column type migration may already be applied or failed:', alterErr.message);
        }
    });

    db.query(`ALTER TABLE guest MODIFY COLUMN food_service VARCHAR(512)`, (alterErr) => {
        if (alterErr) {
            console.log('Note: guest column type migration may already be applied or failed:', alterErr.message);
        }
    });

    migrateExistingSensitiveData().catch((err) => {
        console.error('Initial migration failure:', err);
    });

    // Add room_price column to reservations table if it doesn't exist
    db.query(`ALTER TABLE reservations ADD COLUMN room_price DECIMAL(10,2) AFTER room_id`, (alterErr) => {
        // Ignore error if column already exists
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
            console.log('Note: room_price column may already exist or other schema update');
            console.error('Room price alter note', { message: alterErr.message });
        }
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});


app.post('/migrate_sensitive_data', async (req, res) => {
    try {
        await migrateExistingSensitiveData();
        return res.status(200).json({ message: 'Sensitive rows migrated successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Migration failed.', details: err.message });
    }
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
    const sql = "SELECT id, name, email, role, created_at, password FROM users ORDER BY name ASC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        const decryptedUsers = (data || []).map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            password: decryptCredentials(user.password)
        }));
        return res.status(200).json(decryptedUsers);
    });
});

app.get('/get_admin_users', (req, res) => {
    const sql = "SELECT id, name, email, role, created_at FROM users WHERE role = 'admin' ORDER BY name ASC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching admin users:", err);
            return res.status(500).json({ error: "Database query error!" });
        }
        return res.status(200).json(data);
    });
});

app.post('/add_user_account', (req, res) => {
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    const plain = req.body.password || '';
    const hashed = bcrypt.hashSync(plain, 10);
    const values = [
        req.body.name || '',
        req.body.email || '',
        encryptCredentials(req.body.password || ''),
        req.body.role || 'staff'
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Error adding user account:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        return res.status(200).json({ message: "User account created successfully", id: data.insertId });
    });
});

app.post('/update_user_account/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const fields = [];
    const values = [];

    if (req.body.name) {
        fields.push('name = ?');
        values.push(req.body.name);
    }
    if (req.body.email) {
        fields.push('email = ?');
        values.push(req.body.email);
    }
    if (req.body.role) {
        fields.push('role = ?');
        values.push(req.body.role);
    }
    if (req.body.password) {
        const hashed = bcrypt.hashSync(req.body.password, 10);
        fields.push('password = ?');
        values.push(encryptCredentials(req.body.password));
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating user account:", err);
            return res.status(500).json({ error: "Database query error!", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User account not found" });
        }
        return res.status(200).json({ message: "User account updated successfully" });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = 'SELECT id, name, email, role, password FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Database query error', details: err.message });
        }

        if (!results.length) {
            db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", (countErr, countRows) => {
                if (!countErr && countRows && countRows[0] && countRows[0].count === 0) {
                    if (email === 'admin@example.com' && password === 'admin123') {
                        const defaultEmail = 'admin@example.com';
                        const defaultPassword = 'admin123';
                        db.query(
                            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                            ['System Administrator', defaultEmail, encryptCredentials(defaultPassword), 'admin'],
                            (insertErr, insertResult) => {
                                if (insertErr) {
                                    console.error('Error creating default admin during login:', insertErr);
                                    return res.status(500).json({ error: 'Database query error', details: insertErr.message });
                                }
                                return res.status(200).json({ message: 'Login successful', user: { id: insertResult.insertId, name: 'System Administrator', email: defaultEmail, role: 'admin' } });
                            }
                        );
                    } else {
                        return res.status(401).json({ error: 'No admin account found. Use admin@example.com / admin123 to initialize admin access.' });
                    }
                } else {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
            });
            return;
        }

        const user = results[0];
        const storedPassword = decryptCredentials(user.password);
        if (storedPassword !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin users may access the dashboard' });
        }

        return res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

app.delete('/delete_user_account/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error deleting user account:", err);
            return res.status(500).json({ error: "Database error!" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User account not found" });
        }
        return res.status(200).json({ message: "User account deleted successfully" });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = 'SELECT id, name, email, role, password FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Database query error', details: err.message });
        }
        if (!results.length) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
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
            db.query('UPDATE users SET password = ? WHERE email = ?', [newHash, email], (updateErr) => {
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
    console.log('Incoming /add_reservation payload:', req.body);
    const rawRoomPrice = req.body.room_price;
    const normalizedRoomPrice = rawRoomPrice != null ? parseFloat(String(rawRoomPrice).replace(/,/g, '')) : null;
    const numGuests = parseInt(req.body.num_guests, 10) || 0;
    const roomId = req.body.room_id || null;

    // If room_price is provided and valid, use it; otherwise, get it from rooms table
    if (normalizedRoomPrice && !Number.isNaN(normalizedRoomPrice) && normalizedRoomPrice > 0) {
        // Room price is provided, insert directly
        const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [
            encryptCredentials(req.body.last_name || ''),
            encryptCredentials(req.body.first_name || ''),
            numGuests,
            encryptCredentials(req.body.phone_number || ''),
            encryptCredentials(req.body.email || ''),
            req.body.check_in_date,
            req.body.check_out_date,
            encryptCredentials(req.body.notes || ''),
            req.body.status || 'pending',
            roomId,
            normalizedRoomPrice
        ];
        console.log('DEBUG add_reservation values:', values);
        db.query(sql, values, (err, data) => {
            if (err) {
                console.error("Error inserting reservation:", err);
                return res.status(500).json({ error: "Database query error!", details: err.message });
            }
            console.log(`Reservation created with room_price=${normalizedRoomPrice}`);
            const resp = { message: "Reservation saved successfully!" };
            if (process.env.DEBUG_RESERVATION === '1') resp.debug_values = values;
            return res.status(200).json(resp);
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
                    encryptCredentials(req.body.last_name || ''),
                    encryptCredentials(req.body.first_name || ''),
                    numGuests,
                    encryptCredentials(req.body.phone_number || ''),
                    encryptCredentials(req.body.email || ''),
                    req.body.check_in_date,
                    req.body.check_out_date,
                    encryptCredentials(req.body.notes || ''),
                    req.body.status || 'pending',
                    roomId,
                    null
                ];
                db.query(sql, values, (err, data) => {
                    if (err) {
                        console.error("Error inserting reservation:", err);
                        return res.status(500).json({ error: "Database query error!", details: err.message });
                    }
                    const resp = { message: "Reservation saved successfully!" };
                    if (process.env.DEBUG_RESERVATION === '1') resp.debug_values = values;
                    return res.status(200).json(resp);
                });
            } else {
                const roomPrice = parseFloat(String(results[0].room_price).replace(/,/g, '')) || null;
                const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                const values = [
                    encryptCredentials(req.body.last_name || ''),
                    encryptCredentials(req.body.first_name || ''),
                    numGuests,
                    encryptCredentials(req.body.phone_number || ''),
                    encryptCredentials(req.body.email || ''),
                    req.body.check_in_date,
                    req.body.check_out_date,
                    encryptCredentials(req.body.notes || ''),
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
                    const resp = { message: "Reservation saved successfully!" };
                    if (process.env.DEBUG_RESERVATION === '1') resp.debug_values = values;
                    return res.status(200).json(resp);
                });
            }
        });
    } else {
        // No room_price and no room_id
        const sql = "INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [
            encryptCredentials(req.body.last_name || ''),
            encryptCredentials(req.body.first_name || ''),
            numGuests,
            encryptCredentials(req.body.phone_number || ''),
            encryptCredentials(req.body.email || ''),
            req.body.check_in_date,
            req.body.check_out_date,
            encryptCredentials(req.body.notes || ''),
            req.body.status || 'pending',
            null,
            null
        ];
        db.query(sql, values, (err, data) => {
            if (err) {
                console.error("Error inserting reservation:", err);
                return res.status(500).json({ error: "Database query error!", details: err.message });
            }
            const resp = { message: "Reservation saved successfully!" };
            if (process.env.DEBUG_RESERVATION === '1') resp.debug_values = values;
            return res.status(200).json(resp);
        });
    }
});

app.post('/add_feedback', (req, res) => {
    const sql = "INSERT INTO feedback (name, email, message, created_at) VALUES (?, ?, ?, ?)";
    const values = [
        req.body.name || '',
        req.body.email || '',
        req.body.message || '',
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
        return res.status(200).json(data);
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
        const decrypted = (data || []).map((row) => ({
            ...row,
            last_name: decryptCredentials(row.last_name),
            first_name: decryptCredentials(row.first_name),
            phone_number: decryptCredentials(row.phone_number),
            email: decryptCredentials(row.email),
            notes: decryptCredentials(row.notes)
        }));
        return res.status(200).json(decrypted);
    });
});

app.post('/add_guest_arrival', (req, res) => {
    console.log('Received add_guest_arrival payload:', req.body);
    const sql = "INSERT INTO guest (number_of_guests, food_service, total_price, created_at) VALUES (?, ?, ?, ?)";
    const values = [
        req.body.number_of_guests,
        encryptCredentials(req.body.food_service || ''),
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
        const decrypted = (data || []).map((row) => ({
            ...row,
            food_service: decryptCredentials(row.food_service)
        }));
        return res.status(200).json(decrypted);
    });
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Guest arrival backend is running' });
});

app.get('/routes', (req, res) => {
    const routes = app._router.stack
        .filter((layer) => layer.route)
        .map((layer) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
    res.json({ routes });
});

app.post('/update_reservation/:id', (req, res) => {
    const reservationId = parseInt(req.params.id);
    const {
        status,
        last_name,
        first_name,
        num_guests,
        phone_number,
        email,
        check_in_date,
        check_out_date,
        notes,
        room_id,
    } = req.body;

    if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }

    const getReservationSql = `SELECT room_id, room_price FROM reservations WHERE id = ?`;
    db.query(getReservationSql, [reservationId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching reservation:', err);
            return res.status(500).json({ error: 'Failed to fetch reservation.' });
        }

        const reservation = results[0];
        const finalRoomId = room_id != null ? room_id : reservation.room_id;
        const updateFields = [];
        const updateValues = [];

        if (status) {
            updateFields.push('res_status = ?');
            updateValues.push(status);
        }
        if (last_name !== undefined) {
            updateFields.push('last_name = ?');
            updateValues.push(encryptCredentials(last_name || ''));
        }
        if (first_name !== undefined) {
            updateFields.push('first_name = ?');
            updateValues.push(encryptCredentials(first_name || ''));
        }
        if (phone_number !== undefined) {
            updateFields.push('phone_number = ?');
            updateValues.push(encryptCredentials(phone_number || ''));
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(encryptCredentials(email || ''));
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(encryptCredentials(notes || ''));
        }
        if (num_guests !== undefined) {
            updateFields.push('num_guests = ?');
            updateValues.push(parseInt(num_guests, 10) || 0);
        }
        if (check_in_date !== undefined) {
            updateFields.push('check_in_date = ?');
            updateValues.push(check_in_date);
        }
        if (check_out_date !== undefined) {
            updateFields.push('check_out_date = ?');
            updateValues.push(check_out_date);
        }
        if (room_id !== undefined) {
            updateFields.push('room_id = ?');
            updateValues.push(room_id);
        }

        const updateReservation = (roomPriceUpdate) => {
            if (roomPriceUpdate !== null) {
                updateFields.push('room_price = ?');
                updateValues.push(roomPriceUpdate);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No fields to update.' });
            }

            const updateSql = `UPDATE reservations SET ${updateFields.join(', ')} WHERE id = ?`;
            updateValues.push(reservationId);

            db.query(updateSql, updateValues, (updateErr, result) => {
                if (updateErr) {
                    console.error('Error updating reservation:', updateErr);
                    return res.status(500).json({ error: 'Database error.' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Reservation not found.' });
                }
                console.log(`Reservation ${reservationId} updated`, { status, room_id: finalRoomId, room_price: roomPriceUpdate });
                return res.status(200).json({ message: 'Reservation updated successfully.' });
            });
        };

        if (status === 'confirmed' && finalRoomId) {
            const getRoomPriceSql = `SELECT room_price FROM rooms WHERE id = ?`;
            db.query(getRoomPriceSql, [finalRoomId], (err, roomResults) => {
                let finalRoomPrice = reservation.room_price;
                if (!err && roomResults.length > 0) {
                    const fetchedPrice = parseFloat(String(roomResults[0].room_price).replace(/,/g, ''));
                    if (!isNaN(fetchedPrice) && fetchedPrice > 0) {
                        finalRoomPrice = fetchedPrice;
                    }
                }
                updateReservation(finalRoomPrice);
            });
        } else {
            updateReservation(null);
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


app.post('/migrate_sensitive_data', async (req, res) => {
    try {
        await migrateExistingSensitiveData();
        return res.status(200).json({ message: 'Sensitive rows migrated successfully.' });
    } catch (err) {
        console.error('migrate_sensitive_data error', err);
        return res.status(500).json({ error: 'Migration failed.', details: err.message });
    }
});

app.get('/debug_info', (req, res) => {
    try {
        return res.status(200).json({
            pid: process.pid,
            cwd: process.cwd(),
            scriptFile: import.meta.url,
            env_DEBUG_RESERVATION: process.env.DEBUG_RESERVATION || null
        });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});