# Security Implementation Guide

## 🔐 Bảo mật trong Ứng dụng Chat

Tài liệu này mô tả chi tiết tất cả các biện pháp bảo mật được triển khai.

---

## 1. AUTHENTICATION & AUTHORIZATION

### 1.1 JWT Token (JSON Web Token)

**Triển khai:**
```javascript
// backend/utils/jwt.js
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
```

**Bảo vệ:**
- Token hết hạn sau 7 ngày
- Refresh token 30 ngày
- Chữ ký bằng JWT_SECRET (256+ bits)

**Client-side:**
```javascript
// Frontend lưu token
localStorage.setItem('token', token);

// Gửi kèm request
headers.Authorization = `Bearer ${token}`;
```

### 1.2 bcrypt Password Hashing

**Triển khai:**
```javascript
// backend/models/User.js
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});
```

**Bảo vệ:**
- Salt rounds: 10 (cân bằng giữa bảo mật & tốc độ)
- Không bao giờ lưu plaintext
- Mỗi password có salt khác nhau

### 1.3 Login Attempt Limiting

**Triển khai:**
```javascript
// backend/models/User.js
userSchema.methods.incLoginAttempts = async function () {
  const maxAttempts = 5;
  const lockTimeInMinutes = 30;
  
  if (this.loginAttempts + 1 >= maxAttempts) {
    this.lockedUntil = new Date(now + lockTimeInMinutes * 60 * 1000);
  }
  // ...
};
```

**Bảo vệ:**
- Khóa tài khoản sau 5 lần đăng nhập thất bại
- Khóa 30 phút trước khi mở lại
- Ngăn brute-force attacks

### 1.4 Role-Based Access Control (RBAC)

**Triển khai:**
```javascript
// backend/middleware/auth.js
export const verifyAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
```

**Roles:**
- **User**: Chat, gửi file, xem profile
- **Admin**: Quản lý users, xóa messages, khóa tài khoản

---

## 2. ENCRYPTION

### 2.1 End-to-End Encryption (E2EE)

**Triển khai Frontend:**
```javascript
// frontend/utils/encryption.js
export const encryptMessage = (message, key) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

export const decryptMessage = (encrypted, key) => {
  return CryptoJS.AES.decrypt(encrypted, key)
    .toString(CryptoJS.enc.Utf8);
};
```

**Triển khai Backend:**
```javascript
// backend/utils/encryption.js
export const encryptMessage = (message, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(message, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};
```

**Bảo vệ:**
- Messages mã hóa trước khi gửi
- Server không thể đọc nội dung
- Chỉ người nhận có thể giải mã
- IV (Initialization Vector) ngẫu nhiên cho mỗi message

### 2.2 HTTPS/TLS

**Triển khai trên Render:**
```
- Tự động SSL certificates (Let's Encrypt)
- TLS 1.2+
- Force HTTPS
```

**Bảo vệ:**
- Mã hóa dữ liệu truyền
- Xác thực server
- Chống MITM (Man-in-the-Middle)

### 2.3 Password Encryption

**Triển khai:**
```javascript
// Client-side không bao giờ gửi plaintext
// Luôn gửi qua HTTPS
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"  // Qua HTTPS
}
```

---

## 3. API PROTECTION

### 3.1 Rate Limiting

**Triển khai:**
```javascript
// backend/server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

// Strict limit cho auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5  // Chỉ 5 login attempts
});

app.post('/api/auth/login', authLimiter);
```

**Bảo vệ:**
- Chống brute-force attacks
- Chống DDoS (minor)
- Chống spam

### 3.2 CORS (Cross-Origin Resource Sharing)

**Triển khai:**
```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Bảo vệ:**
- Chỉ frontend chính thức có thể truy cập API
- Chặn cross-domain requests
- Ngăn truy cập từ malicious websites

### 3.3 Helmet.js Security Headers

**Triển khai:**
```javascript
// backend/server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  frameguard: { action: 'deny' },        // Chống clickjacking
  noSniff: true,                          // Chống MIME sniffing
  xssFilter: true,                        // Chống XSS
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Headers được thêm:**
- `X-Frame-Options: DENY` - Chống Clickjacking
- `X-Content-Type-Options: nosniff` - Chống MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Chống XSS
- `Content-Security-Policy` - Chống XSS, Injection
- `Strict-Transport-Security` - Enforce HTTPS

---

## 4. INPUT VALIDATION & SANITIZATION

### 4.1 Input Validation

**Triển khai:**
```javascript
// backend/middleware/validation.js
export const validateEmail = (email) => {
  return validator.isEmail(email);
};

export const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
};

export const validateUsername = (username) => {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};
```

**Yêu cầu:**
- Email: Valid email format
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Username: 3-30 chars, alphanumeric + underscore + hyphen

### 4.2 Input Sanitization

**Triển khai:**
```javascript
// backend/middleware/validation.js
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return validator.escape(data);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  return data;
};

// Middleware
app.use(sanitizeBody);  // Sanitize all requests
```

**Bảo vệ:**
- Escape HTML characters
- Ngăn XSS attacks
- Ngăn Injection attacks

### 4.3 Mongoose Validation

**Triển khai:**
```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  }
});
```

**Bảo vệ:**
- Database-level validation
- Type checking
- Length validation
- Unique constraints

---

## 5. OWASP TOP 10 PREVENTION

