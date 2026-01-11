# Deployment Guide

## Backend Deployment (Vercel/Railway/Render)

### Required Environment Variables

Add these to your backend deployment platform:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=https://louder-frontend-sigma.vercel.app
API_VERSION=v1
SCRAPING_INTERVAL_HOURS=6
LOG_LEVEL=info

# Gmail Configuration (optional - for email sending)
USER=singhmanveer645@gmail.com
APP_PASSWORD=wcqdsknnrhimbaez
```

### Important Notes:

1. **CORS Configuration**: The backend now allows requests from:
   - `http://localhost:3000` (development)
   - `https://louder-frontend-sigma.vercel.app` (production)
   - Any origin specified in `FRONTEND_URL`

2. **MongoDB Connection**: Ensure your MongoDB Atlas cluster allows connections from your deployment platform's IP addresses (or use 0.0.0.0/0 for all IPs in development).

3. **Error Handling**: The backend now has improved error handling to prevent 500 errors from crashing the server.

## Frontend Deployment (Vercel)

### Required Environment Variables

Add these to your frontend deployment:

```env
REACT_APP_API_BASE_URL=https://louder-beta.vercel.app/api/v1
```

**Important**: Replace `https://louder-beta.vercel.app` with your actual backend URL.

## Common Issues & Solutions

### CORS Errors
- **Issue**: "Access-Control-Allow-Origin header has a value that is not equal to the supplied origin"
- **Solution**: Ensure `FRONTEND_URL` in backend matches your frontend deployment URL exactly

### 500 Internal Server Error
- **Issue**: Backend returns 500 errors
- **Solution**: 
  1. Check backend logs for specific error messages
  2. Ensure MongoDB connection string is correct
  3. Verify all environment variables are set
  4. Check that the backend server is running

### Network Errors / Timeout
- **Issue**: "Cannot connect to server" or timeout errors
- **Solution**:
  1. Verify backend is deployed and running
  2. Check backend URL in frontend `.env` matches actual backend URL
  3. Ensure backend allows connections from frontend origin

## Testing Deployment

1. **Health Check**: Visit `https://your-backend-url.com/health`
   - Should return: `{"success":true,"message":"Server is running"}`

2. **API Test**: Visit `https://your-backend-url.com/api/v1/events`
   - Should return events data or empty array

3. **Frontend**: Visit your frontend URL
   - Should load without CORS errors
   - Events should display (if any exist in database)
