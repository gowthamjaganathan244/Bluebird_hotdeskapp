import React from "react";
import { Laptop, User } from "lucide-react";

const RecentFloorMap = ({ desks, selectedDate }) => {
  if (!selectedDate || desks.length === 0) return null;

  const leftSectionDesks = desks.filter(d => d.id <= 6);
  const rightSectionDesks = desks.filter(d => d.id > 6);

  const availableCount = desks.filter(d => d.status === "available").length;
  const bookedCount = desks.filter(d => d.status === "booked").length;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-xl">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Floor Map for {selectedDate}
      </h3>

      <div className="flex gap-8 justify-center">
        {/* Left Section */}
        <div className="grid grid-cols-2 gap-4">
          {leftSectionDesks.map((desk) => (
            <div
              key={desk.id}
              className={`
                w-24 h-16 rounded-md flex items-center justify-start p-2
                ${desk.status === "booked" ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}
              `}
            >
              <div className={`
                flex justify-center items-center rounded-full w-6 h-6 mr-2
                ${desk.status === "booked" ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}
              `}>
                {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {desk.name}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-full border-l border-slate-200 dark:border-slate-700"></div>

        {/* Right Section */}
        <div className="relative">
          <div className="absolute -right-14 top-1/2 transform -translate-y-1/2 rotate-90 text-blue-400 dark:text-blue-300 font-semibold tracking-widest text-sm mr-2">
            WINDOW
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <div className="absolute top-1/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
            <div className="absolute top-2/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
            <div className="absolute top-3/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 pr-4">
            {rightSectionDesks.map((desk) => (
              <div
                key={desk.id}
                className={`
                  w-24 h-16 rounded-md flex items-center justify-start p-2
                  ${desk.status === "booked" ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}
                `}
              >
                <div className={`
                  flex justify-center items-center rounded-full w-6 h-6 mr-2
                  ${desk.status === "booked" ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}
                `}>
                  {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {desk.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-700 dark:text-green-300">Available: {availableCount}</span>
          <span className="text-red-700 dark:text-red-300">Booked: {bookedCount}</span>
        </div>
      </div>
    </div>
  );
};

export default RecentFloorMap;
