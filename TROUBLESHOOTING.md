# Troubleshooting Guide

## "Failed to fetch events" Error

If you're seeing "Failed to fetch events" on the frontend, follow these steps:

### Step 1: Check if Backend is Running

1. **Verify backend server is running**:
   ```bash
   # In backend directory
   cd backend
   npm run dev
   ```

   You should see:
   ```
   Server running on port 5000 in development mode
   Database connection established
   ```

2. **Test backend health endpoint**:
   Open browser or use curl:
   ```bash
   curl http://localhost:5000/health
   ```
   
   Should return:
   ```json
   {"success":true,"message":"Server is running",...}
   ```

### Step 2: Check MongoDB Connection

1. **Verify MongoDB URI in `.env`**:
   ```env
   MONGODB_URI=mongodb+srv://singhmanveer645:waheguru@cluster0.uk9srd7.mongodb.net/louder
   ```

2. **Check MongoDB Atlas Network Access**:
   - Go to MongoDB Atlas dashboard
   - Click "Network Access"
   - Ensure your IP is whitelisted (or allow all IPs: `0.0.0.0/0`)

3. **Check MongoDB Connection Logs**:
   Look for connection errors in backend terminal:
   ```
   MongoDB Connected: ...
   ```
   Or:
   ```
   Database connection failed: ...
   ```

### Step 3: Check if Events Exist in Database

1. **Test events endpoint directly**:
   ```bash
   curl http://localhost:5000/api/v1/events
   ```

2. **If empty array returned**:
   - This is normal if scraping hasn't run yet
   - Trigger scraping (see Step 4)

3. **If error returned**:
   - Check backend terminal for error logs
   - Verify database connection

### Step 4: Populate Events (Scraping)

If database is empty, populate it by running scraping:

**Option A: Via API** (backend must be running):
```bash
curl -X POST http://localhost:5000/api/v1/events/scrape
```

**Option B: Via CLI**:
```bash
cd backend
npm run scrape
```

**Option C: Wait for automatic scraping**:
- Scraping runs automatically every 6 hours
- Or it runs on server startup (if configured)

### Step 5: Check Frontend Configuration

1. **Verify frontend `.env` file exists**:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
   ```

2. **Restart frontend after changing `.env`**:
   ```bash
   # Stop frontend (Ctrl+C)
   # Start again
   npm start
   ```

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### Step 6: Check CORS Configuration

If you see CORS errors in browser console:

1. **Verify backend `.env`**:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

2. **Restart backend after changing `.env`**

3. **Check backend CORS settings** in `backend/app.js`:
   ```javascript
   origin: FRONTEND_URL || '*'
   ```

### Step 7: Verify Ports

Ensure ports are not in use:

- **Backend**: Port 5000 (change in `.env` if needed)
- **Frontend**: Port 3000 (default React port)

Check if ports are in use:
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :5000
lsof -i :3000
```

### Common Issues and Solutions

#### Issue: "Network error. Please check your connection."
**Solution**: Backend server is not running. Start it with `npm run dev` in backend directory.

#### Issue: "Cannot connect to server"
**Solution**: 
- Check if backend is running on port 5000
- Verify `REACT_APP_API_BASE_URL` in frontend `.env`
- Check firewall settings

#### Issue: "MongoDB connection failed"
**Solution**:
- Verify MongoDB URI is correct
- Check MongoDB Atlas network access
- Verify database name in URI (`louder`)

#### Issue: Empty events array (no error shown)
**Solution**: This is normal! Run scraping to populate events:
```bash
curl -X POST http://localhost:5000/api/v1/events/scrape
```

#### Issue: Scraping returns no events
**Solution**:
- This is normal initially - scraping may take time
- Some websites may block automated requests
- Check backend logs for scraping errors
- Verify internet connection

#### Issue: "Failed to fetch events" even after all checks
**Solution**:
1. Clear browser cache
2. Restart both frontend and backend
3. Check browser console for detailed error
4. Verify no proxy/VPN is blocking localhost

### Debug Mode

Enable detailed logging:

**Backend**: Set in `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

**Frontend**: Check browser console for detailed API errors

### Quick Health Check Command

Run this to verify everything:
```bash
# Check backend
curl http://localhost:5000/health

# Check events endpoint
curl http://localhost:5000/api/v1/events

# Check if scraping works
curl -X POST http://localhost:5000/api/v1/events/scrape
```

### Still Having Issues?

1. **Check logs**: Look at backend terminal for detailed error messages
2. **Browser DevTools**: Check Network tab to see actual API requests/responses
3. **Verify all dependencies installed**: Run `npm install` in both frontend and backend
4. **Try fresh start**: Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
