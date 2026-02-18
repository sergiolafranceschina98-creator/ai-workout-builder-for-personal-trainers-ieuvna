
# AI Workout Builder for Personal Trainers

A fully local, offline-first mobile app for personal trainers to create and manage personalized workout programs for their clients.

## Features

- **Client Management**: Add, edit, and track multiple clients with detailed profiles
- **Program Generation**: Create structured workout programs with periodization
- **Local Storage**: All data stored locally using AsyncStorage - no backend required
- **Cross-Platform**: Works on both iPhone and iPad with optimized layouts
- **Dark Mode**: Full support for light and dark themes
- **Offline-First**: Works completely offline with no internet connection required

## Client Profile Information

- Name, age, gender
- Height and weight
- Training experience level (Beginner/Intermediate/Advanced)
- Fitness goals (Fat Loss, Muscle Growth, Strength, Rehabilitation, Sport Performance)
- Training frequency (2-6 days per week)
- Available equipment (Commercial Gym, Home Gym, Dumbbells Only, Bodyweight)
- Session duration (45/60/90 minutes)
- Injuries and limitations

## Program Structure

- Customizable training splits (Push/Pull/Legs, Upper/Lower, Full Body, etc.)
- 4-12 week periodized programs
- Progressive overload built-in
- Detailed exercise prescriptions with sets, reps, rest periods, and tempo
- Phase-based training (Hypertrophy, Strength, etc.)

## Technical Stack

- **Framework**: React Native with Expo 54
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage for local data persistence
- **UI**: Native iOS tabs on iOS, custom floating tab bar on Android
- **Styling**: React Native StyleSheet with theme support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the app in Expo Go or build for production

## Building for Production

### iOS (App Store)

1. Configure your bundle identifier in `app.json`
2. Set up your Apple Developer account
3. Build with EAS:
   ```bash
   eas build --platform ios
   ```

### Android (Google Play)

1. Configure your package name in `app.json`
2. Build with EAS:
   ```bash
   eas build --platform android
   ```

## Data Storage

All data is stored locally on the device using AsyncStorage:

- **Clients**: `@aiworkout_clients`
- **Programs**: `@aiworkout_programs`
- **Sessions**: `@aiworkout_sessions`
- **Nutrition Plans**: `@aiworkout_nutrition`
- **Readiness Scores**: `@aiworkout_readiness`

## App Store Requirements

- ✅ No authentication required
- ✅ No backend dependencies
- ✅ Works offline
- ✅ iPad support enabled
- ✅ Privacy policy and terms of service included
- ✅ Proper app icons and splash screens
- ✅ ITSAppUsesNonExemptEncryption set to false

## License

Proprietary - All rights reserved
