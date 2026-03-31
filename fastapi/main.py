from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import math

app = FastAPI()

ALLOWED_LATITUDE = 22.6813
ALLOWED_LONGITUDE = 88.3789
ALLOWED_RADIUS_METERS = 50.0

# -----------------------------
# Models
# -----------------------------
class RegisterRequest(BaseModel):
    name: str
    image_path: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_label: Optional[str] = None

class AttendanceRequest(BaseModel):
    image_path: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_label: Optional[str] = None

# -----------------------------
# Fake database (for now)
# -----------------------------
students_db = []
attendance_db = []


def distance_in_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine distance for short-radius geofence validation.
    earth_radius_m = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2) ** 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_m * c

# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def root():
    return {"message": "FastAPI is running 🚀"}

@app.post("/api/embeddings/register")
def register_face(data: RegisterRequest):
  if not any(s["name"] == data.name for s in students_db):
    students_db.append({
        "name": data.name,
        "image_path": data.image_path
    })

    return {
        "success": True,
        "message": f"{data.name} registered successfully"
    }

@app.post("/api/mark-attendance-from-path")
def mark_attendance(data: AttendanceRequest):
    if not students_db:
        return {"success": False, "message": "No students registered"}

    if data.latitude is None or data.longitude is None:
        return {
            "success": False,
            "message": "Location permission denied. Please allow location access."
        }

    distance_m = distance_in_meters(
        data.latitude,
        data.longitude,
        ALLOWED_LATITUDE,
        ALLOWED_LONGITUDE,
    )

    if distance_m > ALLOWED_RADIUS_METERS:
        return {
            "success": False,
            "message": "You are outside the allowed campus area",
            "distance_meters": round(distance_m, 2),
            "allowed_radius_meters": ALLOWED_RADIUS_METERS,
        }

    student = students_db[0]

    attendance_db.append({
        "name": student["name"],
        "location": data.location_label,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "distance_meters": round(distance_m, 2),
    })

    return {
        "success": True,
        "message": f"Attendance marked for {student['name']}",
        "distance_meters": round(distance_m, 2),
        "is_inside": True
    }

@app.get("/api/students")
def get_students():
    return students_db

@app.get("/api/attendance")
def get_attendance(name: Optional[str] = None):
    if name:
        return [a for a in attendance_db if a["name"] == name]
    return attendance_db

@app.get("/api/attendance/{name}")
def get_student_attendance(name: str):
    return [a for a in attendance_db if a["name"] == name]