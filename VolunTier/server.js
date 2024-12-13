const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('voluntier.db');

// Database initialization
db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        isAdmin INTEGER DEFAULT 0
    )`);

    // Create events table
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        date TEXT,
        location TEXT,
        maxApplicants INTEGER,
        currentApplicants INTEGER DEFAULT 0
    )`);

    // Create applications table
    db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        eventId INTEGER,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (eventId) REFERENCES events(id)
    )`);

    // Check if admin exists, if not create one
    db.get("SELECT * FROM users WHERE username = 'admin'", [], (err, row) => {
        if (err) {
            console.error('Error checking admin:', err);
            return;
        }
        if (!row) {
            const hashedPassword = bcrypt.hashSync('123', 10);
            db.run("INSERT INTO users (username, password, isAdmin) VALUES ('admin', ?, 1)", 
                [hashedPassword],
                (err) => {
                    if (err) {
                        console.error('Error creating admin:', err);
                    } else {
                        console.log('Admin user created successfully');
                    }
                }
            );
        }
    });
});

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'your_jwt_secret');
        res.json({ token, isAdmin: user.isAdmin });
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (user) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 0)',
            [username, hashedPassword],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                const token = jwt.sign({ id: this.lastID, isAdmin: false }, 'your_jwt_secret');
                res.json({ token, isAdmin: false });
            }
        );
    });
});

// Event routes
app.get('/api/events', (req, res) => {
    db.all('SELECT * FROM events', [], (err, events) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(events);
    });
});

app.post('/api/events', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, date, location, maxApplicants } = req.body;
    
    db.run(`INSERT INTO events (title, description, date, location, maxApplicants, currentApplicants)
            VALUES (?, ?, ?, ?, ?, 0)`,
        [title, description, date, location, maxApplicants],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create event' });
            }
            res.json({ id: this.lastID });
        });
});

// Delete event (admin only)
app.delete('/api/events/:id', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const eventId = req.params.id;

    // Delete all applications first, regardless of status
    db.run('DELETE FROM applications WHERE eventId = ?', [eventId], (err) => {
        if (err) {
            console.error('Error deleting applications:', err);
            return res.status(500).json({ error: 'Failed to delete applications' });
        }

        // Then delete the event
        db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
            if (err) {
                console.error('Error deleting event:', err);
                return res.status(500).json({ error: 'Failed to delete event' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.json({ message: 'Event deleted successfully' });
        });
    });
});

// Application routes
app.get('/api/applications', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const query = `
        SELECT 
            a.id,
            a.status,
            a.eventId,
            e.title as eventTitle,
            u.username as applicantName
        FROM applications a
        JOIN events e ON a.eventId = e.id
        JOIN users u ON a.userId = u.id
        ORDER BY a.id DESC
    `;

    db.all(query, [], (err, applications) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        res.json(applications);
    });
});

app.get('/api/applications/my', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            a.id,
            a.status,
            a.eventId,
            e.title as eventTitle,
            e.date,
            e.location
        FROM applications a
        JOIN events e ON a.eventId = e.id
        WHERE a.userId = ?
        ORDER BY a.id DESC
    `;

    db.all(query, [req.user.id], (err, applications) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        res.json(applications);
    });
});

app.post('/api/applications', authenticateToken, (req, res) => {
    const { eventId } = req.body;
    const userId = req.user.id;

    // Check if user has already applied
    db.get('SELECT * FROM applications WHERE userId = ? AND eventId = ?', 
        [userId, eventId], 
        (err, existingApplication) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (existingApplication) {
                return res.status(400).json({ error: 'You have already applied for this event' });
            }

            // Check if event exists and has spots available
            db.get('SELECT maxApplicants, currentApplicants FROM events WHERE id = ?',
                [eventId],
                (err, event) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    if (!event) {
                        return res.status(404).json({ error: 'Event not found' });
                    }
                    
                    if (event.currentApplicants >= event.maxApplicants) {
                        return res.status(400).json({ error: 'Event is full' });
                    }

                    // Create application
                    db.run(`INSERT INTO applications (userId, eventId, status) VALUES (?, ?, 'pending')`,
                        [userId, eventId],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to create application' });
                            }
                            res.json({ id: this.lastID, status: 'pending' });
                        }
                    );
                }
            );
        }
    );
});

app.put('/api/applications/:id', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    db.run(
        'UPDATE applications SET status = ? WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update application' });
            }

            if (status === 'approved') {
                db.run(
                    `UPDATE events 
                     SET currentApplicants = currentApplicants + 1 
                     WHERE id = (SELECT eventId FROM applications WHERE id = ?)`,
                    [req.params.id],
                    (err) => {
                        if (err) {
                            console.error('Error updating event applicants count:', err);
                        }
                    }
                );
            }

            res.json({ success: true });
        }
    );
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
