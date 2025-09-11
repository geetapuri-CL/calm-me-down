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

4. **Start the development server**
npx expo start -c

5. **Run on Device**
Scan QR code (expo go) / npm run ios / npm run android

6. ## 📱 App Flow

1. **User Input**: Enter name, age, current mood, and desired mood
2. **Fitbit Authorization**: Connect and authorize Fitbit access (if not already done)
3. **Health Data Collection**: Fetch heart rate and activity data
4. **Lyrics Generation**: AI creates personalized therapeutic lyrics based on your data
5. **TODO**: AI generates song
6. **TODO**: Reassess health stats

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Expo AuthSession (OAuth2 PKCE)
- **APIs**: Fitbit Web API, Perplexity AI API SONAR
- **Storage**: AsyncStorage for token management
- **Navigation**: Expo Router (if applicable)
- **Backend**: TODO

## 📂 Project Structure
cmd/
├── app/
│ └── index.tsx # Main HomeScreen component
├── components/
│ ├── FitbitAuth.tsx # Fitbit OAuth implementation
│ ├── UserPrompts.tsx # User input form
│ └── HeartRateTable.tsx # Health data display
├── assets/ # Images, fonts, etc.
├── .env.example # Environment variables template
└── README.md

- **Main files so far** 

## 🔧 Configuration

### Fitbit API Setup

1. Create a Fitbit app at [dev.fitbit.com](https://dev.fitbit.com)
2. Set application type to "Client"
3. Configure OAuth 2.0 settings with your redirect URI
4. Add your client ID and secret to `.env.local`

### Required Scopes

The app requests these Fitbit permissions:
- `heartrate` - Heart rate data
- `activity` - Steps and activity data  
- `profile` - Basic profile information
- `sleep` - Sleep data
- `weight` - Weight data
- `nutrition` - Nutrition data
- `settings` - User settings

## 🙏 Acknowledgments

- Fitbit Web API for health data integration
- Perplexity AI for natural language generation
- Expo team for the amazing development platform

Made with ❤️ for mental wellness and music therapy