# 🤝 Helpy AI - Community Help Platform

A modern, AI-powered community help platform where people can give and receive help. Built with React, Firebase, and integrated with Groq AI for smart features.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Cloud-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)

---

## ✨ Features

### 🔐 Authentication & Roles
- **Email/Password Authentication** - Secure login and registration
- **4 User Roles**:
  - 👤 **Need Help** (Seeker) - Can post help requests
  - 🦸 **Can Help** (Helper) - Can view and accept requests
  - 🔄 **Both** - Can do both
  - 👑 **Admin** - Full platform access

### 🤖 AI-Powered Features
- **Smart Request Categorization** - AI automatically suggests categories and urgency
- **Tag Suggestions** - AI recommends relevant tags for requests
- **AI Insights** - Dashboard shows AI-generated insights about community activity
- **Priority Detection** - AI detects urgent requests

### 📝 Help Request System
- **Create Requests** - Post detailed help requests with title, description, category, urgency
- **View Requests** - Browse all community requests with filtering
- **Accept & Help** - Helpers can offer help and get connected
- **Mark Solved** - Requesters can mark requests as completed
- **Ratings & Reviews** - Rate helpers after request completion (1-5 stars)

### 🏆 Leaderboard & Reputation
- **Trust Score** - Starts at 50%, increases with contributions
- **Contributions Count** - Track how many people you've helped
- **Average Rating** - Star rating from requesters
- **Top Helpers Ranking** - Sort by contributions, rating, or trust score

### 📱 Mobile Responsive
- **Fully Responsive Design** - Works on desktop, tablet, and mobile
- **Mobile Menu** - Hamburger menu with slide-in navigation
- **Touch-Friendly** - Optimized touch targets for mobile

### 🔔 Notifications
- **Real-time Notifications** - Get notified when someone helps with your request
- **Rating Notifications** - Get notified when you receive a rating
- **Request Solved** - Helpers get notified when their help solved a request

---

## 📁 Project Structure

```
src/
├── components/
│   ├── cards/           # Reusable card components
│   ├── layout/          # Layout components (Navbar, etc.)
│   ├── modals/          # Modal dialogs (Rating, etc.)
│   └── ui/              # UI components (Avatar, etc.)
├── config/
│   └── firebase.js      # Firebase configuration
├── context/
│   └── AuthContext.jsx  # Authentication context
├── lib/
│   └── groq.js          # Groq AI integration
├── pages/
│   ├── LandingPage.jsx       # Home page
│   ├── AuthPage.jsx          # Login/Register
│   ├── OnboardingPage.jsx    # Role selection & profile setup
│   ├── DashboardPage.jsx     # Main dashboard
│   ├── AdminDashboard.jsx    # Admin panel
│   ├── ExplorePage.jsx       # Browse requests
│   ├── CreateRequestPage.jsx # Post new request
│   ├── RequestDetailPage.jsx # View request details
│   ├── LeaderboardPage.jsx   # Helper rankings
│   ├── AICenterPage.jsx      # AI features
│   ├── ProfilePage.jsx       # User profiles
│   ├── MessagesPage.jsx      # Conversations
│   └── NotificationsPage.jsx # Notifications
├── App.jsx              # Main app with routes
├── main.jsx             # Entry point
└── index.css            # Global styles
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Groq API key (for AI features)

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd helpy-ai-project

# Install dependencies
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app and copy the configuration
4. Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Setup Firebase Services

**Authentication:**
- Go to Build > Authentication
- Enable **Email/Password** provider

**Firestore Database:**
- Go to Build > Firestore Database
- Create database in production mode
- Copy contents of `firestore.rules` to the Rules tab

### 4. Create First Admin

```bash
# Start the dev server
npm run dev

# Register a new account at http://localhost:5173/login
# Then go to Firebase Console > Firestore
# Find your user document and change role to "admin"
```

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 to view the app.

---

## 🛡️ Security Rules

The `firestore.rules` file includes comprehensive security:

- **User Authentication** - Only authenticated users can read/write
- **Role-based Access** - Different permissions per role
- **Data Validation** - Validates required fields on create
- **Owner Protection** - Users can only modify their own data
- **Admin Override** - Admins can access everything

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

---

## 📱 User Flows

### Need Help (Seeker) Flow
1. Register and select "I Need Help" role
2. Complete onboarding with help categories
3. Dashboard shows: My Requests, Community stats
4. Click "New Request" to post a help request
5. Get notifications when helpers offer help
6. Mark request as solved when done
7. Rate the helper who helped you

### Can Help (Helper) Flow
1. Register and select "I Can Help" role
2. Complete onboarding with skills & expertise
3. Dashboard shows: Helped count, Trust Score, Rating
4. Browse "Explore" to see all requests
5. Click "I can help" on requests matching your skills
6. Get notified when requester marks as solved
7. Build reputation and climb the leaderboard

### Both Role Flow
1. Register and select "Both" role
2. Complete both seeker and helper onboarding
3. Access all features: Post requests AND help others
4. Full dashboard with all stats
5. Maximum flexibility in the community

---

## 🎨 Design System

### Colors
- **Primary**: Teal (#0fa588)
- **Background**: Gradient (#daeee6 → #eeeae2 → #f5e2cc)
- **Surface**: White with subtle shadows
- **Text**: Dark (#111816) with secondary (#5a6660)

### Typography
- **Font**: Sora (Google Fonts)
- **Weights**: 300-800

### Components
- **Hero Cards**: Dark background with white text
- **White Cards**: White background with border radius 20px
- **Buttons**: Pill-shaped with hover animations
- **Badges**: Color-coded by urgency/category

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| Firebase Auth | Authentication |
| Firestore | Database |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| Groq AI | AI Features |

---

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if first time)
firebase init hosting

# Deploy
firebase deploy
```

### Deploy to Netlify/Vercel
```bash
# Build the project
npm run build

# Deploy dist/ folder
```

---

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'seeker' | 'helper' | 'both' | 'admin',
  // Seeker fields
  interests: [],
  helpNeeds: [],
  currentChallenges: string,
  requestsCount: number,
  // Helper fields
  skills: [],
  expertise: [],
  availability: string,
  rating: number,
  ratingCount: number,
  helpedCount: number,
  // Common
  trustScore: number,
  contributions: number,
  badges: [],
  location: string,
  bio: string,
  onboardingDone: boolean,
  createdAt: timestamp
}
```

### Requests Collection
```javascript
{
  title: string,
  description: string,
  category: string,
  urgency: 'High' | 'Medium' | 'Low',
  status: 'open' | 'solved' | 'deleted',
  tags: [],
  authorId: string,
  authorName: string,
  authorLocation: string,
  helpers: [{ uid, name, skills, trustScore }],
  helperCount: number,
  ratings: {
    [helperUid]: { rating, feedback, fromUid, fromName, createdAt }
  },
  createdAt: timestamp,
  solvedAt: timestamp
}
```

---

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" in Firestore**
- Check that firestore.rules are deployed
- Verify user is authenticated

**AI features not working**
- Check GROQ_API_KEY in .env
- Verify API key has available credits

**Routes not working**
- Ensure RoleProtectedRoute is set up in App.jsx
- Check user role in Firestore

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 💬 Support

For questions or issues, please open an issue on GitHub.

**Built with ❤️ for the community**
