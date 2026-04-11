"""
app.py — Crime Hotspot Prediction API (India Edition)
======================================================
Flask REST API with:
  - ML prediction endpoints
  - Authentication (register/login/logout) using SQLite + hashed passwords
  - Analytics endpoint for dashboard charts
  - India-based district data

Endpoints
---------
GET  /health              → server status + model metrics
POST /predict             → predict risk level
GET  /history             → last 50 predictions (in-memory)
GET  /districts           → list of districts with coordinates + meta
POST /batch_predict       → predict multiple rows at once
GET  /analytics           → aggregated analytics for dashboard
POST /auth/register       → create new user account
POST /auth/login          → login and get session token
POST /auth/logout         → invalidate session
GET  /auth/me             → get current user info
"""

import json
import os
import logging
import sqlite3
import hashlib
import secrets
from datetime import datetime
from collections import deque

import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, g

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────
app = Flask(__name__)
BASE = os.path.dirname(__file__)

# ─── CORS ────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Session-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
    return response

@app.route("/<path:path>", methods=["OPTIONS"])
@app.route("/", methods=["OPTIONS"])
def options_handler(path=""):
    return jsonify({}), 200

# ─── Load model bundle ────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(BASE, "model.pkl")
try:
    bundle      = joblib.load(MODEL_PATH)
    MODEL       = bundle["model"]
    ENCODER     = bundle["encoder"]
    FEATURES    = bundle["features"]
    METRICS     = bundle["metrics"]
    D_COORDS    = bundle["district_coords"]
    D_META      = bundle.get("district_meta", {})
    log.info("Model loaded. Accuracy: %.2f%%", METRICS["accuracy"])
except FileNotFoundError:
    log.error("model.pkl not found — run train_model.py first!")
    MODEL = ENCODER = FEATURES = METRICS = D_COORDS = D_META = None

# ─── Database setup (SQLite) ──────────────────────────────────────────────────
DB_PATH = os.path.join(BASE, "users.db")

def get_db():
    """Get SQLite connection from Flask's 'g' context."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Create tables if they don't exist."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email    TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created  TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token    TEXT PRIMARY KEY,
                user_id  INTEGER NOT NULL,
                created  TEXT NOT NULL
            )
        """)
        conn.commit()

init_db()

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    """SHA-256 hash with a salt prefix for basic security."""
    salt = "crimehotspot_india_2025"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def get_current_user():
    """Extract user from session token header."""
    token = request.headers.get("X-Session-Token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?",
            (token,)
        ).fetchone()
    return dict(row) if row else None

# ─── In-memory prediction history ─────────────────────────────────────────────
HISTORY: deque = deque(maxlen=50)

# ─── Patrol suggestion config ─────────────────────────────────────────────────
PATROL_CONFIG = {
    "High":   {"patrols": (10, 15), "urgency": "IMMEDIATE",
               "suggestion": "Deploy maximum patrol units immediately. Establish checkpoints and increase surveillance. Coordinate with rapid response teams."},
    "Medium": {"patrols": (5,  9),  "urgency": "ELEVATED",
               "suggestion": "Increase patrol frequency. Assign dedicated officers to the zone. Monitor known hotspot locations actively."},
    "Low":    {"patrols": (1,  4),  "urgency": "STANDARD",
               "suggestion": "Maintain standard patrol coverage. Periodic check-ins every 2-3 hours are sufficient. No special deployment required."},
}

MONTH_NAMES = ["", "January","February","March","April","May","June",
               "July","August","September","October","November","December"]

def patrol_count(risk: str, score: float) -> int:
    lo, hi = PATROL_CONFIG[risk]["patrols"]
    return round(lo + (hi - lo) * score)

