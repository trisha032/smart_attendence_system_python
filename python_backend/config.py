import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "smart_attendance")

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

DATASET_DIR = (BASE_DIR / os.getenv("DATASET_DIR", "../dataset")).resolve()
ATTENDANCE_DIR = (BASE_DIR / os.getenv("ATTENDANCE_DIR", "../attendance")).resolve()
TEMP_DIR = (BASE_DIR / os.getenv("TEMP_DIR", "./temp")).resolve()
UPLOADS_ROOT = Path(os.getenv("UPLOADS_ROOT", (BASE_DIR.parent / "backend" / "uploads").as_posix())).resolve()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

DATASET_DIR.mkdir(parents=True, exist_ok=True)
ATTENDANCE_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
