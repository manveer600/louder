# Quick Start Guide

## Prerequisites

- Node.js v16+ installed
- MongoDB Atlas account (connection string provided)
- Terminal/Command Prompt

## Backend Setup (5 minutes)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** (copy from example or create manually):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE
   FRONTEND_URL=http://localhost:3000
   API_VERSION=v1
   SCRAPING_INTERVAL_HOURS=6
   LOG_LEVEL=info
   ```
   
   **⚠️ SECURITY**: Replace placeholders with your actual MongoDB Atlas credentials. Never commit `.env` files to version control.

4. **Start the server**:
   ```bash
   npm run dev
   ```

   Server should start on `http://localhost:5000`

5. **Test the API** (optional):
   ```bash
   curl http://localhost:5000/health
   ```

## Frontend Setup (3 minutes)

1. **Open a new terminal and navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

   Frontend should open at `http://localhost:3000`

## Trigger Initial Scraping

To populate events in the database, trigger scraping:

**Option 1: Via API** (when server is running):
```bash
curl -X POST http://localhost:5000/api/v1/events/scrape
```

**Option 2: Via CLI** (from backend directory):
```bash
npm run scrape
```

## Verify Everything Works

1. **Backend Health Check**:
   - Visit: `http://localhost:5000/health`
   - Should return: `{"success":true,"message":"Server is running",...}`

2. **Get Events**:
   - Visit: `http://localhost:5000/api/v1/events`
   - Should return events array (might be empty if scraping hasn't run yet)

3. **Frontend**:
   - Visit: `http://localhost:3000`
   - Should see the LOUDER homepage with event listing

## Common Issues

### MongoDB Connection Error
- Verify the MongoDB URI in `.env` is correct
- Check your MongoDB Atlas network access settings
- Ensure your IP is whitelisted in MongoDB Atlas

### CORS Error
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running

### Port Already in Use
- Change `PORT` in backend `.env` to a different port (e.g., 5001)
- Update `REACT_APP_API_BASE_URL` in frontend `.env` accordingly

### Scraping Returns No Events
- This is normal initially - scraping may take time
- Check logs in the terminal for scraping status
- Some websites may block automated requests

## Next Steps

1. **Set up scheduled scraping**: Already configured to run every 6 hours automatically
2. **Customize scraping**: Add more event sources in `backend/services/scraping/`
3. **Deploy**: Follow deployment instructions in README.md

## Support

Check the main README.md for detailed documentation and troubleshooting.

