import sys
import importlib

print("Python version :", sys.version.split()[0])
print("Python location:", sys.executable)
print()

for name in ["numpy", "pandas", "sklearn", "joblib", "fastapi", "uvicorn"]:
    try:
        module = importlib.import_module(name)
        print(f"OK  {name:8s} {getattr(module, '__version__', '')}")
    except Exception as error:
        print(f"FAIL {name}: {error}")

# Tiny real test: train a model on 6 numbers, to catch crashes that only
# happen when the libraries actually run (not just when they import).
import numpy as np
from sklearn.linear_model import LogisticRegression

X = np.array([[1], [2], [3], [4], [5], [6]])
y = np.array([0, 0, 0, 1, 1, 1])
model = LogisticRegression().fit(X, y)
print()
print("Tiny training test passed. Prediction for 5.5 ->", model.predict([[5.5]])[0])