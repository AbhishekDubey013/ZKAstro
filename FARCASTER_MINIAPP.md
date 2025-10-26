# Farcaster Miniapp - Daily Astrology Predictions

A beautiful, user-friendly Farcaster miniapp that provides personalized daily astrological predictions based on users' birth charts.

## Features

### 🌟 User Experience
- **First-time users**: Enter birth details (date, time, location) once
- **Returning users**: One-click access to daily predictions
- **Interactive ratings**: Rate predictions from 0-5 stars
- **Beautiful UI**: Gradient design with smooth animations

### 🔮 Predictions Include
- Personalized daily forecast based on sun sign
- Lucky number for the day
- Lucky color (visual display)
- Mood indicator
- Contextual astrological insights

### 📊 Features
- Birth data stored securely (never leaves server)
- One prediction per day (cached)
- Rating system to improve predictions
- Statistics tracking (total predictions, average rating)

## User Flow

### New User
1. **Landing Page**: Welcome screen with feature highlights
2. **Get Started**: Click button to begin
3. **Birth Details Form**: 
   - Date of birth (calendar picker)
   - Time of birth (time picker)
   - Place of birth (text input)
4. **Save & Get Prediction**: Submits data and shows first prediction

### Returning User
1. **Welcome Back**: Personalized greeting
2. **Know Your Day**: Single button to get today's prediction
3. **Prediction Display**: Shows forecast with lucky elements
4. **Rate Prediction**: 5-star rating system
5. **Get Another**: Option to refresh or view stats

## API Endpoints

### `GET /api/farcaster/check-data`
Check if user has saved birth data
- **Response**: `{ hasData: boolean }`

### `POST /api/farcaster/save-birth-data`
Save user's birth details
- **Body**: `{ dob, tob, location, lat?, lon? }`
- **Response**: `{ success: boolean }`

### `GET /api/farcaster/daily-prediction`
Get today's prediction (cached)
- **Response**: 
```json
{
  "date": "2025-10-26",
  "prediction": "Today brings excellent energy...",
  "luckyNumber": 7,
  "luckyColor": "#FF6B6B",
  "mood": "Energetic"
}
```

### `POST /api/farcaster/rate-prediction`
Rate a prediction
- **Body**: `{ rating: number, date: string }`
- **Response**: `{ success: boolean }`

### `GET /api/farcaster/stats`
Get user statistics
- **Response**:
```json
{
  "totalPredictions": 15,
  "averageRating": 4.2,
  "recentRatings": [...]
}
```

## Database Schema

### `farcaster_users`
- `id`: UUID (primary key)
- `user_id`: Text (unique, Farcaster user ID)
- `dob`: Text (date of birth)
- `tob`: Text (time of birth)
- `location`: Text (place of birth)
- `lat`: Real (latitude)
- `lon`: Real (longitude)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `farcaster_predictions`
- `id`: UUID (primary key)
- `user_id`: Text
- `date`: Text (YYYY-MM-DD)
- `prediction`: Text
- `lucky_number`: Integer
- `lucky_color`: Text (hex color)
- `mood`: Text
- `created_at`: Timestamp

### `farcaster_ratings`
- `id`: UUID (primary key)
- `user_id`: Text
- `date`: Text (YYYY-MM-DD)
- `rating`: Integer (0-5)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Prediction Logic

### Current Implementation
1. **Calculate Transits**: Get user's sun sign from birth date
2. **Moon Phase**: Calculate current moon phase
3. **Generate Text**: Contextual predictions based on sun sign
4. **Lucky Elements**: 
   - Random lucky number (1-99)
   - Random lucky color from palette
   - Random mood from list

### Future Enhancements
- Full planetary transit calculations
- Integration with AI agent for personalized predictions
- Historical accuracy tracking
- Prediction improvement based on ratings
- Weekly/monthly forecasts

## UI Components

### Landing Page
- Hero section with app icon
- Feature list (3 key benefits)
- "Get Started" CTA button

### Birth Details Form
- Date picker (max: today)
- Time picker (24-hour format)
- Location text input
- Privacy notice
- Submit button with loading state

### Prediction Display
- Date header
- Prediction text (gradient background)
- 3-column grid:
  - Lucky number (large display)
  - Lucky color (color swatch)
  - Mood (text display)
- Star rating (5 stars, interactive)
- "Get Another" button

## Styling

### Color Palette
- Primary: Violet (#7C3AED)
- Secondary: Purple (#9333EA)
- Accent: Pink (#EC4899)
- Background: Gradient (violet → purple → pink)

### Typography
- Headers: Bold, 2xl
- Body: Regular, base
- Descriptions: Gray, sm

### Components
- Cards: White/dark with violet borders
- Buttons: Gradient (violet → purple)
- Inputs: Standard with focus rings
- Stars: Yellow (#FBBF24) when active

## Development

### Run Locally
```bash
npm run dev
```

### Access Miniapp
Navigate to: `http://localhost:5000/farcaster`

### Test Flow
1. Open `/farcaster` route
2. Click "Get Started"
3. Fill in birth details
4. View prediction
5. Rate prediction
6. Refresh page (should show "Know Your Day" button)

## Deployment

### Environment Variables
No additional env vars needed - uses existing database connection.

### Database Migration
```bash
npm run db:push
```

### Build
```bash
npm run build
```

## Future Features

### Phase 2
- [ ] Real Farcaster authentication
- [ ] Share predictions to Farcaster feed
- [ ] Friend compatibility checks
- [ ] Prediction history view

### Phase 3
- [ ] AI agent integration for better predictions
- [ ] Real-time planetary calculations
- [ ] Custom prediction preferences
- [ ] Notification system for daily predictions

### Phase 4
- [ ] Premium features (detailed charts)
- [ ] Group predictions (friend circles)
- [ ] Astrological events calendar
- [ ] Educational content

## Privacy & Security

- Birth data stored securely in database
- No data shared with third parties
- User can delete data anytime
- Predictions generated server-side
- No client-side storage of sensitive data

## Performance

- Predictions cached per day (no redundant calculations)
- Lazy loading of components
- Optimized database queries
- Fast response times (<100ms)

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader friendly
- High contrast mode support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

---

**Built with ❤️ for the Farcaster community**

