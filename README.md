# 🧺 SVCET CampusWash — Smart Hostel Laundry Management System

[![React Native](https://img.shields.io/badge/React%20Native-v0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev/)
[![PHP MySQL](https://img.shields.io/badge/Backend-PHP%20%7C%20MySQL-777BB4?logo=php&logoColor=white)](https://php.net)
[![Google Play Ready](https://img.shields.io/badge/Play%20Store-Compliant-34A853?logo=googleplay&logoColor=white)](https://play.google.com)

A modern, full-stack smart laundry management system for college hostels. Built with **React Native (Expo)** on the frontend and a **RESTful PHP & MySQL Cloud Backend** on GoDaddy cPanel.

---

## 🌟 Key Features

### 🎓 Student Portal:
- **Instant Slot Booking**: Select clothes across categories with unlimited items and live item counter.
- **Smart Photo Intake Verification**: Multi-photo camera/gallery upload with instant client-side canvas thumbnail compression (<30 KB per photo).
- **Live Order Tracking**: Real-time status tracker (*Drop-off Scheduled $\rightarrow$ In Wash $\rightarrow$ Drying & Ironing $\rightarrow$ Ready for Pickup*).
- **Pickup Pass & Digital Tokens**: Generated `#LND-XXXX` token pass for quick counter collection.
- **Wash History**: Complete log of all past laundry orders and piece breakdowns.
- **Curated Squircle UI**: Modern organic curved cards (`borderRadius: 38`), fresh pastel tones, live campus weather, and functional side navigation drawer.

### 👑 Staff & Admin Portal:
- **⚡ Instant Single-Click Bulk Approvals**: Review pending student requests with photos and approve all in parallel with one tap.
- **Intake Checklist**: Verify clothes item by item during student bag drop-off.
- **College Year-Wise Breakdown**: Detailed statistics for 1st, 2nd, 3rd, and 4th-year student loads.
- **📥 Excel/CSV Report Export**: Download complete student registers, room numbers, and item breakdowns.

### 🛡️ Production & Security Hardening:
- **Tiered Rate Limiting**: Exponential backoff (30s, 60s, 300s, 900s) on authentication routes + HTTP 429 response.
- **Strict Schema Validation**: Whitelist enums, RFC 5322 email regex, and phone format checks with HTTP 422 rejections.
- **Safe File Uploads**: Image MIME validation, non-executable storage, and strict payload caps.
- **Google Play Compliance**: Built-in Privacy Policy, Data Safety disclosures, and Account Deletion workflow.

---

## 🚀 Getting Started

### Prerequisites:
- Node.js $\ge 18$
- Expo CLI (`npx expo`)
- Expo Go App (iOS / Android) or modern web browser

### Installation:
```bash
# Clone the repository
git clone https://github.com/yatish2026/SVCET-LAUNDRY.git
cd SVCET-LAUNDRY

# Install dependencies
npm install

# Start development server
npx expo start -c --lan --web
```

---

## 📂 Project Structure

```text
├── src/
│   ├── assets/              # College crest and visual assets
│   ├── backend/             # Production PHP REST API & db connector
│   ├── components/          # Reusable UI (SideMenu, PhotoUploader, Modals)
│   ├── config/              # Cloud API endpoints configuration
│   ├── constants/           # Categories, schedules, theme tokens
│   ├── context/             # AuthContext & LaundryContext providers
│   ├── screens/
│   │   ├── admin/           # Staff dashboard, approvals, checklist, reports
│   │   ├── auth/            # Sign in & student registration
│   │   ├── common/          # Privacy Policy & terms
│   │   └── student/         # Student home, booking, history, profile
│   └── services/            # Axios/Fetch API service client
├── App.js                   # Main application entry point
├── app.json                 # Expo & Play Store configuration
└── package.json             # Project dependencies
```

---

## 📜 License
This project is developed for **Sri Venkateswara College of Engineering and Technology (SVCET)**.
