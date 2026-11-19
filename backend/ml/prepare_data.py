from pathlib import Path
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

DATA_DIR = Path(__file__).parent / "data"
CLEAN_PATH = DATA_DIR / "sleep_clean.csv"   # only READ
TRAIN_PATH = DATA_DIR / "train.csv"         # written by this script
TEST_PATH = DATA_DIR / "test.csv"           # written by this script

FEATURES = ["Age", "Sleep Duration", "Physical Activity Level", "Stress Level"]
TARGET = "Quality of Sleep"
RANDOM_STATE = 42

df = pd.read_csv(CLEAN_PATH, keep_default_na=False, na_values=[""])
print("Rows in cleaned file:", len(df))

# ---- 1. Binary target: 1 = good sleep (score >= 7), 0 = lower (score <= 6) --
df["good_sleep"] = (df[TARGET] >= 7).astype(int)

# ---- 2. Groups: rows with the SAME four feature values share one group_id ----
# After cleaning, 132 rows still contain only 105 distinct combinations of the
# four features. Rows in the same group look identical to the model, so they
# must stay together on one side of the split.
df["group_id"] = df.groupby(FEATURES).ngroup()
print("Distinct feature groups:", df["group_id"].nunique())

# ---- 3. Split: about 25% of the groups go to the test set -------------------
# StratifiedGroupKFold with 4 folds: take the first fold as the test set.
# "Group"  = no group appears in both train and test.
# "Stratified" = both sides keep a similar share of good / lower sleep.
splitter = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=RANDOM_STATE)
train_idx, test_idx = next(splitter.split(df[FEATURES], df["good_sleep"], df["group_id"]))
train, test = df.iloc[train_idx], df.iloc[test_idx]

# ---- 4. Leakage check: stop if any group is on both sides --------------------
overlap = set(train["group_id"]) & set(test["group_id"])
assert len(overlap) == 0, f"LEAKAGE: {len(overlap)} groups appear in train and test"
print("Groups shared between train and test: 0  (leakage check passed)")

# ---- 5. Report class balance -------------------------------------------------
def report(name, data):
    good = int(data["good_sleep"].sum())
    low = len(data) - good
    print(f"{name:6s}: rows = {len(data):3d} | good = {good:3d} | lower = {low:3d} "
          f"| share good = {good / len(data):.1%}")

print()
report("Train", train)
report("Test", test)
test_majority = (test["good_sleep"] == train["good_sleep"].mode()[0]).mean()
print(f"\nBaseline 'always predict the most common class' scores {test_majority:.1%} "
      f"accuracy on the test set.")
print("Any real model must beat this, so we will not judge by accuracy alone.")

# ---- 6. Save (feature scaling comes in Step 5, inside the model pipeline) ----
keep = ["Person ID"] + FEATURES + [TARGET, "good_sleep", "group_id"]
train[keep].to_csv(TRAIN_PATH, index=False)
test[keep].to_csv(TEST_PATH, index=False)
print("\nSaved:", TRAIN_PATH)
print("Saved:", TEST_PATH)
print("Input features used:", FEATURES)