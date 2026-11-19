from pathlib import Path
import warnings
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             make_scorer, precision_score, recall_score)
from sklearn.model_selection import StratifiedGroupKFold, cross_val_score, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent / "data"
FEATURES = ["Age", "Sleep Duration", "Physical Activity Level", "Stress Level"]
LABEL = "good_sleep"          # 1 = good (>=7), 0 = lower (<=6)
RANDOM_STATE = 42

train = pd.read_csv(DATA_DIR / "train.csv")
test = pd.read_csv(DATA_DIR / "test.csv")
X_train, y_train, groups = train[FEATURES], train[LABEL], train["group_id"]
X_test, y_test = test[FEATURES], test[LABEL]
print(f"Training rows: {len(train)} | Test rows: {len(test)} (test set is NOT used for choosing)")

# ---- The four candidates. Scaling lives INSIDE each pipeline, so it is learned
# from the training part of each fold only (no leakage).  Ordered simplest first.
models = {
    "Baseline (most common)": DummyClassifier(strategy="most_frequent"),
    "Logistic Regression": make_pipeline(
        StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=1000)),
    "SVM (RBF)": make_pipeline(
        StandardScaler(), SVC(kernel="rbf", class_weight="balanced")),
    "Random Forest": RandomForestClassifier(
        n_estimators=200, max_depth=4, min_samples_leaf=3,
        class_weight="balanced", random_state=RANDOM_STATE, n_jobs=1),
}

# ---- Validation: grouped, stratified 5-fold CV, repeated with 5 different shuffles
scoring = {
    "accuracy": "accuracy",
    "precision": make_scorer(precision_score, average="macro", zero_division=0),
    "recall": make_scorer(recall_score, average="macro", zero_division=0),
    "macro_f1": make_scorer(f1_score, average="macro", zero_division=0),
    "lower_recall": make_scorer(recall_score, pos_label=0, zero_division=0),
}
folds = []
for repeat in range(5):
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE + repeat)
    folds += list(cv.split(X_train, y_train, groups))
print(f"Cross-validation: {len(folds)} train/validation rounds, grouped and stratified\n")

cv_rows, results = [], {}
for name, model in models.items():
    r = cross_validate(clone(model), X_train, y_train, cv=folds, scoring=scoring,
                       return_train_score=True, n_jobs=1)
    results[name] = r
    cv_rows.append({
        "Model": name,
        "Accuracy": r["test_accuracy"].mean(),
        "Precision": r["test_precision"].mean(),
        "Recall": r["test_recall"].mean(),
        "Macro-F1": r["test_macro_f1"].mean(),
        "Macro-F1 spread": r["test_macro_f1"].std(),
        "Lower-class recall": r["test_lower_recall"].mean(),
        "Train Macro-F1": r["train_macro_f1"].mean(),
        "Gap (train - CV)": r["train_macro_f1"].mean() - r["test_macro_f1"].mean(),
    })
cv_table = pd.DataFrame(cv_rows).set_index("Model")
print("=" * 70)
print("CROSS-VALIDATION RESULTS ON TRAINING DATA (used to choose the model)")
print("Precision/Recall/Macro-F1 are averaged over both classes.")
print("=" * 70)
print(cv_table.round(3).to_string())

# ---- Selection rule, decided BEFORE looking at the test set:
# among real models whose CV macro-F1 is within 0.02 of the best, take the simplest.
real = cv_table.drop(index="Baseline (most common)")
best_f1 = real["Macro-F1"].max()
close = [m for m in real.index if real.loc[m, "Macro-F1"] >= best_f1 - 0.02]
order = ["Logistic Regression", "SVM (RBF)", "Random Forest"]   # simple -> complex
selected = next(m for m in order if m in close)
print(f"\nBest CV macro-F1: {best_f1:.3f}. Models within 0.02 of it: {close}")
print(f"SELECTED (simplest among those): {selected}")

# ---- Final check on the untouched test set (reported for every model) --------
print("\n" + "=" * 70)
print("TEST SET RESULTS (33 rows; evaluated once, after the choice was made)")
print("=" * 70)
test_rows, matrices = [], {}
for name, model in models.items():
    fitted = clone(model).fit(X_train, y_train)
    pred = fitted.predict(X_test)
    matrices[name] = confusion_matrix(y_test, pred, labels=[0, 1])
    test_rows.append({
        "Model": name,
        "Accuracy": accuracy_score(y_test, pred),
        "Precision": precision_score(y_test, pred, average="macro", zero_division=0),
        "Recall": recall_score(y_test, pred, average="macro", zero_division=0),
        "Macro-F1": f1_score(y_test, pred, average="macro", zero_division=0),
        "Lower-class recall": recall_score(y_test, pred, pos_label=0, zero_division=0),
    })
print(pd.DataFrame(test_rows).set_index("Model").round(3).to_string())

print("\nConfusion matrices (rows = actual, columns = predicted)")
print("             pred lower | pred good")
for name, cm in matrices.items():
    print(f"{name}")
    print(f"  actual lower   {cm[0][0]:4d}     |  {cm[0][1]:4d}")
    print(f"  actual good    {cm[1][0]:4d}     |  {cm[1][1]:4d}")


# ---- Sanity checks: is the very high score believable, or is something wrong? --
print("\n" + "=" * 70)
print("SANITY CHECKS (Logistic Regression, same cross-validation, macro-F1)")
print("=" * 70)
lr_model = models["Logistic Regression"]

def cv_f1(columns, labels):
    return cross_val_score(clone(lr_model), X_train[columns], labels,
                           cv=folds, scoring="f1_macro", n_jobs=1).mean()

print("A) Using ONE feature at a time:")
for col in FEATURES:
    print(f"     {col:26s}: {cv_f1([col], y_train):.3f}")
print(f"B) Age + Physical Activity only        : "
      f"{cv_f1(['Age', 'Physical Activity Level'], y_train):.3f}")
print(f"C) Sleep Duration + Stress Level only  : "
      f"{cv_f1(['Sleep Duration', 'Stress Level'], y_train):.3f}")

rng = np.random.default_rng(0)
shuffled = [cv_f1(FEATURES, pd.Series(rng.permutation(y_train.values), index=y_train.index))
            for _ in range(5)]
print(f"D) All 4 features, but labels SHUFFLED  : {np.mean(shuffled):.3f} "
      f"(should be near the baseline of about 0.4-0.5)")

print("\nNo model has been saved yet. Saving is the next step.")