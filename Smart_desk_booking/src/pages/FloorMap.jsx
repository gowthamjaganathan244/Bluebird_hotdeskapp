import React from "react";
import { Laptop, User } from "lucide-react";

const FloorMap = ({ 
  leftSectionDesks = [], 
  rightSectionDesks = [], 
  selectedDesk, 
  onDeskClick,
  desks = [] 
}) => {
  const availableCount = desks.filter(d => d.status === "available").length;
  const bookedCount = desks.filter(d => d.status === "booked").length;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-full mb-4">
      <div className="flex gap-8 justify-center">
        <div className="grid grid-cols-2 gap-4">
          {leftSectionDesks.map((desk) => (
            <div
              key={desk.id}
              onClick={() => onDeskClick(desk.id)}
              className={`
                w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                flex items-center justify-start p-2
                ${desk.status === "booked" 
                  ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                  : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}
                ${selectedDesk === desk.id 
                  ? 'border-2 border-blue-500 dark:border-blue-400' 
                  : ''}
                hover:border-blue-400 dark:hover:border-blue-400 hover:shadow
              `}
            >
              <div className={`
                flex justify-center items-center rounded-full w-6 h-6 mr-2
                ${desk.status === "booked" 
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-300' 
                  : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-300'}
              `}>
                {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {desk.name}
              </span>
            </div>
          ))}
        </div>

        <div className="h-full border-l border-slate-200 dark:border-slate-700"></div>

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
                onClick={() => onDeskClick(desk.id)}
                className={`
                  w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                  flex items-center justify-start p-2
                  ${desk.status === "booked" 
                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                    : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}
                  ${selectedDesk === desk.id 
                    ? 'border-2 border-blue-500 dark:border-blue-400' 
                    : ''}
                  hover:border-blue-400 dark:hover:border-blue-400 hover:shadow
                `}
              >
                <div className={`
                  flex justify-center items-center rounded-full w-6 h-6 mr-2
                  ${desk.status === "booked" 
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-300' 
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-300'}
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

      <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-700 dark:text-green-300">Available: {availableCount}</span>
          <span className="text-red-700 dark:text-red-300">Booked: {bookedCount}</span>
        </div>
      </div>
    </div>
  );
};

export default FloorMap;