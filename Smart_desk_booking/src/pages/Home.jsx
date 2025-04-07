import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  FaCalendarCheck,
  FaChartBar,
  FaSignInAlt,
  FaUserCheck,
  FaTrash
} from "react-icons/fa";
import { Laptop, User } from "lucide-react";
import DatePicker from "react-multi-date-picker";

const Home = () => {
  const { accounts } = useMsal();
  const user = accounts[0];

  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingsForDate, setBookingsForDate] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [todaysCheckIns, setTodaysCheckIns] = useState([]);

  useEffect(() => {
    // Fetch user's bookings on component mount
    if (user) {
      fetchMyBookings();
      fetchTodaysCheckIns();
    }
  }, [user]);

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleDateChange = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    setSelectedDate(formatted);
    fetchBookingsForDate(formatted);
  };

  const fetchBookingsForDate = async (dateStr) => {
    try {
      const res = await fetch("https://prod-12.australiaeast.logic.azure.com:443/workflows/44e2e53e4cb943d1a5a6b234d5edfb9d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Im6MOrEDXrgSbi9CVi5H60uUlmom-SUBQvIRBfenkc4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr })
      });
      const data = await res.json();
      setBookingsForDate(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch date bookings:", err);
      setBookingsForDate([]);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await fetch("https://prod-09.australiaeast.logic.azure.com:443/workflows/5d1396dd50a74f5ba68f3f451090b631/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yDj_geU7D-qqzflrhxS_i_8St483g34mh0RSaHOZZFw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.username || "" })
      });
  
      const data = await res.json();
  
      // ✅ Filter upcoming bookings only
      const today = new Date().toISOString().split("T")[0];
      const upcoming = (data || [])
        .filter(b => b.Date >= today)
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));
  
      setMyBookings(upcoming);
    } catch (err) {
      console.error("❌ Failed to fetch user bookings:", err);
      setMyBookings([]);
    }
  };
  
  const handleCancelBooking = async (booking) => {
    try {
      console.log("🧪 FULL booking object:", booking);
      console.log("🧪 Date:", booking.Date);
      console.log("🧪 UserEmail:", booking.UserEmail);
      console.log("🧪 DeskID:", booking.DeskID);

      const res = await fetch("https://prod-08.australiaeast.logic.azure.com:443/workflows/f05a5517d59e4634923633af6ec85a6a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3A3K3RQGLLk9KlBx0X9Agu5WZr0R6q9MiUjtTSjD6l4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Date: booking.Date,
          UserEmail: booking.UserEmail,
          DeskID: booking.DeskID
        })
      });

      const responseData = await res.json();
      console.log("✅ Power Automate response:", responseData);

      if (res.ok) {
        console.log("✅ Booking cancelled successfully");

        // 🔁 Live update local myBookings list
        setMyBookings(prevBookings =>
          prevBookings.map(b =>
            b.Date === booking.Date &&
            b.DeskID === booking.DeskID &&
            b.UserEmail === booking.UserEmail
              ? { ...b, Status: "Cancelled" }
              : b
          )
        );

        // ✅ Optionally still refresh full list
        fetchMyBookings();
        if (selectedDate) {
          fetchBookingsForDate(selectedDate);
        }
      } else {
        console.error("❌ Cancellation failed with status:", res.status);
        console.error("❌ Error response:", responseData);
      }
    } catch (err) {
      console.error("❌ Failed to cancel booking:", err);
    }
  };

  const fetchTodaysCheckIns = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("https://prod-03.australiaeast.logic.azure.com:443/workflows/c4dbeafcb9a74da399c610196f2cf7c7/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cQ0GfEJCsHONlpUVSRVfASVFx0XVIEG6nEnrpCLujzU", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Date: todayStr })
      });

      const data = await res.json();
      
      // Add this filter to ensure only today's check-ins are shown
      const todaysData = (data || []).filter(entry => {
        return entry.Date === todayStr;
      });
      
      setTodaysCheckIns(todaysData);
      
      // For debugging
      console.log("Today's date:", todayStr);
      console.log("All check-ins:", data);
      console.log("Filtered check-ins:", todaysData);
    } catch (err) {
      console.error("❌ Failed to fetch today's check-ins:", err);
    }
  };
  
  // Weekend detection function for DatePicker
  const disableWeekends = ({ date }) => {
    const day = date.weekDay.index;
    if (day === 0 || day === 6) {
      return {
        disabled: true,
        style: { 
          color: "#ccc",
          backgroundColor: "#f5f5f5"
        },
        className: "weekend-day"
      };
    }
  };
  
  // Prepare full 10 desks with booking status
  const allDesks = [
    { id: 1, name: "Desk 1" },
    { id: 2, name: "Desk 2" },
    { id: 3, name: "Desk 3" },
    { id: 4, name: "Desk 4" },
    { id: 5, name: "Desk 5" },
    { id: 6, name: "Desk 6" },
    { id: 7, name: "Desk 7" },
    { id: 8, name: "Desk 8" },
    { id: 9, name: "Desk 9" },
    { id: 10, name: "Desk 10" }
  ];

  const deskStatusView = allDesks.map(desk => {
    const found = bookingsForDate.find(b => b.DeskID === desk.id);
    return found
      ? { ...desk, status: "booked", user: found.User }
      : { ...desk, status: "available", user: null };
  });

  const leftSectionDesks = deskStatusView.filter(d => d.id <= 6);
  const rightSectionDesks = deskStatusView.filter(d => d.id > 6);
  const availableCount = deskStatusView.filter(d => d.status === "available").length;
  const bookedCount = deskStatusView.filter(d => d.status === "booked").length;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book a Desk */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTimeBasedGreeting()}, {user?.name || "Guest"} 👋
                    </h1>
                    <div className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">
                      {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'})}
                    </div>
                  </div><br></br>
                  <h2 className="text-xl text-blue-600 dark:text-blue-400 font-semibold">
                    Welcome to Bluebird Office Desk Booking System
                  </h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Book a Desk</h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">Today</span>
              </div>

              <Link to="/booking" className="block w-full py-4 bg-blue-600 hover:bg-blue-100 text-white dark:text-white rounded-xl transition-all transform hover:scale-[1.02] text-center font-medium shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <FaCalendarCheck size={20} />
                  <span>Book Your Desk</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <Link to="/reports" className="block w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-white">
                      <FaChartBar size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">View Reports</span>
                  </div>
                </Link>
                
                <Link to="/check-in" className="block w-full p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500 dark:bg-teal-600 flex items-center justify-center text-white">
                      <FaUserCheck size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Office Check-In</span>
                  </div>
                </Link>
                
                <Link to="/support" className="block w-full p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center text-white">
                      <FaSignInAlt size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Help & Support</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Who's in the Office Today */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaUserCheck className="mr-2 text-blue-500 dark:text-blue-400" />
            Who's in the Office Today
          </h2>

          {todaysCheckIns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {todaysCheckIns.map((entry, index) => (
                <div 
                  key={index} 
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-3">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.User || "Anonymous User"}
                      </p>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <Laptop size={14} className="mr-1" />
                        <span>Desk {entry.DeskID}</span>
                        <span className="mx-1.5">•</span>
                        <span>{entry.Location}</span>
                      </div>
                    </div>
                    <span className="h-6 flex items-center justify-center px-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                      In Office
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <User size={36} className="mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">No one has checked in yet today.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check-ins will appear here when team members arrive.</p>
            </div>
          )}
        </div>

        {/* My Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FaCalendarCheck className="mr-2 text-indigo-500 dark:text-indigo-400" />
              My Bookings
            </h2>
            <button 
              onClick={fetchMyBookings}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-lg text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {myBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map((booking) => (
                <div 
                  key={`${booking.DeskID}-${booking.Date}`} 
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Desk {booking.DeskID}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(booking.Date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">
                        Confirmed
                      </span>
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="mt-2 text-red-600 dark:text-red-400 text-sm font-medium flex items-center"
                      >
                        <FaTrash size={12} className="mr-1.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">You have no upcoming bookings.</p>
              <Link to="/booking" className="inline-block mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium">
                Book a Desk
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity / Visual Desk View */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity (Visual Desk View)
            </h2>
            <div className="bg-white p-0 rounded border border-gray-200 datepicker-wrapper">
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                placeholder="Select a date"
                className="border-0 bg-transparent p-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                mapDays={disableWeekends}
                containerClassName="light-theme-calendar"
              />
            </div>
          </div>

          {selectedDate && deskStatusView.length > 0 ? (
            <div className="flex gap-8 justify-center mt-6">
              {/* Left section */}
              <div className="grid grid-cols-2 gap-4">
                {leftSectionDesks.map((desk) => (
                  <div key={desk.id}
                    className={`w-24 h-16 rounded-md flex items-center justify-start p-2 
                    ${desk.status === "booked" 
                      ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                      : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}`}>
                    <div className={`flex justify-center items-center rounded-full w-6 h-6 mr-2 
                      ${desk.status === "booked" 
                        ? 'bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300' 
                        : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-500 dark:text-emerald-300'}`}>
                      {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{desk.name}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-full border-l border-slate-200 dark:border-slate-700"></div>

              {/* Right section */}
              <div className="relative">
                <div className="absolute -right-14 top-1/2 transform -translate-y-1/2 rotate-90 text-blue-400 dark:text-blue-300 font-semibold tracking-widest text-sm mr-2">WINDOW</div>
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="absolute top-1/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                  <div className="absolute top-2/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                  <div className="absolute top-3/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                </div>
                <div className="grid grid-cols-1 gap-4 pr-4">
                  {rightSectionDesks.map((desk) => (
                    <div key={desk.id}
                      className={`w-24 h-16 rounded-md flex items-center justify-start p-2 
                      ${desk.status === "booked" 
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                        : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}`}>
                      <div className={`flex justify-center items-center rounded-full w-6 h-6 mr-2 
                        ${desk.status === "booked" 
                          ? 'bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300' 
                          : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-500 dark:text-emerald-300'}`}>
                        {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{desk.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2">Select a date to view desk map.</p>
          )}

          {/* Status Bar */}
          {selectedDate && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 dark:text-green-300">Available: {availableCount}</span>
                <span className="text-red-700 dark:text-red-300">Booked: {bookedCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;