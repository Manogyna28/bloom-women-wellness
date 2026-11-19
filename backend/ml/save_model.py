from datetime import datetime
from pathlib import Path
import json
import platform
import joblib
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).parent
CLEAN_PATH = BASE_DIR / "data" / "sleep_clean.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "sleep_model.joblib"
INFO_PATH = MODEL_DIR / "model_info.json"

FEATURES = ["Age", "Sleep Duration", "Physical Activity Level", "Stress Level"]
TARGET = "Quality of Sleep"
GOOD_THRESHOLD = 7            # score >= 7 -> good sleep (label 1)

MODEL_DIR.mkdir(exist_ok=True)

# 1. Load cleaned data and build the label
df = pd.read_csv(CLEAN_PATH, keep_default_na=False, na_values=[""])
X = df[FEATURES]
y = (df[TARGET] >= GOOD_THRESHOLD).astype(int)
print(f"Training the final model on all {len(df)} cleaned rows "
      f"(good = {int(y.sum())}, lower = {int((y == 0).sum())})")

# 2. Selected model: Logistic Regression, scaling included in the pipeline
model = make_pipeline(
    StandardScaler(),
    LogisticRegression(class_weight="balanced", max_iter=1000),
)
model.fit(X, y)

# 3. Save the model
joblib.dump(model, MODEL_PATH)

# 4. Save a human-readable info file (also useful for your report)
coefs = model[-1].coef_[0]
info = {
    "name": "Experimental sleep-quality estimator (educational, not medical)",
    "created": datetime.now().isoformat(timespec="seconds"),
    "algorithm": "Logistic Regression inside a StandardScaler pipeline",
    "features_in_order": FEATURES,
    "label": {"1": f"good sleep (score >= {GOOD_THRESHOLD})",
              "0": f"lower sleep (score <= {GOOD_THRESHOLD - 1})"},
    "trained_on_rows": int(len(df)),
    "class_counts": {"good": int(y.sum()), "lower": int((y == 0).sum())},
    "training_value_ranges": {
        c: [float(df[c].min()), float(df[c].max())] for c in FEATURES
    },
    "standardised_coefficients": {c: round(float(v), 3) for c, v in zip(FEATURES, coefs)},
    "evaluation_from_train_model_py": {
        "note": ("Measured on the 99-row training split (25 grouped CV rounds) and a "
                 "33-row test split BEFORE the final refit on all rows. The saved model "
                 "has no separate score of its own."),
        "cv_macro_f1": 0.964,
        "baseline_cv_macro_f1": 0.393,
        "test_macro_f1": 1.0,
        "test_rows": 33,
    },
    "versions": {"python": platform.python_version(), "scikit_learn": sklearn.__version__},
    "limitations": [
        "Experimental educational model. Not a medical tool and not a diagnosis.",
        "Trained on about 132 unique, probably synthetic, self-reported records.",
        "Ages 27-59 only. Predictions outside the training ranges are unreliable.",
        "Scores are driven mostly by Stress Level and Sleep Duration.",
        "Very high test scores reflect how tidy this dataset is, not real-world accuracy.",
    ],
}
INFO_PATH.write_text(json.dumps(info, indent=2), encoding="utf-8")

# 5. Self-check: reload the file and compare with the in-memory model
loaded = joblib.load(MODEL_PATH)
same_labels = (loaded.predict(X) == model.predict(X)).all()
same_probs = abs(loaded.predict_proba(X) - model.predict_proba(X)).max() < 1e-12
print("\nSaved model :", MODEL_PATH, f"({MODEL_PATH.stat().st_size} bytes)")
print("Saved info  :", INFO_PATH, f"({INFO_PATH.stat().st_size} bytes)")
print("Reloaded model gives identical labels       :", bool(same_labels))
print("Reloaded model gives identical probabilities:", bool(same_probs))
print("Class order used by predict_proba           :", [int(c) for c in loaded.classes_], "(0 = lower, 1 = good)")
print("Standardised coefficients                   :", info["standardised_coefficients"])