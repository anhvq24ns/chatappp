# Hướng dẫn Deploy trên Render

## Bước 1: Chuẩn bị GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Secure Chat App"
git branch -M main
git remote add origin https://github.com/yourusername/chatapp.git
git push -u origin main
```

## Bước 2: Deploy Backend trên Render

### 2.1 Tạo Backend Web Service

1. Đăng nhập vào [Render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repository
5. Fill form:
   - **Name**: secure-chat-api
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2.2 Cấu hình Environment Variables

Thêm environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your_very_secure_random_string_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
FRONTEND_URL=https://youapp.onrender.com
NODE_ENV=production
PORT=5000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 2.3 Deploy

- Click "Deploy"
- Chờ build hoàn tất (5-10 phút)
- Copy production URL: `https://secure-chat-api.onrender.com`

## Bước 3: Deploy Frontend trên Render

### 3.1 Tạo Frontend Static Site

1. Click "New +"
2. Select "Static Site"
3. Connect GitHub repository
4. Fill form:
   - **Name**: secure-chat-web
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Publish Directory**: dist

### 3.2 Cấu hình Environment Variables

Thêm environment variables (Build-time):

```
VITE_API_URL=https://secure-chat-api.onrender.com/api
VITE_SOCKET_URL=https://secure-chat-api.onrender.com
```

### 3.3 Deploy

- Click "Deploy"
- Chờ build hoàn tất
- Copy URL: `https://youapp.onrender.com`

## Bước 4: Cập nhật CORS trên Backend

Backend `.env`:
```
FRONTEND_URL=https://secure-chat-web.onrender.com
```

## Bước 5: Database MongoDB Atlas

### 5.1 Tạo MongoDB Atlas Cluster

1. Đăng nhập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster
3. Choose Free tier
4. Create database user
5. Whitelist IP: Allow from anywhere (0.0.0.0/0)

### 5.2 Connection String

```
mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
```

## 🔒 Production Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Change JWT_REFRESH_SECRET
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set NODE_ENV=production
- [ ] Whitelist MongoDB IPs
- [ ] Enable MongoDB authentication
- [ ] Review CORS settings
- [ ] Set rate limiting appropriately
- [ ] Enable helmet.js security headers
- [ ] Configure CSRF protection
- [ ] Setup monitoring/logging
- [ ] Enable API rate limiting
- [ ] Test all auth endpoints
- [ ] Verify E2EE encryption
- [ ] Setup error logging (Sentry, etc.)

## 🚀 Tối ưu Performance

### Backend
```
# Render settings
- Increase instance type if needed
- Enable auto-scale
- Configure caching
```

### Frontend
```
# vite.config.js
- Build optimizations enabled
- Minification enabled
- Source maps disabled in production
```

### Database
```
# MongoDB Atlas
- Index frequently queried fields
- Setup connection pooling
- Monitor query performance
```

## 📊 Monitoring

### Render Dashboard
- View logs
- Check deployment status
- Monitor uptime
- View analytics

### MongoDB Atlas
- View query performance
- Monitor replication lag
- Check connection pool status
- Setup alerts

## 🔄 Deployment Updates

### Tự động Deploy

Render sẽ tự động redeploy khi:
1. Push code to GitHub (main branch)
2. Khỏi động trong 1-2 phút
3. Log hiển thị trên dashboard

### Manual Deploy

```bash
# Trigger redeploy từ Render dashboard
# hoặc push force git push
git push origin main --force
```

## 🐛 Troubleshooting

### Backend không kết nối MongoDB

```
1. Check MONGODB_URI in Render env
2. Verify IP whitelist on MongoDB Atlas
3. Check credentials
4. View logs: Render Dashboard > Logs
```

### Frontend không kết nối Backend

```
1. Check VITE_API_URL in Render env
2. Verify Backend URL is correct
3. Check CORS settings
4. View browser console errors
```

### Socket.IO Connection Failed

```
1. Check VITE_SOCKET_URL
2. Verify Backend is running
3. Check CORS configuration
4. View WebSocket connections in dev tools
```

### Build Fails

```
1. Check build logs in Render
2. Verify dependencies installed
3. Check Node version (>=16)
4. Clear build cache and redeploy
```

## 📈 Scaling

### Khi cần scale up:

**Backend:**
```
1. Upgrade instance type
2. Enable auto-scaling
3. Setup load balancing
4. Cache with Redis (optional)
```

**Frontend:**
```
1. Setup CDN
2. Enable caching
3. Optimize bundle size
```

**Database:**
```
1. Upgrade cluster tier
2. Enable sharding
3. Add read replicas
4. Setup backup
```

## 💰 Cost Estimation

**Free Tier:**
- Backend: $0 (with limitations)
- Frontend: $0 (with limitations)
- MongoDB: $0 (shared)
- Total: $0/month

**Recommended (Hobby):**
- Backend: $7/month (0.5GB RAM)
- Frontend: $0/month
- MongoDB: $0 (shared)
- Total: ~$7/month

**Production:**
- Backend: $12/month+ (1GB RAM+)
- Frontend: $0-20/month (CDN)
- MongoDB: $57+/month (dedicated)
- Total: $70+/month

## 📝 Rollback

```bash
# Nếu deployment bị lỗi:
git revert HEAD~1
git push origin main

# Render sẽ tự động redeploy
```

## 🎯 Final Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database connected
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Logs monitored
- [ ] Email notifications setup
- [ ] Backups configured
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Auth flow working
- [ ] Socket.IO connecting
- [ ] E2EE functioning
- [ ] Admin panel accessible
- [ ] Error handling working

## 🔐 SSL/TLS Certificate

Render tự động cấp SSL certificate (Let's Encrypt):
- Tự động cập nhật
- Hỗ trợ HTTPS
- Force HTTPS bật sẵn

## 📞 Support

- Render Support: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Email: support@securechat.com

---

**Deployment hoàn thành! Your app is live! 🎉**
