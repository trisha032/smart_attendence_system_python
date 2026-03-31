import re
from pathlib import Path
from typing import Dict, Optional

from deepface import DeepFace
import numpy as np


def normalize_student_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", name).strip()
    if not cleaned:
        raise ValueError("Student name cannot be empty")
    return cleaned


def student_folder_name(name: str) -> str:
    normalized = normalize_student_name(name)
    safe = re.sub(r"[^a-zA-Z0-9_-]", "_", normalized)
    return safe.lower()


def verify_against_image(probe_image: Path, db_image: Path) -> bool:
    result = DeepFace.verify(
        img1_path=str(probe_image),
        img2_path=str(db_image),
        enforce_detection=False,
        detector_backend="opencv",
        model_name="Facenet",
        distance_metric="cosine",
    )
    return bool(result.get("verified", False))


def build_embedding(image_path: Path, enforce_detection: bool = True) -> Optional[list]:
    representation = DeepFace.represent(
        img_path=str(image_path),
        model_name="Facenet512",
        detector_backend="opencv",
        enforce_detection=enforce_detection,
    )
    if not representation or "embedding" not in representation[0]:
        return None
    return [float(value) for value in representation[0]["embedding"]]


def cosine_distance(embedding_a: list, embedding_b: list) -> float:
    a = np.array(embedding_a, dtype=np.float32)
    b = np.array(embedding_b, dtype=np.float32)
    denominator = (np.linalg.norm(a) * np.linalg.norm(b))
    if denominator == 0:
        return 1.0
    cosine_similarity = float(np.dot(a, b) / denominator)
    cosine_similarity = max(min(cosine_similarity, 1.0), -1.0)
    return 1.0 - cosine_similarity


def recognize_student_from_embeddings(
    probe_image: Path,
    embeddings_collection,
    threshold: float = 0.35,
) -> Optional[Dict[str, float]]:
    probe_embedding = build_embedding(probe_image, enforce_detection=True)
    if not probe_embedding:
        return None

    best_name = None
    best_distance = float("inf")

    cursor = embeddings_collection.find({}, {"_id": 0, "name": 1, "embedding": 1})
    for doc in cursor:
        db_embedding = doc.get("embedding")
        if not db_embedding:
            continue
        if len(db_embedding) != len(probe_embedding):
            continue

        distance = cosine_distance(probe_embedding, db_embedding)
        if distance < best_distance:
            best_distance = distance
            best_name = doc.get("name")

    if not best_name or best_distance > threshold:
        return None

    return {
        "name": best_name,
        "distance": round(best_distance, 6),
        "confidence": round(max(0.0, 1.0 - best_distance), 6),
    }


def recognize_student(probe_image: Path, dataset_dir: Path) -> Optional[str]:
    if not dataset_dir.exists():
        return None

    for person_dir in dataset_dir.iterdir():
        if not person_dir.is_dir():
            continue

        for db_image in person_dir.glob("*.jpg"):
            try:
                if verify_against_image(probe_image, db_image):
                    return person_dir.name
            except Exception:
                # Ignore per-image failures and continue matching.
                continue

    return None
