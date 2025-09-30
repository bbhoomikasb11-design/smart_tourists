# Smart Tourists Portal - Backend Authentication System

A complete tourism portal for North-East India with blockchain-based user authentication.

## Features

- **User Authentication**: Secure login/registration with email and password
- **Blockchain ID System**: Unique blockchain IDs generated for each user
- **Database Storage**: SQLite database for user management
- **Frontend Integration**: Seamless connection between HTML forms and backend
- **Security**: Password hashing with bcrypt
- **Real-time Feedback**: Loading states and success/error messages

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Start the Backend Server

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

The server will run on `http://localhost:3000`

### 3. Access the Application

- **Homepage**: `http://localhost:3000` (serves frontsheet.html)
- **Login**: `http://localhost:3000/login.html`
- **Register**: `http://localhost:3000/register.html`

## API Endpoints

### Authentication

- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/user/:blockchainId` - Get user profile
- `GET /api/health` - Health check

### Request/Response Examples

#### Register User
```json
POST /api/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "blockchainId": "ST12345678ABCD1234",
  "userId": 1
}
```

#### Login User
```json
POST /api/login
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "blockchainId": "ST12345678ABCD1234"
  }
}
```

## Database Schema

The system uses SQLite with the following table structure:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  blockchain_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

## Blockchain ID Format

Blockchain IDs are generated in the format: `ST[timestamp][random]`
- Example: `ST12345678ABCD1234`
- `ST` prefix for "Smart Tourists"
- Last 8 digits of timestamp
- 8 random hexadecimal characters

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error handling and logging

## File Structure

```
smart_tourists/
├── server.js              # Main backend server
├── package.json           # Dependencies and scripts
├── tourists.db           # SQLite database (auto-created)
├── frontsheet.html       # Homepage with chatbot
├── login.html            # Login page with authentication
├── register.html          # Registration page
├── explore.html          # Explore page
├── discover.html          # Discover page
├── about.html            # About page
└── README.md             # This file
```

## Usage Flow

1. **New User**: Visit register.html → Fill form → Get blockchain ID → Redirect to login
2. **Existing User**: Visit login.html → Enter credentials → Access dashboard
3. **Authentication**: All user data stored with unique blockchain ID
4. **Session Management**: User data stored in localStorage

## Development

### Adding New Features

1. **Database Changes**: Modify the table creation in `server.js`
2. **New Endpoints**: Add routes in `server.js`
3. **Frontend Integration**: Update HTML files with new API calls

### Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test registration
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

## Troubleshooting

### Common Issues

1. **Port 3000 in use**: Change PORT in server.js or kill process using port 3000
2. **Database errors**: Delete `tourists.db` to reset database
3. **CORS errors**: Ensure server is running on localhost:3000
4. **Module not found**: Run `npm install` to install dependencies

### Logs

Check console output for:
- Database connection status
- API request logs
- Error messages
- Server startup confirmation

## Production Deployment

For production deployment:

1. Set environment variables for database and security
2. Use a production database (PostgreSQL/MySQL)
3. Implement proper logging
4. Add rate limiting and security headers
5. Use HTTPS with SSL certificates

## Support

For issues or questions:
- Check the console logs
- Verify all dependencies are installed
- Ensure the server is running on port 3000
- Test API endpoints with curl or Postman
