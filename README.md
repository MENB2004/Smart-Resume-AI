# SmartResume-AI 🚀

SmartResume-AI is an intelligent, cross-platform mobile application designed to help users build perfectly formatted, ATS-compliant resumes. Powered by React Native and Google Gemini AI, it not only generates a premium PDF resume but also provides real-time ATS scoring and job description matching to maximize your hiring potential.

## ✨ Features

- **Dynamic Theme Engine:** A gorgeous UI with full support for Light Mode and a True Black (OLED-friendly) Dark Mode, accented with a premium Indigo gradient palette.
- **Tailored Workflows:** Choose between **Fresher** (prioritizes Education & Projects) or **Experienced** (prioritizes Work History) profiles to tailor the form logic.
- **ATS-Optimized PDF Export:** Generates a strictly ordered, highly readable PDF using a clean serif font (Times New Roman) and intelligent nested bullet points that pass Applicant Tracking Systems with flying colors.
- **AI-Powered Analysis:** Leverages Google Gemini AI to analyze your resume, calculate an overall ATS score, highlight missing industry keywords, and provide actionable improvement suggestions.
- **Job Description Matcher:** Paste a specific job description to see how well your current resume aligns and get tailored feedback.
- **Pull-to-Refresh:** Seamlessly refresh your dashboard and AI analysis with native pull-to-refresh gestures.

## 🛠 Tech Stack

- **Frontend:** React Native, Expo, React Navigation, Expo Linear Gradient
- **State/Forms:** React Context API, React Hook Form, Zod
- **Backend/Auth:** Supabase, AsyncStorage (for local persistence)
- **AI Integration:** Google Gemini API
- **Charts:** React Native Chart Kit

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SmartResume-AI.git
   cd SmartResume-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root of your project and add your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Note: If you run into Metro bundler caching issues on Windows, you can temporarily hardcode these in `src/services/supabase.ts`)*

4. **Start the app**
   ```bash
   npx expo start -c
   ```
   Use the Expo Go app on your phone to scan the QR code, or press `a` to run on an Android emulator / `i` for iOS simulator.

## 🎨 Design System

The app utilizes a custom `ThemeContext` that manages a design system built around readability and modern aesthetics.
- **Primary Accent:** Indigo (`#4F46E5` / `#6366F1`)
- **Dark Mode:** True Black (`#000000`) backgrounds with elevated cards (`#121212`)
- **Light Mode:** Crisp White (`#F8FAFC`) with subtle glassmorphism effects.

## 📄 License

This project is licensed under the MIT License.
