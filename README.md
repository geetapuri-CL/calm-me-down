# Calm Me Down 🎵💚

A personalized wellness app that generates therapeutic lyrics based on your mood and health data from Fitbit.

## 🌟 Features

- **Mood Assessment**: Select your current mood and desired emotional state
- **Health Integration**: Connects with Fitbit API to gather heart rate and activity data
- **AI-Powered Lyrics**: Generates personalized therapeutic lyrics using Perplexity AI
- **Seamless Experience**: 4-step guided process from mood input to personalized content

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android emulator
- Fitbit Developer Account
- Supabase Account (PostgreSQL backend)
- for IOS -> npx expo prebuild

### Installation

1. **Clone the repository**
git clone https://github.com/YOUR_GITHUB_USERNAME/calm-me-down.git
cd calm-me-down

2. **Install dependencies**
npm install

3. **Set up environment variables**
   Create local env file
   cp .env.example .env.local
   Add your API keys:
   FITBIT_CLIENT_ID=your_fitbit_client_id
   FITBIT_CLIENT_SECRET=your_fitbit_client_secret
   PERPLEXITY_API_KEY=your_perplexity_api_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

4. **Start the development server**
npx expo start -c

5. **Run on Device**
Scan QR code (expo go) / npm run ios / npm run android 

6. ## 📱 App Flow

1. **User Input**: Enter name, age, current mood, and desired mood
2. **Fitbit Authorization**: Connect and authorize Fitbit access (if not already done)
3. **Health Data Collection**: Fetch heart rate and activity data
4. **Personalized Generation**: AI creates personalized therapeutic lyrics / song based on your data
5. **Live Polling**: While music plays, HR and steps are automatically recorded and saved every 10s with timestamps for analytics
6. **Feedback**: When a session ends, users can rate the song's effect, linking feedback to their physiological data7
7. **Personal Analytics**: View graphs and stats in the dedicated analytics tab, plotting HR/steps against music and mood shifts

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Expo AuthSession (OAuth2 PKCE)
- **APIs**: Fitbit Web API, Perplexity AI API SONAR
- **Storage**: AsyncStorage for token management
- **Navigation**: Expo Router (if applicable)
- **Backend**: Supabase (PostgreSQL) — for session, HR, steps, feedback, and lyrics storage
- **Charts/Analytics**: react-native-gifted-charts 

## 📂 Project Structure
cmd/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Home tab
│   │   ├── explore.tsx         # Explore tab
│   │   ├── analytics.tsx       # Platform Analytics tab
│   │   └── cmd-effect.tsx      # Personal Analytics tab
│   └── ...
├── components/
│   ├── FitbitAuth.tsx
│   ├── UserPrompts.tsx
│   ├── HeartRateTable.tsx
│   └── ... (UI, analytics, etc.)
├── assets/                     # Images, fonts, etc.
├── lib/
│   ├── supabase.ts             # Supabase client & DBService
├── .env.example                # Environment variables template
└── README.md

- **Main files so far** 

🗄️ Database Model (Supabase)
- health_sessions: user, mood/context, initial HR and steps, session date

- rolling_heart_rate: all polled HR values per session (timestamped)

- rolling_steps: all polled Steps per session (timestamped)

- therapy_responses: lyrics, feedback, AI output per session

## 🔧 Configuration

### Fitbit API Setup

1. Create a Fitbit app at [dev.fitbit.com](https://dev.fitbit.com)
2. Set application type to "Client"
3. Configure OAuth 2.0 settings with your redirect URI
4. Add your client ID and secret to `.env.local`
5. Grant required scopes (heartrate, activity, profile, etc.)

Supabase Setup
1. Create a project at supabase.com
2. Set up tables with your provided schema
3. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local

### Required Scopes

The app requests these Fitbit permissions:
- `heartrate` - Heart rate data
- `activity` - Steps and activity data  
- `profile` - Basic profile information
- `sleep` - Sleep data
- `weight` - Weight data
- `nutrition` - Nutrition data
- `settings` - User settings

📊 Analytics Tab
- Dedicated tabs for both platform-wide and personal analytics

- Graphs show HR and steps changes over the course of music sessions

- Analyze the effect of personalized music on user’s health metrics over time

## 🙏 Acknowledgments

- Fitbit Web API for health data integration
- Perplexity AI for natural language generation
- Expo team for the amazing development platform
- Supabase for backend session/biometric/feedback storage

Made with ❤️ for mental wellness and music therapy