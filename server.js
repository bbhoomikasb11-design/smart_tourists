const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./tourists.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create users table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    blockchain_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    profile_completed BOOLEAN DEFAULT FALSE
  )`);
  
  // Create tourist profiles table
  db.run(`CREATE TABLE IF NOT EXISTS tourist_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blockchain_id TEXT UNIQUE NOT NULL,
    encrypted_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  
  // Create emergency alerts table
  db.run(`CREATE TABLE IF NOT EXISTS emergency_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tourist_id INTEGER NOT NULL,
    tourist_name TEXT NOT NULL,
    blockchain_id TEXT,
    message TEXT NOT NULL,
    location_lat REAL,
    location_lng REAL,
    location_accuracy REAL,
    alert_type TEXT DEFAULT 'emergency',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    resolved_at DATETIME,
    response_team TEXT,
    notes TEXT,
    FOREIGN KEY (tourist_id) REFERENCES users(id)
  )`);

  // Create authority users table (for authority dashboard login)
  db.run(`CREATE TABLE IF NOT EXISTS authority_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed a default authority user if none exists
  db.get('SELECT COUNT(*) as count FROM authority_users', async (err, row) => {
    if (!err && row && row.count === 0) {
      try {
        const defaultEmail = process.env.AUTHORITY_EMAIL || 'authority@example.com';
        const defaultName = process.env.AUTHORITY_NAME || 'Control Room';
        const defaultPass = process.env.AUTHORITY_PASSWORD || 'Authority@123';
        const hashed = await bcrypt.hash(defaultPass, 10);
        db.run('INSERT INTO authority_users (name, email, password) VALUES (?, ?, ?)', [defaultName, defaultEmail, hashed]);
        console.log(`Seeded default authority user: ${defaultEmail} / (password hidden)`);
      } catch (e) {
        console.log('Failed to seed default authority user');
      }
    }
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to emergency monitoring system'
  }));
});

// Broadcast emergency alert to all connected WebSocket clients
function broadcastEmergencyAlert(alert) {
  const message = JSON.stringify({
    type: 'emergency_alert',
    alert: alert
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Generate blockchain ID (simplified version)
function generateBlockchainId() {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  return `ST${timestamp.slice(-8)}${random.slice(0, 8)}`.toUpperCase();
}

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Enhanced encryption functions
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'smart-tourists-secret-key', 'salt', 32);
const IV_LENGTH = 16;

function encryptData(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(encryptedData) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Routes

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
      
      if (row) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email or username already exists' 
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      // Generate blockchain ID at registration time
      const blockchainId = generateBlockchainId();
      
      // Insert new user with blockchain ID
      db.run(
        'INSERT INTO users (username, email, password, blockchain_id) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, blockchainId],
        function(err) {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to create user' 
            });
          }
          
          res.json({
            success: true,
            message: 'User registered successfully.',
            user: {
              id: this.lastID,
              username: username,
              email: email,
              blockchain_id: blockchainId,
              profile_completed: false
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          blockchain_id: user.blockchain_id || null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get user profile by blockchain ID
app.get('/api/user/:blockchainId', (req, res) => {
  const { blockchainId } = req.params;
  
  db.get('SELECT id, username, email, blockchain_id, created_at, last_login, profile_completed FROM users WHERE blockchain_id = ?', 
    [blockchainId], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  });
});

// Save tourist profile
app.post('/api/profile', async (req, res) => {
  try {
    const { userId, personalInfo, travelInfo, accommodation, interests, completedAt } = req.body;
    
    if (!userId || !personalInfo || !travelInfo || !accommodation) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required profile data' 
      });
    }

    // Verify user exists
    db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Reuse existing blockchain ID from user if set; otherwise generate once
      const blockchainId = req.body.blockchainId || generateBlockchainId();

      // Prepare data for encryption
      const profileData = {
        personalInfo,
        travelInfo,
        accommodation,
        interests: interests || [],
        completedAt,
        blockchainId
      };

      // Encrypt the profile data
      const encryptedData = encryptData(profileData);

      // Save profile with blockchain ID (upsert-like behavior)
      db.run(
        `INSERT INTO tourist_profiles (user_id, blockchain_id, encrypted_data, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, blockchainId, encryptedData],
        function(err) {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to save profile' 
            });
          }

          // Update user with blockchain ID (if not already) and mark profile completed
          db.run('UPDATE users SET blockchain_id = COALESCE(blockchain_id, ?), profile_completed = TRUE WHERE id = ?', [blockchainId, userId]);

          res.json({
            success: true,
            message: 'Profile saved successfully',
            blockchainId: blockchainId,
            profileId: this.lastID
          });
        }
      );
    });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get tourist profile (decrypted)
