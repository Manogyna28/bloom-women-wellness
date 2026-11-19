from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers the tables)
from .config import CORS_ORIGINS
from .database import Base, engine
from .routers import account, auth, cycle, logs, meals

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bloom API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(cycle.router)
app.include_router(meals.router)
app.include_router(account.router)


@app.get("/health")
def health():
    return {"status": "ok"}
