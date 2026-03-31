import React, { useState, useRef, useEffect } from "react";
import { Camera, Check, AlertCircle, X } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { registerFace } from "../services/api";

const RegisterFace = () => {
  const [studentName, setStudentName] = useState("");
  const [faceImages, setFaceImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
      canvasRef.current.toBlob((blob) => {
        setFaceImages([...faceImages, blob]);
      });
    }
  };

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
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: locationLabel.trim() || "Registration location",
        };
        setLocation(nextLocation);
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

  const handleRegister = async () => {
    setError("");
    setSuccess(false);

    if (!studentName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (faceImages.length < 5) {
      setError(
        `Please capture at least 5 face images (current: ${faceImages.length})`,
      );
      return;
    }

    setLoading(true);
    try {
      await registerFace(studentName, faceImages, location);
      setSuccess(true);
      setStudentName("");
      setFaceImages([]);
      setCameraActive(false);
      setLocation(null);
      setLocationLabel("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Face Registration
          </h2>
          <p className="text-gray-600">
            Register your face for attendance tracking
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location Label (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="Classroom / Campus"
              className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
              disabled={loading}
            />
            <button
              type="button"
              onClick={captureLocation}
              disabled={loading}
              className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              Use Current
            </button>
          </div>
          {location && (
            <p className="mt-2 text-sm text-emerald-700">
              Location captured: {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </p>
          )}
          {locationError && (
            <p className="mt-2 text-sm text-amber-700">{locationError}</p>
          )}
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Full Name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
            disabled={loading || cameraActive}
          />
        </div>

        {/* Camera Section */}
        <div className="mb-6">
          {!cameraActive ? (
            <button
              onClick={() => setCameraActive(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Camera className="inline mr-2" size={20} />
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
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <button
                    onClick={captureImage}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Camera size={18} className="inline mr-2" />
                    Capture ({faceImages.length}/20)
                  </button>
                  <button
                    onClick={() => setCameraActive(false)}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                  >
                    Stop
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Capture at least 5 images for better recognition (recommended:
                15-20)
              </p>
            </div>
          )}
        </div>

        {/* Captured Images Preview */}
        {faceImages.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">
              Captured Images ({faceImages.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {faceImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Face ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-indigo-300"
                  />
                  <button
                    onClick={() => {
                      const newImages = faceImages.filter(
                        (_, i) => i !== index,
                      );
                      setFaceImages(newImages);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                </div>
              ))}
            </div>
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
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-3">
              <Check className="text-green-500" size={20} />
              <p className="text-green-700 font-medium">
                Face registration successful! You can now mark attendance.
              </p>
            </div>
          </div>
        )}

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading || !studentName.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner message="Registering..." />
          ) : (
            "Complete Registration"
          )}
        </button>
      </div>
    </div>
  );
};

export default RegisterFace;
