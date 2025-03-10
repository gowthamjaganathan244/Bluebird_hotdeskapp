import React from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarCheck,
  FaChartBar,
  FaSignInAlt,
  FaUserCheck,
  FaBuilding
} from "react-icons/fa";

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Booking status card - takes up 2 columns */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workplace Status</h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">Today</span>
              </div>
              
              {/* Progress bar showing booked vs available */}
              <div className="mb-6">
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700" style={{ width: '60%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>6 desks booked</span>
                  <span>4 desks available</span>
                </div>
              </div>
              
              {/* Call to action with improved hover states */}
              <Link 
  to="/booking" 
  className="block w-full py-4 bg-blue-600 hover:bg-blue-100 text-white dark:text-white rounded-xl transition-all transform hover:scale-[1.02] text-center font-medium shadow-md"
>
  <div className="flex items-center justify-center gap-2">
    <FaCalendarCheck size={20} />
    <span>Book Your Desk</span>
  </div>
</Link>
            </div>
          </div>
          
          {/* Quick actions panel */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <Link to="/reports" className="block w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white">
                      <FaChartBar size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">View Reports</span>
                  </div>
                </Link>
                
                <Link to="/check-in" className="block w-full p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center text-white">
                      <FaUserCheck size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Office Check-In</span>
                  </div>
                </Link>
                
                <Link to="/client-check-in" className="block w-full p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center text-white">
                      <FaSignInAlt size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Client Location Check-In</span>
                  </div>
                </Link>


                
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent activity - takes full width */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FaCalendarCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Desk #{10-item} was booked</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item * 15} minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;