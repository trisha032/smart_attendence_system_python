import re
from pathlib import Path
from typing import Optional

from deepface import DeepFace


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
