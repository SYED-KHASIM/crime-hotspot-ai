# CrimeHotspotAI — India Edition 🇮🇳

ML-powered Crime Hotspot Prediction system for **Indian police districts**.  
Built with Flask · Scikit-learn · Leaflet.js · SQLite · Chart.js

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python train_model.py       # generates India dataset + trains model (~1 min)
python app.py               # starts API on http://localhost:5000
```

### 2. Frontend
Open any of these files directly in your browser (no build step needed):
- `frontend/index.html`      — Main prediction + heatmap page
- `frontend/login.html`      — Login page
- `frontend/register.html`   — Registration page
- `frontend/dashboard.html`  — Analytics dashboard

---

## 🗺️ India Districts Covered (25)

| ID | District | State |
|----|----------|-------|
| 1 | Mumbai | Maharashtra |
| 2 | New Delhi | Delhi |
| 3 | Bengaluru | Karnataka |
| 4 | Hyderabad | Telangana |
| 5 | Chennai | Tamil Nadu |
| 6 | Kolkata | West Bengal |
| 7 | Ahmedabad | Gujarat |
| 8 | Pune | Maharashtra |
| 9 | Lucknow | Uttar Pradesh |
| 10 | Patna | Bihar |
| 11 | Nagpur | Maharashtra |
| 12 | Goa (Panaji) | Goa |
| 13 | Jaipur | Rajasthan |
| 14 | Chandigarh | Chandigarh |
| 15 | Agra | Uttar Pradesh |
| 16 | Indore | Madhya Pradesh |
| 17 | Raipur | Chhattisgarh |
| 18 | Bhubaneswar | Odisha |
| 19 | Thiruvananthapuram | Kerala |
| 20 | Coimbatore | Tamil Nadu |
| 21 | Varanasi | Uttar Pradesh |
| 22 | Bhopal | Madhya Pradesh |
| 23 | Shimla | Himachal Pradesh |
| 24 | Srinagar | Jammu & Kashmir |
| 25 | Puducherry | Puducherry |

---

## 🔹 Features

### ✅ India-Based Dataset & Model
- 50,000 synthetic crime records based on Indian city patterns
- District IDs 1–25 mapped to real Indian districts
- Festive season crime peaks (Diwali Oct/Nov, Holi Mar, Summer Jun–Aug)

### ✅ India Map (Leaflet.js)
- Map centered on India (lat 20.59, lng 78.96)
- All 25 district markers with correct Indian coordinates
- Heatmap overlay reflecting India geography
- Popup shows district name + state + risk details

### ✅ State → District Selection
- Prediction form: select State first, then District populates
- District dropdown shows real names (Mumbai, Delhi, etc.)
- Internally sends district ID 1–25 to backend (API unchanged)

### ✅ Authentication System
- `POST /auth/register` — username, email, password (hashed SHA-256)
- `POST /auth/login`    — returns session token
- `POST /auth/logout`   — invalidates token
- `GET  /auth/me`       — get current user
- SQLite storage (`backend/users.db`)
- Session token passed via `X-Session-Token` header

### ✅ High Risk Alert
- Red pulsing banner shown when prediction = **High**
- Message: "🚨 High Crime Risk Detected! Increase patrol immediately."

### ✅ Analytics Dashboard (`dashboard.html`)
- Powered by Chart.js (CDN, no install needed)
- 5 charts: Monthly trend, Risk distribution donut, Hourly bar, Top districts, Day-of-week radar
- KPI cards: total records, High/Medium/Low counts
- Data from `GET /analytics` endpoint

### ✅ All Original Features Preserved
- Prediction API (`/predict`, `/batch_predict`, `/history`, `/districts`)
- Model metrics display
- Map filters (All / High / Medium / Low)
- Hour slider + month selector on map
- Prediction history (last 50)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status + model metrics |
| POST | `/predict` | Predict risk for district/month/hour |
| GET | `/history` | Last 50 predictions |
| GET | `/districts` | All 25 districts with coords + names |
| POST | `/batch_predict` | Predict for multiple inputs |
| GET | `/analytics` | Aggregated chart data for dashboard |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, receive session token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user info |

---

## 🛠️ Tech Stack
- **Backend:** Python 3.10+, Flask 3.x, Scikit-learn, Pandas, NumPy, SQLite
- **Frontend:** Vanilla JS, Leaflet.js 1.9.4, Chart.js 4.4, CSS Variables
- **Model:** GradientBoostingClassifier — 83.4% accuracy
