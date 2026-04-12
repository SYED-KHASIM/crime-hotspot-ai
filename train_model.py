"""
train_model.py - India-based Crime Hotspot Prediction Model Training
"""

import json
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib

SEED = 42
np.random.seed(SEED)

NUM_DISTRICTS = 25
N_SAMPLES     = 50_000
DATASET_PATH  = os.path.join(os.path.dirname(__file__), "../dataset/crime_data.csv")
MODEL_PATH    = os.path.join(os.path.dirname(__file__), "model.pkl")
METRICS_PATH  = os.path.join(os.path.dirname(__file__), "model_metrics.json")

# India-based district coordinates
DISTRICT_COORDS = {
    1:  (19.0760, 72.8777),   # Mumbai
    2:  (28.6139, 77.2090),   # New Delhi
    3:  (12.9716, 77.5946),   # Bengaluru
    4:  (17.3850, 78.4867),   # Hyderabad
    5:  (13.0827, 80.2707),   # Chennai
    6:  (22.5726, 88.3639),   # Kolkata
    7:  (23.0225, 72.5714),   # Ahmedabad
    8:  (18.5204, 73.8567),   # Pune
    9:  (26.8467, 80.9462),   # Lucknow
    10: (25.5941, 85.1376),   # Patna
    11: (21.1458, 79.0882),   # Nagpur
    12: (15.2993, 74.1240),   # Goa (Panaji)
    13: (26.9124, 75.7873),   # Jaipur
    14: (30.7333, 76.7794),   # Chandigarh
    15: (27.1767, 78.0081),   # Agra
    16: (22.7196, 75.8577),   # Indore
    17: (21.2514, 81.6296),   # Raipur
    18: (20.2961, 85.8245),   # Bhubaneswar
    19: (8.5241,  76.9366),   # Thiruvananthapuram
    20: (11.0168, 76.9558),   # Coimbatore
    21: (25.3176, 82.9739),   # Varanasi
    22: (23.2599, 77.4126),   # Bhopal
    23: (31.1048, 77.1734),   # Shimla
    24: (34.0837, 74.7973),   # Srinagar
    25: (11.9416, 79.8083),   # Puducherry
}

DISTRICT_META = {
    1:  {"name": "Mumbai",              "state": "Maharashtra"},
    2:  {"name": "New Delhi",           "state": "Delhi"},
    3:  {"name": "Bengaluru",           "state": "Karnataka"},
    4:  {"name": "Hyderabad",           "state": "Telangana"},
    5:  {"name": "Chennai",             "state": "Tamil Nadu"},
    6:  {"name": "Kolkata",             "state": "West Bengal"},
    7:  {"name": "Ahmedabad",           "state": "Gujarat"},
    8:  {"name": "Pune",                "state": "Maharashtra"},
    9:  {"name": "Lucknow",             "state": "Uttar Pradesh"},
    10: {"name": "Patna",               "state": "Bihar"},
    11: {"name": "Nagpur",              "state": "Maharashtra"},
    12: {"name": "Goa (Panaji)",        "state": "Goa"},
    13: {"name": "Jaipur",              "state": "Rajasthan"},
    14: {"name": "Chandigarh",          "state": "Chandigarh"},
    15: {"name": "Agra",                "state": "Uttar Pradesh"},
    16: {"name": "Indore",              "state": "Madhya Pradesh"},
    17: {"name": "Raipur",              "state": "Chhattisgarh"},
    18: {"name": "Bhubaneswar",         "state": "Odisha"},
    19: {"name": "Thiruvananthapuram",  "state": "Kerala"},
    20: {"name": "Coimbatore",          "state": "Tamil Nadu"},
    21: {"name": "Varanasi",            "state": "Uttar Pradesh"},
    22: {"name": "Bhopal",              "state": "Madhya Pradesh"},
    23: {"name": "Shimla",              "state": "Himachal Pradesh"},
    24: {"name": "Srinagar",            "state": "Jammu & Kashmir"},
    25: {"name": "Puducherry",          "state": "Puducherry"},
}

HIGH_CRIME_DISTRICTS = {1, 2, 6, 9, 10, 15}
MED_CRIME_DISTRICTS  = {3, 4, 5, 8, 13, 21}


def generate_dataset(n=N_SAMPLES):
    print(f"[1/5] Generating {n:,} synthetic India crime records ...")
    districts   = np.random.randint(1, NUM_DISTRICTS + 1, size=n)
    months      = np.random.randint(1, 13, size=n)
    hours       = np.random.randint(0, 24, size=n)
    day_of_week = np.random.randint(0, 7, size=n)

    score = np.zeros(n)
    score += np.where(np.isin(districts, list(HIGH_CRIME_DISTRICTS)), 0.45,
               np.where(np.isin(districts, list(MED_CRIME_DISTRICTS)), 0.25, 0.10))
    score += np.where((hours >= 22) | (hours <= 3), 0.30,
               np.where((hours >= 17) & (hours <= 21), 0.20,
               np.where((hours >= 7) & (hours <= 9), 0.10, 0.05)))
    score += np.where(np.isin(months, [6, 7, 8, 10, 11]), 0.20,
               np.where(np.isin(months, [3, 4, 5, 9, 12]), 0.12, 0.05))
    score += np.where(day_of_week >= 5, 0.07, 0.0)
    score  = np.clip(score + np.random.normal(0, 0.06, size=n), 0, 1)

    labels = np.where(score >= 0.65, "High", np.where(score >= 0.40, "Medium", "Low"))
    df = pd.DataFrame({"district": districts, "month": months, "hour": hours,
                        "day_of_week": day_of_week, "risk_score": np.round(score, 4),
                        "risk_level": labels})
    print(f"   Class distribution → {df['risk_level'].value_counts().to_dict()}")
    return df


def train(df):
    print("[2/5] Preparing features ...")
    FEATURES = ["district", "month", "hour", "day_of_week"]
    X = df[FEATURES].values
    y = df["risk_level"].values
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.20,
                                                         random_state=SEED, stratify=y_enc)
    print(f"   Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    print("[3/5] Training Gradient Boosting Classifier ...")
    gb = GradientBoostingClassifier(n_estimators=300, learning_rate=0.08,
                                     max_depth=5, subsample=0.85,
                                     min_samples_leaf=30, random_state=SEED, verbose=0)
    gb.fit(X_train, y_train)

    print("[4/5] Evaluating ...")
    y_pred = gb.predict(X_test)
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec  = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1   = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    print(f"   Accuracy: {acc*100:.2f}%  Precision: {prec*100:.2f}%  F1: {f1*100:.2f}%")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    metrics = {"accuracy": round(acc*100, 2), "precision": round(prec*100, 2),
               "recall": round(rec*100, 2), "f1_score": round(f1*100, 2),
               "classes": list(le.classes_), "n_train": len(X_train), "n_test": len(X_test)}

    print("[5/5] Saving model bundle ...")
    bundle = {"model": gb, "encoder": le, "features": FEATURES,
              "metrics": metrics, "district_coords": DISTRICT_COORDS,
              "district_meta": DISTRICT_META}
    joblib.dump(bundle, MODEL_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"   Model saved to {MODEL_PATH}")
    return metrics


if __name__ == "__main__":
    os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
    df = generate_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"   crime_data.csv saved\n")
    train(df)
    print("\nTraining complete!")
