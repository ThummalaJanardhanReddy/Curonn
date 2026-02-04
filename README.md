# Curronn - Enterprise Health App

This React Native application implements a complete health journey flow using React Native Paper UI components with enterprise-grade folder structure.

## 🏗️ Project Structure

```
app/
├── features/
│   ├── registration/          # Registration flow screens
│   │   ├── welcome.tsx
│   │   ├── terms.tsx
│   │   ├── verify-details.tsx
│   │   └── otp-verify.tsx
│   ├── personalization/       # Personalization flow screens
│   │   ├── username.tsx
│   │   └── index.tsx
│   └── dashboard/             # Dashboard and main app screens
│       └── dashboard.tsx
├── shared/
│   ├── components/            # Reusable UI components
│   │   └── SplashScreen.tsx
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript type definitions
├── landing.tsx                # Main app with bottom tabs
├── _layout.tsx                # App layout and navigation
└── index.tsx                  # Entry point
```

## 🚀 Features

### 1. Registration Flow
- **Splash Screen** - Company branding with loading animation
- **Welcome Screen** - Company details and introduction
- **Terms & Conditions** - Scrollable terms with continue button enabled only after scrolling to bottom
- **Verify Details** - Employee ID and working email input with validation
- **OTP Verification** - 4-digit OTP input with auto-focus and resend functionality

### 2. Personalization Flow
- **Username Screen** - Get user's preferred name with personalization message
- **Personalization Steps** - 5-step stepper with dynamic content:
  1. **Gender Selection** - Radio buttons for gender identity
  2. **Age Input** - Numeric age input with validation
  3. **Height Input** - Toggle between feet/inches and centimeters
  4. **Weight Input** - Toggle between kilograms and pounds
  5. **Medical Conditions** - Multi-selection chips for health awareness

### 3. Main App (Landing Page)
- **5 Bottom Tabs**:
  - 🏠 **Home** - Welcome and quick actions
  - 🛒 **Orders** - Health order management
  - 👤 **Profile** - Personal information display
  - 🔔 **Notifications** - App notifications
  - ⚙️ **Settings** - App configuration and logout

## 🔄 Navigation Flow

```
Splash → Welcome → Terms → Verify Details → OTP → Username → Personalization → Landing
  ↑                                                                                    ↓
  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## 🛠️ Technical Implementation

- **UI Library**: React Native Paper with Material Design 3
- **Navigation**: Expo Router with file-based routing
- **State Management**: React hooks (useState, useEffect, useRef)
- **Form Validation**: Real-time validation with error messages
- **Responsive Design**: Keyboard avoiding views and proper scrolling
- **Enterprise Structure**: Feature-based folder organization
- **Type Safety**: Full TypeScript implementation

## 📱 Screen Details

### Registration Flow
- **Splash**: 3-second auto-navigation with company branding
- **Welcome**: Company introduction with features and continue button
- **Terms**: Scroll detection enables continue button only after reading
- **Verify Details**: Employee ID + company email validation
- **OTP**: 4-digit verification with demo code `1234`

### Personalization Flow
- **Username**: Name input with validation (2-20 characters)
- **Stepper**: Visual progress indicator with 5 steps
- **Dynamic Content**: Each step shows different form fields
- **Unit Toggles**: Height (ft/cm) and Weight (kg/lb) conversions
- **Multi-Selection**: Medical conditions with chip-based selection

### Main App
- **Bottom Navigation**: 5 tabs with icons and labels
- **Tab Content**: Each tab has unique content and functionality
- **Logout**: Returns to splash screen for new session

## �� Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
```bash
   npm run android
   # or
   npm run ios
   ```

## 🧪 Demo Credentials

- **Demo OTP**: `1234`
- **Email Format**: `user@curronn.com`
- **Employee ID**: Minimum 3 characters
- **Username**: 2-20 characters

## 🔮 Next Steps

The complete user journey is now implemented. Future enhancements include:
- **Order Flow**: Health product ordering and management
- **Data Persistence**: AsyncStorage or database integration
- **Authentication**: JWT tokens and secure sessions
- **API Integration**: Backend service connections
- **Push Notifications**: Real-time updates
- **Analytics**: User behavior tracking

## 📚 Dependencies

- **Core**: expo, react-native, react
- **UI**: react-native-paper, react-native-vector-icons
- **Navigation**: expo-router
- **Development**: typescript, eslint

## 🏢 Enterprise Features

- **Scalable Architecture**: Feature-based organization
- **Reusable Components**: Shared component library
- **Type Safety**: Full TypeScript coverage
- **Consistent UI**: Material Design 3 compliance
- **Navigation Flow**: Intuitive user experience
- **Form Validation**: Robust input handling
- **Responsive Design**: Cross-device compatibility
