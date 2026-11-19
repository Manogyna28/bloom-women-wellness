from pathlib import Path
import pandas as pd

# Path of the CSV, relative to this script (works from any terminal folder)
CSV_PATH = Path(__file__).parent / "data" / "sleep_raw.csv"

# keep_default_na=False stops pandas from turning the word "None"
# (in the Sleep Disorder column) into a missing value.
# Only truly empty cells count as missing.
df = pd.read_csv(CSV_PATH, keep_default_na=False, na_values=[""])

FEATURES = ["Age", "Sleep Duration", "Physical Activity Level", "Stress Level"]
TARGET = "Quality of Sleep"

def title(text):
    print("\n" + "=" * 60)
    print(text)
    print("=" * 60)

title("1. SHAPE AND COLUMNS")
print("Rows, columns:", df.shape)
print("Column names:", list(df.columns))
print("Needed columns present:", all(c in df.columns for c in FEATURES + [TARGET]))

title("2. DATA TYPES")
print(df.dtypes.to_string())

title("3. MISSING VALUES (truly empty cells)")
print(df.isna().sum().to_string())
print("Sleep Disorder values:", df["Sleep Disorder"].value_counts().to_dict())

title("4. DUPLICATES")
without_id = df.drop(columns=["Person ID"])
print("Person ID is unique per row :", df["Person ID"].is_unique)
print("Exact duplicate rows (all columns, incl. Person ID):", df.duplicated().sum())
print("Duplicate rows ignoring Person ID                 :", without_id.duplicated().sum())
print("Unique rows ignoring Person ID                    :", len(without_id.drop_duplicates()))

# How big are the repeated groups?
sizes = without_id.groupby(list(without_id.columns)).size()
print("\nHow many times each distinct record appears (record -> number of groups):")
print(sizes.value_counts().sort_index().to_string())

# Are repeated records next to each other in the file?
df["_group"] = without_id.groupby(list(without_id.columns)).ngroup()
spread = df.groupby("_group")["Person ID"].agg(lambda s: s.max() - s.min())
repeated = df.groupby("_group")["Person ID"].count() > 1
print("\nFor repeated records, gap between first and last Person ID:")
print(spread[repeated].describe().round(1).to_string())
df = df.drop(columns="_group")

title("5. TARGET: Quality of Sleep")
print("Original scores, all rows:")
print(df[TARGET].value_counts().sort_index().to_string())
unique_df = without_id.drop_duplicates()
print("\nOriginal scores, unique rows only:")
print(unique_df[TARGET].value_counts().sort_index().to_string())

for label, data in [("ALL rows", df), ("UNIQUE rows", unique_df)]:
    good = (data[TARGET] >= 7).sum()
    low = (data[TARGET] <= 6).sum()
    print(f"\nBinary split on {label}: Good (>=7) = {good}, Lower (<=6) = {low}, "
          f"share good = {good / len(data):.1%}")

title("6. CAN THE 4 FEATURES CONTRADICT EACH OTHER?")
four = unique_df[FEATURES + [TARGET]].copy()
four["good"] = (four[TARGET] >= 7).astype(int)
combos = four.groupby(FEATURES)
n_combos = combos.ngroups
conflict_scores = (combos[TARGET].nunique() > 1).sum()
conflict_binary = (combos["good"].nunique() > 1).sum()
print("Unique rows (all columns)                     :", len(unique_df))
print("Distinct combinations of the 4 features       :", n_combos)
print("Combos with different original scores         :", conflict_scores)
print("Combos with different good/lower labels       :", conflict_binary)

title("7. SUMMARY STATISTICS (4 features + target, all rows)")
print(df[FEATURES + [TARGET]].describe().round(2).T.to_string())

print("\nDone. The original CSV was only read, never changed.")