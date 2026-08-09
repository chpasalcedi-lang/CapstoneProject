import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const DEFAULT_SECRET_KEY = 'uV9_7lXJ_v_N9Z9pL5mGk1m8n8-v7Z7r9R_vP8N7X2s=';

class CryptoService {
    constructor(secretKey = DEFAULT_SECRET_KEY) {
        this.secretKey = secretKey;
    }

    getKey() {
        return CryptoJS.SHA256(this.secretKey);
    }

    getIv() {
        return CryptoJS.enc.Utf8.parse(this.secretKey.padEnd(16, '0').slice(0, 16));
    }

    encrypt(value) {
        if (value === undefined || value === null) {
            return '';
        }

        const text = String(value);
        return CryptoJS.AES.encrypt(
            CryptoJS.enc.Utf8.parse(text),
            this.getKey(),
            {
                iv: this.getIv(),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        ).toString();
    }

    decrypt(value) {
        if (!value) {
            return '';
        }

        try {
            const bytes = CryptoJS.AES.decrypt(value, this.getKey(), {
                iv: this.getIv(),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
                return decrypted;
            }
        } catch (_error) {
            // ignore if AES with the current key fails
        }

        try {
            const bytes = CryptoJS.AES.decrypt(value, this.secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (_error) {
            return String(value);
        }
    }
}

class Database {
    constructor() {
        const sslMode = String(process.env.DB_SSL_MODE || process.env.DB_SSL || '').toLowerCase();
        const useSsl = sslMode === 'true' || sslMode === '1' || sslMode === 'required';
        const rawDbCa = process.env.DB_CA || '';
        const dbCa = rawDbCa ? rawDbCa.replace(/\\n/g, '\n') : undefined;
        const ssl = useSsl ? { rejectUnauthorized: false, ...(dbCa ? { ca: dbCa } : {}) } : undefined;

        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,
            ssl,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000
        });
    }

    async query(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    async verifyConnection() {
        try {
            const connection = await this.pool.getConnection();
            connection.release();
            console.log('Connected to the database.');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
}

class Server {
    constructor() {
        this.app = express();
        this.db = new Database();
        this.crypto = new CryptoService(process.env.SECRET_KEY || DEFAULT_SECRET_KEY);

        this.setupMiddleware();
        this.setupRoutes();
        this.db.verifyConnection();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            if (req.url.startsWith('/api/')) {
                req.url = req.url.slice(4) || '/';
            }
            next();
        });
    }

    setupRoutes() {
        new HealthController(this.app);
        new RootController(this.app);
        new RoomController(this.app, this.db);
        new AdminController(this.app, this.db, this.crypto);
        new ReservationController(this.app, this.db, this.crypto);
        new FeedbackController(this.app, this.db, this.crypto);
        new GuestArrivalController(this.app, this.db);
    }
}

class HealthController {
    constructor(app) {
        app.get('/health', this.handleHealth.bind(this));
    }

    handleHealth(req, res) {
        return res.status(200).json({ status: 'ok', message: 'Server is running' });
    }
}

class RootController {
    constructor(app) {
        app.get('/', this.handleRoot.bind(this));
    }

    handleRoot(req, res) {
        return res.json({ status: 'ok', message: 'Guest arrival backend is running' });
    }
}

class RoomController {
    constructor(app, db) {
        this.db = db;
        app.post('/add_rooms', this.addRoom.bind(this));
        app.get('/get_rooms', this.getRooms.bind(this));
        app.post('/update_rooms/:id', this.updateRoom.bind(this));
        app.delete('/delete_room/:id', this.deleteRoom.bind(this));
    }

    async addRoom(req, res) {
        try {
            const sql = 'INSERT INTO rooms (room_name, room_number, room_price, room_image, room_type, room_status, room_label) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const values = [
                req.body.room_name,
                req.body.room_number,
                req.body.room_price,
                req.body.room_image,
                req.body.room_type,
                req.body.room_status,
                req.body.room_label
            ];
            await this.db.query(sql, values);
            return res.status(200).json({ message: 'Room added successfully!' });
        } catch (error) {
            console.error('Error adding room:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async getRooms(req, res) {
        try {
            const sql = 'SELECT * FROM rooms';
            const rows = await this.db.query(sql);
            return res.status(200).json(rows);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return res.status(500).json({ error: 'Database query error!' });
        }
    }

    async updateRoom(req, res) {
        try {
            const roomId = Number(req.params.id);
            const sql = 'UPDATE rooms SET room_name = ?, room_number = ?, room_price = ?, room_image = ?, room_type = ?, room_status = ?, room_label = ? WHERE id = ?';
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
            const result = await this.db.query(sql, values);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Room not found!' });
            }
            return res.status(200).json({ message: 'Room updated successfully!' });
        } catch (error) {
            console.error('Error updating room:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async deleteRoom(req, res) {
        try {
            const roomId = Number(req.params.id);
            if (Number.isNaN(roomId)) {
                return res.status(400).json({ error: 'Invalid room id' });
            }
            await this.db.query('DELETE FROM reservations WHERE room_id = ?', [roomId]);
            const result = await this.db.query('DELETE FROM rooms WHERE id = ?', [roomId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }
            return res.status(200).json({ message: 'Room deleted successfully' });
        } catch (error) {
            console.error('Error deleting room:', error);
            return res.status(500).json({ error: 'Database error!' });
        }
    }
}

class AdminController {
    constructor(app, db, crypto) {
        this.db = db;
        this.crypto = crypto;
        app.get('/get_user_accounts', this.getUsers.bind(this));
        app.post('/add_user_account', this.addUser.bind(this));
        app.post('/update_user_account/:id', this.updateUser.bind(this));
        app.delete('/delete_user_account/:id', this.deleteUser.bind(this));
        app.post('/login', this.login.bind(this));
    }

    async getUsers(req, res) {
        try {
            const rows = await this.db.query('SELECT id, name, email, role, created_at FROM admins');
            const users = rows.map((row) => ({
                ...row,
                name: this.crypto.decrypt(row.name),
                email: this.crypto.decrypt(row.email)
            })).sort((a, b) => a.name.localeCompare(b.name));
            return res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching admins:', error);
            return res.status(500).json({ error: 'Database query error!' });
        }
    }

    async addUser(req, res) {
        try {
            const sql = 'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)';
            const encryptedName = this.crypto.encrypt(req.body.name || '');
            const encryptedEmail = this.crypto.encrypt(req.body.email || '');
            const passwordHash = bcrypt.hashSync(req.body.password || '', 10);
            const values = [encryptedName, encryptedEmail, passwordHash, req.body.role || ''];
            const result = await this.db.query(sql, values);
            return res.status(200).json({ message: 'Admin account created successfully', id: result.insertId });
        } catch (error) {
            console.error('Error creating admin:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async updateUser(req, res) {
        try {
            const userId = Number(req.params.id);
            const updates = [];
            const values = [];

            if (req.body.name) {
                updates.push('name = ?');
                values.push(this.crypto.encrypt(req.body.name));
            }
            if (req.body.email) {
                updates.push('email = ?');
                values.push(this.crypto.encrypt(req.body.email));
            }
            if (req.body.role) {
                updates.push('role = ?');
                values.push(req.body.role);
            }
            if (req.body.password) {
                updates.push('password = ?');
                values.push(bcrypt.hashSync(req.body.password, 10));
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(userId);
            const sql = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
            const result = await this.db.query(sql, values);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Admin account not found' });
            }
            return res.status(200).json({ message: 'Admin account updated successfully' });
        } catch (error) {
            console.error('Error updating admin:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async deleteUser(req, res) {
        try {
            const userId = Number(req.params.id);
            const result = await this.db.query('DELETE FROM admins WHERE id = ?', [userId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Admin account not found' });
            }
            return res.status(200).json({ message: 'Admin account deleted successfully' });
        } catch (error) {
            console.error('Error deleting admin:', error);
            return res.status(500).json({ error: 'Database error!' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const sql = 'SELECT id, name, email, role, password FROM admins WHERE email = ?';
            const encryptedEmail = this.crypto.encrypt(email);
            let rows = await this.db.query(sql, [encryptedEmail]);

            if (!rows.length) {
                rows = await this.db.query(sql, [email]);
            }

            if (!rows.length) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = { ...rows[0] };
            user.name = this.crypto.decrypt(user.name);
            user.email = this.crypto.decrypt(user.email);
            const storedPassword = user.password || '';
            const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');

            const passwordMatches = isBcrypt
                ? await bcrypt.compare(password, storedPassword)
                : password === storedPassword;

            if (!passwordMatches) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            if (!isBcrypt) {
                const newHash = bcrypt.hashSync(password, 10);
                await this.db.query('UPDATE admins SET password = ? WHERE email = ?', [newHash, encryptedEmail]);
            }

            delete user.password;
            return res.status(200).json({ message: 'Login successful', user });
        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({ error: 'Database query error', details: error.message });
        }
    }
}

class ReservationController {
    constructor(app, db, crypto) {
        this.db = db;
        this.crypto = crypto;
        app.post('/add_reservation', this.addReservation.bind(this));
        app.get('/get_reservations', this.getReservations.bind(this));
        app.post('/update_reservation/:id', this.updateReservation.bind(this));
        app.post('/cancel_reservation_request/:id', this.cancelReservationRequest.bind(this));
        app.delete('/delete_reservation/:id', this.deleteReservation.bind(this));
    }

    parsePrice(value) {
        if (value === undefined || value === null) {
            return null;
        }
        const parsed = parseFloat(String(value).replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    async addReservation(req, res) {
        try {
            const roomId = req.body.room_id;
            const checkIn = req.body.check_in_date;
            const checkOut = req.body.check_out_date;
            const roomPrice = this.parsePrice(req.body.room_price);
            const totalPrice = this.parsePrice(req.body.total_price);
            const values = [
                this.crypto.encrypt(req.body.last_name || ''),
                this.crypto.encrypt(req.body.first_name || ''),
                Number(req.body.num_guests) || 0,
                this.crypto.encrypt(req.body.phone_number || ''),
                this.crypto.encrypt(req.body.email || ''),
                checkIn || null,
                checkOut || null,
                this.crypto.encrypt(req.body.notes || ''),
                req.body.status || 'pending',
                roomId || null,
                roomPrice,
                totalPrice,
                req.body.discount || '0%'
            ];

            if (roomId && checkIn && checkOut) {
                const overlapSql = "SELECT COUNT(*) AS cnt FROM reservations WHERE room_id = ? AND res_status IN ('pending', 'confirmed', 'complete', 'occupied') AND NOT (check_out_date <= ? OR check_in_date >= ?)";
                const overlapRows = await this.db.query(overlapSql, [roomId, checkIn, checkOut]);
                const bookedCount = overlapRows[0]?.cnt || 0;
                if (bookedCount > 0) {
                    return res.status(409).json({ error: 'Room is already booked for the selected dates' });
                }
            }

            const insertSql = 'INSERT INTO reservations (last_name, first_name, num_guests, phone_number, email, check_in_date, check_out_date, notes, res_status, room_id, room_price, total_price, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const result = await this.db.query(insertSql, values);
            return res.status(200).json({ message: 'Reservation saved successfully!', reservationId: result.insertId });
        } catch (error) {
            console.error('Error adding reservation:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async getReservations(req, res) {
        try {
            await this.db.query("UPDATE reservations SET res_status = 'complete' WHERE res_status = 'confirmed' AND DATE(check_out_date) < CURDATE()");
            const sql = `SELECT r.*, COALESCE(r.room_price, rm.room_price) AS room_price, COALESCE(rm.room_number, 'N/A') AS room_number, rm.room_name, rm.room_label, rm.room_type, GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1) AS nights, COALESCE(r.total_price, COALESCE(r.room_price, rm.room_price) * GREATEST(DATEDIFF(r.check_out_date, r.check_in_date), 1)) AS total_price, COALESCE(r.discount, '0%') AS discount FROM reservations r LEFT JOIN rooms rm ON r.room_id = rm.id ORDER BY r.id DESC`;
            const rows = await this.db.query(sql);
            const reservations = rows.map((row) => {
                const first = this.crypto.decrypt(row.first_name);
                const last = this.crypto.decrypt(row.last_name);
                return {
                    ...row,
                    first_name: first,
                    last_name: last,
                    guest_name: `${first} ${last}`.trim(),
                    phone_number: this.crypto.decrypt(row.phone_number),
                    email: this.crypto.decrypt(row.email),
                    notes: this.crypto.decrypt(row.notes)
                };
            });
            return res.status(200).json(reservations);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            return res.status(500).json({ error: 'Database query error!' });
        }
    }

    async updateReservation(req, res) {
        try {
            const reservationId = Number(req.params.id);
            if (Number.isNaN(reservationId)) {
                return res.status(400).json({ error: 'Invalid reservation ID.' });
            }

            const updates = {};
            if (req.body.status !== undefined && req.body.status !== '') updates.res_status = req.body.status;
            if (req.body.last_name) updates.last_name = this.crypto.encrypt(req.body.last_name);
            if (req.body.first_name) updates.first_name = this.crypto.encrypt(req.body.first_name);
            if (req.body.num_guests !== undefined && req.body.num_guests !== '') updates.num_guests = Number(req.body.num_guests) || 0;
            if (req.body.phone_number) updates.phone_number = this.crypto.encrypt(req.body.phone_number);
            if (req.body.email) updates.email = this.crypto.encrypt(req.body.email);
            if (req.body.check_in_date) updates.check_in_date = req.body.check_in_date;
            if (req.body.check_out_date) updates.check_out_date = req.body.check_out_date;
            if (req.body.notes) updates.notes = this.crypto.encrypt(req.body.notes);
            if (Object.prototype.hasOwnProperty.call(req.body, 'cancel_notes_request')) updates.cancel_notes_request = String(req.body.cancel_notes_request || '');
            if (req.body.room_id !== undefined) updates.room_id = req.body.room_id;

            if (!Object.keys(updates).length) {
                return res.status(400).json({ error: 'No valid fields to update.' });
            }

            const reservation = await this.db.query('SELECT room_id, room_price FROM reservations WHERE id = ?', [reservationId]);
            if (!reservation.length) {
                return res.status(404).json({ error: 'Reservation not found.' });
            }

            const activeRoomId = updates.room_id ?? reservation[0].room_id;
            const refreshPrice = updates.room_id !== undefined || ['confirmed', 'complete'].includes(updates.res_status);
            if (refreshPrice && activeRoomId) {
                const roomRows = await this.db.query('SELECT room_price FROM rooms WHERE id = ?', [activeRoomId]);
                if (roomRows.length) {
                    const fetchedPrice = parseFloat(String(roomRows[0].room_price).replace(/,/g, ''));
                    if (!Number.isNaN(fetchedPrice)) {
                        updates.room_price = fetchedPrice;
                    }
                }
            }

            const sql = `UPDATE reservations SET ${Object.keys(updates).map((key) => `${key} = ?`).join(', ')} WHERE id = ?`;
            const values = [...Object.values(updates), reservationId];
            const result = await this.db.query(sql, values);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation not found.' });
            }
            return res.status(200).json({ message: 'Reservation updated successfully.' });
        } catch (error) {
            console.error('Error updating reservation:', error);
            return res.status(500).json({ error: 'Database error.' });
        }
    }

    async cancelReservationRequest(req, res) {
        try {
            const reservationId = Number(req.params.id);
            if (Number.isNaN(reservationId)) {
                return res.status(400).json({ error: 'Invalid reservation ID.' });
            }
            if (!Object.prototype.hasOwnProperty.call(req.body, 'cancel_notes_request')) {
                return res.status(400).json({ error: 'Cancellation note is required.' });
            }
            const sql = 'UPDATE reservations SET cancel_notes_request = ? WHERE id = ?';
            const result = await this.db.query(sql, [String(req.body.cancel_notes_request || ''), reservationId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation not found.' });
            }
            return res.status(200).json({ message: 'Cancellation request saved successfully.' });
        } catch (error) {
            console.error('Error saving cancellation request:', error);
            return res.status(500).json({ error: 'Database error.' });
        }
    }

    async deleteReservation(req, res) {
        try {
            const reservationId = Number(req.params.id);
            if (Number.isNaN(reservationId)) {
                return res.status(400).json({ error: 'Invalid reservation ID.' });
            }
            const result = await this.db.query('DELETE FROM reservations WHERE id = ?', [reservationId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation not found.' });
            }
            return res.status(200).json({ message: 'Reservation deleted successfully.' });
        } catch (error) {
            console.error('Error deleting reservation:', error);
            return res.status(500).json({ error: 'Database error.' });
        }
    }
}

class FeedbackController {
    constructor(app, db, crypto) {
        this.db = db;
        this.crypto = crypto;
        app.post('/add_feedback', this.addFeedback.bind(this));
        app.get('/get_feedback', this.getFeedback.bind(this));
        app.delete('/delete_feedback/:id', this.deleteFeedback.bind(this));
    }

    async addFeedback(req, res) {
        try {
            const sql = 'INSERT INTO feedback (name, email, message, created_at) VALUES (?, ?, ?, ?)';
            const values = [
                this.crypto.encrypt(req.body.name || ''),
                this.crypto.encrypt(req.body.email || ''),
                this.crypto.encrypt(req.body.message || ''),
                new Date()
            ];
            const result = await this.db.query(sql, values);
            return res.status(200).json({ message: 'Feedback submitted successfully!', feedbackId: result.insertId });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async getFeedback(req, res) {
        try {
            const rows = await this.db.query('SELECT id, name, email, message, created_at FROM feedback ORDER BY created_at DESC');
            const feedback = rows.map((item) => ({
                ...item,
                name: this.crypto.decrypt(item.name),
                email: this.crypto.decrypt(item.email),
                message: this.crypto.decrypt(item.message)
            }));
            return res.status(200).json(feedback);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async deleteFeedback(req, res) {
        try {
            const feedbackId = Number(req.params.id);
            if (Number.isNaN(feedbackId)) {
                return res.status(400).json({ error: 'Invalid feedback ID.' });
            }
            const result = await this.db.query('DELETE FROM feedback WHERE id = ?', [feedbackId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Feedback not found.' });
            }
            return res.status(200).json({ message: 'Feedback deleted successfully.' });
        } catch (error) {
            console.error('Error deleting feedback:', error);
            return res.status(500).json({ error: 'Database error.' });
        }
    }
}

class GuestArrivalController {
    constructor(app, db) {
        this.db = db;
        app.post('/add_guest_arrival', this.addGuestArrival.bind(this));
        app.get('/get_guest_arrivals', this.getGuestArrivals.bind(this));
        app.delete('/delete_guest_arrival/:id', this.deleteGuestArrival.bind(this));
    }

    async addGuestArrival(req, res) {
        try {
            const sql = 'INSERT INTO guest (number_of_guests, food_service, total_price, created_at) VALUES (?, ?, ?, ?)';
            const values = [
                req.body.number_of_guests,
                req.body.food_service,
                req.body.total_price,
                req.body.created_at || new Date()
            ];
            const result = await this.db.query(sql, values);
            return res.status(200).json({ message: 'Guest arrival recorded successfully!', guestId: result.insertId });
        } catch (error) {
            console.error('Error adding guest arrival:', error);
            return res.status(500).json({ error: 'Database query error!', details: error.message });
        }
    }

    async getGuestArrivals(req, res) {
        try {
            const rows = await this.db.query('SELECT * FROM guest ORDER BY created_at DESC');
            return res.status(200).json(rows);
        } catch (error) {
            console.error('Error fetching guest arrivals:', error);
            return res.status(500).json({ error: 'Database query error!' });
        }
    }

    async deleteGuestArrival(req, res) {
        try {
            const guestId = Number(req.params.id);
            const result = await this.db.query('DELETE FROM guest WHERE id = ?', [guestId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Guest arrival not found' });
            }
            return res.status(200).json({ message: 'Guest arrival deleted successfully' });
        } catch (error) {
            console.error('Error deleting guest arrival:', error);
            return res.status(500).json({ error: 'Database error!' });
        }
    }
}

const server = new Server();
const app = server.app;
const PORT = process.env.PORT || 3001;
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;
