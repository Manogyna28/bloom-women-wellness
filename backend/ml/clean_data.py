from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data"
RAW_PATH = DATA_DIR / "sleep_raw.csv"      # original copy: only READ
CLEAN_PATH = DATA_DIR / "sleep_clean.csv"  # new file: this script WRITES it

FEATURES = ["Age", "Sleep Duration", "Physical Activity Level", "Stress Level"]
TARGET = "Quality of Sleep"

# keep_default_na=False keeps the word "None" (Sleep Disorder) as a real value
df = pd.read_csv(RAW_PATH, keep_default_na=False, na_values=[""])
rows_before = len(df)
print("Rows in raw file                          :", rows_before)

# ---- Decision 1: missing values -------------------------------------------
missing = int(df.isna().sum().sum())
print("Missing cells found                       :", missing)
if missing > 0:
    raise SystemExit("Unexpected missing values. Stop and tell your guide.")

# ---- Decision 2: make duplicate category names consistent -----------------
# 'Normal' and 'Normal Weight' mean the same thing; so do 'Salesperson' and
# 'Sales Representative'. We fix this BEFORE looking for duplicates, so rows that
# differ only in spelling are recognised as the same record.
df["BMI Category"] = df["BMI Category"].replace({"Normal Weight": "Normal"})
df["Occupation"] = df["Occupation"].replace({"Sales Representative": "Salesperson"})

# ---- Decision 3: remove repeated records ----------------------------------
# Person ID is only a row counter, so ignore it when comparing rows.
# keep="first" keeps the lowest Person ID of each repeated record.
columns_to_compare = [c for c in df.columns if c != "Person ID"]
duplicate_mask = df.duplicated(subset=columns_to_compare, keep="first")
print("Repeated records removed                  :", int(duplicate_mask.sum()))
clean = df[~duplicate_mask].reset_index(drop=True)

# ---- Safety checks on the cleaned data ------------------------------------
assert clean[columns_to_compare].duplicated().sum() == 0, "duplicates remain"
assert clean[FEATURES + [TARGET]].notna().all().all(), "missing values remain"
assert clean[TARGET].between(1, 10).all(), "target outside the expected range"
assert clean["Person ID"].is_unique, "Person ID should still be unique"

# ---- Save to a NEW file ----------------------------------------------------
clean.to_csv(CLEAN_PATH, index=False)

print("Rows in cleaned file                      :", len(clean))
print("Saved to                                  :", CLEAN_PATH)

good = int((clean[TARGET] >= 7).sum())
low = int((clean[TARGET] <= 6).sum())
print(f"\nAfter cleaning: Good (>=7) = {good}, Lower (<=6) = {low}, "
      f"share good = {good / len(clean):.1%}")
print("\nBMI Category now :", clean["BMI Category"].value_counts().to_dict())
print("Occupation now   :", clean["Occupation"].value_counts().to_dict())
print("\nThe raw file was not changed.")