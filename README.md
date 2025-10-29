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

- **Frontend**: React Native and Expo
- **Backend**: Django (Python)

## 🚀 Getting Started

### 📦 Clone the Repo

```bash
git clone https://github.com/CSC4790-Fall2025-Org/senior-project-thx.git
cd senior-project-thx
```
---

### 🔧 Backend Setup (Django)
#### Navigate to the backend folder

```bash
cd thx-django
```
#### Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate      # on macOS / Linux
venv\Scripts\activate         # on Windows
```
#### Install backend dependencies

```bash
pip install django djangorestframework pillow
```
#### Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```
#### Start the backend server

```bash
python manage.py runserver 0.0.0.0:8000
```
#### Verify the Backend API
In your browser, go to (replace with your actual local IP):
```bash
http://<your_ip>:8000/api/profile/me/
```
If you see JSON data with a demo user, your backend is running correctly.

---
### 📱 Frontend Setup (React Native + Expo)
#### Navigate to the frontend folder
```bash
cd react-native-app
```

#### Install dependencies
```bash
npm install
```

#### Install Required Expo Packages
```bash
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-calendars
npm install @react-native-community/datetimepicker
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install @react-native-picker/picker
npm install react-native-dropdown-picker


npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler
npx expo install expo-router
npx expo install expo-image-picker
npx expo install expo-linear-gradient
```

#### Set up the backend API connection
In your React Native app’s `src/config.js`, update the base URL to your machine’s IP address:
```bash
export const API_BASE = "http://10.138.1.179:8000/api";
```

How to find your IP address:

Mac: `ipconfig getifaddr en0`

Windows: `ipconfig` → look for IPv4 Address

Linux: `hostname -I`

Use your local IP (not localhost) and ensure your laptop and phone are on the same Wi-Fi network.

#### Run the App
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
