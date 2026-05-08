# Secure Chat App - MERN Stack + Render

Ứng dụng chat thời gian thực an toàn với mã hóa end-to-end (E2EE) và bảo vệ chống MITM.

## 🔐 Tính năng Bảo mật

### 1. **Xác thực & Phân quyền**
- ✅ JWT Token Authentication
- ✅ bcrypt Password Hashing
- ✅ Role-based Access Control (Admin/User)
- ✅ Login attempt limiting
- ✅ Account locking mechanism

### 2. **Mã hóa**
- ✅ End-to-End Encryption (E2EE)
- ✅ AES-256 Message Encryption
- ✅ TLS/HTTPS for transport
- ✅ Secure socket connections

### 3. **Bảo vệ API**
- ✅ Rate Limiting (express-rate-limit)
- ✅ CORS Protection
- ✅ Helmet.js Security Headers
- ✅ Input Validation & Sanitization
- ✅ XSS Prevention

### 4. **Socket.IO Bảo mật**
- ✅ JWT Token Verification
- ✅ Authenticated Connections
- ✅ Real-time messaging encryption
- ✅ User online/offline tracking

### 5. **Admin Features**
- ✅ User Management
- ✅ Block/Unblock Users
- ✅ Message Deletion
- ✅ Audit Logging
- ✅ System Statistics

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT
- bcryptjs
- Helmet
- express-rate-limit

### Frontend
- React.js
- React Router
- Axios
- Socket.IO Client
- CryptoJS
- TailwindCSS

### Deployment
- Render.com
- MongoDB Atlas

## 📋 Cài đặt

### Prerequisites
- Node.js >= 16.0.0
- MongoDB Atlas Account
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Cập nhật .env với credentials
# MONGODB_URI=your_mongodb_uri
# JWT_SECRET=your_secret_key
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env

# .env
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Chạy Ứng dụng

### Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:3000`

## 📦 Deployment Render

### Backend Deploy

1. Push code to GitHub
2. Tạo new Web Service on Render
3. Select GitHub repository
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - FRONTEND_URL
   - NODE_ENV=production
7. Deploy

### Frontend Deploy

1. Tạo new Static Site on Render
2. Select GitHub repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy

## 🔒 OWASP Top 10 Prevention

### 1. Injection Attack
- ✅ Mongoose validation
- ✅ Input sanitization
- ✅ Prepared statements

### 2. Broken Authentication
- ✅ JWT tokens
- ✅ Password hashing (bcrypt)
- ✅ Token expiration
- ✅ Login rate limiting

### 3. Sensitive Data Exposure
- ✅ HTTPS/TLS
- ✅ E2EE encryption
- ✅ Password hashing

### 4. Security Misconfiguration
- ✅ Environment variables
- ✅ Helmet.js headers
- ✅ CORS configuration

### 5. XSS Prevention
- ✅ Input sanitization
- ✅ Output encoding
- ✅ CSP headers

### 6. Broken Access Control
- ✅ Role-based routes
- ✅ Middleware checks
- ✅ Resource ownership verification

### 7. CSRF Protection
- ✅ SameSite cookies
- ✅ CORS tokens

### 8. Vulnerable Dependencies
- ✅ npm audit regularly
- ✅ Update dependencies

### 9. Insufficient Logging
- ✅ Audit logs
- ✅ Security event tracking
- ✅ Login attempt logging

### 10. SSRF Prevention
- ✅ URL validation
- ✅ Input validation

## 📝 API Documentation

### Auth Endpoints

**POST** `/api/auth/signup`
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**POST** `/api/auth/logout`

### User Endpoints

**GET** `/api/users/profile` - Get user profile
**PUT** `/api/users/profile` - Update profile
**GET** `/api/users/users` - Get all users
**POST** `/api/users/change-password` - Change password

### Message Endpoints

**GET** `/api/messages/private/:recipientId` - Get private messages
**GET** `/api/messages/group/:groupId` - Get group messages
**DELETE** `/api/messages/:messageId` - Delete message
**PUT** `/api/messages/:messageId` - Edit message

### Group Endpoints

**POST** `/api/groups` - Create group
**GET** `/api/groups` - Get user's groups
**GET** `/api/groups/:groupId` - Get group details
**POST** `/api/groups/:groupId/members` - Add member
**DELETE** `/api/groups/:groupId/members/:memberId` - Remove member
**DELETE** `/api/groups/:groupId` - Delete group

### Admin Endpoints

**GET** `/api/admin/users` - All users
**POST** `/api/admin/users/:userId/block` - Block user
**POST** `/api/admin/users/:userId/unblock` - Unblock user
**DELETE** `/api/admin/messages/:messageId` - Delete message
**GET** `/api/admin/logs` - Audit logs
**GET** `/api/admin/stats` - System statistics

## 🔐 Security Best Practices

1. **Mật khẩu**
   - Tối thiểu 8 ký tự
   - Hoa, thường, số, ký tự đặc biệt
   - Hashed với bcrypt (salt=10)

2. **Token**
   - Hết hạn sau 7 ngày
   - Refresh token 30 ngày
   - Stored in localStorage (production: httpOnly cookies)

3. **HTTPS**
   - Enforced trên Render
   - TLS 1.2+

4. **Rate Limiting**
   - 100 requests/15 minutes (general)
   - 5 login attempts/15 minutes

5. **Audit Logging**
   - Tất cả login attempts
   - Admin actions
   - Failed access attempts

## 📊 Database Schema

### Users
- username (unique, indexed)
- email (unique, indexed)
- password (hashed)
- avatar
- status (online/offline/away)
- role (user/admin)
- isBlocked
- loginAttempts
- createdAt, updatedAt

### Messages
- sender (ref: User)
- recipient (ref: User)
- group (ref: Group)
- content (encrypted)
- isEncrypted
- messageType
- isRead
- isDeleted
- createdAt, updatedAt

### Groups
- name
- description
- owner (ref: User)
- members (with roles)
- avatar
- createdAt, updatedAt

### AuditLogs
- userId (ref: User)
- action
- status
- ipAddress
- severity
- createdAt

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Kiểm tra MONGODB_URI trong .env
Confirm IP whitelist on MongoDB Atlas
```

### Socket.IO Connection Failed
```
Kiểm tra CORS settings
Verify token is being sent
Check Frontend URL in backend
```

### Port Already in Use
```bash
# Backend port 5000
lsof -i :5000
kill -9 <PID>

# Frontend port 3000
lsof -i :3000
kill -9 <PID>
```

## 📄 License

MIT

## 👥 Contributors

Secure Chat Development Team

## 📞 Support

Email: support@securechat.com

---

**Bảo mật là ưu tiên hàng đầu!** 🔐
