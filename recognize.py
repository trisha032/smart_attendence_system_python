import cv2
import os
from deepface import DeepFace

DATASET_PATH = "dataset"
TEMP_IMAGE = "temp.jpg"


def recognize_face():
    name = "Unknown"

    for person in os.listdir(DATASET_PATH):
        person_folder = os.path.join(DATASET_PATH, person)

        for image in os.listdir(person_folder):
            db_image = os.path.join(person_folder, image)

            result = DeepFace.verify(
                img1_path=TEMP_IMAGE,
                img2_path=db_image,
                enforce_detection=False
            )

            if result["verified"]:
                return person

    return name


def start_camera():
    print("Starting camera... Press ESC to exit")

    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Camera error")
            break

        cv2.imwrite(TEMP_IMAGE, frame)

        try:
            name = recognize_face()
        except:
            name = "Unknown"

        cv2.putText(frame, name, (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1, (0, 255, 0), 2)

        cv2.imshow("Smart Attendance Camera", frame)

        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_camera()