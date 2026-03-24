import cv2
import os

name = input("Enter student name: ")

path = "dataset/" + name

if not os.path.exists(path):
    os.makedirs(path)

cam = cv2.VideoCapture(0)

count = 0

while True:
    ret, frame = cam.read()

    cv2.imshow("Register Face", frame)

    cv2.imwrite(f"{path}/{count}.jpg", frame)

    count += 1

    if count == 20:
        break

    if cv2.waitKey(1) == 27:
        break

cam.release()
cv2.destroyAllWindows()

print("Face registered successfully")