# Bloom - wellness app

A wellness tracker with three parts:

| Part | Folder | Port |
|---|---|---|
| Frontend (React + Vite) | wellness-app\frontend | 5173 |
| Main backend (FastAPI) | backend | 8000 |
| Sleep estimate service (ML, FastAPI) | backend\ml | 8001 |

The frontend currently saves user data in the browser (localStorage). It is not yet connected to the main backend. See backend\README.md for how to run the backend.

## Run the sleep estimate service

From the project root:

```powershell
pip install -r backend\ml\requirements.txt
python -m uvicorn predict_api:app --app-dir backend\ml --port 8001
```

Check it: http://127.0.0.1:8001/health should return status "ok".
"Port 8001 already in use" means it is already running.

## Run the frontend

```powershell
cd wellness-app\frontend
npm install
npm run dev
```

Open http://localhost:5173. The ML service address is set in `wellness-app\frontend\.env`:

```
VITE_SLEEP_API=http://127.0.0.1:8001/predict
```

Restart `npm run dev` after changing it.

## About the sleep estimate

- Model: Logistic Regression (StandardScaler pipeline), scikit-learn 1.8.0.
- Inputs: age, sleep duration, physical activity, stress level. Only these four numbers are sent; nothing is stored.
- Output: "likely good" (sleep quality 7 or higher) or "likely lower".
- Accepted ranges: age 27-59, sleep 5.8-8.5 h, activity 30-90 min, stress 3-8. Anything outside is rejected.
- Trained on 132 rows of a small, probably synthetic dataset. The perfect test score reflects how tidy the data is, not real-world accuracy.
- Experimental and educational only. Not medical advice and not a diagnosis.

## ML files (backend\ml)

inspect_data.py, clean_data.py, prepare_data.py, train_model.py, save_model.py, predict_test.py, predict_api.py. The saved model and its details are in `models\sleep_model.joblib` and `models\model_info.json`.