import React, { useState, useEffect } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import RegisterFace from "./components/RegisterFace";
import MarkAttendance from "./components/MarkAttendance";
import Dashboard from "./components/Dashboard";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated (you can integrate with a proper auth system)
    const isAuth = localStorage.getItem("isAuthenticated");
    if (isAuth) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              SmartAttend
            </h1>
            <p className="text-gray-600 mb-8">
              Face Recognition Attendance System
            </p>

            <button
              onClick={() => {
                localStorage.setItem("isAuthenticated", "true");
                setIsAuthenticated(true);
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 mb-4"
            >
              Enter System
            </button>

            <p className="text-sm text-gray-500">
              Make sure your camera is connected before proceeding.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "register" && <RegisterFace />}
        {currentPage === "mark-attendance" && <MarkAttendance />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>
            SmartAttend © 2024 | Face Recognition Attendance System | Made with
            ❤️ for students
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
