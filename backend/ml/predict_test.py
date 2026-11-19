from pathlib import Path
import json
import joblib
import pandas as pd

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "models" / "sleep_model.joblib"
INFO_PATH = BASE_DIR / "models" / "model_info.json"

model = joblib.load(MODEL_PATH)
info = json.loads(INFO_PATH.read_text(encoding="utf-8"))
FEATURES = info["features_in_order"]
RANGES = info["training_value_ranges"]

print("Loaded model from:", MODEL_PATH)
print("Features in order :", FEATURES)
print("Training ranges   :", RANGES)

# (description, Age, Sleep Duration, Physical Activity Level, Stress Level)
examples = [
    ("Rested, low stress",          35, 8.0, 60, 4),
    ("Short sleep, high stress",    45, 6.0, 40, 8),
    ("Typical middle",              40, 7.0, 60, 6),
    ("Long sleep, high stress",     40, 8.2, 50, 8),
    ("Short sleep, low stress",     40, 6.0, 60, 3),
    ("OUT OF RANGE: age 15",        15, 7.5, 60, 5),
    ("OUT OF RANGE: sleep 3 h",     40, 3.0, 60, 5),
    ("OUT OF RANGE: stress 10",     40, 7.0, 60, 10),
]

rows = [e[1:] for e in examples]
X = pd.DataFrame(rows, columns=FEATURES)
proba_good = model.predict_proba(X)[:, 1]
labels = model.predict(X)


def out_of_range(row):
    bad = []
    for name, value in zip(FEATURES, row):
        lo, hi = RANGES[name]
        if value < lo or value > hi:
            bad.append(f"{name} {value} not in [{lo}, {hi}]")
    return bad


print("\n" + "=" * 78)
print(f"{'Example':<30}{'Prediction':<14}{'P(good)':<10}Range check")
print("=" * 78)
for (desc, *vals), lab, p in zip(examples, labels, proba_good):
    bad = out_of_range(vals)
    flag = "OK" if not bad else "OUTSIDE: " + "; ".join(bad)
    print(f"{desc:<30}{('good' if lab == 1 else 'lower'):<14}{p:<10.3f}{flag}")

# Fresh-process consistency: same input twice gives the same answer
again = model.predict_proba(X)[:, 1]
print("\nRepeat prediction identical:", bool((abs(again - proba_good) < 1e-12).all()))