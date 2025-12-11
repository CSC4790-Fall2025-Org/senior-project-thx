# Thx! – A Student-to-Student Service Marketplace

## 📖 Introduction
**Thx!** is a mobile app where students can list, discover, and book services offered by their peers on campus including haircuts, nail appointments, tailoring, tutoring, and more.  

Many students have unique skills and side hustles, but there’s no central place for others to find them. Thx! solves this by providing a trusted peer-to-peer marketplace that supports student entrepreneurship while making it easier for clients to connect with the right service.

## 🎯 Purpose
- Create a **central hub** for student-run services.  
- Help students **reach a wider audience** for their side hustles.  
- Make it simple for clients to **search, filter, and book services**.  
- Encourage a supportive **student-to-student economy** on campus.  

## ✨ Key Features
- 📝 **Service Listings** – Students can create and manage service profiles.  
- 🔎 **Search & Filtering** – Browse by service category.
- 📅 **Booking System** – Built-in scheduling for smooth appointments.  
- 👤 **User Profiles** – Manage activity as a service provider or client.  
- 🤝 **Peer Marketplace** – Campus-first, designed for trust and accessibility.  

## 🛠 Tech Stack

- **Frontend**: React Native
- **Backend**: Django (Python)
- **Databse**: PostgreSQL (Neon)


## 🚀 Getting Started

### 1. 📦 Clone the Repo

```bash
git clone https://github.com/CSC4790-Fall2025-Org/senior-project-thx.git
cd senior-project-thx
```

---

### 2. 🔧 Configure API Base URL
Before running the mobile app, every developer must update the IP address in `react-native-app/src/config.js`.

```bash
export const API_BASE = "http://YOUR_LOCAL_IP:8000/api";
```

Find your machine’s local IP address: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows - IPv4 address).

---

### 3. 🔧 Configure Django Settings
Before running the mobile app, every developer must add their own .env file to the `thx-django` directory.

Use `.env.example` as a template by copying the file:
```bash
cd thx-django
cp ./.env.example ./.env
```

Assuming you already have PostgreSQL18 installed, replace the placeholders for these values with the settings for your local Postgres database:
```bash
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://your_db
```

---

### 4. 🛠 Install Required Packages

```bash
pip install django-environ
pip install django-cors-headers
pip install djangorestframework-simplejwt
pip install psycopg2-binary
```

```bash
cd ../react-native-app
npm install
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-dropdown-picker
npm install react-native-modal

npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler
npx expo install expo-router
npx expo install @expo/vector-icons
npx expo install expo-linear-gradient
npx expo install @react-native-picker/picker
npx expo install expo-clipboard
npx expo install @react-native-async-storage/async-storage
```

---

### 5. ▶️ Run the App
Run in `thx-django`:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Run in `react-native-app`:
```bash
npx expo start
```

This will open the app in Expo DevTools — from there you can run it on iOS Simulator, Android Emulator, or a real device via QR code.

---

## 👥 Authors

Abigail Loyson 

Allyssa Panganiban

Mya Dang  

Rachel Phan   

**Villanova University**
