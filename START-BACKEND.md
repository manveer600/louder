# Quick Guide: Starting the Backend Server

## Problem
Frontend shows: "Cannot connect to server. Please ensure the backend is running on port 5000."

## Solution: Start the Backend Server

### Step 1: Open a Terminal/Command Prompt

**Option A: PowerShell** (Windows)
- Press `Win + X` and select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

**Option B: VS Code Terminal**
- Press `` Ctrl + ` `` (backtick) in VS Code
- Or go to Terminal → New Terminal

### Step 2: Navigate to Backend Directory

```powershell
cd C:\Users\Dell\Desktop\LOUDER\backend
```

### Step 3: Start the Server

**For Development (with auto-reload):**
```powershell
npm run dev
```

**OR for Production:**
```powershell
npm start
```

### Step 4: Verify It's Running

You should see output like:
```
Server running on port 5000 in development mode
Database connection established
MongoDB Connected: ...
API Base URL: http://localhost:5000/api/v1
```

### Step 5: Test Backend

Open a new browser tab and visit:
```
http://localhost:5000/health
```

You should see:
```json
{"success":true,"message":"Server is running",...}
```

### Step 6: Refresh Frontend

Go back to your frontend at `http://localhost:3000` and refresh the page. The error should be gone!

---

## Common Issues

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/

### Issue: "Cannot find module..."
**Solution**: Install dependencies first:
```powershell
cd backend
npm install
```

### Issue: "Port 5000 already in use"
**Solution**: 
- Another app is using port 5000
- Change port in `backend/.env`: `PORT=5001`
- Update frontend `.env`: `REACT_APP_API_BASE_URL=http://localhost:5001/api/v1`

### Issue: "MongoDB connection failed"
**Solution**: 
- Check `backend/.env` has correct `MONGODB_URI`
- Verify MongoDB Atlas network access is configured
- Check your internet connection

### Issue: Backend starts but frontend still can't connect
**Solution**:
- Check `FRONTEND_URL` in `backend/.env` matches `http://localhost:3000`
- Check `REACT_APP_API_BASE_URL` in `frontend/.env` matches `http://localhost:5000/api/v1`
- Restart both frontend and backend after changing `.env` files

---

## Keep Backend Running

**Important**: The backend terminal must stay open and running. Don't close it while using the app.

To stop the server:
- Press `Ctrl + C` in the backend terminal

---

## Quick Checklist

- [ ] Backend directory exists: `C:\Users\Dell\Desktop\LOUDER\backend`
- [ ] Dependencies installed: Run `npm install` in backend directory
- [ ] `.env` file exists: `backend/.env` with MongoDB URI
- [ ] Backend server started: `npm run dev`
- [ ] Server shows "Server running on port 5000"
- [ ] Health check works: http://localhost:5000/health
- [ ] Frontend refreshed at http://localhost:3000

---

## Still Having Issues?

1. **Check backend terminal** for error messages
2. **Check MongoDB connection** in backend logs
3. **Verify port 5000** is not used by another app
4. **Restart both** frontend and backend servers