def make_prediction(district: int, month: int, hour: int) -> dict:
    """Run model inference and return structured result."""
    day_of_week = 3   # neutral midweek default
    X = np.array([[district, month, hour, day_of_week]])
    proba    = MODEL.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    risk     = ENCODER.inverse_transform([pred_idx])[0]
    conf     = float(proba[pred_idx])

    high_idx   = list(ENCODER.classes_).index("High")
    risk_score = float(proba[high_idx])

    patrols  = patrol_count(risk, risk_score)
    cfg      = PATROL_CONFIG[risk]
    lat, lng = D_COORDS.get(district, (20.5937, 78.9629))  # fallback: India center

    meta = D_META.get(district, {"name": f"District {district}", "state": "Unknown"})

    return {
        "risk_level":      risk,
        "confidence":      round(conf * 100, 1),
        "risk_score":      round(risk_score, 3),
        "patrols_needed":  patrols,
        "urgency":         cfg["urgency"],
        "suggestion":      cfg["suggestion"],
        "district":        district,
        "district_name":   meta["name"],
        "district_state":  meta["state"],
        "month":           MONTH_NAMES[month],
        "hour":            hour,
        "coordinates":     {"lat": lat, "lng": lng},
        "probabilities": {
            cls: round(float(p) * 100, 1)
            for cls, p in zip(ENCODER.classes_, proba)
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    username = (data.get("username") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # Validation
    errors = {}
    if not username or len(username) < 3:
        errors["username"] = "Username must be at least 3 characters"
    if not email or "@" not in email:
        errors["email"] = "Valid email required"
    if not password or len(password) < 6:
        errors["password"] = "Password must be at least 6 characters"
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    hashed = hash_password(password)
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT INTO users (username, email, password, created) VALUES (?, ?, ?, ?)",
                (username, email, hashed, datetime.utcnow().isoformat())
            )
            conn.commit()
        return jsonify({"message": "Account created successfully"}), 201
    except sqlite3.IntegrityError as e:
        field = "username" if "username" in str(e) else "email"
        return jsonify({"error": f"That {field} is already registered"}), 409


@app.route("/auth/login", methods=["POST"])
def login():
    """Login and return a session token."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    hashed = hash_password(password)
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        user = conn.execute(
            "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?",
            (username, username, hashed)
        ).fetchone()

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    # Create session token
    token = secrets.token_hex(32)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created) VALUES (?, ?, ?)",
            (token, user["id"], datetime.utcnow().isoformat())
        )
        conn.commit()

    return jsonify({
        "token":    token,
        "username": user["username"],
        "email":    user["email"],
        "message":  "Login successful"
    })


@app.route("/auth/logout", methods=["POST"])
def logout():
    """Invalidate session token."""
    token = request.headers.get("X-Session-Token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if token:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
    return jsonify({"message": "Logged out successfully"})


@app.route("/auth/me", methods=["GET"])
def me():
    """Get current user info from session token."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"username": user["username"], "email": user["email"]})

# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    if MODEL is None:
        return jsonify({"status": "error", "message": "Model not loaded"}), 503
    return jsonify({"status": "ok", "metrics": METRICS, "model": "GradientBoostingClassifier"})


@app.route("/predict", methods=["POST"])
def predict():
    if MODEL is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    errors = {}
    try:
        district = int(data["district"])
        if not 1 <= district <= 25:
            errors["district"] = "Must be between 1 and 25"
    except (KeyError, ValueError, TypeError):
        errors["district"] = "Required integer 1-25"

    try:
        month = int(data["month"])
        if not 1 <= month <= 12:
            errors["month"] = "Must be between 1 and 12"
    except (KeyError, ValueError, TypeError):
        errors["month"] = "Required integer 1-12"

    try:
        hour = int(data["hour"])
        if not 0 <= hour <= 23:
            errors["hour"] = "Must be between 0 and 23"
    except (KeyError, ValueError, TypeError):
        errors["hour"] = "Required integer 0-23"

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    result = make_prediction(district, month, hour)
    HISTORY.appendleft(result)
    log.info("Predicted %s (%s) → %s", result["district_name"], district, result["risk_level"])
    return jsonify(result)


@app.route("/history", methods=["GET"])
def history():
    return jsonify({"history": list(HISTORY), "count": len(HISTORY)})


@app.route("/districts", methods=["GET"])
def districts():
    if D_COORDS is None:
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify({
        "districts": [
            {
                "id":    did,
                "lat":   lat,
                "lng":   lng,
                "name":  D_META.get(did, {}).get("name", f"District {did}"),
                "state": D_META.get(did, {}).get("state", "Unknown"),
            }
            for did, (lat, lng) in D_COORDS.items()
        ]
    })


@app.route("/batch_predict", methods=["POST"])
def batch_predict():
    if MODEL is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json(silent=True)
    if not data or "inputs" not in data:
        return jsonify({"error": "JSON with 'inputs' array required"}), 400

    results = []
    for item in data["inputs"][:100]:
        try:
            results.append(make_prediction(int(item["district"]), int(item["month"]), int(item["hour"])))
        except Exception as e:
            results.append({"error": str(e)})
    return jsonify({"results": results})


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS ROUTE — for dashboard
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/analytics", methods=["GET"])
def analytics():
    """Generate analytics from the dataset for the dashboard."""
    if MODEL is None:
        return jsonify({"error": "Model not loaded"}), 503

    # Load dataset
    csv_path = os.path.join(BASE, "../dataset/crime_data.csv")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        return jsonify({"error": "Dataset not found"}), 500

    # 1. Risk level distribution
    risk_dist = df["risk_level"].value_counts().to_dict()

    # 2. Monthly crime trends (average risk_score per month)
    monthly = df.groupby("month")["risk_score"].mean().round(3)
    monthly_labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    monthly_data = [float(monthly.get(m, 0)) for m in range(1, 13)]

    # 3. Hour-wise crime analysis (average risk_score per hour)
    hourly = df.groupby("hour")["risk_score"].mean().round(3)
    hourly_data = [float(hourly.get(h, 0)) for h in range(24)]

    # 4. District-wise high crime count
    high_df = df[df["risk_level"] == "High"]
    district_high = high_df["district"].value_counts()
    district_labels = [D_META.get(int(d), {}).get("name", f"D{d}") for d in district_high.index[:10]]
    district_counts = [int(c) for c in district_high.values[:10]]

    # 5. Day-of-week analysis
    dow_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dow = df.groupby("day_of_week")["risk_score"].mean().round(3)
    dow_data = [float(dow.get(d, 0)) for d in range(7)]

    return jsonify({
        "risk_distribution": {
            "High":   int(risk_dist.get("High",   0)),
            "Medium": int(risk_dist.get("Medium", 0)),
            "Low":    int(risk_dist.get("Low",    0)),
        },
        "monthly_trend": {
            "labels": monthly_labels,
            "data":   monthly_data,
        },
        "hourly_trend": {
            "labels": [f"{h:02d}:00" for h in range(24)],
            "data":   hourly_data,
        },
        "district_hotspots": {
            "labels": district_labels,
            "data":   district_counts,
        },
        "day_of_week": {
            "labels": dow_labels,
            "data":   dow_data,
        },
        "total_records": len(df),
    })


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("Starting Crime Hotspot India API on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
