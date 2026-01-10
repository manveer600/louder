# LOUDER - Live Events & Ticketing Platform

A production-ready full-stack web application for listing and managing live events in Sydney, Australia. Built with Node.js, Express.js, MongoDB, React, and Tailwind CSS.

## 🎯 Features

- **Event Scraping**: Automatically scrapes events from multiple sources (Eventbrite, Meetup)
- **Auto-Update**: Scheduled scraping every 6-12 hours to keep events up-to-date
- **Event Listing**: Beautiful, responsive event listing with filters (category, date range)
- **Email Capture**: Modal-based email capture with consent management for GET TICKETS flow
- **Analytics**: Email and event statistics for marketing and analytics
- **Duplicate Prevention**: Smart duplicate detection using URL hash and event metadata
- **MVC Architecture**: Clean, scalable backend architecture with proper separation of concerns

## 🏗️ Architecture

### Backend Structure
```
backend/
├── server.js              # Server entry point
├── app.js                 # Express app configuration
├── config/
│   ├── db.js             # MongoDB connection
│   └── env.js            # Environment variables
├── routes/
│   ├── event.routes.js   # Event API routes
│   └── user.routes.js    # User/Email API routes
├── controllers/
│   ├── event.controller.js
│   └── user.controller.js
├── services/
│   ├── scraping/
│   │   ├── eventbrite.service.js
│   │   ├── meetup.service.js
│   │   ├── genericScraper.service.js
│   │   └── orchestrator.service.js
│   ├── email.service.js
│   └── scheduler.service.js
├── models/
│   ├── Event.model.js
│   └── User.model.js
├── middlewares/
│   ├── error.middleware.js
│   └── validation.middleware.js
├── utils/
│   ├── logger.js
│   └── constants.js
└── cron/
    └── scrapeEvents.cron.js
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.js
│   ├── index.js
│   ├── index.css
│   ├── services/
│   │   └── api.js
│   └── components/
│       ├── EventListing.js
│       ├── EventCard.js
│       ├── EmailModal.js
│       ├── FilterBar.js
│       ├── LoadingSpinner.js
│       └── ErrorMessage.js
├── public/
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://singhmanveer645:waheguru@cluster0.uk9srd7.mongodb.net/louder
   FRONTEND_URL=http://localhost:3000
   API_VERSION=v1
   SCRAPING_INTERVAL_HOURS=6
   LOG_LEVEL=info
   ```

5. **Start the server**:
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

6. **Manually trigger scraping** (optional):
   ```bash
   npm run scrape
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
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

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📡 API Endpoints

### Events

- `GET /api/v1/events` - Get all events with filters
  - Query params: `category`, `dateFrom`, `dateTo`, `upcomingOnly`, `page`, `limit`, `sortBy`, `sortOrder`
  
- `GET /api/v1/events/:id` - Get single event by ID

- `GET /api/v1/events/categories` - Get available categories with counts

- `GET /api/v1/events/stats` - Get event statistics

- `POST /api/v1/events/scrape` - Trigger manual scraping (admin)

### Users/Emails

- `POST /api/v1/users/email` - Save email for event ticket request
  - Body: `{ email, eventId, consentGiven }`

- `GET /api/v1/users/stats` - Get email statistics (admin)

### Health Check

- `GET /health` - Server health check

## 🔄 Scraping System

### Automatic Scraping

The application uses `node-cron` to automatically scrape events every 6 hours (configurable via `SCRAPING_INTERVAL_HOURS`).

### Manual Scraping

Trigger scraping manually via:
- API endpoint: `POST /api/v1/events/scrape`
- CLI command: `npm run scrape`

### Scraping Sources

Currently supports:
- **Eventbrite**: Events from Eventbrite Sydney listings
- **Meetup**: Events from Meetup Sydney groups

### Adding New Sources

1. Create a new service in `backend/services/scraping/`
2. Extend `GenericScraperService`
3. Implement `scrapeEvents()` method
4. Add to `ScrapingOrchestratorService`

## 📊 Data Models

### Event Model
```javascript
{
  title: String (required),
  description: String,
  date: Date (required),
  time: String,
  venue: String (required),
  city: String (default: 'Sydney'),
  category: String (required, enum),
  imageUrl: String,
  sourceWebsite: String (required, enum),
  originalEventUrl: String (required, unique),
  urlHash: String (unique, indexed),
  duplicateCheckHash: String (indexed),
  lastUpdated: Date,
  createdAt: Date
}
```

### User Model
```javascript
{
  email: String (required, indexed),
  eventId: ObjectId (required, ref: Event),
  eventTitle: String (required),
  eventUrl: String (required),
  consentGiven: Boolean (required),
  source: String (enum),
  ipAddress: String,
  userAgent: String,
  metadata: Object,
  createdAt: Date
}
```

## 🎨 Frontend Features

- **Event Grid**: Responsive grid layout showing event cards
- **Filters**: Filter by category, date range, and upcoming events
- **Email Modal**: Beautiful modal for email capture on GET TICKETS
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: User-friendly error messages and retry functionality
- **Loading States**: Loading spinners and skeleton screens

## 🔒 Security Considerations

- Input validation on all API endpoints
- Email format validation
- MongoDB injection prevention (Mongoose)
- CORS configuration
- Environment variable protection
- Error handling without exposing sensitive data

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS
- `API_VERSION` - API version (default: v1)
- `SCRAPING_INTERVAL_HOURS` - Scraping interval (default: 6)
- `LOG_LEVEL` - Logging level (info/warn/error/debug)

### Frontend (.env)
- `REACT_APP_API_BASE_URL` - Backend API base URL

## 🚀 Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Ensure MongoDB Atlas connection is configured
3. Set `NODE_ENV=production`
4. Start server: `npm start`

### Frontend Deployment

1. Build the app: `npm run build`
2. Deploy the `build/` folder to your hosting platform
3. Set `REACT_APP_API_BASE_URL` to production API URL

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB Atlas connection string
- Check network access in MongoDB Atlas (allow your IP)
- Verify database user credentials

### Scraping Issues
- Check internet connectivity
- Verify target websites are accessible
- Check logs for specific error messages
- Some websites may block automated requests (consider using proxies or rotating user agents)

### CORS Issues
- Verify `FRONTEND_URL` matches your frontend URL
- Check CORS configuration in `app.js`

## 📈 Future Enhancements

- AI-powered event recommendations
- Seat maps integration
- Real-time ticket pricing
- User authentication and profiles
- Event favorites and wishlists
- Email notifications for saved events
- Social sharing features
- Advanced analytics dashboard

## 📄 License

ISC

## 👥 Author

Louder - Live Events & Ticketing Platform

---

**Note**: This is a production-ready codebase built for Louder entertainment company. Follow best practices for deployment and scaling.

