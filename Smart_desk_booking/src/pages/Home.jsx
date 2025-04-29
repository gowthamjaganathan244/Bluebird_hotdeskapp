import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  FaCalendarCheck,
  FaChartBar,
  FaSignInAlt,
  FaUserCheck,
  FaTrash,
  FaMicrosoft
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
      // New local‑date approach—no split needed
      const today = new Date().toLocaleDateString("en-CA");

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
      // Quick & easy via en‑CA locale
      const todayStr = new Date().toLocaleDateString("en-CA");
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
  
  const todayStr = new Date().toLocaleDateString("en-CA");


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
                
                <a 
                  href="https://teams.microsoft.com/l/chat/0/0?users=support@yourcompany.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white">
                      <FaMicrosoft size={18} />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Teams Support</span>
                  </div>
                </a>
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

        {/* My Bookings - Compact Premium Styled */}
<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
      <FaCalendarCheck className="mr-2 text-indigo-500 dark:text-indigo-400" />
      My Bookings
    </h2>
    <button 
      onClick={fetchMyBookings}
      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  </div>

  {myBookings.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {myBookings.map((booking) => (
        <div 
          key={`${booking.DeskID}-${booking.Date}`} 
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow duration-200"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Desk {booking.DeskID}
                  </p>
                  <span className="ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 text-xs rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px]">Confirmed</span>
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Laptop size={12} className="mr-1" />
                  <span>{new Date(booking.Date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCancelBooking(booking)}
              className="ml-2 p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
              title="Cancel booking"
            >
              <FaTrash size={10} />
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
        <Laptop size={20} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">No bookings found</p>
      
    </div>
  )}
</div>

        {/* Recent Activity / Visual Desk View */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity (Visual Desk View)
            </h2>
          </div>
          
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Select Date:</label>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                inputClass="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Choose a date..."
                mapDays={disableWeekends}
                containerClassName="w-full"
              />
            </div>
          </div>

          {selectedDate && deskStatusView.length > 0 ? (
            <div className="flex gap-8 justify-center mt-6">
              {/* Left section */}
              <div className="grid grid-cols-2 gap-4">
                {leftSectionDesks.map((desk) => (
                  <div key={desk.id}
                    className={`w-24 h-16 rounded-md flex flex-col justify-start p-2 
                    ${desk.status === "booked" 
                      ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                      : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}`}>
                    <div className="flex items-center">
                      <div className={`flex justify-center items-center rounded-full w-6 h-6 mr-2 
                        ${desk.status === "booked" 
                          ? 'bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300' 
                          : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-500 dark:text-emerald-300'}`}>
                        {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{desk.name}</span>
                    </div>
                    {desk.status === "booked" && desk.user && (
                      <div className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-8 truncate">
                        {desk.user}
                      </div>
                    )}
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
                      className={`w-24 h-16 rounded-md flex flex-col justify-start p-2 
                      ${desk.status === "booked" 
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                        : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600'}`}>
                      <div className="flex items-center">
                        <div className={`flex justify-center items-center rounded-full w-6 h-6 mr-2 
                          ${desk.status === "booked" 
                            ? 'bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300' 
                            : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-500 dark:text-emerald-300'}`}>
                          {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{desk.name}</span>
                      </div>
                      {desk.status === "booked" && desk.user && (
                        <div className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-8 truncate">
                          {desk.user}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Select a date to view desk map.</p>
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