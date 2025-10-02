# 🚨 Emergency Alert System Documentation

## Overview
The Smart Tourists Emergency Alert System provides real-time safety monitoring and emergency response capabilities for tourists visiting North-East India. The system includes voice and text-based emergency detection, live GPS tracking, and instant communication with authorities.

## System Components

### 1. Tourist Dashboard (`dashboard.html`)
- **Emergency Chatbot**: Floating chatbot widget with voice and text input
- **Voice Recognition**: Web Speech API for hands-free emergency alerts
- **GPS Tracking**: Continuous location monitoring
- **Danger Detection**: Automatic detection of emergency keywords
- **Real-time Alerts**: Instant communication with authorities

### 2. Authority Dashboard (`authority.html`)
- **Live Monitoring**: Real-time view of all active tourists
- **Emergency Alerts**: Instant notifications of tourist emergencies
- **Location Tracking**: Live GPS coordinates of tourists in distress
- **Response Management**: Tools to respond to and manage emergencies
- **Statistics**: System performance and response metrics

### 3. Backend System (`server.js`)
- **Emergency API**: RESTful endpoints for alert management
- **WebSocket Server**: Real-time communication between dashboards
- **Database**: SQLite storage for alerts and tourist data
- **Encryption**: Secure handling of sensitive tourist information

## Features

### 🎤 Voice Recognition
- Supports multiple browsers (Chrome, Edge, Safari)
- Continuous listening mode for emergency situations
- Automatic transcription of voice messages
- Visual feedback during recording

### 🗺️ GPS Tracking
- HTML5 Geolocation API for precise location
- Continuous location updates every 30 seconds
- Accuracy indicators for location reliability
- Google Maps integration for visualization

### 🚨 Emergency Detection
**Automatic Keywords Detection:**
- "help", "emergency", "sos", "danger"
- "attack", "fire", "accident", "injured"
- "lost", "trapped", "robbery", "assault"

### 📡 Real-time Communication
- WebSocket connections for instant alerts
- Browser notifications for authorities
- Automatic alert broadcasting to all connected dashboards

## API Endpoints

### Emergency Alerts
```
POST /api/emergency-alert
GET /api/emergency-alerts
GET /api/emergency-alert/:id
PUT /api/emergency-alert/:id
```

### User Management
```
GET /api/admin/users
GET /api/admin/profiles
GET /api/admin/stats
```

## Database Schema

### Emergency Alerts Table
```sql
CREATE TABLE emergency_alerts (
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
);
```

## Usage Instructions

### For Tourists

1. **Access Emergency Chatbot**
   - Click the red emergency button (🚨) on the dashboard
   - The chatbot will automatically start location tracking

2. **Send Emergency Alert**
   - **Voice**: Click the microphone button and speak
   - **Text**: Type your emergency message
   - **Keywords**: Use words like "HELP", "SOS", or "EMERGENCY"

3. **Emergency Response**
   - Your location is automatically shared with authorities
   - Emergency contacts are provided for immediate calling
   - Stay calm and follow the chatbot's instructions

### For Authorities

1. **Monitor Tourists**
   - Open `authority.html` in your browser
   - View real-time list of active tourists
   - Monitor their locations and status

2. **Respond to Alerts**
   - Emergency alerts appear instantly in the right panel
   - Click "Respond" to dispatch emergency teams
   - Use "Track" to view detailed location information
   - Update alert status as situations are resolved

3. **System Management**
   - View system statistics and performance metrics
   - Export reports for analysis
   - Access live maps for comprehensive monitoring

## Security Features

- **Data Encryption**: Tourist profiles encrypted with AES-256-CBC
- **Secure Communication**: HTTPS and WSS protocols
- **Access Control**: Separate interfaces for tourists and authorities
- **Privacy Protection**: Location data only shared during emergencies

## Browser Compatibility

### Voice Recognition
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (not supported)

### GPS Tracking
- ✅ All modern browsers
- ✅ Mobile devices
- ⚠️ Requires HTTPS in production

### WebSocket Support
- ✅ All modern browsers
- ✅ Real-time updates
- ✅ Automatic reconnection

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install express sqlite3 bcryptjs cors body-parser ws
   ```

2. **Start Server**
   ```bash
   node server.js
   ```

3. **Access Dashboards**
   - Tourist Dashboard: `http://localhost:3000/dashboard.html`
   - Authority Dashboard: `http://localhost:3000/authority.html`

## Emergency Response Protocol

### Level 1: Automatic Detection
- System detects emergency keywords
- GPS location captured automatically
- Alert sent to all connected authorities
- Emergency contacts displayed to tourist

### Level 2: Authority Response
- Emergency team dispatched
- Real-time location tracking activated
- Communication channel established
- Status updates provided to tourist

### Level 3: Resolution
- Emergency resolved and documented
- Alert status updated to "resolved"
- Response time and outcome recorded
- System ready for next emergency

## Testing

The system includes comprehensive testing for:
- Emergency alert creation and retrieval
- WebSocket real-time communication
- Voice recognition accuracy
- GPS location precision
- Database operations

## Support & Maintenance

### Monitoring
- Server logs all emergency activities
- WebSocket connection status monitoring
- Database integrity checks
- Performance metrics tracking

### Backup & Recovery
- Automatic database backups
- Emergency contact redundancy
- Failover communication channels
- Data recovery procedures

## Contact Information

**Emergency Contacts:**
- All India Emergency: 112
- Police: 100
- Ambulance: 108
- Fire: 101
- Tourist Helpline: 1800-11-1363

**System Administrator:**
- Technical Support: Available 24/7
- Emergency Response Team: Immediate dispatch
- Database Management: Automated with manual oversight

---

*This emergency system is designed to save lives and ensure tourist safety in North-East India. Regular testing and maintenance ensure optimal performance during critical situations.*
