from datetime import datetime
from pathlib import Path
from typing import List, Optional
import shutil
import uuid

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError

from config import (
    DATASET_DIR,
    TEMP_DIR,
    CORS_ORIGINS,
)
from database import students_collection, attendance_collection
from services.face_service import normalize_student_name, student_folder_name, recognize_student

app = FastAPI(title="Smart Attendance Python API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _student_display_name(folder_name: str) -> str:
    doc = students_collection.find_one({"folder": folder_name}, {"_id": 0, "name": 1})
    return doc["name"] if doc and doc.get("name") else folder_name


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Smart Attendance Python API is running"}


@app.post("/api/register")
async def register_face(name: str = Form(...), images: List[UploadFile] = File(...)):
    student_name = normalize_student_name(name)

    if len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required")

    folder = student_folder_name(student_name)
    student_dir = DATASET_DIR / folder
    student_dir.mkdir(parents=True, exist_ok=True)

    saved_count = 0
    for image in images:
        ext = Path(image.filename or "img.jpg").suffix or ".jpg"
        file_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        target = student_dir / file_name
        with target.open("wb") as f:
            shutil.copyfileobj(image.file, f)
        saved_count += 1

    image_count = len(list(student_dir.glob("*.jpg"))) + len(list(student_dir.glob("*.jpeg"))) + len(list(student_dir.glob("*.png")))

    students_collection.update_one(
        {"name": student_name},
        {
            "$set": {
                "name": student_name,
                "folder": folder,
                "imageCount": image_count,
                "updatedAt": datetime.utcnow(),
            },
            "$setOnInsert": {
                "createdAt": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": f"Face registered successfully for {student_name}",
        "studentsRegistered": student_name,
        "imagesCount": saved_count,
    }


@app.post("/api/mark-attendance")
async def mark_attendance(image: UploadFile = File(...)):
    ext = Path(image.filename or "capture.jpg").suffix or ".jpg"
    temp_path = TEMP_DIR / f"probe_{uuid.uuid4().hex}{ext}"

    with temp_path.open("wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        matched_folder = recognize_student(temp_path, DATASET_DIR)
        if not matched_folder:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Face not recognized. Please register first."},
            )

        student_name = _student_display_name(matched_folder)

        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")

        attendance_doc = {
            "name": student_name,
            "date": date_str,
            "time": timestamp_str,
            "timestamp": now.isoformat(),
            "createdAt": datetime.utcnow(),
        }

        already_marked = attendance_collection.find_one({"name": student_name, "date": date_str})
        if already_marked:
            return {
                "success": True,
                "message": f"Attendance already marked today for {student_name}",
                "student_name": student_name,
                "date": already_marked["date"],
                "time": already_marked["time"],
                "timestamp": already_marked["timestamp"],
            }

        try:
            attendance_collection.insert_one(attendance_doc)
        except DuplicateKeyError:
            pass

        return {
            "success": True,
            "message": "Attendance marked successfully",
            "student_name": student_name,
            "date": date_str,
            "time": timestamp_str,
            "timestamp": now.isoformat(),
        }
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.get("/api/attendance")
def get_attendance(name: Optional[str] = Query(default=None)):
    query = {"name": name} if name else {}
    docs = attendance_collection.find(query, {"_id": 0}).sort([("date", -1), ("time", -1)])
    return list(docs)


@app.get("/api/attendance/{name}")
def get_attendance_by_student(name: str):
    docs = attendance_collection.find({"name": name}, {"_id": 0}).sort([("date", -1), ("time", -1)])
    return list(docs)


@app.get("/api/students")
def get_students():
    docs = students_collection.find({}, {"_id": 0, "name": 1}).sort([("name", 1)])
    return [doc["name"] for doc in docs]
