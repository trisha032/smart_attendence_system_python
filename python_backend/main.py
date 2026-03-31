from datetime import datetime
from pathlib import Path
from typing import List, Optional
import shutil
import uuid

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel
from deepface import DeepFace

from config import (
    DATASET_DIR,
    TEMP_DIR,
    CORS_ORIGINS,
    UPLOADS_ROOT,
)
from database import students_collection, attendance_collection, embeddings_collection
from services.face_service import (
    normalize_student_name,
    student_folder_name,
    build_embedding,
    recognize_student_from_embeddings,
)

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


class EmbeddingRegisterRequest(BaseModel):
    name: str
    image_path: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_label: Optional[str] = None


class MarkAttendancePathRequest(BaseModel):
    image_path: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_label: Optional[str] = None


def _location_payload(
    latitude: Optional[float],
    longitude: Optional[float],
    location_label: Optional[str],
) -> Optional[dict]:
    if latitude is None and longitude is None and not location_label:
        return None
    return {
        "latitude": latitude,
        "longitude": longitude,
        "label": location_label.strip() if location_label else None,
    }


@app.post("/api/embeddings/register")
def register_embedding(payload: EmbeddingRegisterRequest):
    try:
        student_name = normalize_student_name(payload.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    image_path = Path(payload.image_path).resolve()
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=400, detail="image_path does not exist")

    try:
        image_path.relative_to(UPLOADS_ROOT)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="image_path must be inside UPLOADS_ROOT") from exc

    try:
        embedding = build_embedding(image_path, enforce_detection=True)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to generate embedding: {exc}") from exc

    if not embedding:
        raise HTTPException(status_code=422, detail="No face embedding generated from image")

    now_utc = datetime.utcnow()
    location = _location_payload(payload.latitude, payload.longitude, payload.location_label)

    set_payload = {
        "name": student_name,
        "updatedAt": now_utc,
    }
    if location:
        set_payload["lastKnownLocation"] = location

    students_collection.update_one(
        {"name": student_name},
        {
            "$set": set_payload,
            "$setOnInsert": {
                "createdAt": now_utc,
            },
        },
        upsert=True,
    )

    embedding_doc = {
        "name": student_name,
        "image_path": str(image_path),
        "embedding": embedding,
        "timestamp": now_utc.isoformat() + "Z",
        "createdAt": now_utc,
    }
    if location:
        embedding_doc["location"] = location

    try:
        result = embeddings_collection.insert_one(embedding_doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Embedding for image_path already exists") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to store embedding: {exc}") from exc

    return {
        "success": True,
        "message": "Embedding stored successfully",
        "id": str(result.inserted_id),
        "name": student_name,
        "image_path": str(image_path),
        "embedding_length": len(embedding),
        "timestamp": now_utc.isoformat() + "Z",
    }


@app.post("/api/register")
async def register_face(
    name: str = Form(...),
    images: List[UploadFile] = File(...),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    location_label: Optional[str] = Form(default=None),
):
    student_name = normalize_student_name(name)

    if len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required")

    folder = student_folder_name(student_name)
    student_dir = DATASET_DIR / folder
    student_dir.mkdir(parents=True, exist_ok=True)

    now_utc = datetime.utcnow()
    location = _location_payload(latitude, longitude, location_label)
    saved_count = 0
    embedding_saved = 0
    for image in images:
        ext = Path(image.filename or "img.jpg").suffix or ".jpg"
        file_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        target = student_dir / file_name
        with target.open("wb") as f:
            shutil.copyfileobj(image.file, f)
        saved_count += 1

        try:
            embedding = build_embedding(target, enforce_detection=True)
            if embedding:
                embedding_doc = {
                    "name": student_name,
                    "image_path": str(target),
                    "embedding": embedding,
                    "timestamp": now_utc.isoformat() + "Z",
                    "createdAt": now_utc,
                }
                if location:
                    embedding_doc["location"] = location
                embeddings_collection.update_one(
                    {"image_path": str(target)},
                    {"$set": embedding_doc},
                    upsert=True,
                )
                embedding_saved += 1
        except Exception:
            # Continue registration even if one image fails embedding extraction.
            pass

    image_count = len(list(student_dir.glob("*.jpg"))) + len(list(student_dir.glob("*.jpeg"))) + len(list(student_dir.glob("*.png")))

    students_collection.update_one(
        {"name": student_name},
        {
            "$set": {
                "name": student_name,
                "folder": folder,
                "imageCount": image_count,
                "updatedAt": now_utc,
                **({"lastKnownLocation": location} if location else {}),
            },
            "$setOnInsert": {
                "createdAt": now_utc,
            },
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": f"Face registered successfully for {student_name}",
        "studentsRegistered": student_name,
        "imagesCount": saved_count,
        "embeddingsStored": embedding_saved,
    }


def _mark_attendance_from_image(
    image_path: Path,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_label: Optional[str] = None,
):
    match = recognize_student_from_embeddings(image_path, embeddings_collection)
    if not match:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "Face not recognized. Please register first."},
        )

    student_name = match["name"]
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
    location = _location_payload(latitude, longitude, location_label)

    attendance_doc = {
        "name": student_name,
        "date": date_str,
        "time": timestamp_str,
        "timestamp": now.isoformat(),
        "createdAt": datetime.utcnow(),
        "matchDistance": match["distance"],
        "matchConfidence": match["confidence"],
    }
    if location:
        attendance_doc["captureLocation"] = location

    already_marked = attendance_collection.find_one({"name": student_name, "date": date_str})
    if already_marked:
        return {
            "success": True,
            "message": f"Attendance already marked today for {student_name}",
            "student_name": student_name,
            "date": already_marked["date"],
            "time": already_marked["time"],
            "timestamp": already_marked["timestamp"],
            "match_distance": already_marked.get("matchDistance", match["distance"]),
            "match_confidence": already_marked.get("matchConfidence", match["confidence"]),
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
        "match_distance": match["distance"],
        "match_confidence": match["confidence"],
    }


@app.post("/api/mark-attendance")
async def mark_attendance(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    location_label: Optional[str] = Form(default=None),
):
    ext = Path(image.filename or "capture.jpg").suffix or ".jpg"
    temp_path = TEMP_DIR / f"probe_{uuid.uuid4().hex}{ext}"

    with temp_path.open("wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        return _mark_attendance_from_image(temp_path, latitude, longitude, location_label)
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.post("/api/mark-attendance-from-path")
def mark_attendance_from_path(payload: MarkAttendancePathRequest):
    image_path = Path(payload.image_path).resolve()
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=400, detail="image_path does not exist")

    try:
        image_path.relative_to(UPLOADS_ROOT)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="image_path must be inside UPLOADS_ROOT") from exc

    return _mark_attendance_from_image(
        image_path,
        payload.latitude,
        payload.longitude,
        payload.location_label,
    )


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


@app.get("/api/students/{name}/face-data")
def get_student_face_data(name: str, include_embeddings: bool = Query(default=False)):
    student_name = normalize_student_name(name)
    student = students_collection.find_one({"name": student_name}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    result = {
        "name": student_name,
        "student": student,
        "embeddingCount": embeddings_collection.count_documents({"name": student_name}),
    }

    if include_embeddings:
        embeddings = list(
            embeddings_collection.find(
                {"name": student_name},
                {"_id": 0, "embedding": 1, "image_path": 1, "timestamp": 1, "location": 1},
            ).sort([("createdAt", -1)])
        )
        result["embeddings"] = embeddings

    return result
