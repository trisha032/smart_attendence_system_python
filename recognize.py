from ast import Name
import cv2
import os
import pandas as pd
from datetime import datetime
from deepface import DeepFace
from geopy.distance import geodesic

DATASET_PATH = "dataset"
TEMP_IMAGE = "temp.jpg"
ATTENDANCE_FILE = "attendance/attendance.csv"

def recognize_face():
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

 return "Unknown"

def mark_attendance(name):
    now = datetime.now()

    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%H:%M:%S")

    df = pd.read_csv(ATTENDANCE_FILE)

    if name not in df["Name"].values:
        df.loc[len(df)] = [name, date, time]
        df.to_csv(ATTENDANCE_FILE, index=False)

        print("Attendance marked for", name)
def start_camera():
 print("Starting camera... Press ESC to exit")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        print("Camera error")
        break

    cv2.imwrite(TEMP_IMAGE, frame)

    name = recognize_face()
   
    if name != "Unknown" and check_location():
        mark_attendance(name)
    else:
        print("Outside campus - attendance denied")

    cv2.putText(frame, name, (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1, (0, 255, 0), 2)

    cv2.imshow("Smart Attendance Camera", frame)

    if cv2.waitKey(1) == 27:
        break

    cap.release()
    cv2.destroyAllWindows()


def check_location():

    campus_location = (22.67715736202727, 88.37926884360701)
    student_location = (22.67715736202727, 88.37926884360701)

    distance = geodesic(campus_location, student_location).meters

    print("Distance from campus:", distance)

    if distance <= 100:
        return True
    else:
        return False


if __name__ == "__main__":
    start_camera()