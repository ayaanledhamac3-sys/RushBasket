import React from "react";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-6">You are logged in successfully.</p>

        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-400">Name:</span> {user.name || "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Email:</span> {user.email || "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Phone:</span> {user.phone || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
