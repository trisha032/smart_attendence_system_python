import React, { useState, useRef, useEffect } from "react";
import { Camera, Check, AlertCircle, Clock } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { markAttendance } from "../services/api";

const ALLOWED_LATITUDE = 22.6813;
const ALLOWED_LONGITUDE = 88.3789;
const ALLOWED_RADIUS_METERS = 15;

const MarkAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [recognizedStudent, setRecognizedStudent] = useState("");
  const [attendanceTime, setAttendanceTime] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!window.isSecureContext) {
        reject(new Error("Location requires secure context"));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.");
      }
    };

    if (cameraActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const captureLocation = () => {
    setLocationError("");

    if (!window.isSecureContext) {
      setLocationError(
        "Location requires a secure context. Use http://localhost (not local IP) or HTTPS.",
      );
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: locationLabel.trim() || "Attendance capture",
        });
      },
      (geoError) => {
        if (geoError?.code === 1) {
          setLocationError(
            "Location permission denied. You can continue without location.",
          );
          return;
        }
        if (geoError?.code === 2) {
          setLocationError(
            "Location unavailable right now. You can continue without location.",
          );
          return;
        }
        setLocationError(
          "Unable to fetch location. You can continue without location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const startCameraWithGeofence = async () => {
    setError("");
    setLocationError("");

    try {
      const position = await getCurrentLocation();
      const currentLatitude = position.coords.latitude;
      const currentLongitude = position.coords.longitude;
      const distance = distanceInMeters(
        currentLatitude,
        currentLongitude,
        ALLOWED_LATITUDE,
        ALLOWED_LONGITUDE,
      );

      if (distance > ALLOWED_RADIUS_METERS) {
        setError("You are outside the allowed campus area");
        setCameraActive(false);
        return;
      }

      setLocation({
        latitude: currentLatitude,
        longitude: currentLongitude,
        label: locationLabel.trim() || "Attendance capture",
      });
      setCameraActive(true);
    } catch (geoError) {
      setError(
        "Location verification failed. Allow location access to open camera.",
      );
      setCameraActive(false);
    }
  };

  const captureAndRecognize = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      canvasRef.current.toBlob(async (blob) => {
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
          const response = await markAttendance(blob, location);
          alert(`Distance: ${response.distance_meters} meters`);
          setRecognizedStudent(response.student_name || "Unknown");
          setAttendanceTime(response.timestamp || new Date().toLocaleString());
          setSuccess(true);
          setCameraActive(false);

          // Reset after 4 seconds
          setTimeout(() => {
            setRecognizedStudent("");
            setAttendanceTime("");
            setSuccess(false);
          }, 4000);
        } catch (err) {
          setError(
            err.response?.data?.message ||
              "Failed to mark attendance. Please try again.",
          );
        } finally {
          setLoading(false);
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Mark Attendance
          </h2>
          <p className="text-gray-600">
            Look at the camera to mark your attendance
          </p>
        </div>

        {/* Camera Section */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="Classroom / Lab (optional)"
              className="flex-1 px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={captureLocation}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
            >
              Use Current Location
            </button>
          </div>
          {location && (
            <p className="text-sm text-emerald-700 mt-2">
              Location captured: {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </p>
          )}
          {locationError && (
            <p className="text-sm text-amber-700 mt-2">{locationError}</p>
          )}
        </div>

        <div className="mb-6">
          {!cameraActive ? (
            <button
              onClick={startCameraWithGeofence}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 text-lg"
            >
              <Camera className="inline mr-2" size={24} />
              Start Camera
            </button>
          ) : (
            <div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="hidden"
                />

                {/* Center Focus Circle */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-40 h-40 border-4 border-cyan-400 rounded-full opacity-50"></div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <button
                    onClick={captureAndRecognize}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Capture & Mark Attendance"}
                  </button>
                  <button
                    onClick={() => setCameraActive(false)}
                    className="px-6 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <LoadingSpinner message="Recognizing your face..." />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Check className="text-green-500" size={24} />
              <p className="text-green-700 font-bold text-lg">
                Attendance Marked Successfully!
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Student Name:</span>
                <span className="font-semibold text-gray-900">
                  {recognizedStudent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time:</span>
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Clock size={16} />
                  {attendanceTime}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white p-6 rounded-lg border-2 border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3">Instructions:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-full text-center text-sm font-bold mt-0.5">
                1
              </span>
              <span>Click "Start Camera" to begin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-circle text-center text-sm font-bold mt-0.5">
                2
              </span>
              <span>Position your face in the center circle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-full text-center text-sm font-bold mt-0.5">
                3
              </span>
              <span>Click "Capture & Mark Attendance" button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-full text-center text-sm font-bold mt-0.5">
                4
              </span>
              <span>Your attendance will be automatically marked</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