### 1. Injection Attack
```javascript
// ✅ Mongoose prevents NoSQL injection
db.collection('users').findOne({ email: user.email });

// ❌ Vulnerable
db.collection('users').find({ email: { $ne: null } });
```

### 2. Broken Authentication
```javascript
// ✅ JWT + bcrypt + rate limiting + account locking
// ✅ Token expiration
// ✅ Logout invalidates session
```

### 3. Sensitive Data Exposure
```javascript
// ✅ HTTPS/TLS encryption
// ✅ E2EE for messages
// ✅ Passwords hashed with bcrypt
// ✅ No sensitive data in logs
```

### 4. Security Misconfiguration
```javascript
// ✅ Environment variables
// ✅ Helmet security headers
// ✅ CORS protection
// ✅ Rate limiting
// ❌ Avoid exposing stack traces in production
```

### 5. XSS (Cross-Site Scripting)
```javascript
// ✅ Input sanitization
// ✅ Output encoding
// ✅ CSP headers
// ✅ Escape user input
```

### 6. Broken Access Control
```javascript
// ✅ Role-based middleware
// ✅ Resource ownership checks
export const verifyOwnership = (req, res, next) => {
  if (resource.ownerId !== req.userId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  next();
};
```

### 7. CSRF
```javascript
// ✅ SameSite cookies
// ✅ CORS tokens
// ✅ Same-origin requests
```

### 8. Vulnerable Components
```bash
# Regularly run
npm audit
npm audit fix
npm outdated
```

### 9. Insufficient Logging
```javascript
// ✅ AuditLog model tracks:
// ✅ Login attempts (success/failure)
// ✅ Admin actions
// ✅ Unauthorized access attempts
// ✅ Message deletions
```

### 10. SSRF
```javascript
// ✅ Validate URLs before processing
// ✅ Whitelist allowed domains
// ✅ Block internal IPs
```

---

## 6. AUDIT LOGGING

**Triển khai:**
```javascript
// backend/models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,  // LOGIN_SUCCESS, LOGIN_FAILED, etc.
  status: String,  // success, failed
  ipAddress: String,
  severity: String,  // low, medium, high, critical
  createdAt: Date
});

// Logged actions:
// - LOGIN_SUCCESS
// - LOGIN_FAILED
// - LOGOUT
// - SIGNUP
// - PASSWORD_CHANGE
// - MESSAGE_SENT
// - MESSAGE_DELETED
// - USER_BLOCKED
// - ADMIN_ACTION
// - UNAUTHORIZED_ACCESS
```

**Admin Dashboard hiển thị:**
- Tất cả login attempts
- Failed login attempts
- Admin actions
- User blocks
- Suspicious activity

---

## 7. SOCKET.IO SECURITY

**Triển khai:**
```javascript
// backend/server.js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.userId;
    next();
  });
});

// Messages are encrypted
socket.on('send_message', async (data) => {
  const message = await Message.create({
    sender: socket.userId,
    content: data.content,  // Already encrypted from client
    isEncrypted: true
  });
});
```

**Bảo vệ:**
- JWT token verification
- Only authenticated users can connect
- Messages encrypted end-to-end
- User ID verified

---

## 8. ENVIRONMENT VARIABLES

**Production .env (Backend):**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<256+ bit random string>
JWT_REFRESH_SECRET=<256+ bit random string>
FRONTEND_URL=https://youapp.onrender.com
NODE_ENV=production
RATE_LIMIT_MAX=100
ENCRYPTION_KEY=<32 char hex>
```

**Production .env (Frontend):**
```
VITE_API_URL=https://secure-chat-api.onrender.com/api
VITE_SOCKET_URL=https://secure-chat-api.onrender.com
```

**Bảo vệ:**
- Không commit .env files
- Use .env.example cho reference
- Rotate secrets regularly
- Use Render environment editor

---

## 9. PASSWORD REQUIREMENTS

**Client-side validation:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

**Server-side validation:**
```javascript
if (!validatePassword(password)) {
  return res.status(400).json({
    message: 'Password must contain uppercase, lowercase, number, and special char'
  });
}
```

---

## 10. SECURITY CHECKLIST

### Development
- [ ] Use HTTPS (even locally with self-signed cert)
- [ ] Validate all inputs
- [ ] Sanitize all outputs
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Log security events
- [ ] Test authentication flow
- [ ] Test authorization checks

### Deployment
- [ ] Change all default credentials
- [ ] Rotate JWT secrets
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Whitelist MongoDB IPs
- [ ] Setup monitoring
- [ ] Setup error logging
- [ ] Enable audit logs
- [ ] Test all endpoints
- [ ] Verify E2EE works
- [ ] Test rate limiting
- [ ] Test CORS

### Ongoing
- [ ] Monitor audit logs daily
- [ ] Review failed login attempts
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Security audit quarterly
- [ ] Penetration testing annually

---

## 11. REFERENCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Helmet.js](https://helmetjs.github.io/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## 📞 Security Incident Response

Nếu phát hiện lỗ hổng bảo mật:

1. **Ngay lập tức:**
   - Dừng production
   - Notify users
   - Backup logs

2. **Trong 24 giờ:**
   - Fix vulnerability
   - Audit affected data
   - Review logs

3. **Trong 1 tuần:**
   - Deploy fix
   - Notify users of actions taken
   - Post-mortem analysis

---

**Bảo mật không phải một tính năng, nó là quá trình! 🔐**
