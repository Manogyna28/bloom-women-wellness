import os

# SQLite works with zero setup. To use MySQL later, set DATABASE_URL, e.g.
# mysql+pymysql://root:password@localhost:3306/bloom
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bloom.db")

# Change this before any real deployment (set it as an environment variable).
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
ALGORITHM = "HS256"
TOKEN_HOURS = int(os.getenv("TOKEN_HOURS", "72"))

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
