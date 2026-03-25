from pymongo import MongoClient, ASCENDING
from pymongo.collection import Collection

from config import MONGODB_URI, MONGODB_DB_NAME

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

students_collection: Collection = db["students"]
attendance_collection: Collection = db["attendance"]

students_collection.create_index([("name", ASCENDING)], unique=True)
attendance_collection.create_index([("name", ASCENDING), ("date", ASCENDING)], unique=True)
attendance_collection.create_index([("date", ASCENDING)])
