import React, { useState, useEffect } from "react";
import { BarChart3, Users, Calendar, Clock, AlertCircle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { getAttendanceRecords, getAllStudents } from "../services/api";

const Dashboard = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [recordsData, studentsData] = await Promise.all([
          getAttendanceRecords(),
          getAllStudents(),
        ]);

        setAttendanceRecords(recordsData);
        setStudents(studentsData);

        // Calculate stats
        const today = new Date().toISOString().split("T")[0];
        const presentToday = recordsData.filter((r) => r.date === today).length;

        setStats({
          totalStudents: studentsData.length,
          presentToday: presentToday,
          totalRecords: recordsData.length,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterRecords = () => {
    if (selectedStudent === "all") {
      return attendanceRecords;
    }
    return attendanceRecords.filter((r) => r.name === selectedStudent);
  };

  const filteredRecords = filterRecords();

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="max-w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                Total Students
              </p>
              <p className="text-4xl font-bold text-indigo-600">
                {stats.totalStudents}
              </p>
            </div>
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center">
              <Users className="text-white" size={28} />
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                Present Today
              </p>
              <p className="text-4xl font-bold text-green-600">
                {stats.presentToday}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
              <Calendar className="text-white" size={28} />
            </div>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                Total Records
              </p>
              <p className="text-4xl font-bold text-purple-600">
                {stats.totalRecords}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center">
              <BarChart3 className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={28} />
            Attendance Records
          </h2>
        </div>

        {/* Filter */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Filter by Student
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Students</option>
            {students.map((student, index) => (
              <option key={`${student.name}-${index}`} value={student.name}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Records Table */}
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const [date, time] = record.time
                    ? record.time.split(" ")
                    : [record.date, "--:--"];
                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {record.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-indigo-600" />
                          {date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-green-600" />
                          {time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          ✓ Present
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 font-medium">
              No attendance records found. Start marking attendance!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-600 border-t border-gray-200">
          Showing {filteredRecords.length} record
          {filteredRecords.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
