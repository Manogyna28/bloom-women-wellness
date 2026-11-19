from pathlib import Path
import json
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
model = joblib.load(BASE_DIR / "models" / "sleep_model.joblib")
info = json.loads((BASE_DIR / "models" / "model_info.json").read_text(encoding="utf-8"))
FEATURES = info["features_in_order"]
RANGES = info["training_value_ranges"]

DISCLAIMER = ("Experimental educational estimate based on a small dataset. "
              "Not medical advice and not a diagnosis.")

app = FastAPI(title="Sleep quality estimator (experimental)")

# Allow your frontend dev server to call this API. Adjust ports if yours differ.
app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    "https://bloom-women-wellness.vercel.app"
],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SleepInput(BaseModel):
    age: float
    sleep_duration: float       # hours
    physical_activity: float    # minutes per day
    stress_level: float         # 1-10 scale, as in the dataset


@app.get("/health")
def health():
    return {"status": "ok", "model": info["algorithm"]}


@app.post("/predict")
def predict(data: SleepInput):
    values = [data.age, data.sleep_duration, data.physical_activity, data.stress_level]

    # Reject anything the model has never seen
    problems = []
    for name, value in zip(FEATURES, values):
        lo, hi = RANGES[name]
        if value < lo or value > hi:
            problems.append(f"{name} must be between {lo:g} and {hi:g} (got {value:g})")
    if problems:
        raise HTTPException(status_code=422, detail={
            "message": "Input is outside the range this model was trained on.",
            "problems": problems,
        })

    X = pd.DataFrame([values], columns=FEATURES)
    p_good = float(model.predict_proba(X)[0, 1])
    is_good = p_good >= 0.5
    return {
        "prediction": "likely_good" if is_good else "likely_lower",
        "probability_good": round(p_good, 3),
        "estimated_confidence": round(p_good if is_good else 1 - p_good, 3),
        "experimental": True,
        "disclaimer": DISCLAIMER,
    }