app.get('/api/profile/:blockchainId', (req, res) => {
  const { blockchainId } = req.params;
  
  db.get('SELECT encrypted_data FROM tourist_profiles WHERE blockchain_id = ?', 
    [blockchainId], (err, profile) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    
    try {
      const decryptedData = decryptData(profile.encrypted_data);
      res.json({
        success: true,
        profile: decryptedData
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to decrypt profile data' 
      });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Smart Tourists Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Emergency Alert Endpoints

// Create emergency alert
app.post('/api/emergency-alert', (req, res) => {
  try {
    const { touristId, touristName, blockchainId, message, location, timestamp, type, status } = req.body;
    
    if (!touristId || !touristName || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: touristId, touristName, message'
      });
    }

    const alertData = {
      tourist_id: touristId,
      tourist_name: touristName,
      blockchain_id: blockchainId || null,
      message: message,
      location_lat: location ? location.lat : null,
      location_lng: location ? location.lng : null,
      location_accuracy: location ? location.accuracy : null,
      alert_type: type || 'emergency',
      status: status || 'active'
    };

    db.run(
      `INSERT INTO emergency_alerts (
        tourist_id, tourist_name, blockchain_id, message, 
        location_lat, location_lng, location_accuracy, 
        alert_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertData.tourist_id,
        alertData.tourist_name,
        alertData.blockchain_id,
        alertData.message,
        alertData.location_lat,
        alertData.location_lng,
        alertData.location_accuracy,
        alertData.alert_type,
        alertData.status
      ],
      function(err) {
        if (err) {
          console.error('Error creating emergency alert:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to create emergency alert'
          });
        }

        const alert = {
          id: this.lastID,
          ...alertData,
          timestamp: new Date().toISOString()
        };

        // Broadcast to all connected WebSocket clients
        broadcastEmergencyAlert(alert);

        console.log(`🚨 EMERGENCY ALERT: ${touristName} - ${message}`);
        
        res.json({
          success: true,
          message: 'Emergency alert created successfully',
          alertId: this.lastID,
          alert: alert
        });
      }
    );
  } catch (error) {
    console.error('Error processing emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all emergency alerts
app.get('/api/emergency-alerts', (req, res) => {
  const status = req.query.status || 'active';
  const limit = parseInt(req.query.limit) || 50;
  
  db.all(
    'SELECT * FROM emergency_alerts WHERE status = ? ORDER BY created_at DESC LIMIT ?',
    [status, limit],
    (err, rows) => {
      if (err) {
        console.error('Error fetching emergency alerts:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch emergency alerts'
        });
      }

      const alerts = rows.map(row => ({
        id: row.id,
        touristId: row.tourist_id,
        touristName: row.tourist_name,
        blockchainId: row.blockchain_id,
        message: row.message,
        location: row.location_lat && row.location_lng ? {
          lat: row.location_lat,
          lng: row.location_lng,
          accuracy: row.location_accuracy
        } : null,
        type: row.alert_type,
        status: row.status,
        timestamp: row.created_at,
        respondedAt: row.responded_at,
        resolvedAt: row.resolved_at,
        responseTeam: row.response_team,
        notes: row.notes
      }));

      res.json({
        success: true,
        alerts: alerts,
        count: alerts.length
      });
    }
  );
});

// Update emergency alert status
app.put('/api/emergency-alert/:id', (req, res) => {
  const alertId = req.params.id;
  const { status, responseTeam, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  let updateQuery = 'UPDATE emergency_alerts SET status = ?';
  let params = [status];
  
  if (status === 'responded' && !req.body.respondedAt) {
    updateQuery += ', responded_at = CURRENT_TIMESTAMP';
  }
  
  if (status === 'resolved' && !req.body.resolvedAt) {
    updateQuery += ', resolved_at = CURRENT_TIMESTAMP';
  }
  
  if (responseTeam) {
    updateQuery += ', response_team = ?';
    params.push(responseTeam);
  }
  
  if (notes) {
    updateQuery += ', notes = ?';
    params.push(notes);
  }
  
  updateQuery += ' WHERE id = ?';
  params.push(alertId);

  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('Error updating emergency alert:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update emergency alert'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency alert updated successfully'
    });
  });
});

// Get emergency alert by ID
app.get('/api/emergency-alert/:id', (req, res) => {
  const alertId = req.params.id;
  
  db.get(
    'SELECT * FROM emergency_alerts WHERE id = ?',
    [alertId],
    (err, row) => {
      if (err) {
        console.error('Error fetching emergency alert:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch emergency alert'
        });
      }

      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Emergency alert not found'
        });
      }

      const alert = {
        id: row.id,
        touristId: row.tourist_id,
        touristName: row.tourist_name,
        blockchainId: row.blockchain_id,
        message: row.message,
        location: row.location_lat && row.location_lng ? {
          lat: row.location_lat,
          lng: row.location_lng,
          accuracy: row.location_accuracy
        } : null,
        type: row.alert_type,
        status: row.status,
        timestamp: row.created_at,
        respondedAt: row.responded_at,
        resolvedAt: row.resolved_at,
        responseTeam: row.response_team,
        notes: row.notes
      };

      res.json({
        success: true,
        alert: alert
      });
    }
  );
});

// Admin endpoints for data viewing
app.get('/api/admin/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    res.json({
      success: true,
      users: users
    });
  });
});

app.get('/api/admin/profiles', (req, res) => {
  db.all('SELECT * FROM tourist_profiles ORDER BY created_at DESC', (err, profiles) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    res.json({
      success: true,
      profiles: profiles
    });
  });
});

app.get('/api/admin/stats', (req, res) => {
  db.get('SELECT COUNT(*) as totalUsers FROM users', (err, userCount) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    db.get('SELECT COUNT(*) as completedProfiles FROM users WHERE profile_completed = TRUE', (err, profileCount) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
      
      db.get('SELECT COUNT(*) as blockchainIds FROM users WHERE blockchain_id IS NOT NULL', (err, blockchainCount) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }
        
        res.json({
          success: true,
          stats: {
            totalUsers: userCount.totalUsers,
            completedProfiles: profileCount.completedProfiles,
            blockchainIds: blockchainCount.blockchainIds
          }
        });
      });
    });
  });
});

app.get('/api/admin/export', (req, res) => {
  db.all(`
    SELECT 
      u.id, u.username, u.email, u.blockchain_id, u.created_at, u.last_login, u.profile_completed,
      tp.encrypted_data, tp.created_at as profile_created_at
    FROM users u
    LEFT JOIN tourist_profiles tp ON u.id = tp.user_id
    ORDER BY u.created_at DESC
  `, (err, data) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    res.json({
      success: true,
      data: data,
      exportDate: new Date().toISOString()
    });
  });
});

app.delete('/api/admin/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM tourist_profiles', (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to clear profiles' 
        });
      }
      
      db.run('DELETE FROM users', (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to clear users' 
          });
        }
        
        res.json({
          success: true,
          message: 'All data cleared successfully'
        });
      });
    });
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontsheet.html'));
});

// Authority login endpoint
app.post('/api/authority/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    db.get('SELECT * FROM authority_users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      return res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: 'authority' }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`Smart Tourists Backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`Database: tourists.db`);
  console.log(`Blockchain ID format: ST[timestamp][random]`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
