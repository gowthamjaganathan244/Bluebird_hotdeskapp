import React from "react";

const Reports = () => {
  return (
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Reports & Analytics
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        View detailed insights on desk bookings, occupancy trends, and usage patterns.
      </p>
      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg">
        Generate Report
      </button>
    </div>
  );
};

export default Reports;
