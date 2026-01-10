# Fixed: "Failed to fetch events" Error

## Problem Identified
The error "Failed to fetch events" was caused by **missing `.env` files** for both backend and frontend.

## What Was Fixed

1. ✅ **Created `backend/.env`** with:
   - MongoDB connection string
   - Server port (5000)
   - Frontend URL for CORS
   - Other required configuration

2. ✅ **Created `frontend/.env`** with:
   - API base URL pointing to backend

3. ✅ **Improved error handling** in API service for better error messages

4. ✅ **Updated event controller** to handle empty results gracefully

## Next Steps to Resolve

### Step 1: Verify Dependencies Installed

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000 in development mode
Database connection established
```

**If you see database connection errors:**
- Check MongoDB Atlas network access (whitelist your IP or use 0.0.0.0/0)
- Verify MongoDB URI in `backend/.env` is correct

### Step 3: Start Frontend Server

Open a **new terminal**:
```bash
cd frontend
npm start
```

The browser should open to `http://localhost:3000`

### Step 4: Populate Events Database

The database is likely empty. Run scraping to populate events:

**Option A: Via API** (backend must be running):
```bash
curl -X POST http://localhost:5000/api/v1/events/scrape
```

**Option B: Via PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/events/scrape" -Method POST
```

**Option C: Via Browser**:
Visit: `http://localhost:5000/api/v1/events/scrape` (will trigger scraping)

**Option D: Via CLI**:
```bash
cd backend
npm run scrape
```

### Step 5: Verify Everything Works

1. **Test backend health**:
   Visit: `http://localhost:5000/health`
   Should return: `{"success":true,...}`

2. **Test events endpoint**:
   Visit: `http://localhost:5000/api/v1/events`
   Should return events array (might be empty until scraping completes)

3. **Check frontend**:
   Visit: `http://localhost:3000`
   Should show events or "No events found" message (not an error)

## If Still Getting Errors

### Error: "Network error" or "Cannot connect to server"
**Solution**: Backend is not running. Start it with `cd backend && npm run dev`

### Error: "MongoDB connection failed"
**Solution**: 
- Check MongoDB Atlas network access
- Verify `MONGODB_URI` in `backend/.env`

### Error: Empty events (no error, just empty)
**Solution**: This is normal! Run scraping (Step 4) to populate events.

### Error: Scraping returns no events
**Solution**: 
- This is normal initially - scraping takes time
- Some websites may block automated requests
- Check backend logs for scraping status
- Events will populate over time (scraping runs every 6 hours automatically)

## Quick Diagnostic

Run the diagnostic script:
```bash
node check-setup.js
```

This will check:
- ✅ Environment files exist
- ✅ Dependencies installed
- ✅ Configuration correct

## Summary

The main issue was missing `.env` files. Now that they're created:
1. ✅ Restart both servers (backend and frontend)
2. ✅ Trigger scraping to populate events
3. ✅ Refresh the frontend page

You should now see events or a proper "No events found" message instead of an error!
